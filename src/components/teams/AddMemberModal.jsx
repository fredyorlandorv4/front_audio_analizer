import React, { useState, useEffect } from 'react';
import { X, Users, User } from 'lucide-react';
import { usersAPI, teamsAPI } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AddMemberModal({ team, onClose, onSuccess }) {
  const { authToken, showToast } = useApp(); // ✅ del contexto
  const [availableOperators, setAvailableOperators] = useState([]);
  const [selectedOperators, setSelectedOperators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!team) return;
    const loadOperators = async () => {
      try {
        const data = await usersAPI.getAvailableOperators(authToken);
        setAvailableOperators(data);
      } catch {
        showToast('Error al cargar operadores disponibles', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadOperators();
  }, [team]);

  if (!team) return null;

  const toggle = (id) =>
    setSelectedOperators(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleAdd = async () => {
    if (selectedOperators.length === 0) {
      showToast('Selecciona al menos un operador', 'warning');
      return;
    }
    try {
      await teamsAPI.addMembers(authToken, team.id, selectedOperators);
      showToast('Miembros agregados exitosamente', 'success');
      onSuccess();
    } catch {
      showToast('Error al agregar miembros al equipo', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Agregar Operadores</h3>
            <p className="text-sm text-gray-600 mt-1">Equipo: {team.nombre}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-500 text-sm">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              Cargando operadores...
            </div>
          ) : availableOperators.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">No hay operadores disponibles sin equipo asignado</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">Selecciona los operadores que deseas agregar al equipo:</p>
              {availableOperators.map((op) => (
                <label key={op.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                  <input type="checkbox" checked={selectedOperators.includes(op.id)} onChange={() => toggle(op.id)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{op.nombre}</p>
                      <p className="text-xs text-gray-500">{op.email}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 sm:p-6 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancelar</button>
          <button onClick={handleAdd} disabled={selectedOperators.length === 0 || loading}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
            Agregar ({selectedOperators.length})
          </button>
        </div>
      </div>
    </div>
  );
}