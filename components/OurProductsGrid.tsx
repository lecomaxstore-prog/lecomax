"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CardProduct } from "@/lib/products";

const COLOR_MAP: Record<string, string> = {
  "Noir": "#0a0a0a", "Blanc": "#f5f5f5", "Gris": "#9ca3af",
  "Bleu": "#3b82f6", "Rouge": "#dc2626", "Vert": "#22c55e",
  "Jaune": "#facc15", "Rose": "#f9a8d4", "Beige": "#f5f0e8",
  "Caramel": "#d4a574", "Marine": "#1e3a5f", "Kaki": "#8b7355",
  "Édition Standard": "#1a1a2e",
};
const getHex = (name: string) => COLOR_MAP[name.split("/")[0].trim()] ?? "#e5e7eb";

const TABS = [
  { key: "tous",        label: "Tous",        icon: "M4 6h16M4 12h16M4 18h16" },
  { key: "accessoires", label: "Accessoires", icon: "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" },
  { key: "chaussures",  label: "Chaussures",  icon: "M3 7c3-2 6-2 9 0s6 2 9 0v11c-3 2-6 2-9 0s-6-2-9 0V7z" },
  { key: "homme",       label: "Homme",       icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { key: "femme",       label: "Femme",       icon: "M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 10c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" },
];

const MOBILE_INITIAL_PRODUCT_COUNT = 8;
const DESKTOP_INITIAL_PRODUCT_COUNT = 16;
const PRODUCT_LOAD_STEP = 8;

function useInView(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function ProductCard({ product, index, visibilityClass = "" }: { product: CardProduct; index: number; visibilityClass?: string }) {
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const discount = hasDiscount
    ? Math.round(((product.oldPrice! - product.price) / product.oldPrice!) * 100)
    : null;

  return (
    <div
      className={`h-full ${visibilityClass}`}
      style={{
        animation: `cardFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both`,
        animationDelay: `${index * 55}ms`,
      }}
    >
      <Link
        href={`/produit/${product.slug}`}
        className="group flex flex-col bg-white border border-neutral-100 hover:border-[#3ecf4c]/40 hover:shadow-[0_8px_32px_rgba(62,207,76,0.10)] transition-all duration-300 overflow-hidden h-full"
      >
        {/* Image */}
        <div className="relative aspect-[4/5] bg-neutral-50 overflow-hidden">
          {product.image && (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
            />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
          {/* Top-left green accent line on hover */}
          <div className="absolute top-0 left-0 w-0 group-hover:w-full h-[2px] bg-[#3ecf4c] transition-all duration-500 ease-out" />
          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
            {product.badge && (
              <span className="text-[10px] font-black uppercase px-2.5 py-[5px] tracking-[0.12em] leading-none bg-black text-white">
                {product.badge}
              </span>
            )}
            {discount && (
              <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-[5px] tracking-[0.12em] leading-none">
                -{discount}%
              </span>
            )}
          </div>
          {/* CTA bar */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-[#3ecf4c] text-black text-[10px] font-black uppercase tracking-[0.2em] py-3 text-center flex items-center justify-center gap-2">
            Voir le produit
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Info */}
        <div className="px-3 pt-3 pb-4 flex flex-col flex-1">
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-[5px] mb-2">
              {product.colors.slice(0, 4).map((c) => (
                <span
                  key={c}
                  className="w-[9px] h-[9px] rounded-full ring-1 ring-black/10 ring-offset-1 shrink-0"
                  style={{ backgroundColor: getHex(c) }}
                  title={c}
                />
              ))}
            </div>
          )}
          <h3 className="font-bold text-[13px] leading-snug line-clamp-2 text-black group-hover:text-neutral-600 transition-colors duration-200 flex-1">
            {product.name}
          </h3>
          <p className="text-neutral-400 text-[10.5px] mt-0.5 uppercase tracking-wider font-semibold">
            {product.category}
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`font-black text-[14px] ${hasDiscount ? "text-red-600" : "text-black"}`}>
              {product.price}&nbsp;MAD
            </span>
            {hasDiscount && (
              <span className="text-neutral-400 line-through text-[12px]">
                {product.oldPrice}&nbsp;MAD
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function OurProductsGrid({ products }: { products: CardProduct[] }) {
  const [active, setActive] = useState("tous");
  const [mobileDisplayed, setMobileDisplayed] = useState(MOBILE_INITIAL_PRODUCT_COUNT);
  const [desktopDisplayed, setDesktopDisplayed] = useState(DESKTOP_INITIAL_PRODUCT_COUNT);
  const { ref, visible } = useInView();

  const filtered = active === "tous"
    ? products
    : products.filter((p) => p.category === active);

  const visibleProducts = filtered.slice(0, Math.max(mobileDisplayed, desktopDisplayed));
  const mobileHasMore = filtered.length > mobileDisplayed;
  const desktopHasMore = filtered.length > desktopDisplayed;

  const handleTab = (key: string) => {
    setActive(key);
    setMobileDisplayed(MOBILE_INITIAL_PRODUCT_COUNT);
    setDesktopDisplayed(DESKTOP_INITIAL_PRODUCT_COUNT);
  };

  const loadMore = (mode: "mobile" | "desktop") => {
    if (mode === "mobile") {
      setMobileDisplayed((count) => Math.min(count + PRODUCT_LOAD_STEP, filtered.length));
      return;
    }
    setDesktopDisplayed((count) => Math.min(count + PRODUCT_LOAD_STEP, filtered.length));
  };

  const loadMoreControl = (mode: "mobile" | "desktop") => {
    const count = mode === "mobile" ? mobileDisplayed : desktopDisplayed;
    const shown = Math.min(count, filtered.length);
    const hasMore = mode === "mobile" ? mobileHasMore : desktopHasMore;
    const nextBatch = Math.min(PRODUCT_LOAD_STEP, filtered.length - shown);
    if (!hasMore) return null;

    return (
      <div className={`${mode === "mobile" ? "flex sm:hidden" : "hidden sm:flex"} mt-10 flex-col items-center sm:mt-12`}>
        <div className="w-full max-w-[280px]">
          <div className="mb-[10px] flex items-center justify-between gap-4 px-1">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#6b6b6b]">
              {shown} affichés
            </p>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#d1d1d1]">
              {filtered.length} au total
            </p>
          </div>
          <div className="h-[3px] w-full overflow-hidden bg-[#e8e8e8]">
            <div
              className="h-full bg-[#34d058] transition-[width] duration-500"
              style={{ width: `${(shown / filtered.length) * 100}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadMore(mode)}
          aria-label={`Afficher ${nextBatch} produit${nextBatch > 1 ? "s" : ""} supplémentaire${nextBatch > 1 ? "s" : ""}`}
          className="group mt-5 inline-flex h-[68px] w-full max-w-[280px] items-center justify-between rounded-[13px] border border-[#e1e1e1] bg-white px-5 text-left text-black shadow-[0_8px_24px_rgba(0,0,0,0.055)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-[#bdecc5] hover:shadow-[0_11px_27px_rgba(0,0,0,0.075)] active:translate-y-0"
        >
          <span className="flex min-w-0 flex-col">
            <span className="text-[11px] font-black uppercase tracking-[0.17em] text-[#151515]">
              Voir plus
            </span>
            <span className="mt-[6px] text-[9px] font-medium tracking-[0.02em] text-[#a6a6a6]">
              +{nextBatch} produit{nextBatch > 1 ? "s" : ""}
            </span>
          </span>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#bcefc4] bg-[#effdf2] text-[#179333] shadow-[0_4px_13px_rgba(46,180,70,0.12)] transition-colors duration-200 group-hover:bg-[#e4fae8]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v13M7.5 13.5 12 18l4.5-4.5" />
            </svg>
          </span>
        </button>
      </div>
    );
  };

  return (
    <section id="nos-produits" className="py-16 bg-neutral-50/60 border-y border-neutral-100" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* â”€â”€ Header â”€â”€ */}
        <div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#3ecf4c] font-black mb-2">
              Catalogue complet
            </p>
            <h2 className="h-display text-3xl md:text-[2.8rem] leading-tight">
              Nos Produits
            </h2>
            <p className="text-neutral-400 text-[13px] mt-1.5">
              {products.length} article{products.length > 1 ? "s" : ""} disponibles
            </p>
          </div>
          <Link
            href="/boutique"
            className="self-start sm:self-auto group inline-flex items-center gap-2.5 border border-neutral-200 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] hover:border-black hover:bg-black hover:text-white transition-all duration-300"
          >
            Voir la boutique
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* â”€â”€ Grid â”€â”€ */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.4s ease 0.2s",
          }}
        >
          {visibleProducts.map((p, i) => (
            <ProductCard
              key={`${active}-${p.slug}`}
              product={p}
              index={i}
              visibilityClass={
                i >= mobileDisplayed
                  ? "hidden sm:block"
                  : i >= desktopDisplayed
                    ? "sm:hidden"
                    : ""
              }
            />
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-14 h-14 mx-auto mb-4 border-2 border-neutral-200 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4d4d4" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <p className="text-neutral-400 text-[13px] font-semibold">Aucun produit dans cette catÃ©gorie.</p>
          </div>
        )}

        {/* â”€â”€ Responsive load more controls â”€â”€ */}
        {loadMoreControl("mobile")}
        {loadMoreControl("desktop")}
      </div>

      <style jsx>{`
        @keyframes cardFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

