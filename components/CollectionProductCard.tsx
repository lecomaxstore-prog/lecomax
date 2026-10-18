"use client";
import ProductBrandMark from "./ProductBrandMark";

import Link from "next/link";
import styles from "./CollectionProductCard.module.css";
import ProductImage from "./ProductImage";
import CardColorOptions from "./CardColorOptions";
import type { CardProduct } from "@/lib/products";
import { recordProductSignal } from "@/lib/personalization";

export default function CollectionProductCard({ product, visibilityClass = "" }: { product: CardProduct; index?: number; visibilityClass?: string }) {
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const outOfStock = product.stock !== undefined && product.stock <= 0;
  const discount = hasDiscount
    ? Math.round(((product.oldPrice! - product.price) / product.oldPrice!) * 100)
    : null;

  return (
    <div data-source-file="components/CollectionProductCard.tsx"
      className={`h-full ${visibilityClass}`}
    >
      <Link
        href={`/produit/${product.slug}`}
        onClick={() => recordProductSignal(product, 2)}
        className={`${styles.card} product-card group flex flex-col bg-white border border-neutral-100 hover:border-[#3ecf4c]/40 hover:shadow-[0_8px_32px_rgba(62,207,76,0.10)] transition-all duration-300 overflow-hidden h-full`}
      >
        {/* Image */}
        <div className={`${styles.media} relative aspect-[4/5] bg-neutral-50 overflow-hidden`}>
            <ProductImage
              src={product.image}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className={`${styles.image} object-contain transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${outOfStock ? "opacity-60 grayscale-[25%]" : "group-hover:scale-[1.05]"}`}
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

        </div>

        {/* Info */}
        <div className={`${styles.info} px-3 pt-3 pb-4 flex flex-col flex-1`}>
        {product.brand && <div className="mb-2"><ProductBrandMark name={product.brand} compact /></div>}
          <h3 className={`${styles.title} min-h-[36px] line-clamp-2 text-[13px] font-semibold leading-[1.4] tracking-[-0.01em] text-neutral-800 transition-colors duration-200 group-hover:text-neutral-600`}>
            {product.name}
          </h3>
          <p className="text-neutral-400 text-[10.5px] mt-0.5 uppercase tracking-wider font-semibold">
            {product.category}
          </p>
          <div className={`${styles.prices} mt-2.5 flex flex-wrap items-baseline gap-2 border-t border-neutral-100 pt-3`}>
            <span className={`text-[14px] font-extrabold tracking-[-0.02em] ${hasDiscount ? "text-red-600" : "text-neutral-950"}`}>
              {product.price}&nbsp;MAD
            </span>
            {hasDiscount && (
              <span className="text-neutral-400 line-through text-[12px]">
                {product.oldPrice}&nbsp;MAD
              </span>
            )}
          </div>
          <CardColorOptions colors={product.colors ?? []} />
          <span className={styles.action}>
            Voir le produit
            <span className={styles.actionIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </span>
          </span>
        </div>
      </Link>
    </div>
  );
}
