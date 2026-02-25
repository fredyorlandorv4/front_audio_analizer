// src/services/api.js
const API_BASE_URL = 'http://127.0.0.1:8000';

const getAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

// Auth
export const authAPI = {
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
  }
};

// Users
export const usersAPI = {
  getAll: async (token) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Error al cargar usuarios');
    return response.json();
  },
  
  create: async (token, userData) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Error al crear usuario');
    return response.json();
  },
  
  update: async (token, userId, userData) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Error al actualizar usuario');
    return response.json();
  },
  
  delete: async (token, userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Error al eliminar usuario');
    return response.json();
  },
  
  getSupervisors: async (token) => {
    const response = await fetch(`${API_BASE_URL}/users/by-role?role=2`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Error al cargar supervisores');
    return response.json();
  },
  
  getAvailableOperators: async (token) => {
    const response = await fetch(`${API_BASE_URL}/users?rol=operador&sin_equipo=true`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Error al cargar operadores');
    return response.json();
  }
};

// Teams
export const teamsAPI = {
  getAll: async (token) => {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Error al remover miembro');
    if (response.status === 204) return; 
    return response.json();
  },
  
  getMembers: async (token, teamId) => {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) return [];
    return response.json();
  },
  
  getScore: async (token, teamId) => {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/score`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) return null;
    return response.json();
  },
  
  create: async (token, teamData) => {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(teamData)
    });
    if (!response.ok) throw new Error('Error al remover miembro');
    if (response.status === 204) return; 
    return response.json();
  },
  
  update: async (token, teamId, teamData) => {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(teamData)
    });
    if (!response.ok) throw new Error('Error al remover miembro');
    if (response.status === 204) return; 
    return response.json();
  },
  
  delete: async (token, teamId) => {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Error al remover miembro');
    if (response.status === 204) return; 
    return response.json();
  },
  
  addMembers: async (token, teamId, userIds) => {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/colaboradores/multiple`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ user_ids: userIds })
    });
    if (!response.ok) throw new Error('Error al agregar miembros');
    return response.json();
  },
  
  removeMember: async (token, teamId, userId) => {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/colaboradores/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Error al remover miembro');
    return response.json();
  }
};

// Categorias
export const categoriasAPI = {
  getAll: async (token) => {
    const response = await fetch(`${API_BASE_URL}/categorias/`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Error al cargar categorías');
    return response.json();
  }
};

// Audios
export const audiosAPI = {
  getAll: async (token) => {
    const response = await fetch(`${API_BASE_URL}/audios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Error al cargar audios');
    return response.json();
  },
  
  getByUserId: async (token, userId) => {
    const response = await fetch(`${API_BASE_URL}/audios/by_user_id/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Error al cargar audios');
    return response.json();
  },
  
  upload: async (token, file,equipoId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (equipoId) formData.append('equipo_id', equipoId); 
    const response = await fetch(`${API_BASE_URL}/audios`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!response.ok) throw new Error('Error al subir archivo');
    return response.json();
  },
  
  delete: async (token, audioId) => {
    const response = await fetch(`${API_BASE_URL}/audios/${audioId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Error al eliminar audio');
    return response.json();
  },
  
  download: async (token, downloadUrl) => {
    const response = await fetch(`${API_BASE_URL}${downloadUrl}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Error al descargar audio');
    return response.blob();
  }
};



export { API_BASE_URL };