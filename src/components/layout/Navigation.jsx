// src/components/layout/Navigation.jsx
import React from 'react';
import { useApp } from '../../context/AppContext';

const NAV_ITEMS = [
  { id: 'list',   label: 'Mis Audios',   minRole: 99 },
  { id: 'upload', label: 'Cargar Audio', minRole: 99 },
  { id: 'teams',  label: 'Equipos',      minRole: 2  },
  { id: 'users',  label: 'Usuarios',     minRole: 1  },
];

export default function Navigation({ currentView, setCurrentView }) {
  const { userRole } = useApp(); // ✅ userRole del contexto

  const visibleItems = NAV_ITEMS.filter(item => userRole <= item.minRole);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-14 sm:top-16 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 font-medium transition-colors text-sm sm:text-base ${
                currentView === item.id
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}