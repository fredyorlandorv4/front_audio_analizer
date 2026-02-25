// src/components/audios/AudioDetail.jsx
import React, { useState } from 'react';
import { ArrowLeft, Music, Play, Pause, Trash2, FileText, X } from 'lucide-react';
import { audiosAPI } from '../../services/api';
import { formatBytes, formatDate } from '../../utils/formatters';

export default function AudioDetail({ 
  audio, 
  authToken, 
  showToast, 
  onBack,
  playingId,
  setPlayingId 
}) {
  const [showExtraModal, setShowExtraModal] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este audio?')) return;
    
    try {
      await audiosAPI.delete(authToken, audio.id);
      showToast('Audio eliminado exitosamente', 'success');
      onBack();
    } catch (error) {
      showToast('Error al eliminar el audio', 'error');
    }
  };

  const togglePlay = () => {
    if (playingId === audio.id) {
      setPlayingId(null);
    } else {
      setPlayingId(audio.id);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver a la lista
      </button>

      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="flex items-start gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-8 rounded-2xl">
            <Music className="w-16 h-16 text-white" />
          </div>
          
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{audio.original_filename}</h2>
            <div className="flex items-center gap-4 text-gray-600">
              <span>{formatBytes(audio.size_bytes)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Información del archivo</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha de carga:</span>
                <span className="font-medium text-gray-800">{formatDate(audio.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tamaño:</span>
                <span className="font-medium text-gray-800">{formatBytes(audio.size_bytes)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={togglePlay}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
            >
              {playingId === audio.id ? (
                <>
                  <Pause className="w-5 h-5" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Reproducir
                </>
              )}
            </button>
                          
            {audio.extra ? (
              <button
                onClick={() => setShowExtraModal(true)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                <FileText className="w-5 h-5" />
                Ver Análisis
              </button>
            ) : (
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed font-semibold"
              >
                <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                Análisis en proceso...
              </button>
            )}
            
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
            >
              <Trash2 className="w-5 h-5" />
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {showExtraModal && audio.extra && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowExtraModal(false); }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between">
              <h3 className="text-2xl font-bold">Análisis del Audio</h3>
              <button onClick={() => setShowExtraModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {audio.extra.title && (
                <div>
                  <h4 className="text-lg font-semibold text-purple-600 mb-2">Título</h4>
                  <p className="text-gray-800">{audio.extra.title}</p>
                </div>
              )}
              {audio.extra.summary && (
                <div>
                  <h4 className="text-lg font-semibold text-purple-600 mb-2">Resumen</h4>
                  <p className="text-gray-700">{audio.extra.summary}</p>
                </div>
              )}
              {/* Agregar más campos del análisis según necesites */}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end">
              <button
                onClick={() => setShowExtraModal(false)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}