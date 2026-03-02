// src/components/teams/AnalisisUsuarioModal.jsx
import React, { useState, useEffect } from 'react';
import { X, BarChart2, CheckCircle, TrendingUp, Lightbulb, Calendar, Loader, AlertTriangle, Star } from 'lucide-react';
import { analisisUsuarioAPI } from '../../services/api';
import { formatDate, scoreColor, scoreBg } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';

const ESTADO_BADGE = {
  completado: { label: 'Completado', cls: 'bg-green-100 text-green-800' },
  procesando: { label: 'Procesando', cls: 'bg-yellow-100 text-yellow-800' },
  pendiente:  { label: 'Pendiente',  cls: 'bg-gray-100 text-gray-600' },
  error:      { label: 'Error',      cls: 'bg-red-100 text-red-800' },
};

function ResultRenderer({ resultado }) {
  if (!resultado) return null;

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
  const restEntries      = Object.entries(rest).filter(([, v]) => v !== null && v !== undefined && v !== '');

  const allEmpty = !punteo && !resumenText && !fortalezasList?.length && !mejorasList?.length && !recomendList?.length && !observList?.length && restEntries.length === 0;
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
          <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200">{resumenText}</p>
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
            <Lightbulb className="w-3.5 h-3.5" />Recomendaciones
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

      {observList?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Observaciones</h4>
          <ul className="space-y-1">
            {observList.map((obs, i) => (
              <li key={i} className="text-sm text-gray-700 pl-3">• {obs}</li>
            ))}
          </ul>
        </div>
      )}

      {patronesList?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Patrones Identificados</h4>
          <ul className="space-y-1">
            {patronesList.map((p, i) => (
              <li key={i} className="text-sm text-gray-700 pl-3">• {typeof p === 'string' ? p : JSON.stringify(p)}</li>
            ))}
          </ul>
        </div>
      )}

      {restEntries.map(([key, value]) => (
        <div key={key}>
          <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">{key.replace(/_/g, ' ')}</h4>
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

export default function AnalisisUsuarioModal({ member, onClose }) {
  const { authToken, showToast } = useApp();
  const [loading, setLoading] = useState(true);
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

  const badge = analisis ? (ESTADO_BADGE[analisis.estado] ?? { label: analisis.estado, cls: 'bg-gray-100 text-gray-600' }) : null;

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

              {(analisis.estado === 'procesando' || analisis.estado === 'pendiente') ? (
                <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <Loader className="w-5 h-5 text-yellow-600 animate-spin flex-shrink-0" />
                  <p className="text-sm text-yellow-800">El análisis está siendo procesado. Vuelve en unos momentos.</p>
                </div>
              ) : analisis.estado === 'error' ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">Ocurrió un error al procesar el análisis.</p>
                </div>
              ) : (
                <ResultRenderer resultado={analisis.resultado} />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
