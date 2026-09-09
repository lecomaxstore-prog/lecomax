"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/components/WishlistContext";
import { customerApiFetch } from "@/lib/customer-api";
import { products, type CardProduct } from "@/lib/products";
import "./wishlist.css";

export default function WishlistPage() {
  const { slugs, count, ready, authenticated } = useWishlist();
  const [remoteProducts, setRemoteProducts] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      setRemoteProducts([]);
      setLoading(false);
      return;
    }
    customerApiFetch("/api/wishlist/")
      .then(async (response) => {
        if (!response.ok) throw new Error("Wishlist unavailable");
        const data = await response.json();
        setRemoteProducts(Array.isArray(data.products) ? data.products : []);
      })
      .catch(() => setRemoteProducts([]))
      .finally(() => setLoading(false));
  }, [authenticated, ready]);

  const wishedProducts = useMemo(() => {
    const bySlug = new Map<string, CardProduct>();
    for (const product of products) {
      if (slugs.has(product.slug)) bySlug.set(product.slug, product);
    }
    for (const product of remoteProducts) {
      if (slugs.has(product.slug)) bySlug.set(product.slug, product);
    }
    return [...slugs].map((slug) => bySlug.get(slug)).filter((product): product is CardProduct => !!product);
  }, [remoteProducts, slugs]);

  return (
    <main className="wishlist-page">
      <section className="wishlist-header">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
          <Link href="/compte" className="wishlist-back"><span aria-hidden="true">←</span> Mon compte</Link>
          <div className="wishlist-heading-row">
            <div>
              <h1 className="wishlist-title">Mes favoris {ready && <span>{count}</span>}</h1>
              <p className="mt-2 text-[13px] leading-6 text-[#71806f]">Vos coups de cœur, réunis au même endroit.</p>
            </div>
            <Link href="/boutique" className="wishlist-shop-link">La boutique <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      <section className="wishlist-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8" aria-label="Produits favoris">
        {!ready || loading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" role="status" aria-label="Chargement des favoris">
            {Array.from({ length: 2 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-2xl bg-[#e9ede2] motion-reduce:animate-none" />)}
          </div>
        ) : wishedProducts.length === 0 ? (
          <div className="wishlist-empty mx-auto flex max-w-lg flex-col items-center rounded-[24px] border border-[#e1e6da] bg-white px-6 py-12 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#2cc643]">
              <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.8a5.5 5.5 0 0 0 1-7.8Z"/></svg>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-[#183c30]">Le début de vos envies</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">Appuyez sur le cœur d&apos;un produit pour le conserver ici.</p>
            <Link href="/boutique" className="mt-6 inline-flex min-h-11 items-center gap-3 rounded-full bg-[#183c30] px-6 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#29523d]">
              Découvrir la boutique <span aria-hidden>→</span>
            </Link>
          </div>
        ) : (
          <div className={`wishlist-products${wishedProducts.length === 1 ? " wishlist-products-single" : ""}`}>
            {wishedProducts.map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
        )}

        {!authenticated && ready && count > 0 && (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#dde5d2] bg-[#edf2e5] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-[13px] font-semibold text-[#344f3a]">Vos favoris vous suivent partout</p><p className="mt-1 text-xs leading-5 text-[#6e7d63]">Connectez-vous pour retrouver cette sélection sur tous vos appareils.</p></div>
            <Link href="/connexion?redirect=%2Fwishlist" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-[#cbd8be] bg-white px-5 text-xs font-semibold text-[#344f3a]">Se connecter</Link>
          </div>
        )}
      </section>
    </main>
  );
}
