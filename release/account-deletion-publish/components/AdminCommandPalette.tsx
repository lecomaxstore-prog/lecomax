"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

export type AdminCommandItem = {
  label: string;
  href: string;
  section: string;
  icon: ReactNode;
  badge?: number;
};

type Result = AdminCommandItem & {
  description?: string;
  action?: boolean;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr-FR");
}

function SearchIcon() {
  return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round"><circle cx="11" cy="11" r="7.5"/><path d="m20 20-3.7-3.7"/></svg>;
}

export default function AdminCommandPalette({ items, pathname }: { items: AdminCommandItem[]; pathname: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [recentHrefs, setRecentHrefs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("admin-recent-pages") || "[]") as unknown;
      const recent = Array.isArray(stored) ? stored.filter((value): value is string => typeof value === "string") : [];
      const next = [pathname, ...recent.filter((href) => href !== pathname)].slice(0, 5);
      localStorage.setItem("admin-recent-pages", JSON.stringify(next));
      setRecentHrefs(next);
    } catch {
      setRecentHrefs([pathname]);
    }
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const quickActions = useMemo<Result[]>(() => {
    const actions: Result[] = [];
    const has = (href: string) => items.some((item) => item.href === href);
    const icon = <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
    if (has("/admin/products")) actions.push({ label: "Créer un produit", href: "/admin/products?new=1", section: "ACTION RAPIDE", description: "Ajouter un article au catalogue", icon, action: true });
    if (has("/admin/categories")) actions.push({ label: "Créer une catégorie", href: "/admin/categories?new=1", section: "ACTION RAPIDE", description: "Ajouter une collection web et mobile", icon, action: true });
    return actions;
  }, [items]);

  const results = useMemo<Result[]>(() => {
    const needle = normalize(query.trim());
    if (needle) {
      return [...quickActions, ...items].filter((item) => normalize(`${item.label} ${item.section} ${"description" in item ? item.description ?? "" : ""}`).includes(needle));
    }
    const recent = recentHrefs
      .map((href) => items.find((item) => href === item.href || href.startsWith(`${item.href}/`)))
      .filter((item): item is AdminCommandItem => Boolean(item));
    const uniqueRecent = recent.filter((item, index) => recent.findIndex((candidate) => candidate.href === item.href) === index);
    return [...quickActions, ...uniqueRecent.map((item) => ({ ...item, section: "RÉCEMMENT CONSULTÉ" }))];
  }, [items, query, quickActions, recentHrefs]);

  useEffect(() => setSelected(0), [query, open]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  function navigate(href: string) {
    close();
    router.push(href);
  }

  function handleKeys(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((value) => results.length ? (value + 1) % results.length : 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected((value) => results.length ? (value - 1 + results.length) % results.length : 0);
    } else if (event.key === "Enter" && results[selected]) {
      event.preventDefault();
      navigate(results[selected].href);
    }
  }

  return (
    <>
      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/55 p-0 backdrop-blur-sm sm:p-6 sm:pt-[11vh]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <section role="dialog" aria-modal="true" aria-label="Recherche rapide" className="flex h-dvh w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[min(680px,78vh)] sm:max-w-2xl sm:rounded-[28px] sm:border sm:border-white/20">
            <div className="flex items-center gap-3 border-b border-neutral-100 px-4 pb-3 pt-[calc(0.9rem+env(safe-area-inset-top))] sm:px-5 sm:py-4">
              <span className="text-neutral-400"><SearchIcon /></span>
              <label htmlFor="admin-command-search" className="sr-only">Rechercher une page ou une action</label>
              <input
                id="admin-command-search"
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeys}
                placeholder="Page, commande, produit, réglage…"
                autoComplete="off"
                className="min-h-11 min-w-0 flex-1 bg-transparent text-base font-semibold text-neutral-950 outline-none placeholder:font-medium placeholder:text-neutral-350"
              />
              <button type="button" onClick={close} className="flex h-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 px-3 text-xs font-bold text-neutral-500 hover:bg-neutral-50 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c]">Fermer</button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3" role="listbox" aria-label="Résultats">
              {results.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400"><SearchIcon /></span>
                  <p className="mt-4 text-sm font-black text-neutral-800">Aucun résultat</p>
                  <p className="mt-1 text-xs leading-5 text-neutral-400">Essayez le nom d’une page, d’une commande ou d’un réglage.</p>
                </div>
              ) : results.map((item, index) => {
                const active = index === selected;
                return (
                  <button
                    key={`${item.href}-${item.section}`}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setSelected(index)}
                    onClick={() => navigate(item.href)}
                    className={`flex min-h-[66px] w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left outline-none transition sm:px-4 ${active ? "bg-neutral-950 text-white shadow-lg" : "text-neutral-900 hover:bg-neutral-100"}`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.action ? active ? "bg-[#3ecf4c] text-black" : "bg-emerald-50 text-emerald-700" : active ? "bg-white/10 text-white" : "bg-neutral-100 text-neutral-500"}`}>{item.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[10px] font-extrabold uppercase tracking-[0.13em] ${active ? "text-white/45" : "text-neutral-400"}`}>{item.section}</span>
                      <span className="mt-0.5 block truncate text-sm font-black">{item.label}</span>
                      {item.description && <span className={`mt-0.5 block truncate text-xs ${active ? "text-white/55" : "text-neutral-400"}`}>{item.description}</span>}
                    </span>
                    {(item.badge ?? 0) > 0 && <span className="rounded-full bg-orange-500 px-2 py-1 text-[10px] font-black text-white">{item.badge}</span>}
                    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                );
              })}
            </div>

            <footer className="hidden items-center gap-4 border-t border-neutral-100 bg-neutral-50/80 px-5 py-3 text-[10px] font-bold text-neutral-400 sm:flex">
              <span><kbd className="rounded border border-neutral-200 bg-white px-1.5 py-0.5">↑↓</kbd> Naviguer</span>
              <span><kbd className="rounded border border-neutral-200 bg-white px-1.5 py-0.5">Entrée</kbd> Ouvrir</span>
              <span><kbd className="rounded border border-neutral-200 bg-white px-1.5 py-0.5">Échap</kbd> Fermer</span>
            </footer>
          </section>
        </div>,
        document.body
      )}
    </>
  );
}
