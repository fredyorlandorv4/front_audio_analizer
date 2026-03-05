// src/components/teams/AnalisisEquipoModal.jsx
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  X, Users, CheckCircle, TrendingUp, Lightbulb, Calendar,
  Loader, AlertTriangle, Star, BarChart2, UserCheck, UserX
} from 'lucide-react';
import { analisisEquipoAPI } from '../../services/api';
import { formatDate, scoreColor, scoreBg } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';

// Maneja tanto status en inglés como en español
const ESTADO_BADGE = {
  completado:  { label: 'Completado',  cls: 'bg-green-100 text-green-800' },
  completed:   { label: 'Completado',  cls: 'bg-green-100 text-green-800' },
  procesando:  { label: 'Procesando',  cls: 'bg-yellow-100 text-yellow-800' },
  processing:  { label: 'Procesando',  cls: 'bg-yellow-100 text-yellow-800' },
  pendiente:   { label: 'Pendiente',   cls: 'bg-gray-100 text-gray-600' },
  pending:     { label: 'Pendiente',   cls: 'bg-gray-100 text-gray-600' },
  error:       { label: 'Error',       cls: 'bg-red-100 text-red-800' },
};

// Limpia el string resultado que puede venir con doble-encoding:
// e.g. "\"## 1. Diagnóstico..." → "## 1. Diagnóstico..."
function cleanResultadoStr(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed;
    if (typeof parsed === 'object' && parsed !== null) return parsed; // objeto estructurado
  } catch { /* not JSON */ }
  // Quita comillas envolventes si quedaron sin procesar
  return raw.replace(/^"|"$/g, '');
}

