"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  old_price?: number;
  images?: string[];
  image?: string;
  badge?: string;
};

const getImage = (p: Product) => (p.images && p.images.length > 0 ? p.images[0] : p.image ?? "");

interface Props {
  open: boolean;
  onClose: () => void;
}

const POPULAR = [
  "Baskets", "Manette", "Écouteurs", "Sac", "Lenovo",
  "Montre", "Veste", "Casque", "Sneakers", "Chaussures",
];

function ProductImg({ src, alt }: { src: string; alt: string }) {
  const [err, setErr] = useState(false);
  return err || !src ? (
    <div style={{
      width: "100%", height: "100%",
      background: "linear-gradient(145deg,#f7f7f7,#ededed)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
  ) : (
    <img src={src} alt={alt} onError={() => setErr(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ fontWeight: 900, color: "#3ecf4c" }}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function SearchOverlay({ open, onClose }: Props) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(false);
  const [visible, setVisible]   = useState(false);
  const [recents, setRecents]   = useState<string[]>([]);
  const inputRef       = useRef<HTMLInputElement>(null); // desktop
  const inputMobileRef  = useRef<HTMLInputElement>(null); // mobile
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const railRef  = useRef<HTMLDivElement>(null);

  // Load recents
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem("search_recents") || "[]");
      setRecents(Array.isArray(r) ? r.slice(0, 8) : []);
    } catch { /**/ }
  }, []);

  const addRecent = useCallback((term: string) => {
    const t = term.trim();
    if (!t) return;
    setRecents(prev => {
      const next = [t, ...prev.filter(x => x.toLowerCase() !== t.toLowerCase())].slice(0, 8);
      try { localStorage.setItem("search_recents", JSON.stringify(next)); } catch { /**/ }
      return next;
    });
  }, []);

  const removeRecent = useCallback((term: string) => {
    setRecents(prev => {
      const next = prev.filter(x => x !== term);
      try { localStorage.setItem("search_recents", JSON.stringify(next)); } catch { /**/ }
      return next;
    });
  }, []);

  // Animate in/out
  useEffect(() => {
    if (open) {
      setVisible(true);
      setQuery(""); setResults([]); setLoading(false);
      setTimeout(() => {
        if (window.innerWidth < 768) inputMobileRef.current?.focus();
        else inputRef.current?.focus();
      }, 100);
      // Prevent body scroll on mobile
      document.body.style.overflow = "hidden";
    } else {
      const t = setTimeout(() => setVisible(false), 320);
      document.body.style.overflow = "";
      return () => clearTimeout(t);
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Load featured
  useEffect(() => {
    fetch("/api/products?active=true&limit=10")
      .then(r => r.json())
      .then(d => setFeatured(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const fetchNow = useCallback(async (term: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (term.trim().length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/products?search=${encodeURIComponent(term.trim())}&active=true&limit=8`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch { setResults([]); }
    finally  { setLoading(false); }
  }, []);

  const doSearch = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.trim().length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/products?search=${encodeURIComponent(q.trim())}&active=true&limit=8`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch { setResults([]); }
      finally  { setLoading(false); }
    }, 300);
  }, []);

  useEffect(() => {
    doSearch(query);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, doSearch]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  const goSearch = () => {
    if (q.length >= 2) { addRecent(q); onClose(); window.location.href = `/boutique?search=${encodeURIComponent(q)}`; }
  };

  const pickSuggestion = (term: string) => {
    setQuery(term);
    fetchNow(term);
    inputRef.current?.focus();
  };

  const scrollRail = (dir: "left" | "right") => {
    railRef.current?.scrollBy({ left: dir === "right" ? 260 : -260, behavior: "smooth" });
  };

  const discount = (p: Product) => p.old_price && p.old_price > p.price
    ? Math.round((1 - p.price / p.old_price) * 100) : null;

  if (!visible) return null;

  const q          = query.trim();
  const hasResults = results.length > 0;
  const showHint   = q.length === 1 && !loading;
  const showEmpty  = q.length >= 2 && !loading && !hasResults;
  const isActive   = open;
  const displayList = q && hasResults ? results : featured;

  // ─── MOBILE: full-screen bottom sheet ─────────────────────────────────────
  return (
    <>
      <div className="so-mobile">
        {/* Backdrop */}
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 9980,
            background: isActive ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)",
            transition: "background 0.28s",
          }}
        />

        {/* Full-screen sheet */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 9990,
          background: "#fff",
          display: "flex", flexDirection: "column",
          transform: isActive ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)",
        }}>

          {/* ── Search bar ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 0,
            padding: "0 16px",
            height: 60, flexShrink: 0,
            borderBottom: "1.5px solid #f0f0f0",
          }}>
            {/* Back arrow */}
            <button onClick={onClose} style={{
              width: 40, height: 40, border: "none", background: "none",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", color: "#333", marginLeft: -8, flexShrink: 0,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>

            {/* Input */}
            <div style={{
              flex: 1, display: "flex", alignItems: "center",
              background: "#f5f5f5", borderRadius: 12,
              padding: "0 12px", height: 42, margin: "0 8px",
            }}>
              <svg style={{ color: "#999", flexShrink: 0 }} width="17" height="17" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
              </svg>
              <input
                ref={inputMobileRef}
                type="search"
                inputMode="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                onKeyUp={e => { if (e.key === "Enter") goSearch(); }}
                placeholder="Rechercher..."
                autoComplete="off" spellCheck={false}
                style={{
                  flex: 1, fontSize: 16, fontWeight: 400,
                  border: "none", outline: "none", background: "transparent",
                  color: "#000", fontFamily: "inherit", padding: "0 10px",
                  // Prevent iOS zoom on focus (font-size >= 16px)
                }}
              />
              {loading && (
                <svg style={{ animation: "_spin 0.7s linear infinite", color: "#3ecf4c", flexShrink: 0 }}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                </svg>
              )}
              {query && !loading && (
                <button onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                  style={{ background: "none", border: "none", cursor: "pointer",
                    padding: 0, display: "flex", alignItems: "center", color: "#aaa", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Search CTA */}
            <button onClick={goSearch}
              style={{
                height: 42, padding: "0 16px", borderRadius: 12,
                background: "#3ecf4c", color: "#000", border: "none",
                fontSize: 13, fontWeight: 800, cursor: "pointer",
                fontFamily: "inherit", flexShrink: 0,
                opacity: q.length >= 2 ? 1 : 0.4,
                transition: "opacity 0.15s",
              }}>
              OK
            </button>
          </div>

          {/* ── Recents ── */}
          {!q && recents.length > 0 && (
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f3f3", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#aaa", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  Récent
                </span>
                <button onClick={() => { setRecents([]); try { localStorage.removeItem("search_recents"); } catch {/**/} }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#3ecf4c", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>
                  Effacer
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {recents.map(r => (
                  <div key={r} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 99,
                    border: "1.5px solid #e5e5e5", background: "#fafafa",
                  }}>
                    <button onClick={() => pickSuggestion(r)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13, fontWeight: 600, color: "#333", fontFamily: "inherit" }}>
                      {r}
                    </button>
                    <button onClick={() => removeRecent(r)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#ccc", display: "flex", alignItems: "center" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <path d="M18 6 6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Popular tags (no query) ── */}
          {!q && (
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f3f3", flexShrink: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#aaa", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 10px" }}>
                Tendances
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(featured.length > 0 ? featured.slice(0, 8).map(p => p.name) : POPULAR).map(term => (
                  <button key={term} onClick={() => pickSuggestion(term)}
                    style={{
                      padding: "7px 14px", borderRadius: 99,
                      border: "1.5px solid #e5e5e5", background: "#fff",
                      fontSize: 13, fontWeight: 600, color: "#333",
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Results hint ── */}
          {showHint && (
            <div style={{ padding: "32px 16px", color: "#bbb", fontSize: 14, textAlign: "center" }}>
              Continuez à taper…
            </div>
          )}

          {/* ── No results ── */}
          {showEmpty && (
            <div style={{ padding: "48px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>😕</div>
              <p style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>Aucun résultat pour «{q}»</p>
              <p style={{ fontSize: 13, color: "#aaa" }}>Essayez un autre terme</p>
            </div>
          )}

          {/* ── Results / Suggestions list ── */}
          {!showHint && !showEmpty && (
            <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" as never }}>
              {/* Results header */}
              {q && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 16px 6px" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                    {loading ? "Recherche…" : `${results.length} résultat${results.length > 1 ? "s" : ""}`}
                  </span>
                  {hasResults && (
                    <Link href={`/boutique?search=${encodeURIComponent(q)}`}
                      onClick={() => { addRecent(q); onClose(); }}
                      style={{ fontSize: 12, fontWeight: 800, color: "#3ecf4c", textDecoration: "none" }}>
                      Voir tout →
                    </Link>
                  )}
                </div>
              )}

              {!q && (
                <p style={{ fontSize: 11, fontWeight: 800, color: "#aaa", textTransform: "uppercase",
                  letterSpacing: "0.14em", padding: "14px 16px 6px", margin: 0 }}>
                  Produits recommandés
                </p>
              )}

              {/* Product rows */}
              {displayList.map(p => {
                const disc = discount(p);
                return (
                  <Link key={p.slug} href={`/produit/${p.slug}`}
                    onClick={() => { if (q) addRecent(q); onClose(); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "12px 16px",
                      borderBottom: "1px solid #f5f5f5",
                      textDecoration: "none", color: "#000",
                      background: "#fff",
                    }}>
                    {/* Thumbnail */}
                    <div style={{
                      width: 64, height: 64, borderRadius: 12,
                      overflow: "hidden", flexShrink: 0,
                      background: "#f7f7f7", border: "1px solid #efefef",
                    }}>
                      <ProductImg src={getImage(p)} alt={p.name} />
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 10, fontWeight: 800, color: "#aaa",
                        textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 3px" }}>
                        {p.category}
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 5px",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <Highlight text={p.name} query={q} />
                      </p>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 900 }}>{p.price} DH</span>
                        {p.old_price && p.old_price > p.price && (
                          <span style={{ fontSize: 12, color: "#bbb", textDecoration: "line-through" }}>
                            {p.old_price} DH
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Discount badge */}
                    {disc && (
                      <span style={{
                        background: "#fef2f2", color: "#ef4444",
                        fontSize: 11, fontWeight: 900, padding: "3px 8px",
                        borderRadius: 99, flexShrink: 0,
                      }}>-{disc}%</span>
                    )}
                    {/* Chevron */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ─── DESKTOP: original top-slide 2-column overlay ─── */}
      <div className="so-desktop">
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9990,
        background: isActive ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0)",
        backdropFilter: isActive ? "blur(6px)" : "none",
        transition: "background 0.28s, backdrop-filter 0.28s",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* White panel sliding from top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        background: "#fff",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        transform: isActive ? "translateY(0)" : "translateY(-100%)",
        transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)",
        maxHeight: "90vh",
        display: "flex", flexDirection: "column",
      }}>

        {/* Search bar row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 0,
          borderBottom: "2px solid #efefef",
          padding: "0 24px",
          height: 68, flexShrink: 0,
        }}>
          <Link href="/" onClick={onClose}
            style={{ textDecoration: "none", marginRight: 24, flexShrink: 0 }}>
            <Logo />
          </Link>
          <svg style={{ color: "#555", flexShrink: 0 }} width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            onKeyUp={e => { if (e.key === "Enter" && q.length >= 2) { addRecent(q); onClose(); window.location.href = `/boutique?search=${encodeURIComponent(q)}`; } }}
            placeholder="Rechercher un produit, une marque..."
            style={{
              flex: 1, fontSize: 16, fontWeight: 400,
              border: "none", outline: "none", background: "transparent",
              color: "#000", fontFamily: "inherit", padding: "0 14px",
            }}
            autoComplete="off" spellCheck={false}
          />
          {loading && (
            <svg style={{ animation: "_spin 0.7s linear infinite", color: "#3ecf4c", marginRight: 12, flexShrink: 0 }}
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
            </svg>
          )}
          {query && !loading && (
            <button onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              style={{
                width: 30, height: 30, borderRadius: "50%", border: "none",
                background: "#f0f0f0", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", color: "#666",
                marginRight: 8, flexShrink: 0,
              }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
          <button onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: "50%", border: "none",
              background: "transparent", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: "#333",
              flexShrink: 0,
            }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Recents row */}
        {!q && recents.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8,
            padding: "12px 24px 12px",
            borderBottom: "1px solid #f3f3f3",
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#bbb", letterSpacing: "0.14em",
              textTransform: "uppercase", marginRight: 4, flexShrink: 0 }}>Récent :</span>
            {recents.map(r => (
              <div key={r} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "5px 12px", borderRadius: 99,
                border: "1.5px solid #e5e5e5", background: "#fafafa",
                fontSize: 12, fontWeight: 600, color: "#333",
              }}>
                <button onClick={() => pickSuggestion(r)}
                  style={{ background: "none", border: "none", cursor: "pointer",
                    padding: 0, fontSize: 12, fontWeight: 600, color: "#333", fontFamily: "inherit" }}>
                  {r}
                </button>
                <button onClick={() => removeRecent(r)}
                  style={{ background: "none", border: "none", cursor: "pointer",
                    padding: 0, color: "#aaa", display: "flex", alignItems: "center" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            ))}
            <button onClick={() => { setRecents([]); try { localStorage.removeItem("search_recents"); } catch {/**/} }}
              style={{ background: "none", border: "none", cursor: "pointer",
                color: "#3ecf4c", fontSize: 11, fontWeight: 700, marginLeft: 4, fontFamily: "inherit" }}>
              Tout effacer
            </button>
          </div>
        )}

        {/* Body: 2-column */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

          {/* Left sidebar */}
          <div style={{
            width: 200, flexShrink: 0,
            borderRight: "1px solid #f3f3f3",
            padding: "24px 20px",
            overflowY: "auto",
          }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "#aaa", margin: "0 0 14px" }}>
              {q && hasResults ? "Suggestions" : "Tendances"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {(q && hasResults
                ? results.slice(0, 8).map(p => p.name)
                : featured.length > 0 ? featured.slice(0, 10).map(p => p.name) : POPULAR
              ).map(term => (
                <button key={term} onClick={() => pickSuggestion(term)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    textAlign: "left", padding: "7px 10px", borderRadius: 8,
                    fontSize: 13, fontWeight: 500, color: "#444", fontFamily: "inherit",
                    transition: "background 0.12s, color 0.12s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "#f5fdf6";
                    (e.currentTarget as HTMLElement).style.color = "#1a9c28";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "none";
                    (e.currentTarget as HTMLElement).style.color = "#444";
                  }}
                >
                  {q ? <Highlight text={term} query={q} /> : term}
                </button>
              ))}
            </div>
          </div>

          {/* Right: products */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 24px 16px", flexShrink: 0,
            }}>
              <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.2em",
                textTransform: "uppercase", color: "#aaa", margin: 0 }}>
                {loading && q ? "Recherche en cours…"
                  : q && hasResults ? `${results.length} résultat${results.length > 1 ? "s" : ""} pour «\u00a0${q}\u00a0»`
                  : "Produits recommandés"}
              </p>
              {q && hasResults && (
                <Link href={`/boutique?search=${encodeURIComponent(q)}`} onClick={() => { addRecent(q); onClose(); }}
                  style={{ fontSize: 11, fontWeight: 800, color: "#3ecf4c", textDecoration: "none", letterSpacing: "0.06em" }}>
                  Voir tout →
                </Link>
              )}
            </div>

            {showHint && (
              <div style={{ padding: "40px 24px", color: "#bbb", fontSize: 13, textAlign: "center" }}>
                Continuez à taper pour rechercher…
              </div>
            )}
            {showEmpty && (
              <div style={{ padding: "40px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>😕</div>
                <p style={{ fontSize: 15, fontWeight: 800, margin: "0 0 6px" }}>Aucun résultat pour «{q}»</p>
                <p style={{ fontSize: 12, color: "#aaa" }}>Essayez un autre terme ou parcourez nos catégories</p>
              </div>
            )}

            {!showHint && !showEmpty && (
              <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
                {loading && q && (
                  <div style={{
                    position: "absolute", inset: 0, zIndex: 20,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(255,255,255,0.7)",
                  }}>
                    <svg style={{ animation: "_spin 0.7s linear infinite", color: "#3ecf4c" }}
                      width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                    </svg>
                  </div>
                )}
                <button onClick={() => scrollRail("left")}
                  style={{
                    position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)",
                    zIndex: 10, width: 36, height: 36, borderRadius: "50%",
                    background: "#fff", border: "1.5px solid #e5e5e5",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.10)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#333",
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <div ref={railRef} style={{
                  display: "flex", gap: 14, overflowX: "auto", overflowY: "hidden",
                  padding: "0 52px 24px",
                  scrollbarWidth: "none",
                  height: "100%",
                  alignItems: "flex-start",
                }}>
                  {(q && hasResults ? results : featured).map((p) => {
                    const disc = discount(p);
                    return (
                      <Link key={p.slug} href={`/produit/${p.slug}`}
                        onClick={() => { if (q) addRecent(q); onClose(); }}
                        style={{
                          flexShrink: 0, width: 180,
                          display: "flex", flexDirection: "column",
                          border: "1.5px solid #efefef", borderRadius: 14,
                          overflow: "hidden", textDecoration: "none", color: "#000",
                          background: "#fff", transition: "box-shadow 0.15s, transform 0.15s",
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.boxShadow = "none";
                          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        }}
                      >
                        <div style={{ position: "relative", height: 180, background: "#f7f7f7" }}>
                          <ProductImg src={getImage(p)} alt={p.name} />
                          {disc && (
                            <div style={{
                              position: "absolute", top: 8, right: 8,
                              background: "#ef4444", color: "#fff",
                              fontSize: 9, fontWeight: 900, padding: "3px 6px", borderRadius: 5,
                            }}>-{disc}%</div>
                          )}
                        </div>
                        <div style={{ padding: "12px 12px 14px", flex: 1 }}>
                          <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.14em",
                            textTransform: "uppercase", color: "#aaa", margin: "0 0 4px" }}>
                            {p.category}
                          </p>
                          <p style={{ fontSize: 12, fontWeight: 700, margin: "0 0 10px",
                            lineHeight: 1.4,
                            display: "-webkit-box", WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                            <Highlight text={p.name} query={q} />
                          </p>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                            <span style={{ fontSize: 14, fontWeight: 900 }}>{p.price} DH</span>
                            {p.old_price && p.old_price > p.price && (
                              <span style={{ fontSize: 11, color: "#bbb", textDecoration: "line-through" }}>
                                {p.old_price} DH
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <button onClick={() => scrollRail("right")}
                  style={{
                    position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                    zIndex: 10, width: 36, height: 36, borderRadius: "50%",
                    background: "#fff", border: "1.5px solid #e5e5e5",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.10)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#333",
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      </div>
      </div>

    </>
  );
}

