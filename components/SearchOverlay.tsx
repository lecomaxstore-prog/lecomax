"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./search-overlay.css";
import Logo from "@/components/Logo";
import type { SearchableProduct } from "@/lib/product-search";
import { collectEvent } from "@/lib/collect";
import { recordProductSignal } from "@/lib/personalization";

interface Props {
  open: boolean;
  onClose: () => void;
}

type SearchResponse = {
  results: SearchableProduct[];
  suggestions: string[];
  total: number;
};

const POPULAR = ["Baskets", "Écouteurs Bluetooth", "Manette", "Sac de voyage", "Lenovo", "Montre", "Chaussures femme"];

const money = new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 });

function SearchIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ProductImage({ product }: { product: SearchableProduct }) {
  const [failed, setFailed] = useState(false);
  const src = product.images?.[0];
  if (!src || failed) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-300">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m4 18 5-5 3 3 3-3 5 5" />
        </svg>
      </span>
    );
  }
  return <img src={src} alt={product.name} onError={() => setFailed(true)} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const clean = query.trim();
  if (!clean) return <>{text}</>;
  const index = text.toLocaleLowerCase("fr").indexOf(clean.toLocaleLowerCase("fr"));
  if (index < 0) return <>{text}</>;
  return <>{text.slice(0, index)}<mark className="bg-transparent font-semibold text-[#179b38]">{text.slice(index, index + clean.length)}</mark>{text.slice(index + clean.length)}</>;
}

