// src/components/shared/AudioPlayer.jsx
import React from 'react';
import { Music, Pause } from 'lucide-react';

export default function AudioPlayer({ audioId, audios, onStop }) {
  const audio = audios.find(a => a.id === audioId);
  
  if (!audio) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Music className="w-5 h-5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate text-sm">{audio.original_filename}</p>
            <p className="text-xs text-purple-200">Reproduciendo ahora</p>
          </div>
        </div>
        <button
          onClick={onStop}
          className="p-2 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <Pause className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}