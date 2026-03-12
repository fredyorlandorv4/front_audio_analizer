// src/components/users/AudioUploadModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  X, Upload, Users, User, CheckCircle, XCircle,
  Loader, Music, ShieldCheck, Trash2, Zap
} from 'lucide-react';
import { audiosAPI, teamsAPI } from '../../services/api';
import { formatBytes } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';

// Estado por archivo: pending | uploading | success | error
const FILE_STATUS = { PENDING: 'pending', UPLOADING: 'uploading', SUCCESS: 'success', ERROR: 'error' };

// ── Compresión de audio (Web Audio API, sin dependencias externas) ────────────
// Convierte un AudioBuffer a WAV mono 16-bit
function audioBufferToWav(buffer) {
  const sampleRate  = buffer.sampleRate;
  const numSamples  = buffer.length;
  const dataSize    = numSamples * 2; // mono, 16-bit
  const ab          = new ArrayBuffer(44 + dataSize);
  const view        = new DataView(ab);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };

  ws(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true);
  ws(8, 'WAVE'); ws(12, 'fmt ');
  view.setUint32(16, 16, true);   // chunk size
  view.setUint16(20, 1, true);    // PCM
  view.setUint16(22, 1, true);    // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ws(36, 'data'); view.setUint32(40, dataSize, true);

  // Mezcla todos los canales a mono y escribe muestras
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    let sample = channels.reduce((sum, ch) => sum + ch[i], 0) / channels.length;
    sample = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }
  return new Blob([ab], { type: 'audio/wav' });
}

