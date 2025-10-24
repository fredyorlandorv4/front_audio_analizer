import React, { useState, useEffect } from 'react';
import { Upload, Music, Play, Pause, Trash2, ArrowLeft, User, LogOut, FileText, X, CheckCircle, AlertCircle, Info, XCircle, Users, Edit, Plus, Eye, EyeOff } from 'lucide-react';

export default function AudioManager() {
  // ⚙️ CONFIGURACIÓN DE API - Cambia esta URL por tu endpoint
  const API_BASE_URL = 'http://localhost:8000';  // 👈 Cambia esto por tu URL
  
  // Inicializar el estado desde localStorage si existe
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [currentView, setCurrentView] = useState(() => {
    // Si hay sesión activa, ir a la lista, sino al login
    return localStorage.getItem('isLoggedIn') === 'true' ? 'list' : 'login';
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username') || '';
  });
  const [password, setPassword] = useState('');
  const [audios, setAudios] = useState([]);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [authToken, setAuthToken] = useState(() => {
    return localStorage.getItem('authToken') || '';
  });
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState(null);
  const [loadingAudioId, setLoadingAudioId] = useState(null);
  const [currentBlobUrl, setCurrentBlobUrl] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  // Estados para gestión de usuarios
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    email: '',
    nombre: '',
    rol: 'operador',
    area: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Función para mostrar notificaciones
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    const newToast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remover después de 4 segundos
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  // Funciones para gestión de usuarios
  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (response.status === 401) {
        handleLogout();
        showToast('Tu sesión ha expirado', 'error');
        return;
      }
      
      if (!response.ok) throw new Error('Error al cargar usuarios');
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      showToast('Error al cargar usuarios', 'error');
    }
  };

  const handleCreateUser = async () => {
    if (!userForm.email || !userForm.nombre || !userForm.rol || !userForm.area) {
      showToast('Por favor completa todos los campos obligatorios', 'warning');
      return;
    }

    if (!userForm.password) {
      showToast('La contraseña es obligatoria', 'warning');
      return;
    }

    if (userForm.password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
      return;
    }

    if (userForm.password !== userForm.confirmPassword) {
      showToast('Las contraseñas no coinciden', 'warning');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userForm.email,
          nombre: userForm.nombre,
          rol: userForm.rol,
          area: userForm.area,
          password: userForm.password
        })
      });

      if (!response.ok) throw new Error('Error al crear usuario');

      const newUser = await response.json();
      setUsers(prev => [...prev, newUser]);
      setShowUserModal(false);
      setUserForm({ email: '', nombre: '', rol: 'operador', area: '', password: '', confirmPassword: '' });
      showToast('Usuario creado exitosamente', 'success');
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al crear usuario', 'error');
    }
  };

  const handleUpdateUser = async () => {
    if (!userForm.email || !userForm.nombre || !userForm.rol || !userForm.area) {
      showToast('Por favor completa todos los campos obligatorios', 'warning');
      return;
    }

    // Si se ingresó password, validar
    if (userForm.password) {
      if (userForm.password.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
        return;
      }

      if (userForm.password !== userForm.confirmPassword) {
        showToast('Las contraseñas no coinciden', 'warning');
        return;
      }
    }

    try {
      const updateData = {
        email: userForm.email,
        nombre: userForm.nombre,
        rol: userForm.rol,
        area: userForm.area
      };

      // Solo incluir password si se proporcionó uno nuevo
      if (userForm.password) {
        updateData.password = userForm.password;
      }

      const response = await fetch(`${API_BASE_URL}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error('Error al actualizar usuario');

      const updatedUser = await response.json();
      setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ email: '', nombre: '', rol: 'operador', area: '', password: '', confirmPassword: '' });
      showToast('Usuario actualizado exitosamente', 'success');
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al actualizar usuario', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = window.confirm('¿Estás seguro de eliminar este usuario?');
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (!response.ok) throw new Error('Error al eliminar usuario');

      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast('Usuario eliminado exitosamente', 'success');
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al eliminar usuario', 'error');
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setUserForm({ email: '', nombre: '', rol: 'operador', area: '', password: '', confirmPassword: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowUserModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      area: user.area || '',
      password: '',
      confirmPassword: ''
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowUserModal(true);
  };

  // Cargar audios cuando hay sesión activa
  useEffect(() => {
    if (isLoggedIn && authToken) {
      setCurrentView('list');
      loadAudios(authToken);
    }
  }, []);

  // Cargar usuarios cuando se accede a la vista de usuarios
  useEffect(() => {
    if (currentView === 'users' && isLoggedIn && authToken) {
      loadUsers();
    }
  }, [currentView, isLoggedIn, authToken]);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showExtraModal) {
        setShowExtraModal(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showExtraModal]);

  // Limpiar audio al cambiar de vista
  useEffect(() => {
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = '';
        setAudioPlayer(null);
        setPlayingId(null);
      }
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
        setCurrentBlobUrl(null);
      }
    };
  }, [currentView]);

  // Función de login - Envía datos como application/x-www-form-urlencoded
  const handleLogin = async () => {
    if (!username || !password) {
      setLoginError('Por favor completa todos los campos');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      // Crear datos en formato urlencoded
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      // Manejar diferentes códigos de respuesta
      if (response.status === 401) {
        setLoginError('Usuario o contraseña incorrectos');
        setIsLoggingIn(false);
        return;
      }

      if (response.status === 404) {
        setLoginError('El usuario no existe');
        setIsLoggingIn(false);
        return;
      }

      if (response.status === 422) {
        setLoginError('Datos de login inválidos');
        setIsLoggingIn(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setLoginError(errorData.detail || `Error del servidor (${response.status})`);
        setIsLoggingIn(false);
        return;
      }

      const data = await response.json();
      
      // Verificar que venga el token
      if (!data.access_token) {
        setLoginError('Respuesta del servidor inválida');
        setIsLoggingIn(false);
        return;
      }

      // Guardar el access_token de la respuesta
      const token = data.access_token;
      setAuthToken(token);
      
      // Guardar sesión en localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('username', username);
      localStorage.setItem('isLoggedIn', 'true');
      
      setIsLoggedIn(true);
      setCurrentView('list');
      setIsLoggingIn(false);
      
      // Cargar audios del servidor con el token recién obtenido
      loadAudios(token);
      
      showToast(`¡Bienvenido ${username}!`, 'success');
    } catch (error) {
      console.error('Error en login:', error);
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        setLoginError('No se pudo conectar al servidor. Verifica tu conexión.');
      } else {
        setLoginError('Error inesperado. Intenta nuevamente.');
      }
      setIsLoggingIn(false);
    }
  };

  // Función para cargar audios desde la API
  const loadAudios = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/audios`, {
        headers: { 
          'Authorization': `Bearer ${token || authToken}`
        }
      });

      // Si el token expiró, cerrar sesión
      if (response.status === 401) {
        console.warn('Token expirado, cerrando sesión...');
        handleLogout();
        showToast('Tu sesión ha expirado. Por favor inicia sesión nuevamente.', 'error');
        return;
      }

      if (!response.ok) {
        throw new Error(`Error al cargar audios: ${response.status}`);
      }

      const data = await response.json();
      setAudios(data);
    } catch (error) {
      console.error('Error cargando audios:', error);
      // No mostrar alert aquí para no molestar al usuario constantemente
    }
  };

  // Función para subir audios a la API
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE_URL}/audios`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${authToken}`
          },
          body: formData
        });

        if (response.status === 401) {
          showToast('Tu sesión ha expirado. Por favor inicia sesión nuevamente.', 'error');
          handleLogout();
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Error al subir archivo: ${response.status}`);
        }

        const data = await response.json();
        
        // Agregar el audio retornado por el servidor a la lista
        setAudios(prev => [...prev, data]);
        showToast(`Audio "${file.name}" subido exitosamente`, 'success');
      } catch (error) {
        console.error('Error subiendo archivo:', error);
        showToast(`Error al subir "${file.name}": ${error.message}`, 'error');
      }
    }
  };

  // Función para eliminar audio
  const handleDelete = async (id) => {
    const confirmed = window.confirm('¿Estás seguro de que deseas eliminar este audio?');
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/audios/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.status === 401) {
        showToast('Tu sesión ha expirado. Por favor inicia sesión nuevamente.', 'error');
        handleLogout();
        return;
      }

      if (response.status === 404) {
        showToast('El audio no existe o ya fue eliminado.', 'warning');
        // Removerlo de la lista de todos modos
        setAudios(audios.filter(audio => audio.id !== id));
        if (selectedAudio?.id === id) {
          setSelectedAudio(null);
          setCurrentView('list');
        }
        return;
      }

      if (!response.ok) {
        throw new Error(`Error al eliminar: ${response.status}`);
      }
      
      setAudios(audios.filter(audio => audio.id !== id));
      if (selectedAudio?.id === id) {
        setSelectedAudio(null);
        setCurrentView('list');
      }
      showToast('Audio eliminado exitosamente', 'success');
    } catch (error) {
      console.error('Error eliminando audio:', error);
      showToast(`Error al eliminar el audio: ${error.message}`, 'error');
    }
  };

  const handleLogout = () => {
    // Detener audio si está reproduciéndose
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.src = '';
      setAudioPlayer(null);
      setPlayingId(null);
    }

    // Limpiar blob URL
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
      setCurrentBlobUrl(null);
    }
    
    // Limpiar localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('isLoggedIn');
    
    setIsLoggedIn(false);
    setCurrentView('login');
    setUsername('');
    setPassword('');
    setAuthToken('');
    setAudios([]);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Función para reproducir audio
  const togglePlay = async (audio) => {
    // Si hay un audio reproduciéndose y es el mismo, pausarlo
    if (playingId === audio.id && audioPlayer) {
      audioPlayer.pause();
      setPlayingId(null);
      return;
    }

    // Si hay un audio diferente reproduciéndose, limpiarlo
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.src = '';
      setAudioPlayer(null);
    }

    // Limpiar blob URL anterior si existe
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
      setCurrentBlobUrl(null);
    }

    setLoadingAudioId(audio.id);

    try {
      console.log('🎵 Cargando audio:', audio.original_filename);
      console.log('📍 URL:', `${API_BASE_URL}${audio.download_url}`);
      
      // Descargar el audio con autenticación
      const response = await fetch(`${API_BASE_URL}${audio.download_url}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('✅ Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('📦 Blob creado - Tipo:', blob.type, 'Tamaño:', blob.size, 'bytes');
      
      // Verificar que el blob no esté vacío
      if (blob.size === 0) {
        throw new Error('El archivo de audio está vacío');
      }

      const audioUrl = URL.createObjectURL(blob);
      setCurrentBlobUrl(audioUrl);
      console.log('🔗 Blob URL creado:', audioUrl);
      
      // Crear nuevo reproductor de audio
      const newAudio = new Audio();
      newAudio.preload = 'auto';
      newAudio.src = audioUrl;
      
      // Eventos de monitoreo
      newAudio.addEventListener('loadedmetadata', () => {
        console.log('📊 Metadatos cargados - Duración:', newAudio.duration, 'segundos');
      });

      newAudio.addEventListener('canplay', () => {
        console.log('✅ Audio listo para reproducir');
      });

      newAudio.addEventListener('error', (e) => {
        console.error('❌ Error en el reproductor:', newAudio.error);
        let errorMsg = 'Error desconocido';
        if (newAudio.error) {
          switch (newAudio.error.code) {
            case 1: errorMsg = 'Reproducción abortada'; break;
            case 2: errorMsg = 'Error de red'; break;
            case 3: errorMsg = 'Error de decodificación'; break;
            case 4: errorMsg = 'Formato de audio no soportado'; break;
          }
        }
        showToast(`Error al reproducir: ${errorMsg}`, 'error');
        setLoadingAudioId(null);
        setPlayingId(null);
        URL.revokeObjectURL(audioUrl);
        setCurrentBlobUrl(null);
      });
      
      // Intentar reproducir
      try {
        await newAudio.play();
        console.log('▶️ Reproducción iniciada');
        setPlayingId(audio.id);
        setAudioPlayer(newAudio);
        setLoadingAudioId(null);
      } catch (playError) {
        console.error('❌ Error al reproducir:', playError);
        showToast(`No se pudo reproducir el audio: ${playError.message}`, 'error');
        setLoadingAudioId(null);
        URL.revokeObjectURL(audioUrl);
        setCurrentBlobUrl(null);
      }

      // Cuando termine el audio
      newAudio.addEventListener('ended', () => {
        console.log('⏹️ Reproducción finalizada');
        setPlayingId(null);
        setAudioPlayer(null);
        URL.revokeObjectURL(audioUrl);
        setCurrentBlobUrl(null);
      });

    } catch (error) {
      console.error('❌ Error cargando audio:', error);
      showToast(`Error al cargar el audio: ${error.message}`, 'error');
      setLoadingAudioId(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoggingIn) {
      handleLogin();
    }
  };

  // Vista de Login
  if (currentView === 'login') {
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
                onChange={(e) => {
                  setUsername(e.target.value);
                  setLoginError(''); // Limpiar error al escribir
                }}
                onKeyPress={handleKeyPress}
                disabled={isLoggingIn}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Ingresa tu usuario"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError(''); // Limpiar error al escribir
                }}
                onKeyPress={handleKeyPress}
                disabled={isLoggingIn}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Ingresa tu contraseña"
              />
            </div>
            
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Layout para vistas autenticadas
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Music className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Audio Manager</h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 text-gray-700">
                <User className="w-5 h-5" />
                <span className="font-medium">{username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-14 sm:top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentView('list')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 font-medium transition-colors text-sm sm:text-base ${
                currentView === 'list'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Mis Audios
            </button>
            <button
              onClick={() => setCurrentView('upload')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 font-medium transition-colors text-sm sm:text-base ${
                currentView === 'upload'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Cargar Audio
            </button>
            <button
              onClick={() => setCurrentView('users')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 font-medium transition-colors text-sm sm:text-base ${
                currentView === 'users'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Usuarios
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 ${playingId ? 'pb-24' : ''}`}>
        {currentView === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Cargar Nuevos Audios</h2>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 sm:p-12 cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all">
                <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-4" />
                <span className="text-base sm:text-lg font-medium text-gray-700 mb-2 text-center">
                  Haz clic para seleccionar archivos
                </span>
                <span className="text-sm text-gray-500 text-center">o arrastra y suelta aquí</span>
                <span className="text-xs text-gray-400 mt-2">MP3, WAV, OGG</span>
                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              
              {audios.length > 0 && (
                <button
                  onClick={() => setCurrentView('list')}
                  className="w-full mt-6 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Ver Audios Cargados ({audios.length})
                </button>
              )}
            </div>
          </div>
        )}

        {currentView === 'list' && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Mis Audios</h2>
              <span className="text-sm sm:text-base text-gray-600">{audios.length} archivo(s)</span>
            </div>

            {audios.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
                <Music className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4 text-sm sm:text-base">No tienes audios cargados</p>
                <button
                  onClick={() => setCurrentView('upload')}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
                >
                  Cargar tu primer audio
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {audios.map((audio) => (
                  <div
                    key={audio.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-purple-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                        <Music className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate text-sm sm:text-base">{audio.original_filename}</h3>
                        <p className="text-xs sm:text-sm text-gray-500">{formatBytes(audio.size_bytes)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-3">
                      <span>{formatDate(audio.created_at)}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => togglePlay(audio)}
                        disabled={loadingAudioId === audio.id}
                        className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingAudioId === audio.id ? (
                          <>
                            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="hidden sm:inline">Cargando...</span>
                          </>
                        ) : playingId === audio.id ? (
                          <>
                            <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Pausar</span>
                            <span className="sm:hidden">⏸</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Reproducir</span>
                            <span className="sm:hidden">▶</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAudio(audio);
                          setCurrentView('detail');
                        }}
                        className="px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'detail' && selectedAudio && (
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setCurrentView('list')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 sm:mb-6"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Volver a la lista</span>
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-6 sm:p-8 rounded-2xl mx-auto sm:mx-0">
                  <Music className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                </div>
                
                <div className="flex-1 text-center sm:text-left w-full">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 break-words">{selectedAudio.original_filename}</h2>
                  <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 text-sm sm:text-base text-gray-600 flex-wrap">
                    <span>{formatBytes(selectedAudio.size_bytes)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">Información del archivo</h3>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600">Fecha de carga:</span>
                      <span className="font-medium text-gray-800">{formatDate(selectedAudio.created_at)}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600">Tamaño:</span>
                      <span className="font-medium text-gray-800">{formatBytes(selectedAudio.size_bytes)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => togglePlay(selectedAudio)}
                    disabled={loadingAudioId === selectedAudio.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingAudioId === selectedAudio.id ? (
                      <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Cargando...
                      </>
                    ) : playingId === selectedAudio.id ? (
                      <>
                        <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                        Reproducir
                      </>
                    )}
                  </button>
                  
                  {selectedAudio.extra && (
                    <button
                      onClick={() => setShowExtraModal(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm sm:text-base"
                    >
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      Ver Análisis
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(selectedAudio.id)}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm sm:text-base"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>

            {/* Modal de información extra */}
            {showExtraModal && selectedAudio.extra && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setShowExtraModal(false);
                }}
              >
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  {/* Header del modal */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Análisis del Audio</h3>
                    <button
                      onClick={() => setShowExtraModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6 text-gray-600" />
                    </button>
                  </div>

                  {/* Contenido del modal */}
                  <div className="p-4 sm:p-6 space-y-6">
                    {/* Título y Resumen */}
                    {selectedAudio.extra.title && (
                      <div>
                        <h4 className="text-lg font-semibold text-purple-600 mb-2">Título</h4>
                        <p className="text-gray-800">{selectedAudio.extra.title}</p>
                      </div>
                    )}

                    {selectedAudio.extra.summary && (
                      <div>
                        <h4 className="text-lg font-semibold text-purple-600 mb-2">Resumen</h4>
                        <p className="text-gray-700 leading-relaxed">{selectedAudio.extra.summary}</p>
                      </div>
                    )}

                    {/* Sentimiento */}
                    {selectedAudio.extra.sentiment && (
                      <div>
                        <h4 className="text-lg font-semibold text-purple-600 mb-2">Sentimiento</h4>
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {selectedAudio.extra.sentiment}
                        </span>
                      </div>
                    )}

                    {/* Puntos Principales */}
                    {selectedAudio.extra.main_points && selectedAudio.extra.main_points.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-purple-600 mb-3">Puntos Principales</h4>
                        <ul className="space-y-2">
                          {selectedAudio.extra.main_points.map((point, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-purple-500 mt-1">•</span>
                              <span className="text-gray-700">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Items */}
                    {selectedAudio.extra.action_items && selectedAudio.extra.action_items.length > 0 && (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-yellow-800 mb-3">Acciones Pendientes</h4>
                        <ul className="space-y-2">
                          {selectedAudio.extra.action_items.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-yellow-600 mt-1">□</span>
                              <span className="text-gray-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Follow Up */}
                    {selectedAudio.extra.follow_up && selectedAudio.extra.follow_up.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-green-800 mb-3">Seguimiento</h4>
                        <ul className="space-y-2">
                          {selectedAudio.extra.follow_up.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-green-600 mt-1">→</span>
                              <span className="text-gray-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Temas Relacionados */}
                    {selectedAudio.extra.related_topics && selectedAudio.extra.related_topics.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-purple-600 mb-3">Temas Relacionados</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedAudio.extra.related_topics.map((topic, index) => (
                            <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Supervisor Coaching */}
                    {selectedAudio.extra.supervisor_coaching && (
                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-xl font-bold text-purple-600 mb-4">Coaching del Supervisor</h4>
                        
                        {/* Quality Score */}
                        {selectedAudio.extra.supervisor_coaching.quality_score && (
                          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-800">Puntuación de Calidad</span>
                              <span className="text-2xl font-bold text-purple-600">
                                {selectedAudio.extra.supervisor_coaching.quality_score.score}/100
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{selectedAudio.extra.supervisor_coaching.quality_score.rationale}</p>
                          </div>
                        )}

                        {/* Observaciones */}
                        {selectedAudio.extra.supervisor_coaching.observations && selectedAudio.extra.supervisor_coaching.observations.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-semibold text-gray-800 mb-2">Observaciones</h5>
                            <ul className="space-y-1">
                              {selectedAudio.extra.supervisor_coaching.observations.map((obs, index) => (
                                <li key={index} className="text-sm text-gray-700 pl-4">• {obs}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Fortalezas */}
                        {selectedAudio.extra.supervisor_coaching.strengths && selectedAudio.extra.supervisor_coaching.strengths.length > 0 && (
                          <div className="bg-green-50 p-4 rounded-lg mb-4">
                            <h5 className="font-semibold text-green-800 mb-2">Fortalezas</h5>
                            <ul className="space-y-1">
                              {selectedAudio.extra.supervisor_coaching.strengths.map((strength, index) => (
                                <li key={index} className="text-sm text-gray-700 pl-4">✓ {strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Áreas de Mejora */}
                        {selectedAudio.extra.supervisor_coaching.areas_for_improvement && selectedAudio.extra.supervisor_coaching.areas_for_improvement.length > 0 && (
                          <div className="bg-orange-50 p-4 rounded-lg mb-4">
                            <h5 className="font-semibold text-orange-800 mb-2">Áreas de Mejora</h5>
                            <ul className="space-y-1">
                              {selectedAudio.extra.supervisor_coaching.areas_for_improvement.map((area, index) => (
                                <li key={index} className="text-sm text-gray-700 pl-4">⚠ {area}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Frases Sugeridas */}
                        {selectedAudio.extra.supervisor_coaching.suggested_phrases && selectedAudio.extra.supervisor_coaching.suggested_phrases.length > 0 && (
                          <div className="bg-blue-50 p-4 rounded-lg mb-4">
                            <h5 className="font-semibold text-blue-800 mb-2">Frases Sugeridas</h5>
                            <ul className="space-y-2">
                              {selectedAudio.extra.supervisor_coaching.suggested_phrases.map((phrase, index) => (
                                <li key={index} className="text-sm text-gray-700 italic pl-4">" {phrase} "</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Compliance Flags */}
                        {selectedAudio.extra.supervisor_coaching.compliance_flags && selectedAudio.extra.supervisor_coaching.compliance_flags.length > 0 && (
                          <div className="bg-red-50 p-4 rounded-lg mb-4">
                            <h5 className="font-semibold text-red-800 mb-2">⚠️ Alertas de Cumplimiento</h5>
                            <ul className="space-y-1">
                              {selectedAudio.extra.supervisor_coaching.compliance_flags.map((flag, index) => (
                                <li key={index} className="text-sm text-gray-700 pl-4">⚠ {flag}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Próximos Pasos */}
                        {selectedAudio.extra.supervisor_coaching.next_steps && selectedAudio.extra.supervisor_coaching.next_steps.length > 0 && (
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <h5 className="font-semibold text-purple-800 mb-2">Próximos Pasos</h5>
                            <ul className="space-y-1">
                              {selectedAudio.extra.supervisor_coaching.next_steps.map((step, index) => (
                                <li key={index} className="text-sm text-gray-700 pl-4">→ {step}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer del modal */}
                  <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
                    <button
                      onClick={() => setShowExtraModal(false)}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'users' && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                <Plus className="w-5 h-5" />
                Nuevo Usuario
              </button>
            </div>

            {users.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4 text-sm sm:text-base">No hay usuarios registrados</p>
                <button
                  onClick={openCreateModal}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
                >
                  Crear primer usuario
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Tabla responsive */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                          Área
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-purple-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.nombre}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.email}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                            <div className="text-sm text-gray-700">{user.area || '-'}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.rol === 'admin' 
                                ? 'bg-red-100 text-red-800'
                                : user.rol === 'sup'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {user.rol === 'admin' ? 'Administrador' : user.rol === 'sup' ? 'Supervisor' : 'Operador'}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-purple-600 hover:text-purple-900 mr-3 inline-flex items-center gap-1"
                            >
                              <Edit className="w-4 h-4" />
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="hidden sm:inline">Eliminar</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Vista de cards en móvil (alternativa) */}
                <div className="sm:hidden">
                  {users.map((user) => (
                    <div key={user.id} className="p-4 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.nombre}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.rol === 'admin' 
                            ? 'bg-red-100 text-red-800'
                            : user.rol === 'sup'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.rol === 'admin' ? 'Admin' : user.rol === 'sup' ? 'Sup' : 'Op'}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => openEditModal(user)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal para crear/editar usuario */}
            {showUserModal && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowUserModal(false);
                    setShowPassword(false);
                    setShowConfirmPassword(false);
                  }
                }}
              >
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                  <div className="border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800">
                      {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowUserModal(false);
                        setShowPassword(false);
                        setShowConfirmPassword(false);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  <div className="p-4 sm:p-6 space-y-4">
                    {/* Nombre */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={userForm.nombre}
                        onChange={(e) => setUserForm({...userForm, nombre: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Ej: Juan Pérez"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="juan@ejemplo.com"
                      />
                    </div>

                    {/* Contraseña */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña {editingUser ? <span className="text-gray-500 text-xs">(dejar en blanco para no cambiar)</span> : <span className="text-red-500">*</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={userForm.password}
                          onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder={editingUser ? "Nueva contraseña (opcional)" : "Mínimo 6 caracteres"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {!editingUser && (
                        <p className="mt-1 text-xs text-gray-500">Debe tener al menos 6 caracteres</p>
                      )}
                    </div>

                    {/* Confirmar Contraseña */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar contraseña {editingUser ? '' : <span className="text-red-500">*</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={userForm.confirmPassword}
                          onChange={(e) => setUserForm({...userForm, confirmPassword: e.target.value})}
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder={editingUser ? "Confirma nueva contraseña" : "Confirma tu contraseña"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {userForm.password && userForm.confirmPassword && userForm.password !== userForm.confirmPassword && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Las contraseñas no coinciden
                        </p>
                      )}
                      {userForm.password && userForm.confirmPassword && userForm.password === userForm.confirmPassword && (
                        <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Las contraseñas coinciden
                        </p>
                      )}
                    </div>

                    {/* Rol */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rol <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={userForm.rol}
                        onChange={(e) => setUserForm({...userForm, rol: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="operador">Operador</option>
                        <option value="sup">Supervisor</option>
                        <option value="admin">Administrador</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        {userForm.rol === 'admin' && '• Acceso total al sistema'}
                        {userForm.rol === 'sup' && '• Puede gestionar usuarios y audios'}
                        {userForm.rol === 'operador' && '• Solo puede gestionar audios'}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 p-4 sm:p-6 flex gap-3">
                    <button
                      onClick={() => {
                        setShowUserModal(false);
                        setShowPassword(false);
                        setShowConfirmPassword(false);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={editingUser ? handleUpdateUser : handleCreateUser}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                    >
                      {editingUser ? 'Actualizar' : 'Crear Usuario'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mini reproductor flotante */}
      {playingId && audios.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Music className="w-5 h-5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate text-sm">
                  {audios.find(a => a.id === playingId)?.original_filename || 'Reproduciendo...'}
                </p>
                <p className="text-xs text-purple-200">Reproduciendo ahora</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (audioPlayer) {
                  audioPlayer.pause();
                  audioPlayer.src = '';
                  setPlayingId(null);
                  setAudioPlayer(null);
                }
                if (currentBlobUrl) {
                  URL.revokeObjectURL(currentBlobUrl);
                  setCurrentBlobUrl(null);
                }
              }}
              className="p-2 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <Pause className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Sistema de Notificaciones Toast */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle className="w-5 h-5" />,
            error: <XCircle className="w-5 h-5" />,
            warning: <AlertCircle className="w-5 h-5" />,
            info: <Info className="w-5 h-5" />
          };

          const colors = {
            success: 'bg-green-50 border-green-200 text-green-800',
            error: 'bg-red-50 border-red-200 text-red-800',
            warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            info: 'bg-blue-50 border-blue-200 text-blue-800'
          };

          const iconColors = {
            success: 'text-green-500',
            error: 'text-red-500',
            warning: 'text-yellow-500',
            info: 'text-blue-500'
          };

          return (
            <div
              key={toast.id}
              className={`${colors[toast.type]} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-[slideIn_0.3s_ease-out] min-w-[320px]`}
            >
              <div className={iconColors[toast.type]}>
                {icons[toast.type]}
              </div>
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="hover:opacity-70 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* CSS para animación */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}