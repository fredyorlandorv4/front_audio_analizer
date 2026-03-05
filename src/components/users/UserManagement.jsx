// src/components/users/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { Users, User, Edit, Trash2, Plus, Upload, Loader } from 'lucide-react';
import { usersAPI } from '../../services/api';
import UserModal from './UserModal';
import AudioUploadModal from './AudioUploadModal';
import { useApp } from '../../context/AppContext';

export default function UserManagement() {
  const { authToken, showToast } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [uploadTargetUser, setUploadTargetUser] = useState(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersAPI.getAll(authToken);
      setUsers(data);
    } catch {
      showToast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      await usersAPI.create(authToken, userData);
      showToast('Usuario creado exitosamente', 'success');
      setShowUserModal(false);
      loadUsers();
    } catch {
      showToast('Error al crear usuario', 'error');
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      await usersAPI.update(authToken, editingUser.id, userData);
      showToast('Usuario actualizado exitosamente', 'success');
      setShowUserModal(false);
      setEditingUser(null);
      loadUsers();
    } catch {
      showToast('Error al actualizar usuario', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    try {
      await usersAPI.delete(authToken, userId);
      showToast('Usuario eliminado exitosamente', 'success');
      loadUsers();
    } catch {
      showToast('Error al eliminar usuario', 'error');
    }
  };

  const openCreateModal = () => { setEditingUser(null); setShowUserModal(true); };
  const openEditModal   = (user) => { setEditingUser(user); setShowUserModal(true); };

  const ROL_BADGE = {
    admin:    'bg-red-100 text-red-800',
    sup:      'bg-blue-100 text-blue-800',
    operador: 'bg-green-100 text-green-800',
  };
  const ROL_LABEL = { admin: 'Administrador', sup: 'Supervisor', operador: 'Operador' };

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <button disabled className="flex items-center gap-2 px-4 py-2 bg-purple-300 text-white rounded-lg font-semibold cursor-not-allowed">
            <Plus className="w-5 h-5" />Nuevo Usuario
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-16 flex flex-col items-center gap-3 text-gray-400">
          <Loader className="w-8 h-8 animate-spin text-purple-400" />
          <p className="text-sm">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────
  if (users.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
            <Plus className="w-5 h-5" />Nuevo Usuario
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No hay usuarios registrados</p>
          <button onClick={openCreateModal} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Crear primer usuario
          </button>
        </div>
        {showUserModal && (
          <UserModal user={null} onSave={handleCreateUser} onClose={() => setShowUserModal(false)} />
        )}
      </div>
    );
  }

  // ── Table ────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
          <Plus className="w-5 h-5" />Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Área</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{user.nombre}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{user.area || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full ${ROL_BADGE[user.rol] || 'bg-gray-100 text-gray-700'}`}>
                      {ROL_LABEL[user.rol] || user.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setUploadTargetUser(user)}
                        title="Cargar audios para este usuario"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cargar audios</span>
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        title="Editar usuario"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        title="Eliminar usuario"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showUserModal && (
        <UserModal
          user={editingUser}
          onSave={editingUser ? handleUpdateUser : handleCreateUser}
          onClose={() => { setShowUserModal(false); setEditingUser(null); }}
        />
      )}

      {uploadTargetUser && (
        <AudioUploadModal
          user={uploadTargetUser}
          onClose={() => setUploadTargetUser(null)}
        />
      )}
    </div>
  );
}