// Renderiza markdown con estilos Tailwind
function MarkdownContent({ text }) {
  return (
    <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-extrabold text-gray-900 mt-6 mb-2 border-b pb-1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-indigo-800 mt-5 mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 inline-block" />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-gray-700 mt-4 mb-1.5 underline underline-offset-2 decoration-indigo-300">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-sm text-gray-700 mb-2 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1 mb-3 pl-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1 mb-3 pl-1 list-decimal list-inside">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-indigo-400 flex-shrink-0 mt-1">•</span>
              <span className="flex-1">{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-600">{children}</em>
          ),
          hr: () => (
            <hr className="my-4 border-indigo-100" />
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-300 pl-4 py-1 my-2 bg-indigo-50 rounded-r-lg text-sm text-indigo-800 italic">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

// Renderiza resultado estructurado (objeto con campos específicos)
function StructuredResult({ resultado }) {
  const {
    resumen, summary,
    fortalezas, strengths,
    areas_de_mejora, areas_for_improvement,
    recomendaciones, recommendations,
    observaciones, observations,
    punteo_promedio, score_promedio, promedio_punteo,
    patrones_identificados, patterns,
    tendencias,
    ...rest
  } = resultado;

  const punteo         = punteo_promedio ?? score_promedio ?? promedio_punteo;
  const resumenText    = resumen ?? summary;
  const fortalezasList = fortalezas ?? strengths;
  const mejorasList    = areas_de_mejora ?? areas_for_improvement;
  const recomendList   = recomendaciones ?? recommendations;
  const observList     = observaciones ?? observations;
  const patronesList   = patrones_identificados ?? patterns;
  const restEntries    = Object.entries(rest).filter(([, v]) => v !== null && v !== undefined && v !== '');

  return (
    <div className="space-y-5">
      {punteo != null && (
        <div className={`flex items-center gap-4 p-4 rounded-xl border ${scoreBg(punteo)}`}>
          <div className={`text-4xl font-extrabold ${scoreColor(punteo)}`}>{Math.round(punteo)}</div>
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
              <div
                className={`h-3 rounded-full transition-all ${punteo >= 80 ? 'bg-green-500' : punteo >= 60 ? 'bg-yellow-400' : 'bg-red-500'}`}
                style={{ width: `${Math.min(punteo, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-600">Punteo promedio grupal acumulativo</p>
          </div>
        </div>
      )}
      {resumenText && (
        <div>
          <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" />Resumen Grupal
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200">{resumenText}</p>
        </div>
      )}
      {fortalezasList?.length > 0 && (
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <h4 className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />Fortalezas del Equipo
          </h4>
          <ul className="space-y-1.5">
            {fortalezasList.map((item, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>{item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {mejorasList?.length > 0 && (
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
          <h4 className="text-xs font-semibold text-orange-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />Áreas de Mejora
          </h4>
          <ul className="space-y-1.5">
            {mejorasList.map((item, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-orange-500 mt-0.5 flex-shrink-0">⚠</span>{item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {recomendList?.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" />Recomendaciones para el Equipo
          </h4>
          <ul className="space-y-1.5">
            {recomendList.map((item, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-500 mt-0.5 flex-shrink-0">→</span>{item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {tendencias?.length > 0 && (
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
          <h4 className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-2">Tendencias</h4>
          <ul className="space-y-1">
            {tendencias.map((t, i) => (
              <li key={i} className="text-sm text-gray-700 pl-3">• {typeof t === 'string' ? t : JSON.stringify(t)}</li>
            ))}
          </ul>
        </div>
      )}
      {observList?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Observaciones</h4>
          <ul className="space-y-1">
            {observList.map((obs, i) => <li key={i} className="text-sm text-gray-700 pl-3">• {obs}</li>)}
          </ul>
        </div>
      )}
      {patronesList?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Patrones Identificados</h4>
          <ul className="space-y-1">
            {patronesList.map((p, i) => (
              <li key={i} className="text-sm text-gray-700 pl-3">• {typeof p === 'string' ? p : JSON.stringify(p)}</li>
            ))}
          </ul>
        </div>
      )}
      {restEntries.map(([key, value]) => (
        <div key={key}>
          <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">{key.replace(/_/g, ' ')}</h4>
          {Array.isArray(value) ? (
            <ul className="space-y-1">
              {value.map((item, i) => (
                <li key={i} className="text-sm text-gray-700 pl-3">• {typeof item === 'string' ? item : JSON.stringify(item)}</li>
              ))}
            </ul>
          ) : typeof value === 'object' ? (
            <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto border border-gray-200">{JSON.stringify(value, null, 2)}</pre>
          ) : (
            <p className="text-sm text-gray-700">{String(value)}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// Dispatcher: detecta si resultado es string markdown u objeto estructurado
function ResultRenderer({ resultado }) {
  if (!resultado) return null;

  if (typeof resultado === 'string') {
    const cleaned = cleanResultadoStr(resultado);
    // Después de limpiar, podría ser objeto o string
    if (typeof cleaned === 'object') return <StructuredResult resultado={cleaned} />;
    return <MarkdownContent text={cleaned} />;
  }

  if (typeof resultado === 'object') return <StructuredResult resultado={resultado} />;
  return null;
}

export default function AnalisisEquipoModal({ team, onClose }) {
  const { authToken, showToast } = useApp();
  const [loading, setLoading]   = useState(true);
  const [analisis, setAnalisis] = useState(undefined);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await analisisEquipoAPI.getUltimo(authToken, team.id);
        setAnalisis(data);
      } catch {
        showToast('Error al cargar el análisis grupal', 'error');
        setAnalisis(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [team.id]);

  // Maneja status en inglés y español
  const statusKey = analisis?.status || analisis?.estado || '';
  const badge     = ESTADO_BADGE[statusKey] ?? (statusKey ? { label: statusKey, cls: 'bg-gray-100 text-gray-600' } : null);
  const isWorking = ['procesando', 'processing', 'pendiente', 'pending'].includes(statusKey);
  const isError   = statusKey === 'error';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Análisis Grupal — Resumen</h3>
              <p className="text-sm text-gray-500">{team.nombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
              <Loader className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="text-sm">Cargando análisis grupal...</span>
            </div>
          ) : !analisis ? (
            <div className="text-center py-16">
              <Star className="w-14 h-14 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Sin análisis grupal disponible</p>
              <p className="text-gray-400 text-sm mt-1">Ejecuta un análisis grupal para ver los resultados aquí</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Meta: estado + fecha + miembros */}
              <div className="flex items-center gap-3 flex-wrap">
                {badge && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                )}
                {analisis.created_at && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />{formatDate(analisis.created_at)}
                  </span>
                )}
                {analisis.miembros_incluidos?.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                    <UserCheck className="w-3.5 h-3.5" />
                    {analisis.miembros_incluidos.length} incluido(s)
                  </span>
                )}
                {analisis.miembros_sin_analisis?.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    <UserX className="w-3.5 h-3.5" />
                    {analisis.miembros_sin_analisis.length} sin análisis
                  </span>
                )}
              </div>

              {/* Cuerpo del análisis */}
              {isWorking ? (
                <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <Loader className="w-5 h-5 text-yellow-600 animate-spin flex-shrink-0" />
                  <p className="text-sm text-yellow-800">El análisis grupal está siendo procesado. Vuelve en unos momentos.</p>
                </div>
              ) : isError ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">Ocurrió un error al procesar el análisis grupal.</p>
                </div>
              ) : analisis.resultado ? (
                <ResultRenderer resultado={analisis.resultado} />
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">Sin resultados disponibles</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
