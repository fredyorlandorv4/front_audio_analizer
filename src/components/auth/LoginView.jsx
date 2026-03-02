// src/components/auth/LoginView.jsx
import React, { useState } from 'react';
import { Music, AlertTriangle } from 'lucide-react';
import { authAPI } from '../../services/api';

export default function LoginView({ onLoginSuccess, sessionExpired }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setLoginError('Por favor completa todos los campos');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const data = await authAPI.login(username, password);

      if (!data.access_token) {
        setLoginError('Respuesta del servidor inválida');
        setIsLoggingIn(false);
        return;
      }

      onLoginSuccess(data.access_token, username, data.role);
    } catch (error) {
      setLoginError('Usuario o contraseña incorrectos');
      setIsLoggingIn(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoggingIn) handleLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-full">
            <Music className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-gray-800">Audio Manager</h1>
        <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">Gestiona tus archivos de audio</p>

        <div className="space-y-4">
          {/* Banner de sesión expirada */}
          {sessionExpired && !loginError && (
            <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="font-medium">Tu sesión ha expirado. Por favor inicia sesión nuevamente.</p>
            </div>
          )}

          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <p className="font-medium">⚠️ {loginError}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setLoginError(''); }}
              onKeyPress={handleKeyPress}
              disabled={isLoggingIn}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Ingresa tu usuario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
              onKeyPress={handleKeyPress}
              disabled={isLoggingIn}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Ingresa tu contraseña"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Iniciando sesión...
              </>
            ) : 'Iniciar Sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
