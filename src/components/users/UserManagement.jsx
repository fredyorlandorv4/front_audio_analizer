// src/components/users/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { Users, User, Edit, Trash2, Plus } from 'lucide-react';
import { usersAPI } from '../../services/api';
import UserModal from './UserModal';
import { useApp } from '../../context/AppContext';

export default function UserManagement() {
  const { authToken, showToast } = useApp(); // ✅ del contexto
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const data = await usersAPI.getAll(authToken);
      setUsers(data);
    } catch {
      showToast('Error al cargar usuarios', 'error');
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
  const openEditModal = (user) => { setEditingUser(user); setShowUserModal(true); };

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
          <button onClick={openCreateModal} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Crear primer usuario</button>
        </div>
      </div>
    );
  }

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Área</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="ml-4"><div className="text-sm font-medium text-gray-900">{user.nombre}</div></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{user.email}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell"><div className="text-sm text-gray-700">{user.area || '-'}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.rol === 'admin' ? 'bg-red-100 text-red-800' :
                      user.rol === 'sup'   ? 'bg-blue-100 text-blue-800' :
                                             'bg-green-100 text-green-800'
                    }`}>
                      {user.rol === 'admin' ? 'Administrador' : user.rol === 'sup' ? 'Supervisor' : 'Operador'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditModal(user)} className="text-purple-600 hover:text-purple-900 mr-3 inline-flex items-center gap-1">
                      <Edit className="w-4 h-4" /><span className="hidden sm:inline">Editar</span>
                    </button>
                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900 inline-flex items-center gap-1">
                      <Trash2 className="w-4 h-4" /><span className="hidden sm:inline">Eliminar</span>
                    </button>
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
    </div>
  );
}