"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { formatMAD, type CardProduct } from "@/lib/products";
import { useWishlist } from "./WishlistContext";

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


export default function ProductCard({ product }: { product: CardProduct }) {
  const [mounted, setMounted] = useState(false);
  const { slugs: wishlistSlugs, pending: wishlistPending, toggle: toggleWishlist } = useWishlist();
  const wished = wishlistSlugs.has(product.slug);
  const wishPending = wishlistPending.has(product.slug);
  const rating = product.rating ?? 0;
  const count = product.reviewCount ?? 0;
  const displayImage = product.image || "/images/no-image.svg";
  const outOfStock = product.stock !== undefined && product.stock <= 0 && !product.preorder_enabled;

  useEffect(() => setMounted(true), []);
  const onSale = product.oldPrice && product.oldPrice > product.price;
  const discount = onSale ? Math.round((1 - product.price / product.oldPrice!) * 100) : 0;

  return (
    <article
      className="group relative isolate flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-neutral-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] focus-within:ring-2 focus-within:ring-emerald-600 focus-within:ring-offset-2 motion-reduce:transition-none"
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden border-b border-[#f0f1ec] bg-white">
        <Image
          src={displayImage}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className={`object-contain px-2.5 pb-3 pt-9 transition-transform duration-500 motion-reduce:transition-none sm:px-4 sm:pb-4 sm:pt-10 ${outOfStock ? "opacity-60 grayscale-[25%]" : "group-hover:scale-[1.03] motion-reduce:transform-none"}`}
        />

        {/* Top-left badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {outOfStock && (
            <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-white shadow-sm">
              Épuisé
            </span>
          )}
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
          type="button"
          disabled={wishPending}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); void toggleWishlist(product.slug); }}
          aria-label={wished ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={wished}
          className="absolute right-1.5 top-1.5 z-20 flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-60"
        >
          <span className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-200 ${wished ? "border-[#183c30] bg-[#183c30] text-white" : "border-[#e8ece5] bg-[#f7f8f4]/95 text-[#536457] hover:border-[#bac8ba] hover:bg-[#edf1e8] hover:text-[#183c30]"}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={wished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          </span>
        </button>

      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {/* Colors */}
        {product.colors.length > 0 && (
          <div className="mb-2.5 flex min-h-5 items-center gap-2">
            {product.colors.slice(0, 5).map((c, i) => (
              <span
                key={i}
                aria-label={c}
                title={c}
                className="group/swatch relative h-4 w-4 shrink-0 cursor-default rounded-full border-2 border-white shadow-[0_1px_3px_rgba(0,0,0,.14)] ring-1 ring-neutral-300 transition-transform duration-150 hover:z-10 hover:scale-110 hover:ring-neutral-500"
                style={{ backgroundColor: getColor(c) }}
              >
                {/* Tooltip */}
                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-900 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md opacity-0 group-hover/swatch:opacity-100 transition-opacity duration-150 shadow-lg">
                  {c}
                </span>
              </span>
            ))}
            {product.colors.length > 5 && (
              <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 px-1 text-[8px] font-bold text-neutral-500">
                +{product.colors.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h3 title={product.name} className="min-h-[3.9em] line-clamp-3 text-[13px] font-semibold leading-[1.3] tracking-[-0.01em] text-neutral-800 sm:text-sm">
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
        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
            <span className={`text-lg font-extrabold leading-none tracking-[-0.03em] sm:text-xl ${onSale ? "text-red-600" : "text-neutral-950"}`}>
              {formatMAD(product.price)}
            </span>
            {onSale && (
              <span className="text-neutral-400 line-through text-[12px] leading-none font-medium">
                {formatMAD(product.oldPrice!)}
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/produit/${product.slug}`}
          aria-label={`Voir le produit : ${product.name}`}
          className={`mt-4 flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 text-[11px] font-semibold transition-colors after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none sm:text-xs ${outOfStock ? "bg-neutral-100 text-neutral-600" : "bg-emerald-50 text-emerald-900 group-hover:bg-emerald-100"}`}
        >
          <span>{outOfStock ? "Voir les détails" : "Voir le produit"}</span>
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${outOfStock ? "bg-neutral-200 text-neutral-600" : "bg-emerald-600 text-white"}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </span>
        </Link>
      </div>
    </article>
  );
}
