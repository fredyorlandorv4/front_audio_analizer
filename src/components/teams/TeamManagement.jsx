// src/components/teams/TeamManagement.jsx
import React, { useState, useEffect } from 'react';
import { Users, Edit, Trash2, User, Plus, X, ChevronRight, BarChart2, Zap, Loader } from 'lucide-react';
import { teamsAPI, usersAPI, categoriasAPI, analisisUsuarioAPI, analisisEquipoAPI } from '../../services/api';
import TeamModal from './TeamModal';
import AddMemberModal from './AddMemberModal';
import MemberDetail from './MemberDetail';
import AnalisisUsuarioModal from './AnalisisUsuarioModal';
import AnalisisEquipoModal from './AnalisisEquipoModal';
import { useApp } from '../../context/AppContext';

export default function TeamManagement() {
  const { authToken, showToast } = useApp();
  const [teams, setTeams] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Análisis modals
  const [analisisMember, setAnalisisMember] = useState(null); // abre AnalisisUsuarioModal
  const [analisisTeam, setAnalisisTeam]     = useState(null); // abre AnalisisEquipoModal

  // Loading state para botones "Ejecutar"
  const [ejecutandoUsers,  setEjecutandoUsers]  = useState(new Set());
  const [ejecutandoEquipos, setEjecutandoEquipos] = useState(new Set());

  useEffect(() => {
    loadTeams();
    loadSupervisors();
    loadCategorias();
  }, []);

  const loadTeams = async () => {
    try {
      const data = await teamsAPI.getAll(authToken);
      const teamsWithMembers = await Promise.all(
        data.map(async (team) => {
          try {
            const [members, scoreData] = await Promise.all([
              teamsAPI.getMembers(authToken, team.id),
              teamsAPI.getScore(authToken, team.id)
            ]);
            return { ...team, members, score: scoreData?.promedio_punteo ?? null, audio_count: scoreData?.total_audios ?? 0 };
          } catch {
            return { ...team, members: [], score: null, audio_count: 0 };
          }
        })
      );
      setTeams(teamsWithMembers);
    } catch {
      showToast('Error al cargar equipos', 'error');
    }
  };

  const loadSupervisors = async () => {
    try {
      const data = await usersAPI.getSupervisors(authToken);
      setSupervisors(data);
    } catch {
      showToast('Error al cargar supervisores', 'error');
    }
  };

  const loadCategorias = async () => {
    try {
      const data = await categoriasAPI.getAll(authToken);
      setCategorias(data);
    } catch {
      showToast('Error al cargar categorías', 'error');
    }
  };

  const handleCreateTeam = async (teamData) => {
    try {
      await teamsAPI.create(authToken, teamData);
      showToast('Equipo creado exitosamente', 'success');
      setShowTeamModal(false);
      loadTeams();
    } catch {
      showToast('Error al crear equipo', 'error');
    }
  };

  const handleUpdateTeam = async (teamData) => {
    try {
      await teamsAPI.update(authToken, selectedTeam.id, teamData);
      showToast('Equipo actualizado exitosamente', 'success');
      setShowTeamModal(false);
      setSelectedTeam(null);
      loadTeams();
    } catch {
      showToast('Error al actualizar equipo', 'error');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('¿Eliminar este equipo? Los operadores quedarán sin equipo.')) return;
    try {
      await teamsAPI.delete(authToken, teamId);
      showToast('Equipo eliminado exitosamente', 'success');
      loadTeams();
    } catch {
      showToast('Error al eliminar equipo', 'error');
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    if (!window.confirm('¿Remover este operador del equipo?')) return;
    try {
      await teamsAPI.removeMember(authToken, teamId, userId);
      showToast('Operador removido del equipo', 'success');
      loadTeams();
    } catch {
      showToast('Error al remover operador', 'error');
    }
  };

  // Ejecutar análisis individual de usuario
  const handleEjecutarAnalisisUsuario = async (userId) => {
    if (ejecutandoUsers.has(userId)) return;
    setEjecutandoUsers(prev => new Set(prev).add(userId));
    try {
      await analisisUsuarioAPI.ejecutar(authToken, userId);
      showToast('Análisis iniciado. Los resultados estarán disponibles en breve.', 'success');
    } catch {
      showToast('Error al ejecutar el análisis del usuario', 'error');
    } finally {
      setEjecutandoUsers(prev => { const next = new Set(prev); next.delete(userId); return next; });
    }
  };

  // Ejecutar análisis grupal de equipo
  const handleEjecutarAnalisisEquipo = async (teamId) => {
    if (ejecutandoEquipos.has(teamId)) return;
    setEjecutandoEquipos(prev => new Set(prev).add(teamId));
    try {
      await analisisEquipoAPI.ejecutar(authToken, teamId);
      showToast('Análisis grupal iniciado. Los resultados estarán disponibles en breve.', 'success');
    } catch {
      showToast('Error al ejecutar el análisis grupal', 'error');
    } finally {
      setEjecutandoEquipos(prev => { const next = new Set(prev); next.delete(teamId); return next; });
    }
  };

  const openCreateModal    = () => { setSelectedTeam(null); setShowTeamModal(true); };
  const openEditModal      = (team) => { setSelectedTeam(team); setShowTeamModal(true); };
  const openAddMemberModal = (team) => { setSelectedTeam(team); setShowAddMemberModal(true); };

  if (teams.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Gestión de Equipos</h2>
          <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
            <Plus className="w-5 h-5" />Nuevo Equipo
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No hay equipos creados</p>
          <button onClick={openCreateModal} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Crear primer equipo</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Equipos</h2>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
          <Plus className="w-5 h-5" />Nuevo Equipo
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {teams.map((team) => (
          <div key={team.id} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{team.nombre}</h3>
                {team.descripcion && <p className="text-sm text-gray-600">{team.descripcion}</p>}
                {team.categoria && (
                  <span className="inline-block mt-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                    {team.categoria.nombre}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditModal(team)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"><Edit className="w-5 h-5" /></button>
                <button onClick={() => handleDeleteTeam(team.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-800 uppercase">Supervisor</span>
              </div>
              <p className="text-sm font-semibold">{team.supervisor?.email || 'Sin supervisor'}</p>
            </div>

            <div>
              <div className="flex justify-between mb-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />Operadores ({team.members?.length || 0})
                </h4>
                <button onClick={() => openAddMemberModal(team)} className="text-xs text-purple-600 font-medium flex items-center gap-1">
                  <Plus className="w-3 h-3" />Agregar
                </button>
              </div>

              {team.members?.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {team.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-1 p-2 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors group">
                      {/* Info del miembro — clic abre detalle */}
                      <button
                        onClick={() => setSelectedMember(member)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      >
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-purple-700">{member.nombre || member.email}</p>
                          {member.nombre && <p className="text-xs text-gray-500 truncate">{member.email}</p>}
                        </div>
                      </button>

                      {/* Botones de acción del miembro */}
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {/* Ver detalle de audios */}
                        <button
                          onClick={() => setSelectedMember(member)}
                          title="Ver audios del operador"
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Análisis General — ver resumen */}
                        <button
                          onClick={() => setAnalisisMember(member)}
                          title="Ver análisis general del operador"
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </button>

                        {/* Ejecutar Análisis */}
                        <button
                          onClick={() => handleEjecutarAnalisisUsuario(member.id)}
                          disabled={ejecutandoUsers.has(member.id)}
                          title="Ejecutar análisis acumulativo del operador"
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {ejecutandoUsers.has(member.id)
                            ? <Loader className="w-4 h-4 animate-spin" />
                            : <Zap className="w-4 h-4" />
                          }
                        </button>

                        {/* Remover del equipo */}
                        <button
                          onClick={() => handleRemoveMember(team.id, member.id)}
                          title="Remover del equipo"
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">No hay operadores asignados</p>
              )}
            </div>

            {/* Stats */}
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{team.members?.length || 0}</p>
                  <p className="text-xs text-gray-600">Miembros</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{team.audio_count || 0}</p>
                  <p className="text-xs text-gray-600">Audios</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${
                    team.score === null ? 'text-gray-400' :
                    team.score >= 80 ? 'text-green-600' :
                    team.score >= 60 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {team.score !== null ? team.score.toFixed(0) : '—'}
                  </p>
                  <p className="text-xs text-gray-600">Punteo</p>
                </div>
              </div>

              {/* Botones de análisis grupal del equipo */}
              <div className="flex gap-2">
                <button
                  onClick={() => setAnalisisTeam(team)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                >
                  <BarChart2 className="w-4 h-4" />
                  Análisis Grupal
                </button>
                <button
                  onClick={() => handleEjecutarAnalisisEquipo(team.id)}
                  disabled={ejecutandoEquipos.has(team.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ejecutandoEquipos.has(team.id) ? (
                    <><Loader className="w-4 h-4 animate-spin" />Ejecutando...</>
                  ) : (
                    <><Zap className="w-4 h-4" />Ejecutar Análisis Grupal</>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showTeamModal && (
        <TeamModal
          team={selectedTeam}
          supervisors={supervisors}
          categorias={categorias}
          onSave={selectedTeam ? handleUpdateTeam : handleCreateTeam}
          onClose={() => { setShowTeamModal(false); setSelectedTeam(null); }}
        />
      )}

      {showAddMemberModal && selectedTeam && (
        <AddMemberModal
          team={selectedTeam}
          onClose={() => setShowAddMemberModal(false)}
          onSuccess={() => { loadTeams(); setShowAddMemberModal(false); }}
        />
      )}

      {selectedMember && (
        <MemberDetail
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {/* Modal análisis individual de operador */}
      {analisisMember && (
        <AnalisisUsuarioModal
          member={analisisMember}
          onClose={() => setAnalisisMember(null)}
        />
      )}

      {/* Modal análisis grupal de equipo */}
      {analisisTeam && (
        <AnalisisEquipoModal
          team={analisisTeam}
          onClose={() => setAnalisisTeam(null)}
        />
      )}
    </div>
  );
}
