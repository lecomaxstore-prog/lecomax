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
  { key: "tous", label: "Tous" },
  { key: "accessoires", label: "Accessoires" },
  { key: "chaussures", label: "Chaussures" },
  { key: "homme", label: "Homme" },
  { key: "femme", label: "Femme" },
];

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

function ProductCard({ product, index }: { product: CardProduct; index: number }) {
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const discount = hasDiscount
    ? Math.round(((product.oldPrice! - product.price) / product.oldPrice!) * 100)
    : null;

  return (
    <div
      style={{
        opacity: 1,
        transform: "translateY(0)",
        animation: `cardFadeUp 0.5s ease both`,
        animationDelay: `${index * 60}ms`,
      }}
    >
      <Link
        href={`/produit/${product.slug}`}
        className="group block bg-white border border-neutral-100 hover:border-neutral-200 hover:shadow-[0_6px_28px_rgba(0,0,0,0.09)] transition-all duration-300 overflow-hidden"
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
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-colors duration-500" />
          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
            {product.badge && (
              <span className="text-[10px] font-black uppercase px-2.5 py-[5px] tracking-[0.12em] leading-none bg-black text-white">
                {product.badge}
              </span>
            )}
            {discount && (
              <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-[5px] tracking-[0.12em] leading-none">
                −{discount}%
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
        <div className="px-3 pt-3 pb-4">
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
          <h3 className="font-bold text-[13px] leading-snug line-clamp-2 text-black group-hover:text-neutral-600 transition-colors duration-200">
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
  const [displayed, setDisplayed] = useState(20);
  const { ref, visible } = useInView();

  const filtered = active === "tous"
    ? products
    : products.filter((p) => p.category === active);

  const visible_products = filtered.slice(0, displayed);
  const hasMore = filtered.length > displayed;

  // Reset displayed count on tab change
  const handleTab = (key: string) => {
    setActive(key);
    setDisplayed(20);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-16" ref={ref}>
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 border-b border-neutral-100 pb-8"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold mb-2">
            Catalogue complet
          </p>
          <h2 className="h-display text-3xl md:text-[2.6rem]">Nos Produits</h2>
        </div>
        <Link
          href="/boutique"
          className="self-start sm:self-auto inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-500 hover:text-black transition-colors"
        >
          Voir tout
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Filter tabs */}
      <div
        className="flex gap-1 mb-8 overflow-x-auto no-scrollbar"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s",
        }}
      >
        {TABS.map((tab) => {
          const count = tab.key === "tous"
            ? products.length
            : products.filter((p) => p.category === tab.key).length;
          if (count === 0 && tab.key !== "tous") return null;
          return (
            <button
              key={tab.key}
              onClick={() => handleTab(tab.key)}
              className={`flex-none px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-200 whitespace-nowrap ${
                active === tab.key
                  ? "bg-black text-white"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-black"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-[10px] ${active === tab.key ? "text-white/60" : "text-neutral-400"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.4s ease 0.2s",
        }}
      >
        {visible_products.map((p, i) => (
          <ProductCard key={p.slug} product={p} index={i} />
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-neutral-400 text-[13px]">
          Aucun produit dans cette catégorie pour le moment.
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setDisplayed((d) => d + 8)}
            className="inline-flex items-center gap-2.5 border border-neutral-200 px-8 py-3.5 text-[11px] font-black uppercase tracking-[0.18em] hover:border-black hover:bg-black hover:text-white transition-all duration-300"
          >
            Voir plus
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes cardFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
