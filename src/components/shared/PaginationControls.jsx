// src/components/shared/PaginationControls.jsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  hasNext,
  hasPrev,
  goNext,
  goPrev,
  goToPage,
  compact = false  // versión compacta para paneles pequeños como MemberDetail
}) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end   = Math.min(currentPage * itemsPerPage, totalItems);

  // Genera los números de página a mostrar (máx 5)
  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) return [totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages];
    return [currentPage-2, currentPage-1, currentPage, currentPage+1, currentPage+2];
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 mt-3">
        <span className="text-xs text-gray-500">{start}–{end} de {totalItems}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-gray-700 px-2">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={goNext}
            disabled={!hasNext}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
      <span className="text-sm text-gray-500">
        Mostrando {start}–{end} de {totalItems} audios
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={goPrev}
          disabled={!hasPrev}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map(n => (
            <button
              key={n}
              onClick={() => goToPage(n)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                n === currentPage
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={!hasNext}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}