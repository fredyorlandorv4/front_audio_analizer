import React, { useState } from 'react';
import { Upload, Users } from 'lucide-react';
import { audiosAPI } from '../../services/api';
import { useApp } from '../../context/AppContext';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default function AudioUpload({ onUploadSuccess }) {
  const { authToken, showToast, audios, setAudios, userTeams } = useApp();
  const [equipoId, setEquipoId] = useState('');
  const [uploading, setUploading] = useState(false);

  // Bloquear subida si no hay equipo seleccionado
  const canUpload = equipoId !== '';

  const handleFileUpload = async (e) => {
    if (!canUpload) {
      showToast('Debes seleccionar un equipo antes de cargar audios', 'warning');
      e.target.value = '';
      return;
    }

    const files = Array.from(e.target.files);
    setUploading(true);

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        showToast(`"${file.name}" supera el límite de 20 MB`, 'warning');
        continue;
      }
      try {
        const newAudio = await audiosAPI.upload(authToken, file, equipoId);
        setAudios(prev => [newAudio, ...prev]);
        showToast(`"${file.name}" subido exitosamente`, 'success');
      } catch {
        showToast(`Error al subir "${file.name}"`, 'error');
      }
    }

    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Cargar Nuevos Audios</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">

        {/* Selector de equipo — obligatorio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            Asignar a equipo <span className="text-red-500">*</span>
          </label>
          {userTeams.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No tienes equipos asignados</p>
          ) : (
            <>
              <select
                value={equipoId}
                onChange={(e) => setEquipoId(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm
                  ${equipoId === '' ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              >
                <option value="">— Selecciona un equipo —</option>
                {userTeams.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                ))}
              </select>
              {equipoId === '' && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  ⚠ Selecciona un equipo para poder cargar audios
                </p>
              )}
            </>
          )}
        </div>

        {/* Drop zone */}
        <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 transition-all
          ${!canUpload || uploading
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
            : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50 cursor-pointer'
          }`}>
          <Upload className={`w-16 h-16 mb-4 ${!canUpload || uploading ? 'text-gray-300' : 'text-gray-400'}`} />
          <span className="text-lg font-medium text-gray-700 mb-2 text-center">
            {uploading
              ? 'Subiendo archivos...'
              : !canUpload
              ? 'Selecciona un equipo primero'
              : 'Haz clic para seleccionar archivos'}
          </span>
          {canUpload && !uploading && (
            <span className="text-sm text-gray-500">o arrastra y suelta aquí</span>
          )}
          <span className="text-xs text-gray-400 mt-2">MP3, WAV, OGG · Máx. 20 MB por archivo</span>
          {equipoId && (
            <span className="mt-3 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              📁 {userTeams.find(e => e.id === parseInt(equipoId))?.nombre}
            </span>
          )}
          <input
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileUpload}
            disabled={!canUpload || uploading}
            className="hidden"
          />
        </label>

        {audios?.length > 0 && (
          <button
            onClick={onUploadSuccess}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Ver Audios Cargados ({audios.length})
          </button>
        )}
      </div>
    </div>
  );
}