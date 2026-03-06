import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, CheckCircle, AlertCircle, Loader, Building2 } from 'lucide-react';
import { areasAPI } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function UserModal({ user, onSave, onClose }) {
  const { authToken, showToast } = useApp();
  const [formData, setFormData] = useState({
    email: '', nombre: '', rol: 'operador', area: '', password: '', confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Áreas cargadas desde el API
  const [areas, setAreas]             = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [areasError, setAreasError]   = useState(false);

  // Extrae el ID de un campo que puede ser objeto { id, name, description } o un valor primitivo
  const areaId = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return String(val.id ?? '');
    return String(val);
  };

  // Carga áreas al montar
  useEffect(() => {
    const load = async () => {
      try {
        const data = await areasAPI.getAll(authToken);
        const list = Array.isArray(data) ? data : [];
        setAreas(list);
        if (list.length === 0) setAreasError(true);
      } catch {
        setAreasError(true);
      } finally {
        setLoadingAreas(false);
      }
    };
    load();
  }, []);

  // Pre-rellena el formulario al editar
  useEffect(() => {
    if (user) {
      setFormData({
        email:    user.email  || '',
        nombre:   typeof user.nombre === 'object' ? (user.nombre?.name || user.nombre?.nombre || '') : (user.nombre || ''),
        rol:      typeof user.rol    === 'object' ? (user.rol?.name    || user.rol?.nombre    || 'operador') : (user.rol || 'operador'),
        area:     areaId(user.area),  // guarda el ID del área
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
    // Si hay select con áreas, envía area_id (entero); si es input libre, envía area (string)
    const areaAsNumber = parseInt(formData.area, 10);
    const userData = {
      email:  formData.email,
      nombre: formData.nombre,
      rol:    formData.rol,
      ...(areas.length > 0 && !areasError
        ? { area_id: areaAsNumber }
        : { area: formData.area })
    };
    if (formData.password) userData.password = formData.password;
    onSave(userData);
  };

  const passwordsMatch     = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
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
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo <span className="text-red-500">*</span></label>
            <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Juan Pérez" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="juan@ejemplo.com" />
          </div>

          {/* Área — select dinámico */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              Área <span className="text-red-500">*</span>
            </label>
            {loadingAreas ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                <Loader className="w-4 h-4 animate-spin" /> Cargando áreas...
              </div>
            ) : !areasError && areas.length > 0 ? (
              <select
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm
                  ${!formData.area ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              >
                <option value="">— Selecciona un área —</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name || a.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ej: Ventas"
              />
            )}
            {!formData.area && !loadingAreas && (
              <p className="mt-1 text-xs text-red-500">⚠ Este campo es obligatorio</p>
            )}
          </div>

          {/* Contraseña */}
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

          {/* Confirmar contraseña */}
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

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rol <span className="text-red-500">*</span></label>
            <select value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option value="operador">Operador</option>
              <option value="sup">Supervisor</option>
              <option value="admin">Administrador</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {formData.rol === 'admin'    && '• Acceso total al sistema'}
              {formData.rol === 'sup'      && '• Puede gestionar usuarios y audios'}
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
