import { useState, useCallback } from 'react';
import { audiosAPI } from '../services/api';

export function useAudioPlayer(authToken, showToast) {
  const [playingId, setPlayingId]           = useState(null);
  const [loadingAudioId, setLoadingAudioId] = useState(null);
  const [audioPlayer, setAudioPlayer]       = useState(null);
  const [currentBlobUrl, setCurrentBlobUrl] = useState(null);

  const stopCurrent = useCallback(() => {
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.src = '';
      setAudioPlayer(null);
    }
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
      setCurrentBlobUrl(null);
    }
  }, [audioPlayer, currentBlobUrl]);

  const stopPlayback = useCallback(() => {
    stopCurrent();
    setPlayingId(null);
  }, [stopCurrent]);

  const togglePlay = useCallback(async (audio) => {
    if (playingId === audio.id && audioPlayer) {
      audioPlayer.pause();
      setPlayingId(null);
      return;
    }

    stopCurrent();
    setLoadingAudioId(audio.id);

    try {
      // Usa el servicio existente en lugar de fetch directo
      const blob = await audiosAPI.download(authToken, audio.download_url);

      if (blob.size === 0) throw new Error('El archivo de audio está vacío');

      const blobUrl = URL.createObjectURL(blob);
      setCurrentBlobUrl(blobUrl);

      const newAudio = new Audio();
      newAudio.preload = 'auto';
      newAudio.src = blobUrl;

      newAudio.addEventListener('error', () => {
        const codes = { 1: 'Reproducción abortada', 2: 'Error de red', 3: 'Error de decodificación', 4: 'Formato no soportado' };
        const msg = codes[newAudio.error?.code] || 'Error desconocido';
        showToast(`Error al reproducir: ${msg}`, 'error');
        setLoadingAudioId(null);
        setPlayingId(null);
        URL.revokeObjectURL(blobUrl);
        setCurrentBlobUrl(null);
      });

      newAudio.addEventListener('ended', () => {
        setPlayingId(null);
        setAudioPlayer(null);
        URL.revokeObjectURL(blobUrl);
        setCurrentBlobUrl(null);
      });

      await newAudio.play();
      setAudioPlayer(newAudio);
      setPlayingId(audio.id);
    } catch (error) {
      showToast(`Error al cargar el audio: ${error.message}`, 'error');
    } finally {
      setLoadingAudioId(null);
    }
  }, [authToken, playingId, audioPlayer, stopCurrent, showToast]);

  return { playingId, loadingAudioId, togglePlay, stopPlayback };
}