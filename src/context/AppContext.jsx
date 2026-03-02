// src/context/AppContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { teamsAPI } from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [authToken, setAuthToken]   = useState(() => localStorage.getItem('authToken') || '');
  const [username, setUsername]     = useState(() => localStorage.getItem('username') || '');
  const [userRole, setUserRole]     = useState(() => parseInt(localStorage.getItem('userRole') ?? '99'));
  const [audios, setAudios]         = useState([]);
  const [userTeams, setUserTeams]   = useState([]);
  const [toasts, setToasts]         = useState([]);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Refs para acceder a las funciones más recientes desde el event listener
  const logoutRef    = useRef(null);
  const showToastRef = useRef(null);

  // Cargar equipos del usuario cuando inicia sesión
  useEffect(() => {
    if (isLoggedIn && authToken) loadUserTeams();
  }, [isLoggedIn, authToken]);

  const loadUserTeams = async () => {
    try {
      const data = await teamsAPI.getAll(authToken);
      setUserTeams(data);
    } catch {
      console.error('Error cargando equipos del usuario');
    }
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const login = (token, user, role) => {
    setAuthToken(token);
    setUsername(user);
    setUserRole(role);
    setSessionExpired(false);
    localStorage.setItem('authToken', token);
    localStorage.setItem('username', user);
    localStorage.setItem('userRole', role);
    localStorage.setItem('isLoggedIn', 'true');
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setAuthToken('');
    setUsername('');
    setUserRole(99);
    setAudios([]);
    setUserTeams([]);
  };

  // Mantener refs actualizados en cada render
  logoutRef.current    = logout;
  showToastRef.current = showToast;

  // Escuchar el evento de token expirado disparado por authFetch en api.js
  useEffect(() => {
    const handler = () => {
      setSessionExpired(true);
      showToastRef.current('Tu sesión ha expirado. Por favor inicia sesión nuevamente.', 'error');
      // Pequeño delay para que el toast sea visible antes del cambio de vista
      setTimeout(() => logoutRef.current(), 800);
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  return (
    <AppContext.Provider value={{
      // Auth
      isLoggedIn,
      authToken,
      username,
      userRole,
      sessionExpired,
      login,
      logout,
      // Audios
      audios,
      setAudios,
      // Equipos del usuario
      userTeams,
      loadUserTeams,
      // Toasts
      toasts,
      setToasts,
      showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}
