"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CardProduct } from "@/lib/products";
import ProductCard from "./ProductCard";
import SearchOverlay from "./SearchOverlay";
import { useCart } from "./CartContext";
import { useWishlist } from "./WishlistContext";

type Props = {
  products: CardProduct[];
  heroImage?: string;
};

const categories = [
  { label: "Chaussures", href: "/chaussures", icon: "shoe" },
  { label: "Vêtements", href: "/femme", icon: "shirt" },
  { label: "Électronique", href: "/accessoires", icon: "audio" },
  { label: "Accessoires", href: "/accessoires", icon: "bag" },
] as const;

function SearchIcon() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
}

function CategoryIcon({ name }: { name: (typeof categories)[number]["icon"] }) {
  if (name === "shirt") return <svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round"><path d="m8 3-5 3 2 5 3-1v11h8V10l3 1 2-5-5-3a4.6 4.6 0 0 1-8 0Z"/></svg>;
  if (name === "audio") return <svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v6H5a1 1 0 0 1-1-1v-5ZM20 14h-3v6h2a1 1 0 0 0 1-1v-5Z"/></svg>;
  if (name === "bag") return <svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round"><path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>;
  return <svg aria-hidden="true" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"><path d="M3 15c4 0 7-2 8-7l3 2c1.5 2.5 3.5 4 7 5v4H4a2 2 0 0 1-1-4Z"/><path d="M11 12h5"/></svg>;
}

function NavIcon({ id }: { id: string }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (id === "search") return <SearchIcon />;
  if (id === "favorites") return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>;
  if (id === "cart") return <svg {...common}><path d="M3 4h2l2 11h11l2-8H6"/><circle cx="9" cy="19" r="1"/><circle cx="18" cy="19" r="1"/></svg>;
  if (id === "profile") return <svg {...common}><circle cx="12" cy="8" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/></svg>;
  return <svg {...common}><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-7h6v7"/></svg>;
}

export default function MobileHome({ products, heroImage }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const arrivals = products.slice(0, 6);
  const heroSrc = heroImage || "/images/hero secrtion/hero section mobile version.png";
  const tabs = [
    { id: "home", label: "Accueil", href: "/" },
    { id: "search", label: "Recherche" },
    { id: "favorites", label: "Favoris", href: "/wishlist", badge: wishlistCount },
    { id: "cart", label: "Panier", href: "/panier", badge: cartCount },
    { id: "profile", label: "Profil", href: "/compte" },
  ];

  return (
    <div className="bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto max-w-xl px-4 pt-4">
        <div className="flex gap-2">
          <button type="button" onClick={() => setSearchOpen(true)} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#E6E8E5] bg-[#F6F7F5] px-4 text-left text-sm text-[#5E625F] transition active:scale-[.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#32CD57]" aria-label="Ouvrir la recherche">
            <span className="shrink-0"><SearchIcon /></span><span className="truncate">Que recherchez-vous ?</span>
          </button>
          <button type="button" onClick={() => setFiltersOpen(true)} className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#E6E8E5] bg-white transition active:bg-[#F6F7F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#32CD57]" aria-label="Ouvrir les filtres">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M7 12h10M10 17h4"/><circle cx="8" cy="7" r="1.5" fill="white"/><circle cx="15" cy="12" r="1.5" fill="white"/></svg>
          </button>
        </div>

        <section className="relative mt-4 min-h-[420px] overflow-hidden rounded-[18px] bg-neutral-950">
          <Image src={heroSrc} alt="Nouvelle collection L'ecomax" fill priority sizes="100vw" className="object-cover object-center" unoptimized={heroSrc.startsWith("http")} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <p className="text-[10px] font-black tracking-[.25em] text-[#32CD57]">NOUVELLE COLLECTION</p>
            <h1 className="mt-2 max-w-[315px] text-[2.35rem] font-black leading-[.92] tracking-[-.035em]">BOUGEZ PLUS.<br/>VIVEZ MIEUX.</h1>
            <p className="mt-3 max-w-[300px] text-[13px] leading-5 text-white/75">Performance, style et innovation pour chaque journée.</p>
            <Link href="/nouveautes" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-[10px] bg-[#32CD57] px-6 text-[11px] font-black tracking-[.15em] text-[#111] transition active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black">DÉCOUVRIR</Link>
          </div>
        </section>

        <section aria-label="Catégories" className="mt-5 grid grid-cols-4 gap-2">
          {categories.map((category) => (
            <Link key={category.label} href={category.href} className="flex min-h-[88px] min-w-0 flex-col items-center justify-center gap-2 rounded-[14px] border border-[#E6E8E5] bg-[#F6F7F5] px-1 text-center text-[#111] transition active:scale-[.97] active:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#32CD57]">
              <CategoryIcon name={category.icon} />
              <span className="w-full truncate text-[10px] font-bold">{category.label}</span>
            </Link>
          ))}
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black tracking-[.02em] text-[#111]">NOUVEAUTÉS</h2>
            <Link href="/nouveautes" className="flex min-h-11 items-center text-xs font-bold text-[#11843A]">Voir tout →</Link>
          </div>
          {arrivals.length ? (
            <div className="grid grid-cols-2 gap-3">{arrivals.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
          ) : (
            <div className="rounded-2xl border border-[#E6E8E5] bg-[#F6F7F5] p-6 text-center text-sm text-[#5E625F]">Aucune nouveauté disponible pour le moment.</div>
          )}
        </section>

        <section aria-label="Nos engagements" className="mt-7 grid grid-cols-2 divide-x divide-[#E6E8E5] rounded-[14px] border border-[#E6E8E5] bg-white py-4">
          <div className="flex items-center justify-center gap-2 px-2 text-[11px] font-semibold"><span className="text-[#11843A]"><svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 6h13v11H2zM15 10h4l3 3v4h-7z"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg></span>Livraison rapide</div>
          <div className="flex items-center justify-center gap-2 px-2 text-[11px] font-semibold"><span className="text-[#11843A]"><svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span>Paiement sécurisé</div>
        </section>
      </div>

      <nav aria-label="Navigation mobile" className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E6E8E5] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-xl">
          {tabs.map((tab) => {
            const content = <><span className="relative"><NavIcon id={tab.id}/>{!!tab.badge && <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#E53935] px-1 text-[8px] font-black text-white">{tab.badge > 99 ? "99+" : tab.badge}</span>}</span><span className="text-[9px] font-bold">{tab.label}</span></>;
            const className = `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 ${tab.id === "home" ? "text-[#11843A]" : "text-[#737773]"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#32CD57]`;
            return tab.href ? <Link key={tab.id} href={tab.href} className={className}>{content}</Link> : <button key={tab.id} type="button" onClick={() => setSearchOpen(true)} className={className}>{content}</button>;
          })}
        </div>
      </nav>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      {filtersOpen && (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/35" role="dialog" aria-modal="true" aria-label="Filtres de recherche" onClick={() => setFiltersOpen(false)}>
          <div className="w-full rounded-t-[22px] bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-neutral-300"/>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">Explorer par catégorie</h2><button type="button" onClick={() => setFiltersOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F6F7F5]" aria-label="Fermer les filtres">×</button></div>
            <div className="grid grid-cols-2 gap-2">{categories.map((category) => <Link key={category.label} href={category.href} className="flex min-h-12 items-center justify-between rounded-xl border border-[#E6E8E5] px-4 text-sm font-bold">{category.label}<span aria-hidden="true">→</span></Link>)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
