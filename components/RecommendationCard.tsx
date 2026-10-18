"use client";
import ProductBrandMark from "./ProductBrandMark";

import Image from "next/image";
import Link from "next/link";
import { formatMAD, type CardProduct } from "@/lib/products";
import { useWishlist } from "./WishlistContext";

export default function RecommendationCard({ product }: { product: CardProduct }) {
  const { slugs, pending, toggle } = useWishlist();
  const wished = slugs.has(product.slug);
  const soldOut = product.stock !== undefined && product.stock <= 0 && !product.preorder_enabled;
  const onSale = Boolean(product.oldPrice && product.oldPrice > product.price);

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative overflow-hidden rounded-[4px] bg-[#f4f3ef]">
        <Link href={`/produit/${product.slug}`} aria-label={`Découvrir ${product.name}`} className="relative block aspect-square focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#234735]">
          <Image src={product.image || "/images/no-image.svg"} alt={product.name} fill
            sizes="(min-width: 1280px) 280px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-contain p-3 mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none sm:p-4" />
        </Link>
        {(soldOut || product.badge) && <span className="pointer-events-none absolute left-3 top-4 max-w-[calc(100%_-_76px)] bg-white/90 px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-neutral-700">{soldOut ? "Épuisé" : product.badge}</span>}
        <button type="button" aria-label={wished ? "Retirer des favoris" : "Ajouter aux favoris"} aria-pressed={wished}
          disabled={pending.has(product.slug)} onClick={() => void toggle(product.slug)}
          className={`absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234735] disabled:opacity-40 ${wished ? "bg-white text-[#234735]" : "text-neutral-600 hover:bg-white/80 hover:text-neutral-900"}`}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill={wished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>
        </button>
      </div>
      <div className="flex flex-1 flex-col pt-2.5">
        {product.brand && <div className="mb-2"><ProductBrandMark name={product.brand} compact /></div>}
        <p className="mb-1 text-[8px] font-medium uppercase tracking-[0.12em] text-neutral-500">{product.category}</p>
        <h3 title={product.name} className="line-clamp-2 text-[12px] font-medium leading-[1.5] tracking-[-0.015em] text-[#242824] sm:text-[13px]">
          <Link href={`/produit/${product.slug}`} className="rounded-sm hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234735]">{product.name}</Link>
        </h3>
        <div className="mt-2 flex flex-wrap items-baseline gap-2.5">
          <span className="text-[14px] font-semibold tabular-nums tracking-[-0.015em] text-[#242824]">{formatMAD(product.price)}</span>
          {onSale && <del className="text-xs text-neutral-400">{formatMAD(product.oldPrice!)}</del>}
        </div>
        {product.colors.length > 0 && <p className="mt-1.5 text-[11px] leading-5 text-neutral-500">{product.colors.length} coloris</p>}
        <div className="mt-auto pt-2">
          <Link href={`/produit/${product.slug}`} className="flex min-h-11 items-center justify-between gap-3 border-t border-neutral-200 text-[11px] font-medium text-[#35483b] transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234735]">
            Découvrir le modèle
            <svg aria-hidden="true" className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
