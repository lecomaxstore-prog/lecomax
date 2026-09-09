"use client";
import { useEffect, useState } from "react";

export function useAdminPagination<T>(items: T[], resetKey: string, size = 24) {
  const [requested, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(requested, pages);
  useEffect(() => setPage(1), [resetKey]);
  return { items: items.slice((page - 1) * size, page * size), page, pages, setPage, total: items.length };
}
export default function Pagination({ page, pages, setPage, total }: { page: number; pages: number; setPage: (page: number) => void; total: number }) {
  if (pages <= 1) return null;
  return <nav aria-label="Pagination" className="admin-pagination">
    <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Précédent</button>
    <span role="status" aria-live="polite">{page} / {pages}<small>{total} résultats</small></span>
    <button type="button" disabled={page === pages} onClick={() => setPage(page + 1)}>Suivant</button>
  </nav>;
}
