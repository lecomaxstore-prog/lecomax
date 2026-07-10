"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { formatMAD, type CardProduct } from "@/lib/products";

const COLOR_MAP: Record<string, string> = {
  "Noir": "#0a0a0a", "Blanc": "#f5f5f5", "Blanc casse": "#fafaf5",
  "Edition Standard": "#1a1a2e",
  "Gris": "#9ca3af", "Gris chine": "#d1d5db", "Gris fonce": "#4b5563",
  "Gris anthracite": "#374151", "Bleu": "#3b82f6", "Bleu marine": "#1e3a5f",
  "Bleu nuit": "#1e2a4a", "Bleu ciel": "#7dd3fc", "Navy": "#1e3a5f",
  "Rouge": "#dc2626", "Bordeaux": "#7c1035", "Rose": "#f9a8d4",
  "Rose poudre": "#fcd5ce", "Corail": "#fb7185", "Vert": "#22c55e",
  "Vert militaire": "#4a5c3a", "Vert sauge": "#7c9a6f", "Kaki": "#8b7355",
  "Caramel": "#d4a574", "Beige": "#f5f0e8", "Champagne": "#f7e7ce",
  "Lilas": "#c4b5fd", "Mauve": "#a78bfa", "Violet": "#8b5cf6",
  "Marine": "#1e3a5f", "Jaune": "#facc15", "Jaune citron": "#fef08a",
  "Orange": "#f97316",
};
const getColor = (name: string) => COLOR_MAP[name.split("/")[0].trim()] ?? "#e5e7eb";

export function ratingFor(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const rating = 4.3 + (h % 7) / 10;
  const count = 2 + (h % 5);
  return { rating: Math.round(rating * 10) / 10, count };
}

export default function ProductCard({ product }: { product: CardProduct }) {
  const [wished, setWished] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rating = product.rating ?? 0;
  const count = product.reviewCount ?? 0;
  const displayImage = product.image || "/images/no-image.svg";

  useEffect(() => setMounted(true), []);
  const onSale = product.oldPrice && product.oldPrice > product.price;
  const discount = onSale ? Math.round((1 - product.price / product.oldPrice!) * 100) : 0;

  return (
    <Link
      href={`/produit/${product.slug}`}
      className="group flex flex-col bg-white rounded-xl border border-neutral-100 hover:border-neutral-200 hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)] transition-all duration-300 overflow-hidden h-full"
    >
      {/* Image */}
      <div className="relative aspect-[4/5] bg-neutral-50 overflow-hidden">
        <Image
          src={displayImage}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
        />
        <div className="shimmer-on-hover" />

        {/* Top-left badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {product.badge && (
            <span className={`text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full leading-none ${
              product.badge === "Nouveau" ? "bg-black text-white" :
              product.badge === "Bestseller" ? "bg-amber-400 text-black" :
              product.badge === "Promo" ? "bg-red-500 text-white" :
              "bg-white text-black shadow-sm"
            }`}>
              {product.badge}
            </span>
          )}
          {onSale && discount >= 5 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full leading-none">
              -{discount}%
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); setWished((w) => !w); }}
          aria-label={wished ? "Retirer des favoris" : "Ajouter aux favoris"}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-200
            ${wished
              ? "bg-black text-white opacity-100 scale-100"
              : "bg-white/95 text-neutral-400 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 hover:text-black"
            }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={wished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {/* CTA bar on hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out px-3 pb-3 pt-10 bg-gradient-to-t from-black/70 to-transparent">
          <div className="w-full bg-[#3ecf4c] text-black text-[10px] font-black uppercase tracking-[0.2em] py-2.5 rounded-lg text-center flex items-center justify-center gap-2">
            Voir le produit
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pt-3.5 pb-4 flex flex-col flex-1">
        {/* Colors */}
        {product.colors.length > 0 && (
          <div className="flex items-center gap-1 mb-2.5">
            {product.colors.slice(0, 5).map((c, i) => (
              <span
                key={i}
                className="group/swatch relative w-[14px] h-[14px] rounded-full ring-1 ring-black/10 shrink-0 cursor-default transition-transform duration-150 hover:scale-125 hover:ring-2 hover:ring-black/20 hover:z-10"
                style={{ backgroundColor: getColor(c) }}
              >
                {/* Tooltip */}
                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-900 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md opacity-0 group-hover/swatch:opacity-100 transition-opacity duration-150 shadow-lg">
                  {c}
                </span>
              </span>
            ))}
            {product.colors.length > 5 && (
              <span className="flex items-center justify-center w-[14px] h-[14px] rounded-full bg-neutral-100 text-[8px] font-black text-neutral-500 ring-1 ring-black/10 shrink-0">
                +{product.colors.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-[13.5px] leading-snug line-clamp-2 text-neutral-800 group-hover:text-neutral-600 transition-colors duration-200 flex-1">
          {product.name}
        </h3>

        {/* Rating — only show when there are real reviews, after hydration */}
        {mounted && count > 0 && (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex items-center gap-[1.5px]">
            {Array.from({ length: 5 }).map((_, i) => {
              const pct = Math.min(100, Math.max(0, (rating - i) * 100));
              return (
                <span key={i} className="relative inline-block" style={{ width: 12, height: 12 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e2e2e2" strokeWidth="1.5" className="absolute inset-0">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {pct > 0 && (
                    <span style={{ width: `${pct}%`, overflow: "hidden", position: "absolute", top: 0, left: 0, height: "100%", display: "inline-block" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </span>
                  )}
                </span>
              );
            })}
          </div>
          <span className="text-[10.5px] text-neutral-400 font-medium">
            {rating.toFixed(1)} ({count})
          </span>
        </div>
        )}

        {/* Price */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className={`font-black text-[16px] leading-none ${onSale ? "text-red-600" : "text-neutral-900"}`}>
              {formatMAD(product.price)}
            </span>
            {onSale && (
              <span className="text-neutral-400 line-through text-[12px] leading-none font-medium">
                {formatMAD(product.oldPrice!)}
              </span>
            )}
          </div>
          {onSale && discount >= 5 && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full leading-none">
              -{discount}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
