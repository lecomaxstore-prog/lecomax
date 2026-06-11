"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useCart } from "./CartContext";
import { categories } from "@/lib/products";
import Logo from "./Logo";
import { supabase } from "@/lib/supabase";
import SearchOverlay from "./SearchOverlay";

const utilLinks = [
  { label: "Aide", href: "/aide", icon: <HelpIcon /> },
  { label: "Suivre la commande", href: "/suivre-commande", icon: <TruckIcon /> },
  { label: "ecoClub", href: "/ecoclub", icon: <StarIcon /> },
  { label: "Boutiques", href: "/boutiques", icon: <PinIcon /> },
];

export default function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    // Keep in sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
    <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md transition-shadow duration-200 ${scrolled ? "shadow-[0_1px_12px_0_rgba(0,0,0,0.08)]" : "shadow-[0_1px_0_0_#e5e5e5]"}`}>
      {/* ── Top utility bar ─────────────────────────────────────── */}
      <div className="hidden md:block bg-neutral-950">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-9">
          {/* Left: tagline */}
          <span className="text-[11px] text-white/40 tracking-[0.15em] uppercase">
            L&apos;ecomax — Performance &amp; Style
          </span>

          {/* Right: utility links */}
          <div className="flex items-center divide-x divide-white/10">
            {utilLinks.map((u) => (
              <Link
                key={u.label}
                href={u.href}
                className="flex items-center gap-1.5 px-4 text-[11px] text-white/60 hover:text-white transition-colors tracking-wide"
              >
                <span className="opacity-70">{u.icon}</span>
                {u.label}
              </Link>
            ))}
            {/* Country selector */}
            <button className="flex items-center gap-1.5 pl-4 text-[11px] text-white/60 hover:text-white transition-colors tracking-wide">
              <GlobeIcon />
              <span>Maroc · FR</span>
              <ChevronIcon />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main bar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 md:px-6 h-[60px]">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            aria-label="Menu"
            className="md:hidden p-2 -ml-1"
            onClick={() => setOpen((o) => !o)}
          >
            <span className={`block w-[22px] h-[2px] bg-black transition-all duration-300 origin-center ${open ? "rotate-45 translate-y-[7px]" : "mb-[5px]"}`} />
            <span className={`block w-[22px] h-[2px] bg-black transition-all duration-300 ${open ? "opacity-0 scale-x-0" : "mb-[5px]"}`} />
            <span className={`block h-[2px] bg-black transition-all duration-300 origin-center ${open ? "-rotate-45 w-[22px] -translate-y-[7px]" : "w-[16px]"}`} />
          </button>

          <Link href="/" aria-label="L'ecomax — Accueil" className="flex items-center gap-3">
            <Logo />
          </Link>
        </div>

        {/* Centre: nav */}
        <nav className="hidden md:flex items-center gap-0.5 text-[12px] font-black uppercase tracking-[0.08em]">
          <Link
            href="/"
            className="relative px-3.5 py-1.5 group rounded-sm overflow-hidden"
          >
            <span className="absolute inset-0 bg-neutral-100 scale-x-0 scale-y-75 group-hover:scale-x-100 group-hover:scale-y-100 origin-center transition-transform duration-200 ease-out rounded-sm" />
            <span className="relative z-10 transition-colors duration-200">Accueil</span>
            <span className="absolute inset-x-3.5 bottom-0.5 h-[2px] bg-[#3ecf4c] scale-x-0 group-hover:scale-x-100 origin-center transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              className="relative px-3.5 py-1.5 group rounded-sm overflow-hidden"
            >
              {/* Pill hover bg */}
              <span className="absolute inset-0 bg-neutral-100 scale-x-0 scale-y-75 group-hover:scale-x-100 group-hover:scale-y-100 origin-center transition-transform duration-200 ease-out rounded-sm" />
              <span className="relative z-10 transition-colors duration-200">{c.label}</span>
              {/* Green underline */}
              <span className="absolute inset-x-3.5 bottom-0.5 h-[2px] bg-[#3ecf4c] scale-x-0 group-hover:scale-x-100 origin-center transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
            </Link>
          ))}
          <Link
            href="/promotions"
            className="relative ml-1 px-3.5 py-1.5 group rounded-sm overflow-hidden"
          >
            {/* Red pill hover bg */}
            <span className="absolute inset-0 bg-red-50 scale-x-0 scale-y-75 group-hover:scale-x-100 group-hover:scale-y-100 origin-center transition-transform duration-200 ease-out rounded-sm" />
            <span className="relative z-10 flex items-center gap-1.5 text-red-600">
              {/* Pulsing dot */}
              <span className="relative flex h-[7px] w-[7px] shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60" />
                <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-red-600" />
              </span>
              Promotions
            </span>
            <span className="absolute inset-x-3.5 bottom-0.5 h-[2px] bg-red-500 scale-x-0 group-hover:scale-x-100 origin-center transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
          </Link>
        </nav>

        {/* Right: search + icons */}
        <div className="flex items-center gap-1">
          {/* Search button — desktop + mobile */}
          <button
            aria-label="Recherche"
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-600 hover:text-black"
          >
            <SearchIcon />
          </button>

          <IconBtn href={isLoggedIn ? "/compte" : "/connexion"} label="Mon compte">
            <UserIcon />
          </IconBtn>
          <IconBtn href={isLoggedIn ? "/compte" : "/connexion"} label="Mes favoris">
            <HeartIcon />
          </IconBtn>
          <IconBtn href="/panier" label="Panier">
            <span className="relative">
              <BagIcon />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[9px] font-bold rounded-full w-[16px] h-[16px] flex items-center justify-center leading-none">
                  {count}
                </span>
              )}
            </span>
          </IconBtn>
        </div>
      </div>
    </header>

      {/* ── Mobile full-screen menu ───────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[9998] md:hidden transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        onClick={() => setOpen(false)}
      />

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 left-0 h-full w-[88vw] max-w-[360px] z-[9999] md:hidden flex flex-col ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "#fff", transition: "transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        {/* ── Header ── */}
        <div className={`flex items-center justify-between px-5 h-[60px] shrink-0 ${open ? "drawer-item" : ""}`}
          style={{ borderBottom: "1.5px solid #f0f0f0", animationDelay: "20ms" }}>
          <Link href="/" onClick={() => setOpen(false)}>
            <Logo />
          </Link>
          <button
            aria-label="Fermer"
            onClick={() => setOpen(false)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 active:bg-neutral-100 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* ── Scrollable body wrapper (fade mask at bottom) ── */}
        <div className="flex-1 relative min-h-0">
          {/* Bottom fade-out hint */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10" style={{ height: 48, background: "linear-gradient(to top, #fff 0%, transparent 100%)" }} />

        {/* Scrollable body */}
        <div className="h-full overflow-y-auto drawer-scroll" key={open ? "open" : "closed"}
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorY: "contain",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          } as React.CSSProperties}>

          {/* Account quick-access */}
          <Link href={isLoggedIn ? "/compte" : "/connexion"} onClick={() => setOpen(false)}
            className={`flex items-center gap-3 mx-4 mt-4 px-4 py-3.5 rounded-2xl active:opacity-80 transition-opacity ${open ? "drawer-item" : ""}`}
            style={{ background: "linear-gradient(135deg,#3ecf4c15,#3ecf4c08)", border: "1.5px solid #3ecf4c30", animationDelay: "60ms" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#3ecf4c20" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-black">{isLoggedIn ? "Mon compte" : "Se connecter"}</p>
              <p className="text-[11px] text-neutral-400">{isLoggedIn ? "Commandes & profil" : "Créer un compte gratuit"}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </Link>

          {/* ── Nav rows ── */}
          <div className={`mt-4 ${open ? "drawer-item" : ""}`} style={{ animationDelay: "110ms" }}>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-300 mb-1 px-5">Catégories</p>
            {([
              { slug: "homme",       label: "Homme",       sub: "Vestes, Pulls & Sport",     img: "/images/menu%20category/homme.png" },
              { slug: "femme",       label: "Femme",        sub: "Mode, Robes & Lifestyle",  img: "/images/menu%20category/femme.png" },
              { slug: "chaussures",  label: "Chaussures",   sub: "Running, Sneakers & Style", img: "/images/menu%20category/chaussures.png" },
              { slug: "accessoires", label: "Accessoires",  sub: "Tech, Audio & Sacs",        img: "/images/menu%20category/accessoires.png" },
            ] as { slug:string; label:string; sub:string; img:string }[]).map((c, i, arr) => (
              <Link key={c.slug} href={`/${c.slug}`} onClick={() => setOpen(false)}
                className={`flex items-center gap-4 px-5 py-2.5 active:bg-neutral-50 transition-colors ${open ? "drawer-item" : ""}`}
                style={{ borderBottom: i < arr.length - 1 ? "1px solid #f3f3f3" : "none", animationDelay: `${140 + i * 55}ms` }}>
                {/* Category photo */}
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-neutral-100">
                  <img src={c.img} alt={c.label}
                    className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-black text-black leading-snug">{c.label}</p>
                  <p className="text-[11px] text-neutral-400 leading-snug">{c.sub}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </Link>
            ))}
          </div>

          {/* ── Promotions + Nouveautés photo banners ── */}
          <div className={`px-4 mt-3 grid grid-cols-2 gap-2.5 ${open ? "drawer-item" : ""}`} style={{ animationDelay: "380ms" }}>
            {/* Nouveautés */}
            <Link href="/nouveautes" onClick={() => setOpen(false)}
              className="relative overflow-hidden rounded-2xl active:opacity-90 transition-opacity"
              style={{ height: 130 }}>
              <img src="/images/menu%20category/nouveautes.png"
                alt="Nouveautés" className="absolute inset-0 w-full h-full object-cover object-top" />
              {/* gradient overlay */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-[13px] font-black text-white leading-tight">Nouveautés</p>
                <p className="text-[10px] text-white/70 leading-tight mt-0.5">Voir tout →</p>
              </div>
            </Link>

            {/* Promotions */}
            <Link href="/promotions" onClick={() => setOpen(false)}
              className="relative overflow-hidden rounded-2xl active:opacity-90 transition-opacity"
              style={{ height: 130 }}>
              <img src="/images/menu%20category/promotions.png"
                alt="Promotions" className="absolute inset-0 w-full h-full object-cover object-center" />
              {/* gradient overlay */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.1) 60%)" }} />
              {/* live badge */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"/>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"/>
                </span>
                <span className="text-[9px] font-black text-white uppercase tracking-wide">Live</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-[13px] font-black text-white leading-tight">Promotions</p>
                <p className="text-[10px] text-white/70 leading-tight mt-0.5">Offres en cours →</p>
              </div>
            </Link>
          </div>

          {/* ── Useful links ── */}
          <div className={`px-4 mt-4 mb-6 ${open ? "drawer-item" : ""}`} style={{ animationDelay: "440ms" }}>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-300 mb-2 px-1">Aide & Services</p>
            <div className="grid grid-cols-2 gap-2">
              {utilLinks.map((u) => (
                <Link key={u.label} href={u.href} onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl active:bg-neutral-50 transition-colors"
                  style={{ border: "1.5px solid #f0f0f0" }}>
                  <span className="text-neutral-400 shrink-0">{u.icon}</span>
                  <span className="text-[12px] font-bold text-neutral-600 leading-tight">{u.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 px-5 py-3.5 flex items-center justify-between" style={{ borderTop: "1.5px solid #f0f0f0" }}>
          <p className="text-[10px] text-neutral-300 tracking-widest uppercase">L&apos;ecomax &copy; 2026</p>
          <div className="flex items-center gap-3">
            <Link href="/nous-contacter" onClick={() => setOpen(false)}
              className="text-[10px] font-bold text-neutral-400 active:text-black transition-colors uppercase tracking-wide">
              Contact
            </Link>
            <Link href="/aide" onClick={() => setOpen(false)}
              className="text-[10px] font-bold text-neutral-400 active:text-black transition-colors uppercase tracking-wide">
              Aide
            </Link>
          </div>
        </div>
      </div>
      {/* Search overlay */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

/* ── Shared icon button wrapper ── */
function IconBtn({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-700 hover:text-black"
    >
      {children}
    </Link>
  );
}

/* ── SVG icons ── */
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
function HelpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <circle cx="12" cy="17" r=".5" fill="currentColor" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 3h15v13H1z" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}


