import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function UserModal({ user, onSave, onClose }) {
  const { showToast } = useApp(); // ✅ del contexto
  const [formData, setFormData] = useState({
    email: '', nombre: '', rol: 'operador', area: '', password: '', confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Extrae string de campos que la API puede devolver como objeto { id, name, description }
  const safeStr = (val, fallback = '') => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'object') return val.name || val.nombre || val.description || fallback;
    return String(val).trim() || fallback;
  };

  useEffect(() => {
    if (user) {
      setFormData({
        email:   user.email  || '',
        nombre:  safeStr(user.nombre),
        rol:     safeStr(user.rol, 'operador'),
        area:    safeStr(user.area),
        password: '', confirmPassword: ''
      });
    }
  }, [user]);

  const handleSubmit = () => {
    if (!formData.email || !formData.nombre || !formData.rol || !formData.area) {
      showToast('Por favor completa todos los campos obligatorios', 'warning');
      return;
    }
    if (!user && !formData.password) {
      showToast('La contraseña es obligatoria', 'warning');
      return;
    }
    if (formData.password) {
      if (formData.password.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showToast('Las contraseñas no coinciden', 'warning');
        return;
      }
    }
    const userData = { email: formData.email, nombre: formData.nombre, rol: formData.rol, area: formData.area };
    if (formData.password) userData.password = formData.password;
    onSave(userData);
  };

  const passwordsMatch    = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
  const passwordsDontMatch = formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="border-b p-6 flex justify-between items-center">
          <h3 className="text-xl font-bold">{user ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo <span className="text-red-500">*</span></label>
            <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Juan Pérez" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="juan@ejemplo.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Área <span className="text-red-500">*</span></label>
            <input type="text" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Ventas" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña {user ? <span className="text-gray-500 text-xs">(dejar en blanco para no cambiar)</span> : <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={user ? "Nueva contraseña (opcional)" : "Mínimo 6 caracteres"} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar contraseña {!user && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Confirma tu contraseña" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordsDontMatch && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Las contraseñas no coinciden</p>}
            {passwordsMatch    && <p className="mt-1 text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Las contraseñas coinciden</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rol <span className="text-red-500">*</span></label>
            <select value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option value="operador">Operador</option>
              <option value="sup">Supervisor</option>
              <option value="admin">Administrador</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {formData.rol === 'admin' && '• Acceso total al sistema'}
              {formData.rol === 'sup'   && '• Puede gestionar usuarios y audios'}
              {formData.rol === 'operador' && '• Solo puede gestionar audios'}
            </p>
          </div>
        </div>

        <div className="border-t p-6 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancelar</button>
          <button onClick={handleSubmit} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
            {user ? 'Actualizar' : 'Crear Usuario'}
          </button>
        </div>
      </div>
    </div>
  );
}