// src/App.js
import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import LoginView from './components/auth/LoginView';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import Toast from './components/layout/Toast';
import AudioList from './components/audios/AudioList';
import AudioUpload from './components/audios/AudioUpload';
import AudioDetail from './components/audios/AudioDetail';
import UserManagement from './components/users/UserManagement';
import TeamManagement from './components/teams/TeamManagement';
import AudioPlayer from './components/shared/AudioPlayer';
import { useAudioPlayer } from './hooks/useAudioPlayer';

export default function App() {
  const { isLoggedIn, authToken, userRole, toasts, setToasts, showToast, audios, setAudios, sessionExpired, login, logout } = useApp();
  const [currentView, setCurrentView] = useState(() => isLoggedIn ? 'list' : 'login');
  const [selectedAudio, setSelectedAudio] = useState(null);

  const { playingId, loadingAudioId, togglePlay, stopPlayback } = useAudioPlayer(authToken, showToast);

  // Detener reproducción cuando la sesión cierra (manual o por expiración)
  useEffect(() => {
    if (!isLoggedIn) {
      stopPlayback();
      setCurrentView('login');
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    stopPlayback();
    logout();
  };

  const handleLoginSuccess = (token, user, role) => {
    login(token, user, role);
    setCurrentView('list');
    showToast(`¡Bienvenido ${user}!`, 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!isLoggedIn ? (
        <LoginView onLoginSuccess={handleLoginSuccess} sessionExpired={sessionExpired} />
      ) : (
        <>
          <Header onLogout={handleLogout} />
          <Navigation currentView={currentView} setCurrentView={setCurrentView} />

          <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 ${playingId ? 'pb-24' : ''}`}>
            {currentView === 'upload' && (
              <AudioUpload onUploadSuccess={() => setCurrentView('list')} />
            )}

            {currentView === 'list' && (
              <AudioList
                onSelectAudio={(audio) => { setSelectedAudio(audio); setCurrentView('detail'); }}
                playingId={playingId}
                loadingAudioId={loadingAudioId}
                togglePlay={togglePlay}
              />
            )}

            {currentView === 'detail' && selectedAudio && (
              <AudioDetail
                audio={selectedAudio}
                onBack={() => setCurrentView('list')}
                playingId={playingId}
                loadingAudioId={loadingAudioId}
                togglePlay={togglePlay}
              />
            )}

            {currentView === 'users' && userRole === 1 && (
              <UserManagement />
            )}

            {currentView === 'teams' && userRole <= 2 && (
              <TeamManagement />
            )}
          </main>

          {playingId && <AudioPlayer audioId={playingId} audios={audios} onStop={stopPlayback} />}
        </>
      )}

      {/* Toast siempre montado para mostrar mensajes durante y después del logout */}
      <Toast toasts={toasts} setToasts={setToasts} />
    </div>
  );
}
