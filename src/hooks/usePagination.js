import { useState, useMemo } from 'react';

export function usePagination(items = [], itemsPerPage = 6) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Si los items cambian y la página actual ya no existe, volver a la 1
  const safePage = Math.min(currentPage, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, safePage, itemsPerPage]);

  const goNext     = () => setCurrentPage(p => Math.min(p + 1, totalPages));
  const goPrev     = () => setCurrentPage(p => Math.max(p - 1, 1));
  const goToPage   = (n) => setCurrentPage(Math.max(1, Math.min(n, totalPages)));
  const resetPage  = () => setCurrentPage(1);

  return {
    paginated,
    currentPage: safePage,
    totalPages,
    totalItems: items.length,
    itemsPerPage,
    goNext,
    goPrev,
    goToPage,
    resetPage,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}