function ProductCard({ product, query, active, index, onPick, onHover }: {
  product: SearchableProduct;
  query: string;
  active: boolean;
  index: number;
  onPick: () => void;
  onHover: () => void;
}) {
  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;
  return (
    <Link
      href={`/produit/${product.slug}`}
      onClick={onPick}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") onHover(); }}
      data-search-result={index}
      className={`search-product-card group flex min-w-0 items-center gap-4 rounded-2xl border bg-white p-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] ${active ? "border-[#3ecf4c] ring-2 ring-[#3ecf4c]/15" : "border-neutral-200"}`}
    >
      <div className="relative h-[112px] w-[112px] shrink-0 overflow-hidden rounded-xl bg-neutral-100">
        <ProductImage product={product} />
        {discount > 0 && <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-[8px] font-semibold text-white">-{discount}%</span>}
        {(product.stock ?? 0) <= 0 && <span className="absolute inset-x-2 bottom-2 rounded-md bg-black/80 px-1.5 py-1 text-center text-[8px] font-semibold uppercase tracking-wider text-white backdrop-blur">Indisponible</span>}
      </div>
      <div className="min-w-0 flex-1 pr-2">
        <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{product.brand || product.category || "L’ecomax"}</p>
        <h3 className="line-clamp-2 text-[13px] font-medium leading-5 text-neutral-900"><Highlight text={product.name} query={query} /></h3>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-base font-semibold text-neutral-950">{money.format(product.price)} MAD</span>
          {product.original_price && product.original_price > product.price && <span className="text-[11px] text-neutral-400 line-through">{money.format(product.original_price)} MAD</span>}
        </div>
        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-[#179b38]">Voir le produit <span aria-hidden="true">→</span></span>
      </div>
    </Link>
  );
}

function MobileProductRow({ product, query, active, index, onPick, onHover }: {
  product: SearchableProduct; query: string; active: boolean; index: number; onPick: () => void; onHover: () => void;
}) {
  return (
    <Link
      href={`/produit/${product.slug}`}
      onClick={onPick}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") onHover(); }}
      data-search-result={index}
      className={`search-product-row flex items-center gap-3 rounded-2xl border p-2.5 transition ${active ? "border-[#3ecf4c] bg-[#f4fff6]" : "border-neutral-100 bg-white"}`}
    >
      <span className="group h-[74px] w-[74px] shrink-0 overflow-hidden rounded-xl bg-neutral-100"><ProductImage product={product} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[9px] font-semibold uppercase tracking-[0.13em] text-neutral-400">{product.brand || product.category || "L’ecomax"}</span>
        <span className="mt-1 line-clamp-2 text-[13px] font-medium leading-5"><Highlight text={product.name} query={query} /></span>
        <span className="mt-1.5 block text-sm font-semibold">{money.format(product.price)} MAD</span>
      </span>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="mr-1 shrink-0 text-neutral-300" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
    </Link>
  );
}

export default function SearchOverlay({ open, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchableProduct[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const desktopInput = useRef<HTMLInputElement>(null);
  const mobileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("search_recents") || "[]");
      if (Array.isArray(saved)) setRecents(saved.filter((term): term is string => typeof term === "string" && !!term.trim()).slice(0, 6));
    } catch { /* Ignore malformed local data. */ }
  }, []);

  const remember = useCallback((value: string) => {
    const term = value.trim();
    if (!term) return;
    setRecents((current) => {
      const next = [term, ...current.filter((item) => item.toLocaleLowerCase("fr") !== term.toLocaleLowerCase("fr"))].slice(0, 6);
      try { localStorage.setItem("search_recents", JSON.stringify(next)); } catch { /* Storage can be blocked. */ }
      return next;
    });
  }, []);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setQuery("");
      setActiveIndex(-1);
      document.body.style.overflow = "hidden";
      const focusTimer = window.setTimeout(() => (window.innerWidth < 768 ? mobileInput : desktopInput).current?.focus(), 120);
      return () => window.clearTimeout(focusTimer);
    }
    const closeTimer = window.setTimeout(() => setVisible(false), 240);
    document.body.style.overflow = "";
    return () => window.clearTimeout(closeTimer);
  }, [open]);

  useEffect(() => () => { document.body.style.overflow = ""; }, []);

  useEffect(() => {
    if (!visible) return;
    const clean = query.trim();
    if (clean.length === 1) {
      setResults([]); setSuggestions([]); setTotal(0); setLoading(false); setError("");
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError(""); setActiveIndex(-1);
      try {
        const response = await fetch(`/api/search?limit=12${clean ? `&q=${encodeURIComponent(clean)}` : ""}`, { signal: controller.signal });
        if (!response.ok) throw new Error("search_failed");
        const data = await response.json() as SearchResponse;
        setResults(Array.isArray(data.results) ? data.results : []);
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
        setTotal(Number(data.total) || 0);
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") {
          setError("Impossible de charger les résultats. Réessayez dans un instant.");
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, clean ? 180 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, visible]);

  const closeAndRemember = () => { if (query.trim()) remember(query); onClose(); };
  const submitSearch = () => {
    const clean = query.trim();
    if (activeIndex >= 0 && results[activeIndex]) {
      const selected = results[activeIndex];
      collectEvent("search", { query: clean, extra: { result_count: total, selected_product: selected.slug } });
      recordProductSignal(selected, 3);
      remember(clean); onClose(); window.location.href = `/produit/${results[activeIndex].slug}`; return;
    }
    if (clean.length >= 2) {
      collectEvent("search", { query: clean, extra: { result_count: total } });
      remember(clean); onClose(); window.location.href = `/boutique?search=${encodeURIComponent(clean)}`;
    }
  };
  const chooseTerm = (term: string) => { setQuery(term); setActiveIndex(-1); (window.innerWidth < 768 ? mobileInput : desktopInput).current?.focus(); };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
    if (event.key === "ArrowDown" && results.length) { event.preventDefault(); setActiveIndex((current) => Math.min(results.length - 1, current + 1)); }
    if (event.key === "ArrowUp" && results.length) { event.preventDefault(); setActiveIndex((current) => Math.max(-1, current - 1)); }
    if (event.key === "Enter") { event.preventDefault(); submitSearch(); }
  };
  const clearRecent = (term: string) => setRecents((current) => {
    const next = current.filter((item) => item !== term);
    try { localStorage.setItem("search_recents", JSON.stringify(next)); } catch { /* Storage can be blocked. */ }
    return next;
  });

  if (!visible) return null;
  const cleanQuery = query.trim();
  const isTypingHint = cleanQuery.length === 1;
  const noResults = cleanQuery.length >= 2 && !loading && !error && results.length === 0;
  const heading = cleanQuery ? `${total} résultat${total === 1 ? "" : "s"}` : "Nos recommandations";

  return (
    <>
      <div className="so-mobile fixed inset-0 z-[9999] bg-white" role="dialog" aria-modal="true" aria-label="Recherche de produits">
        <div className={`flex h-full flex-col transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-full"}`}>
          <div className="search-mobile-header flex shrink-0 items-center justify-between px-5">
            <Link href="/" onClick={onClose} aria-label="L’ecomax — Accueil"><Logo showWordmark className="scale-90 origin-left" /></Link>
            <button onClick={onClose} aria-label="Fermer la recherche" className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-600 active:scale-95">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="search-mobile-input shrink-0 px-5 pb-5 pt-1">
            <div className="search-field flex h-12 items-center rounded-2xl border border-neutral-200 bg-neutral-50 px-3 shadow-sm focus-within:border-[#3ecf4c] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#3ecf4c]/10">
              <span className="text-neutral-500"><SearchIcon size={19} /></span>
              <input ref={mobileInput} aria-label="Rechercher un produit" type="search" inputMode="search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleKeyDown} placeholder="Produit, marque, catégorie…" autoComplete="off" className="h-full min-w-0 flex-1 bg-transparent px-3 text-base font-medium outline-none placeholder:text-neutral-400" />
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-[#179b38]" />}
              {query && !loading && <button onClick={() => { setQuery(""); mobileInput.current?.focus(); }} aria-label="Effacer" className="search-clear flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-500">×</button>}
            </div>
          </div>

          <div className="search-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-8">
            {!cleanQuery && (recents.length > 0 || POPULAR.length > 0) && (
              <div className="search-discovery mb-5 space-y-4 border-b border-neutral-100 pb-5">
                {recents.length > 0 && <div><p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">Recherches récentes</p><div className="flex flex-wrap gap-2">{recents.map((term) => <span key={term} className="inline-flex items-center rounded-full border border-neutral-200 bg-white"><button onClick={() => chooseTerm(term)} className="px-3 py-2 text-xs font-medium">{term}</button><button onClick={() => clearRecent(term)} aria-label={`Supprimer ${term}`} className="pr-2.5 text-neutral-300">×</button></span>)}</div></div>}
                <div><p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">Tendances</p><div className="flex flex-wrap gap-2">{POPULAR.slice(0, 6).map((term) => <button key={term} onClick={() => chooseTerm(term)} className="rounded-full bg-neutral-100 px-3.5 py-2 text-xs font-medium text-neutral-700">{term}</button>)}</div></div>
              </div>
            )}

            <div className="search-results-heading mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">{loading ? "Recherche en cours…" : heading}</h2>
              {cleanQuery.length >= 2 && results.length > 0 && <button onClick={submitSearch} className="text-xs font-semibold text-[#179b38]">Voir tout →</button>}
            </div>
            {suggestions.length > 0 && cleanQuery && <div className="search-suggestions mb-4 flex flex-wrap gap-2">{suggestions.slice(0, 3).map((term) => <button key={term} onClick={() => chooseTerm(term)} className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-[11px] font-medium">{term}</button>)}</div>}

            {isTypingHint && <MessageState title="Continuez à écrire" text="Saisissez au moins deux caractères pour lancer la recherche." />}
            {noResults && <MessageState title={`Aucun résultat pour « ${cleanQuery} »`} text="Vérifiez l’orthographe ou essayez une catégorie, une marque ou un terme plus simple." />}
            {error && <MessageState title="Recherche indisponible" text={error} />}
            {!isTypingHint && !noResults && !error && <div className="search-result-list">{results.map((product, index) => <MobileProductRow key={product.slug} product={product} query={cleanQuery} active={activeIndex === index} index={index} onHover={() => setActiveIndex(index)} onPick={closeAndRemember} />)}</div>}
          </div>
        </div>
      </div>

      <div className={`so-desktop fixed inset-0 z-[9999] bg-black/60 backdrop-blur-[7px] transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-label="Recherche de produits">
        <div className={`search-desktop-panel mx-auto mt-5 max-h-[calc(100vh-40px)] w-[calc(100%-40px)] max-w-[1120px] overflow-hidden rounded-[26px] border border-white/30 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.35)] transition-all duration-300 ${open ? "translate-y-0 scale-100 opacity-100" : "-translate-y-5 scale-[0.98] opacity-0"}`}>
          <div className="flex h-[82px] items-center gap-5 border-b border-neutral-100 px-7">
            <Link href="/" onClick={onClose} aria-label="L’ecomax — Accueil" className="shrink-0"><Logo showWordmark /></Link>
            <div className="search-field flex h-[50px] min-w-0 flex-1 items-center rounded-2xl border border-neutral-200 bg-[#f7f7f7] px-4 transition focus-within:border-[#3ecf4c] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#3ecf4c]/10">
              <span className="text-neutral-500"><SearchIcon /></span>
              <input ref={desktopInput} aria-label="Rechercher un produit" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleKeyDown} placeholder="Que recherchez-vous ? Produit, marque, catégorie…" autoComplete="off" spellCheck={false} className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] font-semibold outline-none placeholder:font-normal placeholder:text-neutral-400" />
              {loading && <span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-[#179b38]" />}
              {query && !loading && <button onClick={() => { setQuery(""); desktopInput.current?.focus(); }} aria-label="Effacer la recherche" className="mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-sm text-neutral-500 hover:bg-neutral-300">×</button>}
              <kbd className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-[9px] font-semibold text-neutral-400 shadow-sm">↵ ENTRÉE</kbd>
            </div>
            <button onClick={onClose} aria-label="Fermer la recherche" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition hover:border-neutral-400 hover:bg-neutral-50 hover:text-black">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex min-h-[58px] items-center gap-3 border-b border-neutral-100 bg-neutral-50/70 px-7">
            <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.17em] text-neutral-400">{cleanQuery && suggestions.length ? "Suggestions" : "Recherches populaires"}</span>
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
              {(cleanQuery && suggestions.length ? suggestions : POPULAR).slice(0, 6).map((term) => <button key={term} onClick={() => chooseTerm(term)} className="shrink-0 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-[11px] font-medium text-neutral-600 transition hover:border-[#3ecf4c] hover:text-[#168a31]">{term}</button>)}
            </div>
            {recents.length > 0 && !cleanQuery && <button onClick={() => chooseTerm(recents[0])} className="shrink-0 border-l border-neutral-200 pl-4 text-[11px] font-medium text-neutral-400 hover:text-black">Récent : <span className="text-neutral-700">{recents[0]}</span></button>}
          </div>

          <main className="search-desktop-results min-w-0 px-7 py-6">
            <div className="mb-5 flex items-end justify-between">
              <div><p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#179b38]">Sélection L’ecomax</p><h2 className="mt-1 text-[21px] font-semibold tracking-[-0.025em]">{loading ? "Recherche en cours…" : heading}</h2></div>
              <button onClick={cleanQuery.length >= 2 ? submitSearch : () => { onClose(); window.location.href = "/boutique"; }} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-neutral-200 px-4 text-[11px] font-semibold transition hover:border-black hover:bg-black hover:text-white">{cleanQuery.length >= 2 ? "Voir tous les résultats" : "Explorer la boutique"}<span aria-hidden="true">→</span></button>
            </div>

            {isTypingHint && <MessageState title="Continuez à écrire" text="Deux caractères suffisent pour lancer la recherche intelligente." />}
            {noResults && <MessageState title={`Aucun résultat pour « ${cleanQuery} »`} text="Essayez une marque, une catégorie ou un mot plus simple. La recherche accepte aussi les fautes légères." />}
            {error && <MessageState title="Recherche indisponible" text={error} />}
            {!isTypingHint && !noResults && !error && <div className="grid grid-cols-2 gap-3.5">{results.slice(0, cleanQuery ? 6 : 4).map((product, index) => <ProductCard key={product.slug} product={product} query={cleanQuery} active={activeIndex === index} index={index} onHover={() => setActiveIndex(index)} onPick={closeAndRemember} />)}</div>}
          </main>

          <div className="flex min-h-[52px] items-center justify-center gap-8 border-t border-neutral-100 bg-neutral-50 px-7 text-[10px] font-medium text-neutral-500">
            <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#3ecf4c]" />Recherche intelligente et tolérante aux fautes</span>
            <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#3ecf4c]" />Livraison partout au Maroc</span>
            <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#3ecf4c]" />Paiement sécurisé</span>
          </div>
        </div>
      </div>
    </>
  );
}

function MessageState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-neutral-400 shadow-sm"><SearchIcon size={24} /></span>
      <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">{text}</p>
    </div>
  );
}
