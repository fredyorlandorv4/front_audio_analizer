// src/components/audios/AudioDetail.jsx
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Music, Play, Pause, Trash2, FileText, X, Download, FileSpreadsheet } from 'lucide-react';
import { audiosAPI } from '../../services/api';
import { formatBytes, formatDate } from '../../utils/formatters';
import { exportAsCSV, exportAsPDF } from '../../utils/exportAnalisis';
import { useApp } from '../../context/AppContext';

// Renderiza un string que puede contener markdown
function MdText({ text }) {
  if (!text) return null;
  return (
    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-lg font-bold text-gray-900 mt-4 mb-1 border-b pb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold text-purple-800 mt-3 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-700 mt-2 mb-1">{children}</h3>,
          p:  ({ children }) => <p className="text-sm text-gray-700 mb-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="space-y-1 mb-2 pl-1">{children}</ul>,
          ol: ({ children }) => <ol className="space-y-1 mb-2 pl-4 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="text-sm text-gray-700 flex items-start gap-1.5"><span className="text-purple-400 flex-shrink-0 mt-1">•</span><span>{children}</span></li>,
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          hr: () => <hr className="my-3 border-purple-100" />,
          code: ({ children }) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
        }}
      >{text}</ReactMarkdown>
    </div>
  );
}

// Etiqueta legible para las claves del objeto extra
function fieldLabel(key) {
  const map = {
    title: 'Título', summary: 'Resumen', transcription: 'Transcripción',
    transcript: 'Transcripción', sentiment: 'Sentimiento', sentimiento: 'Sentimiento',
    score: 'Puntaje', punteo: 'Puntaje', punteo_promedio: 'Puntaje Promedio',
    quality_score: 'Puntaje de Calidad',
    keywords: 'Palabras Clave', palabras_clave: 'Palabras Clave',
    topics: 'Temas', temas: 'Temas', language: 'Idioma', idioma: 'Idioma',
    duration: 'Duración', duracion: 'Duración',
    main_points: 'Puntos Principales', action_items: 'Acciones a Tomar',
    follow_up: 'Seguimiento', stories: 'Historias', references: 'Referencias',
    arguments: 'Argumentos', related_topics: 'Temas Relacionados',
    fortalezas: 'Fortalezas', strengths: 'Fortalezas',
    areas_de_mejora: 'Áreas de Mejora', areas_for_improvement: 'Áreas de Mejora',
    recomendaciones: 'Recomendaciones', suggested_phrases: 'Frases Sugeridas',
    observations: 'Observaciones', observaciones: 'Observaciones',
    compliance_flags: 'Alertas de Cumplimiento', next_steps: 'Próximos Pasos',
    supervisor_coaching: 'Coaching al Supervisor',
    rationale: 'Justificación', notas: 'Notas', notes: 'Notas',
  };
  return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Devuelve true si el valor es vacío o un placeholder sin contenido real
function isEmptyValue(value) {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (Array.isArray(value) && value.every(i => typeof i === 'string' && i.toLowerCase().includes('nothing found'))) return true;
  return false;
}

// Renderiza un campo individual de audio.extra (recursivo para objetos anidados)
function ExtraField({ label, value, depth = 0 }) {
  if (isEmptyValue(value)) return null;

  // Objeto anidado → renderiza cada sub-clave como sub-sección
  if (typeof value === 'object' && !Array.isArray(value)) {
    return (
      <div className={depth > 0 ? 'pl-3 border-l-2 border-purple-100 space-y-3' : ''}>
        {depth === 0 && (
          <h4 className="text-sm font-semibold text-purple-700 uppercase tracking-wide mb-2">{label}</h4>
        )}
        <div className="space-y-3">
          {Object.entries(value)
            .filter(([, v]) => !isEmptyValue(v))
            .map(([k, v]) => (
              <ExtraField key={k} label={fieldLabel(k)} value={v} depth={depth + 1} />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className={`font-semibold uppercase tracking-wide mb-1.5 ${depth > 0 ? 'text-xs text-gray-500' : 'text-sm text-purple-700'}`}>
        {label}
      </h4>
      {Array.isArray(value) ? (
        <ul className="space-y-1">
          {value.map((item, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-purple-400 flex-shrink-0 mt-0.5">•</span>
              <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
            </li>
          ))}
        </ul>
      ) : typeof value === 'string' && value.includes('\n') ? (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200"><MdText text={value} /></div>
      ) : (
        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200">{String(value)}</p>
      )}
    </div>
  );
}

export default function AudioDetail({
  audio,
  onBack,
  playingId,
  loadingAudioId,
  togglePlay
}) {
  const { authToken, showToast, setAudios } = useApp();
  const [showExtraModal, setShowExtraModal] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este audio?')) return;

    try {
      await audiosAPI.delete(authToken, audio.id);
      // Eliminar del estado global para que la lista se actualice
      setAudios(prev => prev.filter(a => a.id !== audio.id));
      showToast('Audio eliminado exitosamente', 'success');
      onBack();
    } catch (error) {
      showToast('Error al eliminar el audio', 'error');
    }
  };

  const isPlaying = playingId === audio.id;
  const isLoading = loadingAudioId === audio.id;

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
              onClick={() => togglePlay(audio)}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Cargando...
                </>
              ) : isPlaying ? (
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
              {typeof audio.extra === 'string' ? (
                <MdText text={audio.extra} />
              ) : (
                Object.entries(audio.extra)
                  .filter(([, v]) => !isEmptyValue(v))
                  .map(([key, value]) => (
                    <ExtraField key={key} label={fieldLabel(key)} value={value} />
                  ))
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => exportAsPDF(
                    'Análisis del Audio',
                    audio.original_filename,
                    audio.extra,
                    [['Archivo', audio.original_filename], ['Tamaño', formatBytes(audio.size_bytes)], ['Fecha', formatDate(audio.created_at)]]
                  )}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 text-sm font-medium"
                >
                  <Download className="w-4 h-4" />PDF
                </button>
                <button
                  onClick={() => exportAsCSV(
                    audio.extra,
                    `analisis_${audio.original_filename}.csv`,
                    [['archivo', audio.original_filename], ['tamaño', formatBytes(audio.size_bytes)], ['fecha', formatDate(audio.created_at)]]
                  )}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 text-sm font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4" />CSV
                </button>
              </div>
              <button
                onClick={() => setShowExtraModal(false)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm"
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
