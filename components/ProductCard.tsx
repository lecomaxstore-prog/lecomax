"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatMAD, type CardProduct } from "@/lib/products";

const COLOR_MAP: Record<string, string> = {
  "Noir": "#0a0a0a", "Blanc": "#f5f5f5", "Blanc casse": "#fafaf5",
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

// Deterministic rating derived from the slug so it stays stable per product.
function ratingFor(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const rating = 4.3 + (h % 7) / 10; // 4.3 – 4.9
  const count = 40 + (h % 380); // 40 – 419
  return { rating: Math.round(rating * 10) / 10, count };
}

export default function ProductCard({ product }: { product: CardProduct }) {
  const [wished, setWished] = useState(false);
  const { rating, count } = ratingFor(product.slug);
  const onSale = product.oldPrice && product.oldPrice > product.price;
  const discount = onSale
    ? Math.round((1 - product.price / product.oldPrice!) * 100)
    : 0;

  return (
    <Link
      href={`/produit/${product.slug}`}
      className="group block bg-white border border-neutral-100 hover:border-neutral-200 hover:shadow-[0_6px_28px_rgba(0,0,0,0.09)] transition-all duration-300 overflow-hidden"
    >
      {/* Image container */}
      <div className="relative aspect-[4/5] bg-neutral-50 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
        />

        {/* Subtle dark vignette on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-colors duration-500" />

        {/* Shimmer sweep on hover */}
        <div className="shimmer-on-hover" />

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
          {product.badge && (
            <span
              className={`text-[10px] font-black uppercase px-2.5 py-[5px] tracking-[0.12em] leading-none ${
                product.badge === "Promo"
                  ? "bg-red-600 text-white"
                  : product.badge === "Nouveau"
                  ? "bg-black text-white"
                  : product.badge === "Bestseller"
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-black shadow-sm"
              }`}
            >
              {product.badge}
            </span>
          )}
          {onSale && (
            <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-[5px] tracking-[0.12em] leading-none">
              −{discount}%
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={(e) => { e.preventDefault(); setWished((w) => !w); }}
          aria-label={wished ? "Retirer des favoris" : "Ajouter aux favoris"}
          className={`absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200
            opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0
            ${wished ? "bg-black text-white" : "bg-white/90 text-neutral-600 hover:bg-black hover:text-white"}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={wished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {/* Quick-view hover bar */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-[#3ecf4c] text-black text-[10px] font-black uppercase tracking-[0.2em] py-3 text-center flex items-center justify-center gap-2">
          Voir le produit
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>

      {/* Info */}
      <div className="px-3 pt-3 pb-4">
        {/* Color swatches */}
        {product.colors.length > 0 && (
          <div className="flex items-center gap-[5px] mb-2">
            {product.colors.slice(0, 5).map((c, i) => (
              <span
                key={i}
                className="w-[9px] h-[9px] rounded-full ring-1 ring-black/10 ring-offset-1 shrink-0"
                style={{ backgroundColor: getColor(c) }}
                title={c}
              />
            ))}
            {product.colors.length > 5 && (
              <span className="text-[10px] text-neutral-400 ml-0.5 font-medium">+{product.colors.length - 5}</span>
            )}
          </div>
        )}

        <h3 className="font-bold text-[13px] leading-snug line-clamp-2 text-black group-hover:text-neutral-600 transition-colors duration-200">
          {product.name}
        </h3>
        {product.subCategory && <p className="text-neutral-400 text-[10.5px] mt-0.5 uppercase tracking-wider font-semibold">{product.subCategory}</p>}

        {/* Rating */}
        <div className="flex items-center gap-1.5 mt-1.5" aria-label={`Note ${rating} sur 5`}>
          <div className="flex items-center gap-[1px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill={i < Math.round(rating) ? "#f59e0b" : "none"}
                stroke={i < Math.round(rating) ? "#f59e0b" : "#d4d4d4"}
                strokeWidth="1.5"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <span className="text-[10.5px] text-neutral-400 font-semibold">
            {rating.toFixed(1)} ({count})
          </span>
        </div>

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className={`font-black text-[14px] ${onSale ? "text-red-600" : "text-black"}`}>
            {formatMAD(product.price)}
          </span>
          {onSale && (
            <span className="text-neutral-400 line-through text-[12px]">
              {formatMAD(product.oldPrice!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
