// src/components/layout/Header.jsx
import React from 'react';
import { Music, User, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Header({ onLogout }) {
  const { username } = useApp(); // ✅ username del contexto

  return (
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
              onClick={onLogout}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}