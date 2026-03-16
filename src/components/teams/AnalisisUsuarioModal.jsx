// src/components/teams/AnalisisUsuarioModal.jsx
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, BarChart2, CheckCircle, TrendingUp, Lightbulb, Calendar, Loader, AlertTriangle, Star, Download, FileSpreadsheet } from 'lucide-react';
import { analisisUsuarioAPI } from '../../services/api';
import { formatDate, scoreColor, scoreBg } from '../../utils/formatters';
import { exportAsCSV, exportAsPDF } from '../../utils/exportAnalisis';
import { useApp } from '../../context/AppContext';

// Maneja status en inglés y español
const ESTADO_BADGE = {
  completado:  { label: 'Completado', cls: 'bg-green-100 text-green-800' },
  completed:   { label: 'Completado', cls: 'bg-green-100 text-green-800' },
  procesando:  { label: 'Procesando', cls: 'bg-yellow-100 text-yellow-800' },
  processing:  { label: 'Procesando', cls: 'bg-yellow-100 text-yellow-800' },
  pendiente:   { label: 'Pendiente',  cls: 'bg-gray-100 text-gray-600' },
  pending:     { label: 'Pendiente',  cls: 'bg-gray-100 text-gray-600' },
  error:       { label: 'Error',      cls: 'bg-red-100 text-red-800' },
};