// Decodifica y re-renderiza el audio a 16 kHz mono (ideal para voz/llamadas)
async function compressAudio(file) {
  const TARGET_RATE = 16000;
  const arrayBuffer = await file.arrayBuffer();
  const ctx         = new AudioContext();
  const decoded     = await ctx.decodeAudioData(arrayBuffer);
  await ctx.close();

  const numSamples = Math.ceil(decoded.duration * TARGET_RATE);
  const offline    = new OfflineAudioContext(1, numSamples, TARGET_RATE);
  const src        = offline.createBufferSource();
  src.buffer       = decoded;
  src.connect(offline.destination);
  src.start(0);

  const rendered = await offline.startRendering();
  const blob     = audioBufferToWav(rendered);
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  return new File([blob], `${baseName}.wav`, { type: 'audio/wav' });
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AudioUploadModal({ user, onClose }) {
  const { authToken, showToast, userRole } = useApp();
  const isAdmin = userRole === 1;

  const [teams, setTeams]             = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [equipoId, setEquipoId]       = useState('');
  const [fileList, setFileList]       = useState([]);
  const [uploading, setUploading]     = useState(false);
  const [compressEnabled, setCompressEnabled] = useState(false);
  const inputRef = useRef(null);

  const canUpload    = (isAdmin || equipoId !== '') && fileList.length > 0 && !uploading;
  const pendingFiles = fileList.filter(f => f.status === FILE_STATUS.PENDING);
  const hasPending   = pendingFiles.length > 0;

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const data = await teamsAPI.getAll(authToken);
        setTeams(Array.isArray(data) ? data : []);
      } catch {
        showToast('Error al cargar equipos', 'error');
      } finally {
        setLoadingTeams(false);
      }
    };
    loadTeams();
  }, []);

  const handleFilePick = (e) => {
    const picked = Array.from(e.target.files);
    if (!picked.length) return;

    const newEntries = picked
      .filter(f => {
        const isDupe = fileList.some(
          existing => existing.file.name === f.name && existing.file.size === f.size
        );
        if (isDupe) {
          showToast(`"${f.name}" ya está en la lista`, 'warning');
          return false;
        }
        return true;
      })
      .map(f => ({ file: f, id: `${f.name}-${f.size}-${Date.now()}`, status: FILE_STATUS.PENDING, error: null }));

    setFileList(prev => [...prev, ...newEntries]);
    e.target.value = '';
  };

  const removeFile = (id) => {
    setFileList(prev => prev.filter(f => f.id !== id));
  };

  const updateStatus = (id, status, error = null) => {
    setFileList(prev => prev.map(f => f.id === id ? { ...f, status, error } : f));
  };

  const handleUpload = async () => {
    if (!canUpload) return;
    if (!isAdmin && equipoId === '') {
      showToast('Selecciona un equipo antes de subir', 'warning');
      return;
    }

    setUploading(true);
    const toUpload = fileList.filter(f => f.status === FILE_STATUS.PENDING);

    for (const entry of toUpload) {
      updateStatus(entry.id, FILE_STATUS.UPLOADING);
      try {
        let fileToUpload = entry.file;
        if (compressEnabled) {
          try {
            fileToUpload = await compressAudio(entry.file);
          } catch {
            // Si falla la compresión sube el archivo original
            fileToUpload = entry.file;
          }
        }
        await audiosAPI.upload(
          authToken,
          fileToUpload,
          equipoId !== '' ? equipoId : null,
          user.id
        );
        updateStatus(entry.id, FILE_STATUS.SUCCESS);
      } catch (err) {
        updateStatus(entry.id, FILE_STATUS.ERROR, err.message || 'Error al subir');
      }
    }

    setUploading(false);
  };

  const successCount = fileList.filter(f => f.status === FILE_STATUS.SUCCESS).length;
  const errorCount   = fileList.filter(f => f.status === FILE_STATUS.ERROR).length;
  const allDone      = fileList.length > 0 && fileList.every(f => f.status === FILE_STATUS.SUCCESS || f.status === FILE_STATUS.ERROR);

  const statusIcon = (status) => {
    if (status === FILE_STATUS.UPLOADING) return <Loader className="w-4 h-4 animate-spin text-purple-500 flex-shrink-0" />;
    if (status === FILE_STATUS.SUCCESS)   return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
    if (status === FILE_STATUS.ERROR)     return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
    return <Music className="w-4 h-4 text-gray-400 flex-shrink-0" />;
  };

  const statusLabel = (entry) => {
    if (entry.status === FILE_STATUS.UPLOADING) return <span className="text-xs text-purple-600">{compressEnabled ? 'Comprimiendo y subiendo...' : 'Subiendo...'}</span>;
    if (entry.status === FILE_STATUS.SUCCESS)   return <span className="text-xs text-green-600 font-medium">Subido</span>;
    if (entry.status === FILE_STATUS.ERROR)     return <span className="text-xs text-red-600">{entry.error || 'Error'}</span>;
    return <span className="text-xs text-gray-400">{formatBytes(entry.file.size)}</span>;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => { if (e.target === e.currentTarget && !uploading) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="border-b p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Cargar Audios</h3>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <User className="w-3.5 h-3.5" />
                <span>{user.nombre || user.email}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">

          {/* Selector de equipo */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 text-purple-600" />
              Equipo
              {!isAdmin && <span className="text-red-500">*</span>}
              {isAdmin  && <span className="text-xs text-gray-400 font-normal">(opcional)</span>}
            </label>

            {isAdmin && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700">Como administrador puedes omitir la asignación de equipo.</p>
              </div>
            )}

            {loadingTeams ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                <Loader className="w-4 h-4 animate-spin" />Cargando equipos...
              </div>
            ) : (
              <>
                <select
                  value={equipoId}
                  onChange={(e) => setEquipoId(e.target.value)}
                  disabled={uploading}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm disabled:opacity-50
                    ${!isAdmin && equipoId === '' ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">{isAdmin ? '— Sin equipo —' : '— Selecciona un equipo —'}</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
                {!isAdmin && equipoId === '' && (
                  <p className="mt-1 text-xs text-red-500">⚠ Obligatorio para no administradores</p>
                )}
              </>
            )}
          </div>

          {/* Toggle de compresión */}
          <div className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors
            ${compressEnabled ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
            <button
              type="button"
              onClick={() => !uploading && setCompressEnabled(v => !v)}
              disabled={uploading}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5
                ${compressEnabled ? 'bg-amber-500' : 'bg-gray-300'} disabled:opacity-50`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out
                ${compressEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <Zap className={`w-3.5 h-3.5 ${compressEnabled ? 'text-amber-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${compressEnabled ? 'text-amber-800' : 'text-gray-600'}`}>
                  Comprimir antes de subir
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Convierte a WAV mono 16 kHz — reduce el tamaño hasta 4×. Recomendado para grabaciones de voz.
              </p>
            </div>
          </div>

          {/* Drop zone / selector */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Music className="w-4 h-4 text-purple-600" />
              Archivos de audio
            </label>
            <label
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-all
                ${uploading ? 'cursor-not-allowed opacity-50 border-gray-200' : 'cursor-pointer border-gray-300 hover:border-purple-400 hover:bg-purple-50'}`}
            >
              <Upload className="w-8 h-8 text-gray-300 mb-2" />
              <span className="text-sm font-medium text-gray-600">Haz clic para agregar archivos</span>
              <span className="text-xs text-gray-400 mt-1">MP3, WAV, OGG · Selección múltiple</span>
              <input
                ref={inputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={handleFilePick}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Lista de archivos */}
          {fileList.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{fileList.length} archivo(s)</span>
                {!uploading && hasPending && (
                  <button
                    onClick={() => setFileList(prev => prev.filter(f => f.status !== FILE_STATUS.PENDING))}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Limpiar pendientes
                  </button>
                )}
              </div>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {fileList.map((entry) => (
                  <li
                    key={entry.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border text-sm
                      ${entry.status === FILE_STATUS.SUCCESS ? 'bg-green-50 border-green-200' :
                        entry.status === FILE_STATUS.ERROR   ? 'bg-red-50 border-red-200' :
                        entry.status === FILE_STATUS.UPLOADING ? 'bg-purple-50 border-purple-200' :
                        'bg-gray-50 border-gray-200'}`}
                  >
                    {statusIcon(entry.status)}
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-gray-800 text-xs">{entry.file.name}</p>
                      {statusLabel(entry)}
                    </div>
                    {entry.status === FILE_STATUS.PENDING && !uploading && (
                      <button onClick={() => removeFile(entry.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              {/* Resumen post-subida */}
              {allDone && (
                <div className={`mt-3 px-4 py-2.5 rounded-lg text-sm font-medium
                  ${errorCount === 0 ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-yellow-50 text-yellow-800 border border-yellow-200'}`}
                >
                  {errorCount === 0
                    ? `✓ ${successCount} archivo(s) subidos correctamente`
                    : `${successCount} subido(s) · ${errorCount} con error`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm disabled:opacity-40"
          >
            {allDone ? 'Cerrar' : 'Cancelar'}
          </button>
          <button
            onClick={handleUpload}
            disabled={!canUpload || !hasPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <><Loader className="w-4 h-4 animate-spin" />{compressEnabled ? 'Procesando...' : 'Subiendo...'}</>
            ) : (
              <><Upload className="w-4 h-4" />Subir {hasPending ? `${pendingFiles.length} archivo(s)` : ''}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
