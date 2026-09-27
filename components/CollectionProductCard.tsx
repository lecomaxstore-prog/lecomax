"use client";

import Link from "next/link";
import ProductImage from "./ProductImage";
import CardColorOptions from "./CardColorOptions";
import type { CardProduct } from "@/lib/products";
import { recordProductSignal } from "@/lib/personalization";

export default function CollectionProductCard({ product, index = 0, visibilityClass = "" }: { product: CardProduct; index?: number; visibilityClass?: string }) {
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const outOfStock = product.stock !== undefined && product.stock <= 0;
  const discount = hasDiscount
    ? Math.round(((product.oldPrice! - product.price) / product.oldPrice!) * 100)
    : null;

  return (
    <div data-source-file="components/CollectionProductCard.tsx"
      className={`h-full ${visibilityClass}`}
      style={{
        animation: `cardFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both`,
        animationDelay: `${index * 55}ms`,
      }}
    >
      <Link
        href={`/produit/${product.slug}`}
        onClick={() => recordProductSignal(product, 2)}
        className="product-card group flex flex-col bg-white border border-neutral-100 hover:border-[#3ecf4c]/40 hover:shadow-[0_8px_32px_rgba(62,207,76,0.10)] transition-all duration-300 overflow-hidden h-full"
      >
        {/* Image */}
        <div className="relative aspect-[4/5] bg-neutral-50 overflow-hidden">
            <ProductImage
              src={product.image}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className={`object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${outOfStock ? "opacity-60 grayscale-[25%]" : "group-hover:scale-[1.05]"}`}
            />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
          {/* Top-left green accent line on hover */}
          <div className="absolute top-0 left-0 w-0 group-hover:w-full h-[2px] bg-[#3ecf4c] transition-all duration-500 ease-out" />
          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
            {outOfStock && (
              <span className="bg-neutral-950 px-2.5 py-[5px] text-[10px] font-black uppercase tracking-[0.12em] leading-none text-white">
                Épuisé
              </span>
            )}
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
          {/* Refined CTA */}
          <div className="product-card-cta absolute inset-x-0 bottom-0 px-3 pb-3 pt-12 pointer-events-none">
            <div className={`flex min-h-11 items-center justify-between rounded-xl border px-3.5 pl-4 shadow-[0_8px_24px_rgba(0,0,0,.16)] backdrop-blur-md ${outOfStock ? "border-white/10 bg-neutral-950/95 text-white" : "border-transparent bg-[#f1f2f2] text-[#4f5553]"}`}>
              <span className="text-[10px] font-extrabold tracking-[0.08em]">
                {outOfStock ? "Produit épuisé" : "Voir le produit"}
              </span>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${outOfStock ? "bg-white/10 text-white" : "bg-[#079b70] text-white"}`}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="px-3 pt-3 pb-4 flex flex-col flex-1">
          <CardColorOptions colors={product.colors ?? []} />
          <h3 className="min-h-[36px] line-clamp-2 text-[13px] font-semibold leading-[1.4] tracking-[-0.01em] text-neutral-800 transition-colors duration-200 group-hover:text-neutral-600">
            {product.name}
          </h3>
          <p className="text-neutral-400 text-[10.5px] mt-0.5 uppercase tracking-wider font-semibold">
            {product.category}
          </p>
          <div className="mt-2.5 flex items-baseline gap-2 border-t border-neutral-100 pt-3">
            <span className={`text-[14px] font-extrabold tracking-[-0.02em] ${hasDiscount ? "text-red-600" : "text-neutral-950"}`}>
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