// Limpia strings con doble-encoding: "\"## ..." → "## ..."
function cleanResultadoStr(raw) {
  try {
    const parsed = JSON.parse(raw);
    // JSON.parse convierte \n a saltos reales automáticamente
    if (typeof parsed === 'string') return parsed;
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch { /* not JSON */ }
  // Si no es JSON válido, convertir \n literales a saltos reales y quitar comillas
  return raw.replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
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
            <h2 className="text-base font-bold text-purple-800 mt-5 mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0 inline-block" />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-gray-700 mt-4 mb-1.5 underline underline-offset-2 decoration-purple-300">
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
              <span className="text-purple-400 flex-shrink-0 mt-1">•</span>
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
            <hr className="my-4 border-purple-100" />
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-300 pl-4 py-1 my-2 bg-purple-50 rounded-r-lg text-sm text-purple-800 italic">
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

// Helpers para renderizar campos desconocidos / anidados ──────────────────────

function isEmptyValue(v) {
  if (v === null || v === undefined || v === '') return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (Array.isArray(v) && v.every(i => typeof i === 'string' && i.toLowerCase().includes('nothing found'))) return true;
  return false;
}

const FIELD_LABEL = {
  quality_score: 'Puntaje de Calidad', rationale: 'Justificación',
  main_points: 'Puntos Principales', action_items: 'Acciones a Tomar',
  follow_up: 'Seguimiento', references: 'Referencias', related_topics: 'Temas Relacionados',
  suggested_phrases: 'Frases Sugeridas', compliance_flags: 'Alertas de Cumplimiento',
  next_steps: 'Próximos Pasos', supervisor_coaching: 'Coaching al Supervisor',
  areas_for_improvement: 'Áreas de Mejora', strengths: 'Fortalezas',
  observations: 'Observaciones', score: 'Puntaje',
};
const toLabel = (key) => FIELD_LABEL[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// Renderiza un string: si tiene saltos de línea o sintaxis markdown → MarkdownContent
function MdOrText({ text }) {
  const s = String(text);
  if (s.includes('\n') || s.includes('**') || s.includes('##') || s.includes('- ')) {
    return <MarkdownContent text={s} />;
  }
  return <span className="text-sm text-gray-700">{s}</span>;
}

function NestedValue({ value }) {
  if (isEmptyValue(value)) return null;
  if (Array.isArray(value)) {
    if (value.every(i => typeof i !== 'object' || i === null)) {
      return (
        <ul className="space-y-1 mt-1">
          {value.map((item, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-purple-400 flex-shrink-0 mt-0.5">•</span>
              <MdOrText text={item} />
            </li>
          ))}
        </ul>
      );
    }
    return (
      <div className="space-y-2 mt-1">
        {value.map((item, i) => (
          <div key={i} className="pl-3 border-l-2 border-purple-100">
            <NestedValue value={item} />
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === 'object') {
    return (
      <div className="space-y-2 mt-1 pl-3 border-l-2 border-purple-100">
        {Object.entries(value).filter(([, v]) => !isEmptyValue(v)).map(([k, v]) => (
          <div key={k}>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{toLabel(k)}: </span>
            {typeof v === 'object' ? <NestedValue value={v} /> : <MdOrText text={v} />}
          </div>
        ))}
      </div>
    );
  }
  return <MarkdownContent text={String(value)} />;
}

// ─────────────────────────────────────────────────────────────────────────────

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
    ...rest
  } = resultado;

  const punteo           = punteo_promedio ?? score_promedio ?? promedio_punteo;
  const resumenText      = resumen ?? summary;
  const fortalezasList   = fortalezas ?? strengths;
  const mejorasList      = areas_de_mejora ?? areas_for_improvement;
  const recomendList     = recomendaciones ?? recommendations;
  const observList       = observaciones ?? observations;
  const patronesList     = patrones_identificados ?? patterns;
  const restEntries      = Object.entries(rest).filter(([, v]) => !isEmptyValue(v));

  const allEmpty = !punteo && !resumenText && !fortalezasList?.length && !mejorasList?.length
                  && !recomendList?.length && !observList?.length && restEntries.length === 0;
  if (allEmpty) return <p className="text-gray-400 text-sm text-center py-4">Sin datos de resultado disponibles</p>;

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
            <p className="text-xs text-gray-600">Punteo promedio acumulativo</p>
          </div>
        </div>
      )}
      {resumenText && (
        <div>
          <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" />Resumen
          </h4>
          <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200">
            <MarkdownContent text={resumenText} />
          </div>
        </div>
      )}
      {fortalezasList?.length > 0 && (
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <h4 className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />Fortalezas
          </h4>
          <ul className="space-y-1.5">
            {fortalezasList.map((item, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                <div className="flex-1 min-w-0"><MdOrText text={typeof item === 'string' ? item : JSON.stringify(item)} /></div>
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
                <span className="text-orange-500 mt-0.5 flex-shrink-0">⚠</span>
                <div className="flex-1 min-w-0"><MdOrText text={typeof item === 'string' ? item : JSON.stringify(item)} /></div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {recomendList?.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" />Recomendaciones
          </h4>
          <ul className="space-y-1.5">
            {recomendList.map((item, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-500 mt-0.5 flex-shrink-0">→</span>
                <div className="flex-1 min-w-0"><MdOrText text={typeof item === 'string' ? item : JSON.stringify(item)} /></div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {observList?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Observaciones</h4>
          <ul className="space-y-1">
            {observList.map((obs, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-purple-400 flex-shrink-0 mt-0.5">•</span>
                <div className="flex-1 min-w-0"><MdOrText text={typeof obs === 'string' ? obs : JSON.stringify(obs)} /></div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {patronesList?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Patrones Identificados</h4>
          <ul className="space-y-1">
            {patronesList.map((p, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-purple-400 flex-shrink-0 mt-0.5">•</span>
                <div className="flex-1 min-w-0"><MdOrText text={typeof p === 'string' ? p : JSON.stringify(p)} /></div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {restEntries.map(([key, value]) => (
        <div key={key}>
          <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">{toLabel(key)}</h4>
          <NestedValue value={value} />
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
    if (typeof cleaned === 'object') return <StructuredResult resultado={cleaned} />;
    return <MarkdownContent text={cleaned} />;
  }
  if (typeof resultado === 'object') return <StructuredResult resultado={resultado} />;
  return null;
}

export default function AnalisisUsuarioModal({ member, onClose }) {
  const { authToken, showToast } = useApp();
  const [loading, setLoading]   = useState(true);
  const [analisis, setAnalisis] = useState(undefined);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await analisisUsuarioAPI.getUltimo(authToken, member.id);
        setAnalisis(data);
      } catch {
        showToast('Error al cargar el análisis del usuario', 'error');
        setAnalisis(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [member.id]);

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
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Análisis General — Resumen</h3>
              <p className="text-sm text-gray-500">{member.nombre || member.email}</p>
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
              <Loader className="w-8 h-8 animate-spin text-purple-500" />
              <span className="text-sm">Cargando análisis...</span>
            </div>
          ) : !analisis ? (
            <div className="text-center py-16">
              <Star className="w-14 h-14 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Sin análisis disponible</p>
              <p className="text-gray-400 text-sm mt-1">Ejecuta un análisis acumulativo para ver los resultados aquí</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Meta */}
              <div className="flex items-center gap-3 flex-wrap">
                {badge && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                )}
                {analisis.created_at && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />{formatDate(analisis.created_at)}
                  </span>
                )}
                {analisis.total_audios_analizados != null && (
                  <span className="text-xs text-gray-500">{analisis.total_audios_analizados} audio(s) analizados</span>
                )}
              </div>

              {/* Cuerpo del análisis */}
              {isWorking ? (
                <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <Loader className="w-5 h-5 text-yellow-600 animate-spin flex-shrink-0" />
                  <p className="text-sm text-yellow-800">El análisis está siendo procesado. Vuelve en unos momentos.</p>
                </div>
              ) : isError ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">Ocurrió un error al procesar el análisis.</p>
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
        <div className="border-t p-4 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex gap-2">
            {analisis?.resultado && (
              <>
                <button
                  onClick={() => exportAsPDF(
                    'Análisis Individual',
                    member.nombre || member.email,
                    typeof analisis.resultado === 'string' ? cleanResultadoStr(analisis.resultado) : analisis.resultado,
                    [['Usuario', member.nombre || member.email], ['Fecha', formatDate(analisis.created_at)], ['Audios analizados', analisis.total_audios_analizados ?? '—']]
                  )}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 text-sm font-medium"
                >
                  <Download className="w-4 h-4" />PDF
                </button>
                <button
                  onClick={() => exportAsCSV(
                    typeof analisis.resultado === 'string' ? cleanResultadoStr(analisis.resultado) : analisis.resultado,
                    `analisis_${(member.nombre || member.email).replace(/\s+/g, '_')}.csv`,
                    [['usuario', member.nombre || member.email], ['fecha', formatDate(analisis.created_at)], ['audios_analizados', analisis.total_audios_analizados ?? '']]
                  )}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 text-sm font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4" />CSV
                </button>
              </>
            )}
          </div>
          <button onClick={onClose} className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
