import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function TeamModal({ team, supervisors, categorias, onSave, onClose }) {
  const { showToast } = useApp(); // ✅ del contexto
  const [form, setForm] = useState({
    nombre: '', descripcion: '', supervisor_id: '', categoria_id: ''
  });

  useEffect(() => {
    if (team) {
      setForm({
        nombre: team.nombre || '',
        descripcion: team.descripcion || '',
        supervisor_id: team.supervisor?.id || '',
        categoria_id: team.categoria?.id || ''
      });
    }
  }, [team]);

  const handleSave = () => {
    if (!form.nombre || !form.supervisor_id) {
      showToast('Por favor completa todos los campos obligatorios', 'warning');
      return;
    }
    onSave({
      nombre: form.nombre,
      descripcion: form.descripcion,
      supervisor_id: parseInt(form.supervisor_id),
      ...(form.categoria_id && { categoria_id: parseInt(form.categoria_id) })
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="border-b border-gray-200 p-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">{team ? 'Editar Equipo' : 'Nuevo Equipo'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Equipo <span className="text-red-500">*</span></label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Equipo Ventas" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Descripción del equipo (opcional)" rows="3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor <span className="text-red-500">*</span></label>
            <select value={form.supervisor_id} onChange={(e) => setForm({ ...form, supervisor_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option value="">Seleccionar supervisor...</option>
              {supervisors.map((sup) => <option key={sup.id} value={sup.id}>{sup.email}</option>)}
            </select>
            <p className="mt-1 text-xs text-gray-500">Solo usuarios con rol "Supervisor" aparecen en esta lista</p>
          </div>
          {categorias?.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
              <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">Sin categoría</option>
                {categorias.map((cat) => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-6 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancelar</button>
          <button onClick={handleSave} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
            {team ? 'Actualizar' : 'Crear Equipo'}
          </button>
        </div>
      </div>
    </div>
  );
}