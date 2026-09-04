"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useCart } from "./CartContext";
import { categories } from "@/lib/products";
import Logo from "./Logo";
import { supabase } from "@/lib/supabase";
import SearchOverlay from "./SearchOverlay";
import { useSettings } from "@/lib/use-settings";
import { useWishlist } from "./WishlistContext";

const utilLinks = [
  { label: "Application Android", href: "/download", icon: <DownloadIcon /> },
  { label: "Aide", href: "/aide", icon: <HelpIcon /> },
  { label: "Suivre la commande", href: "/suivre-commande", icon: <TruckIcon /> },
  { label: "ecoClub", href: "/ecoclub", icon: <StarIcon /> },
  { label: "Ecomedia", href: "/ecomedia", icon: <EcomediaIcon /> },
  { label: "Boutiques", href: "/boutiques", icon: <PinIcon /> },
];

export default function Header() {
  const { count } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [navCategories, setNavCategories] = useState<{ slug: string; label: string }[]>(categories.map(({ slug, label }) => ({ slug, label })));
  const siteSettings = useSettings();
  const visibleUtilLinks = utilLinks.filter((link) => link.href !== "/ecoclub" || siteSettings.enable_ecoclub !== "false");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);

  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" }).then((response) => response.json()).then((data) => {
      if (Array.isArray(data) && data.length) setNavCategories(data.filter((category) => category.active !== false).map((category) => ({ slug: category.slug, label: category.label })));
    }).catch(() => {});
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
      <div className="hidden lg:block bg-neutral-950">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-9">
          {/* Left: tagline */}
          <span className="text-[11px] text-white/40 tracking-[0.15em] uppercase">
            L&apos;ecomax — Performance &amp; Style
          </span>

          {/* Right: utility links */}
          <div className="flex items-center divide-x divide-white/10">
            {visibleUtilLinks.map((u) => (
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
      <div className="flex h-[60px] items-center justify-between px-4 lg:px-6">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="mobile-navigation-drawer"
            className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center lg:hidden"
            onClick={() => setOpen((o) => !o)}
          >
            <span aria-hidden="true" className="relative block h-5 w-6">
              <span className={`absolute left-0 h-[2px] w-6 bg-black transition-all duration-300 ease-out ${open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-[2px]"}`} />
              <span className={`absolute left-0 top-1/2 h-[2px] w-6 -translate-y-1/2 bg-black transition-all duration-200 ${open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"}`} />
              <span className={`absolute left-0 h-[2px] bg-black transition-all duration-300 ease-out ${open ? "top-1/2 w-6 -translate-y-1/2 -rotate-45" : "bottom-[2px] w-[17px]"}`} />
            </span>
          </button>

          <Link href="/" aria-label="L'ecomax — Accueil" className="flex items-center gap-3">
            <Logo showWordmark />
          </Link>
        </div>

        {/* Centre: nav */}
        <nav className="hidden items-center gap-0.5 text-[12px] font-black uppercase tracking-[0.08em] lg:flex">
          <Link
            href="/"
            className="relative px-3.5 py-1.5 group rounded-sm overflow-hidden"
          >
            <span className="absolute inset-0 bg-neutral-100 scale-x-0 scale-y-75 group-hover:scale-x-100 group-hover:scale-y-100 origin-center transition-transform duration-200 ease-out rounded-sm" />
            <span className="relative z-10 transition-colors duration-200">Accueil</span>
            <span className="absolute inset-x-3.5 bottom-0.5 h-[2px] bg-[#3ecf4c] scale-x-0 group-hover:scale-x-100 origin-center transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
          </Link>
          {navCategories.map((c) => (
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
        <div className="flex shrink-0 items-center gap-0 lg:gap-1">
          {/* Search button — desktop + mobile */}
          <button
            aria-label="Recherche"
            onClick={() => setSearchOpen(true)}
            className="header-action-button"
          >
            <SearchIcon />
          </button>

          <IconBtn href={isLoggedIn ? "/compte" : "/connexion"} label="Mon compte">
            <UserIcon />
          </IconBtn>
          {siteSettings.enable_wishlist !== "false" && <IconBtn href="/wishlist" label="Mes favoris">
            <span className="relative inline-flex h-6 w-6 items-center justify-center">
              <HeartIcon />
              {wishlistCount > 0 && (
                <span className="header-action-badge">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </span>
          </IconBtn>}
          <IconBtn href="/panier" label="Panier">
            <span
              data-cart-icon
              className="relative inline-flex h-6 w-6 items-center justify-center"
            >
              <BagIcon />
              {count > 0 && (
                <span className="header-action-badge">
                  {count > 99 ? "99+" : count}
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
        className={`fixed inset-0 z-[9998] transition-opacity duration-300 lg:hidden ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        onClick={() => setOpen(false)}
      />

      {/* Slide-in panel */}
      <div
        id="mobile-navigation-drawer"
        className={`fixed left-0 top-0 z-[9999] flex h-full w-full flex-col overflow-hidden bg-white lg:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ transition: "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        {/* ── Header ── */}
        <div
          className={`relative flex h-[60px] shrink-0 items-center justify-between border-b border-[#3ecf4c]/70 px-4 text-white shadow-[0_8px_24px_rgba(0,0,0,.18)] ${open ? "drawer-item" : ""}`}
          style={{
            animationDelay: "20ms",
            background: "linear-gradient(115deg, #050705 0%, #0b120d 58%, #12351a 100%)",
          }}
        >
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#3ecf4c] to-transparent" />
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => setOpen(false)}
              className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c]"
            >
              <span aria-hidden="true" className="relative block h-5 w-6">
                <span className="absolute left-0 top-1/2 h-[2px] w-6 -translate-y-1/2 rotate-45 bg-white" />
                <span className="absolute left-0 top-1/2 h-[2px] w-6 -translate-y-1/2 -rotate-45 bg-white" />
              </span>
            </button>
            <Link href="/" onClick={() => setOpen(false)} aria-label="L'ecomax — Accueil" className="flex items-center gap-3">
              <Logo showWordmark variant="light" />
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-0">
            <button
              aria-label="Recherche"
              onClick={() => { setOpen(false); setSearchOpen(true); }}
              className="header-action-button !text-white hover:!bg-white/10 hover:!text-white focus-visible:!outline-[#3ecf4c]"
            >
              <SearchIcon />
            </button>
            <Link
              href={isLoggedIn ? "/compte" : "/connexion"}
              onClick={() => setOpen(false)}
              aria-label="Mon compte"
              className="header-action-button !text-white hover:!bg-white/10 hover:!text-white focus-visible:!outline-[#3ecf4c]"
            >
              <UserIcon />
            </Link>
            {siteSettings.enable_wishlist !== "false" && (
              <Link href="/wishlist" onClick={() => setOpen(false)} aria-label="Mes favoris" className="header-action-button !text-white hover:!bg-white/10 hover:!text-white focus-visible:!outline-[#3ecf4c]">
                <span className="relative inline-flex h-6 w-6 items-center justify-center">
                  <HeartIcon />
                  {wishlistCount > 0 && (
                    <span className="header-action-badge !border-[#0b120d]">
                      {wishlistCount > 99 ? "99+" : wishlistCount}
                    </span>
                  )}
                </span>
              </Link>
            )}
            <Link href="/panier" onClick={() => setOpen(false)} aria-label="Panier" className="header-action-button !text-white hover:!bg-white/10 hover:!text-white focus-visible:!outline-[#3ecf4c]">
              <span className="relative inline-flex h-6 w-6 items-center justify-center">
                <BagIcon />
                {count > 0 && (
                  <span className="header-action-badge !border-[#0b120d]">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </span>
            </Link>
          </div>
        </div>

        {/* ── Scrollable body wrapper (fade mask at bottom) ── */}
        <div className="flex-1 relative min-h-0">
          {/* Bottom fade-out hint */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-12 bg-gradient-to-t from-[#fafbf9] to-transparent" />

        {/* Scrollable body */}
        <div className="drawer-scroll h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" key={open ? "open" : "closed"}
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorY: "contain",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          } as React.CSSProperties}>

          {/* Account quick-access */}
          <Link href={isLoggedIn ? "/compte" : "/connexion"} onClick={() => setOpen(false)}
            className="hidden"
            style={{ animationDelay: "60ms" }}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-emerald-200 bg-white text-emerald-600 shadow-[0_6px_16px_rgba(16,185,129,0.10)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="mb-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-emerald-700">Votre espace</p>
              <p className="text-[14px] font-black leading-tight text-neutral-950">{isLoggedIn ? "Mon compte" : "Se connecter"}</p>
              <p className="mt-0.5 text-[10px] font-medium text-neutral-500">{isLoggedIn ? "Commandes, adresses et profil" : "Créez votre compte gratuitement"}</p>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_5px_13px_rgba(5,150,105,.24)] transition-transform group-active:translate-x-0.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </span>
          </Link>

          {/* ── Nav rows ── */}
          <div className={`mx-4 mt-5 ${open ? "drawer-item" : ""}`} style={{ animationDelay: "110ms" }}>
            <div className="hidden">
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-neutral-400">Explorer les catégories</p>
              <Link href="/boutique" onClick={() => setOpen(false)} className="group/all inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-700 transition-colors hover:text-emerald-800">
                Tout voir
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="transition-transform group-hover/all:translate-x-0.5"><path d="M5 12h14M14 7l5 5-5 5"/></svg>
              </Link>
            </div>
            <div>
            {([
              { slug: "homme",       label: "Homme",       sub: "Vestes, Pulls & Sport",     img: "/images/menu%20category/homme.png" },
              { slug: "femme",       label: "Femme",        sub: "Mode, Robes & Lifestyle",  img: "/images/menu%20category/femme.png" },
              { slug: "chaussures",  label: "Chaussures",   sub: "Running, Sneakers & Style", img: "/images/menu%20category/chaussures.png" },
              { slug: "accessoires", label: "Accessoires",  sub: "Tech, Audio & Sacs",        img: "/images/menu%20category/accessoires.png" },
              { slug: "nouveautes",  label: "Nouveautés",   sub: "",                          img: "" },
              { slug: "promotions",  label: "Promotions",   sub: "",                          img: "" },
            ] as { slug:string; label:string; sub:string; img:string }[]).map((c, i) => (
              <Link key={c.slug} href={`/${c.slug}`} onClick={() => setOpen(false)}
                className={`group flex min-h-[60px] items-center justify-between border-b border-neutral-200 px-1 transition-colors active:bg-neutral-50 ${open ? "drawer-item" : ""}`}
                style={{ animationDelay: `${140 + i * 55}ms` }}>
                {/* Category photo */}
                <div className="hidden">
                  {c.img && <img src={c.img} alt={c.label}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[18px] font-black uppercase leading-none tracking-[-0.02em] text-neutral-950">{c.label}</p>
                  <p className="hidden">{c.sub}</p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-neutral-950 transition-transform group-active:translate-x-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </span>
              </Link>
            ))}
            </div>
          </div>

          {/* ── Promotions + Nouveautés photo banners ── */}
          <div className="hidden">
            {/* Nouveautés */}
            <Link href="/nouveautes" onClick={() => setOpen(false)}
              className="group relative h-[124px] overflow-hidden rounded-[20px] border border-white/70 shadow-[0_10px_24px_rgba(0,0,0,.10)] transition active:scale-[.98]">
              <img src="/images/menu%20category/nouveautes.png"
                alt="Nouveautés" className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-active:scale-105" />
              {/* gradient overlay */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-[13px] font-black text-white leading-tight">Nouveautés</p>
                <p className="text-[10px] text-white/70 leading-tight mt-0.5">Voir tout →</p>
              </div>
            </Link>

            {/* Promotions */}
            <Link href="/promotions" onClick={() => setOpen(false)}
              className="group relative h-[124px] overflow-hidden rounded-[20px] border border-white/70 shadow-[0_10px_24px_rgba(0,0,0,.10)] transition active:scale-[.98]">
              <img src="/images/menu%20category/promotions.png"
                alt="Promotions" className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-active:scale-105" />
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
          <div className={`mb-8 mt-7 px-5 ${open ? "drawer-item" : ""}`} style={{ animationDelay: "440ms" }}>
            <p className="hidden">Aide & Services</p>
            <div>
              {visibleUtilLinks.map((u) => (
                <Link key={u.label} href={u.href} onClick={() => setOpen(false)}
                  className="flex min-h-[52px] items-center border-b border-neutral-200 text-[15px] font-medium text-neutral-800 transition-colors active:bg-neutral-50">
                  <span className="hidden">{u.icon}</span>
                  <span>{u.label}</span>
                </Link>
              ))}
            </div>
            <div className="mt-7 space-y-2.5">
              <Link
                href={isLoggedIn ? "/compte" : "/connexion"}
                onClick={() => setOpen(false)}
                className="flex min-h-[54px] items-center justify-center border border-neutral-950 bg-neutral-950 px-5 text-[13px] font-black uppercase tracking-[.08em] text-white"
              >
                {isLoggedIn ? "Mon compte" : "Se connecter"}
              </Link>
              {!isLoggedIn && (
                <Link
                  href="/inscription"
                  onClick={() => setOpen(false)}
                  className="flex min-h-[54px] items-center justify-center border border-neutral-950 bg-white px-5 text-[13px] font-black uppercase tracking-[.08em] text-neutral-950"
                >
                  S&apos;inscrire
                </Link>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* ── Footer ── */}
        <div className="hidden">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-300">L&apos;ecomax &copy; 2026</p>
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
      className="header-action-button"
    >
      {children}
    </Link>
  );
}

/* ── SVG icons ── */
function SearchIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10.75" cy="10.75" r="6.75" />
      <path d="m19.5 19.5-4-4" />
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
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.75" />
      <path d="M4.75 20.5a7.25 7.25 0 0 1 14.5 0" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 5.1a5.25 5.25 0 0 0-7.43 0L12 6.17 10.93 5.1A5.25 5.25 0 0 0 3.5 12.53L12 21l8.5-8.47a5.25 5.25 0 0 0 0-7.43Z" />
    </svg>
  );
}
function BagIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h2.25l1.7 10.1a2 2 0 0 0 1.97 1.67h8.95a2 2 0 0 0 1.95-1.55L21.25 7H6" />
      <circle cx="9.25" cy="19.5" r="1.15" />
      <circle cx="18.25" cy="19.5" r="1.15" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
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
function EcomediaIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
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


