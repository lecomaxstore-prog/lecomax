"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { useRef, useState, useEffect } from "react";

const cats = [
  { slug: "homme",       label: "Homme",        sub: "Vestes & Sweats" },
  { slug: "femme",       label: "Femme",         sub: "Vestes & Sweats" },
  { slug: "chaussures",  label: "Chaussures",    sub: "Running & Lifestyle" },
  { slug: "accessoires", label: "Accessoires",   sub: "Tech, Audio & Sacs" },
];

type TabItem = {
  id: string;
  label: string;
  href?: string;
  action?: "categories" | "search";
};

const tabs: TabItem[] = [
  { id: "accueil",    label: "Accueil",    href: "/" },
  { id: "categories", label: "Catégories", action: "categories" },
  { id: "recherche",  label: "Recherche",  action: "search" },
  { id: "panier",     label: "Panier",     href: "/panier" },
  { id: "compte",     label: "Compte",     href: "/connexion" },
];

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function IconGrid({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.2 : 0} />
      <rect x="14" y="3" width="7" height="7" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.2 : 0} />
      <rect x="14" y="14" width="7" height="7" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.2 : 0} />
      <rect x="3" y="14" width="7" height="7" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.2 : 0} />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function IconBag({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export default function MobileNav() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { count } = useCart();

  const [catOpen,    setCatOpen]    = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query,      setQuery]      = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setCatOpen(false); setSearchOpen(false); }, [pathname]);
  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 80);
    else setQuery("");
  }, [searchOpen]);

  const isRouteActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const isTabActive = (tab: TabItem) => {
    if (tab.action === "categories") return catOpen;
    if (tab.action === "search") return searchOpen;
    if (tab.href) return isRouteActive(tab.href) && !catOpen && !searchOpen;
    return false;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchOpen(false);
    router.push(`/chaussures?q=${encodeURIComponent(query.trim())}`);
  };

  const renderIcon = (tab: TabItem, active: boolean) => {
    if (tab.id === "accueil")    return <IconHome active={active} />;
    if (tab.id === "categories") return <IconGrid active={active} />;
    if (tab.id === "recherche")  return <IconSearch />;
    if (tab.id === "compte")     return <IconUser />;
    if (tab.id === "panier") return (
      <span data-cart-icon className="relative inline-flex">
        <IconBag active={active} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[8px] font-black rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-[3px] leading-none">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </span>
    );
    return null;
  };

  const handleTabClick = (tab: TabItem) => {
    if (tab.action === "categories") { setCatOpen((v) => !v); setSearchOpen(false); }
    else if (tab.action === "search") { setSearchOpen((v) => !v); setCatOpen(false); }
  };

  return (
    <>
      {/* ── Categories sheet ── */}
      {catOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70" onClick={() => setCatOpen(false)} />
          <div className="relative overflow-hidden" style={{ backgroundColor: "#111111" }}>
            {/* top accent line */}
            <div className="h-px w-full bg-white/10" />
            {/* handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30 px-5 pb-3">Catégories</p>
            <div className="px-4 pb-5 grid grid-cols-2 gap-2">
              {cats.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${c.slug}`}
                  className="group flex flex-col gap-1 p-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] active:bg-white/[0.08] transition-all"
                >
                  <span className="text-white font-bold text-[14px] leading-tight tracking-tight">{c.label}</span>
                  <span className="text-white/35 text-[11px] leading-tight">{c.sub}</span>
                </Link>
              ))}
            </div>
            <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
          </div>
        </div>
      )}

      {/* ── Search overlay ── */}
      {searchOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] flex flex-col"
          style={{ backgroundColor: "#0a0a0a" }}
        >
          {/* search bar row */}
          <div className="flex items-center gap-3 px-4 pt-16 pb-5 border-b border-white/[0.07]">
            <form onSubmit={handleSearch} className="flex-1 flex items-center gap-3 bg-white/[0.07] rounded-xl px-4 h-11 border border-white/[0.06]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-40">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un produit..."
                className="flex-1 bg-transparent text-white placeholder-white/25 text-[15px] outline-none font-medium"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="text-white/30 hover:text-white/60 transition-colors">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </form>
            <button onClick={() => setSearchOpen(false)} className="text-white/50 text-[14px] font-semibold shrink-0 hover:text-white/80 transition-colors">
              Annuler
            </button>
          </div>
          {/* suggestions */}
          {!query && (
            <div className="px-4 pt-5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/25 mb-3">Tendances</p>
              <div className="flex flex-wrap gap-2">
                {["Running", "Controllers", "AirPods", "Vestes", "Sacs", "Lifestyle"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3.5 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] text-white/55 text-[13px] font-medium active:bg-white/[0.1] transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50"
        style={{ backgroundColor: "#0d0d0d" }}
      >
        {/* top border accent */}
        <div className="h-px w-full bg-white/[0.09]" />
        <div className="flex items-stretch h-[58px]">
          {tabs.map((tab) => {
            const active = isTabActive(tab);
            const inner = (
              <>
                <span className="relative">{renderIcon(tab, active)}</span>
                <span className={`text-[9px] font-bold uppercase tracking-[0.07em] leading-none mt-0.5 transition-colors duration-150 ${active ? "text-white" : "text-white/35"}`}>
                  {tab.label}
                </span>
                {/* active bar at top */}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-white rounded-b-full" />
                )}
              </>
            );
            const cls = `relative flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-colors duration-150 cursor-pointer ${active ? "text-white" : "text-white/35 active:text-white/60"}`;

            if (tab.href) {
              return (
                <Link key={tab.id} href={tab.href} className={cls}>
                  {inner}
                </Link>
              );
            }
            return (
              <button key={tab.id} onClick={() => handleTabClick(tab)} className={cls}>
                {inner}
              </button>
            );
          })}
        </div>
        <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
      </nav>
    </>
  );
}