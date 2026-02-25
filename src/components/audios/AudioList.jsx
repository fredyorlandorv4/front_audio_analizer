// src/components/audios/AudioList.jsx
import React, { useEffect } from 'react';
import { Music, Play, Pause, Users } from 'lucide-react';
import { audiosAPI } from '../../services/api';
import { formatBytes, formatDate } from '../../utils/formatters';
import { usePagination } from '../../hooks/usePagination';
import PaginationControls from '../shared/PaginationControls';
import { useApp } from '../../context/AppContext';

export default function AudioList({ onSelectAudio, playingId, loadingAudioId, togglePlay }) {
  // ✅ authToken, showToast y audios vienen del contexto, no de props
  const { authToken, showToast, audios, setAudios } = useApp();
  const pagination = usePagination(audios, 6);

  useEffect(() => { loadAudios(); }, []);
  useEffect(() => { pagination.resetPage(); }, [audios.length]);

  const loadAudios = async () => {
    try {
      const data = await audiosAPI.getAll(authToken);
      setAudios(data);
    } catch {
      showToast('Error al cargar audios', 'error');
    }
  };

  if (audios.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Mis Audios</h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No tienes audios cargados</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Mis Audios</h2>
        <span className="text-gray-600">{audios.length} archivo(s)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pagination.paginated.map((audio) => (
          <div key={audio.id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-purple-100 p-3 rounded-lg flex-shrink-0">
                <Music className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{audio.original_filename}</h3>
                <p className="text-sm text-gray-500">{formatBytes(audio.size_bytes)}</p>
                {audio.equipo && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    <Users className="w-3 h-3" />{audio.equipo.nombre}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <span>{formatDate(audio.created_at)}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => togglePlay(audio)}
                disabled={loadingAudioId === audio.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {loadingAudioId === audio.id ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Cargando...</>
                ) : playingId === audio.id ? (
                  <><Pause className="w-4 h-4" />Pausar</>
                ) : (
                  <><Play className="w-4 h-4" />Reproducir</>
                )}
              </button>
              <button onClick={() => onSelectAudio(audio)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Ver
              </button>
            </div>
          </div>
        ))}
      </div>

      <PaginationControls {...pagination} />
    </div>
  );
}