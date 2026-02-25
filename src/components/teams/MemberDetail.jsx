// src/components/teams/MemberDetail.jsx
import React, { useState, useEffect } from 'react';
import { X, User, BarChart2, Music, MessageSquare, Star, Mic, Play, Pause } from 'lucide-react';
import { audiosAPI } from '../../services/api';
import { formatBytes, formatDate, calcAverageScore, scoreColor, scoreBg } from '../../utils/formatters';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { usePagination } from '../../hooks/usePagination';
import PaginationControls from '../shared/PaginationControls';
import { useApp } from '../../context/AppContext';

export default function MemberDetail({ member, onClose }) {
  const { authToken, showToast } = useApp(); // ✅ del contexto
  const [memberAudios, setMemberAudios]             = useState([]);
  const [loadingMember, setLoadingMember]           = useState(false);
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal]   = useState(false);
  const [modalAudio, setModalAudio]                 = useState(null);

  const { playingId, loadingAudioId, togglePlay, stopPlayback } = useAudioPlayer(authToken, showToast);
  const pagination = usePagination(memberAudios, 5);

  useEffect(() => {
    loadMemberAudios();
    // Detener audio al cerrar el panel
    return () => stopPlayback();
  }, [member]);

  const loadMemberAudios = async () => {
    setLoadingMember(true);
    try {
      const data = await audiosAPI.getByUserId(authToken, member.id);
      setMemberAudios(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('Error al cargar audios del miembro', 'error');
      setMemberAudios([]);
    } finally {
      setLoadingMember(false);
    }
  };

  const openTranscriptionModal = (audio) => { setModalAudio(audio); setShowTranscriptionModal(true); };
  const openAnalysisModal      = (audio) => { setModalAudio(audio); setShowAnalysisModal(true); };

  const avgScore       = calcAverageScore(memberAudios);
  const audiosWithScore = memberAudios.filter(a => a.extra?.supervisor_coaching?.quality_score?.score != null);

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black bg-opacity-40" onClick={onClose} />
      
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-[slideInRight_0.25s_ease-out]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-5 flex items-start justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{member.nombre || member.email}</h2>
              {member.nombre && <p className="text-purple-200 text-sm">{member.email}</p>}
              {member.area  && <p className="text-purple-200 text-xs mt-0.5">Área: {member.area}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Punteo general */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" /> Punteo General
          </h3>
          {loadingMember ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              Cargando datos...
            </div>
          ) : avgScore !== null ? (
            <div className={`flex items-center gap-4 p-3 rounded-xl border ${scoreBg(avgScore)}`}>
              <div className={`text-4xl font-extrabold ${scoreColor(avgScore)}`}>{avgScore}</div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
                  <div
                    className={`h-3 rounded-full transition-all ${avgScore >= 80 ? 'bg-green-500' : avgScore >= 60 ? 'bg-yellow-400' : 'bg-red-500'}`}
                    style={{ width: `${avgScore}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Promedio de {audiosWithScore.length} audio{audiosWithScore.length !== 1 ? 's' : ''} evaluado{audiosWithScore.length !== 1 ? 's' : ''} / {memberAudios.length} total
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                {memberAudios.length === 0 ? 'Sin audios registrados' : 'Sin evaluaciones aún'}
              </p>
            </div>
          )}
        </div>

        {/* Lista de audios */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Mic className="w-4 h-4" /> Audios ({memberAudios.length})
          </h3>

          {loadingMember ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : memberAudios.length === 0 ? (
            <div className="text-center py-10">
              <Music className="w-12 h-12 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No hay audios registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pagination.paginated.map((audio) => {
                const score          = audio.extra?.supervisor_coaching?.quality_score?.score;
                const hasTranscription = !!(audio.extra?.transcription || audio.transcription);
                const hasAnalysis    = !!audio.extra;
                const isPlaying      = playingId === audio.id;
                const isLoading      = loadingAudioId === audio.id;

                return (
                  <div key={audio.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 hover:border-purple-300 transition-colors">
                    {/* Info del audio */}
                    <div className="flex items-start gap-3 mb-2.5">
                      <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Music className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{audio.original_filename}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-500">{formatDate(audio.created_at)}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-500">{formatBytes(audio.size_bytes)}</span>
                          {score != null && (
                            <><span className="text-gray-300">·</span>
                            <span className={`text-xs font-bold ${scoreColor(score)}`}>{score}/100</span></>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-2">
                      {/* Reproducir */}
                      <button
                        onClick={() => togglePlay(audio)}
                        disabled={isLoading}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50
                          ${isPlaying ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                      >
                        {isLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        {isLoading ? 'Cargando...' : isPlaying ? 'Pausar' : 'Reproducir'}
                      </button>

                      {/* Transcripción */}
                      <button
                        onClick={() => openTranscriptionModal(audio)}
                        disabled={!hasTranscription}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors
                          ${hasTranscription ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Transcripción
                      </button>

                      {/* Análisis */}
                      <button
                        onClick={() => openAnalysisModal(audio)}
                        disabled={!hasAnalysis}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors
                          ${hasAnalysis ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        {hasAnalysis ? 'Análisis' : 'En proceso...'}
                      </button>
                    </div>
                  </div>
                );
              })}
              {/* Paginación compacta */}
              <PaginationControls {...pagination} compact />
            </div>
          )}
        </div>
      </div>

      {/* Modal Transcripción */}
      {showTranscriptionModal && modalAudio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowTranscriptionModal(false); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Transcripción</h3>
                  <p className="text-xs text-gray-500 truncate max-w-xs">{modalAudio.original_filename}</p>
                </div>
              </div>
              <button onClick={() => setShowTranscriptionModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {(modalAudio.extra?.transcription || modalAudio.transcription) ? (
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-mono border border-gray-200">
                  {modalAudio.extra?.transcription || modalAudio.transcription}
                </div>
              ) : (
                <div className="text-center py-10">
                  <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No hay transcripción disponible</p>
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 p-4 flex justify-end flex-shrink-0">
              <button onClick={() => setShowTranscriptionModal(false)} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Análisis */}
      {showAnalysisModal && modalAudio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAnalysisModal(false); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Análisis del Audio</h3>
                  <p className="text-xs text-gray-500 truncate max-w-xs">{modalAudio.original_filename}</p>
                </div>
              </div>
              <button onClick={() => setShowAnalysisModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-5">
              {modalAudio.extra ? (
                <>
                  {modalAudio.extra.title    && <div><h4 className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-1">Título</h4><p className="text-gray-800">{modalAudio.extra.title}</p></div>}
                  {modalAudio.extra.summary  && <div><h4 className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-1">Resumen</h4><p className="text-gray-700 leading-relaxed">{modalAudio.extra.summary}</p></div>}
                  {modalAudio.extra.sentiment && <div><h4 className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-2">Sentimiento</h4><span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{modalAudio.extra.sentiment}</span></div>}

                  {modalAudio.extra.main_points?.length > 0 && (
                    <div><h4 className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-2">Puntos Principales</h4>
                      <ul className="space-y-1">{modalAudio.extra.main_points.map((p,i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-purple-400 mt-0.5">•</span>{p}</li>)}</ul>
                    </div>
                  )}
                  {modalAudio.extra.action_items?.length > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg"><h4 className="text-sm font-semibold text-yellow-800 uppercase tracking-wide mb-2">Acciones Pendientes</h4>
                      <ul className="space-y-1">{modalAudio.extra.action_items.map((item,i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-yellow-600 mt-0.5">□</span>{item}</li>)}</ul>
                    </div>
                  )}
                  {modalAudio.extra.follow_up?.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg"><h4 className="text-sm font-semibold text-green-800 uppercase tracking-wide mb-2">Seguimiento</h4>
                      <ul className="space-y-1">{modalAudio.extra.follow_up.map((item,i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-green-600 mt-0.5">→</span>{item}</li>)}</ul>
                    </div>
                  )}
                  {modalAudio.extra.related_topics?.length > 0 && (
                    <div><h4 className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-2">Temas Relacionados</h4>
                      <div className="flex flex-wrap gap-2">{modalAudio.extra.related_topics.map((topic,i) => <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{topic}</span>)}</div>
                    </div>
                  )}

                  {modalAudio.extra.supervisor_coaching && (
                    <div className="border-t border-gray-200 pt-5">
                      <h4 className="text-base font-bold text-purple-600 mb-4">Coaching del Supervisor</h4>
                      {modalAudio.extra.supervisor_coaching.quality_score && (
                        <div className={`p-4 rounded-xl border mb-4 ${scoreBg(modalAudio.extra.supervisor_coaching.quality_score.score)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-800 text-sm">Puntuación de Calidad</span>
                            <span className={`text-3xl font-extrabold ${scoreColor(modalAudio.extra.supervisor_coaching.quality_score.score)}`}>{modalAudio.extra.supervisor_coaching.quality_score.score}/100</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div className={`h-2 rounded-full ${modalAudio.extra.supervisor_coaching.quality_score.score >= 80 ? 'bg-green-500' : modalAudio.extra.supervisor_coaching.quality_score.score >= 60 ? 'bg-yellow-400' : 'bg-red-500'}`}
                              style={{ width: `${modalAudio.extra.supervisor_coaching.quality_score.score}%` }} />
                          </div>
                          <p className="text-xs text-gray-600">{modalAudio.extra.supervisor_coaching.quality_score.rationale}</p>
                        </div>
                      )}
                      {modalAudio.extra.supervisor_coaching.observations?.length > 0 && (
                        <div className="mb-3"><h5 className="font-semibold text-gray-800 mb-2 text-sm">Observaciones</h5>
                          <ul className="space-y-1">{modalAudio.extra.supervisor_coaching.observations.map((obs,i) => <li key={i} className="text-sm text-gray-700 pl-4">• {obs}</li>)}</ul>
                        </div>
                      )}
                      {modalAudio.extra.supervisor_coaching.strengths?.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg mb-3"><h5 className="font-semibold text-green-800 mb-2 text-sm">Fortalezas</h5>
                          <ul className="space-y-1">{modalAudio.extra.supervisor_coaching.strengths.map((s,i) => <li key={i} className="text-sm text-gray-700 pl-3">✓ {s}</li>)}</ul>
                        </div>
                      )}
                      {modalAudio.extra.supervisor_coaching.areas_for_improvement?.length > 0 && (
                        <div className="bg-orange-50 p-4 rounded-lg mb-3"><h5 className="font-semibold text-orange-800 mb-2 text-sm">Áreas de Mejora</h5>
                          <ul className="space-y-1">{modalAudio.extra.supervisor_coaching.areas_for_improvement.map((a,i) => <li key={i} className="text-sm text-gray-700 pl-3">⚠ {a}</li>)}</ul>
                        </div>
                      )}
                      {modalAudio.extra.supervisor_coaching.suggested_phrases?.length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg mb-3"><h5 className="font-semibold text-blue-800 mb-2 text-sm">Frases Sugeridas</h5>
                          <ul className="space-y-2">{modalAudio.extra.supervisor_coaching.suggested_phrases.map((p,i) => <li key={i} className="text-sm text-gray-700 italic pl-3">"{p}"</li>)}</ul>
                        </div>
                      )}
                      {modalAudio.extra.supervisor_coaching.compliance_flags?.length > 0 && (
                        <div className="bg-red-50 p-4 rounded-lg mb-3"><h5 className="font-semibold text-red-800 mb-2 text-sm">⚠️ Alertas de Cumplimiento</h5>
                          <ul className="space-y-1">{modalAudio.extra.supervisor_coaching.compliance_flags.map((f,i) => <li key={i} className="text-sm text-gray-700 pl-3">⚠ {f}</li>)}</ul>
                        </div>
                      )}
                      {modalAudio.extra.supervisor_coaching.next_steps?.length > 0 && (
                        <div className="bg-purple-50 p-4 rounded-lg"><h5 className="font-semibold text-purple-800 mb-2 text-sm">Próximos Pasos</h5>
                          <ul className="space-y-1">{modalAudio.extra.supervisor_coaching.next_steps.map((s,i) => <li key={i} className="text-sm text-gray-700 pl-3">→ {s}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10">
                  <BarChart2 className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No hay análisis disponible</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-4 flex justify-end flex-shrink-0">
              <button onClick={() => setShowAnalysisModal(false)} className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}