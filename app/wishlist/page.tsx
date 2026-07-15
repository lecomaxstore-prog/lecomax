"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/components/WishlistContext";
import { customerApiFetch } from "@/lib/customer-api";
import { products, type CardProduct } from "@/lib/products";

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
    <main className="min-h-[70vh] bg-[linear-gradient(180deg,#f7f8f8_0%,#ffffff_50%)]">
      <section className="border-b border-neutral-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#21b535]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.8a5.5 5.5 0 0 0 1-7.8Z"/></svg>
                Votre sélection
              </div>
              <h1 className="text-[30px] font-black uppercase tracking-[-0.04em] text-neutral-950 sm:text-[42px]">Mes favoris</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-500">Gardez les produits qui vous plaisent et retrouvez-les facilement avant votre prochaine commande.</p>
            </div>
            {ready && count > 0 && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                {count} produit{count > 1 ? "s" : ""} enregistré{count > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {!ready || loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-neutral-100" />)}
          </div>
        ) : wishedProducts.length === 0 ? (
          <div className="mx-auto flex max-w-lg flex-col items-center rounded-[28px] border border-neutral-200 bg-white px-6 py-14 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#2cc643]">
              <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.8a5.5 5.5 0 0 0 1-7.8Z"/></svg>
            </div>
            <h2 className="text-lg font-black text-neutral-950">Votre liste est encore vide</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">Appuyez sur le cœur d&apos;un produit pour le conserver ici.</p>
            <Link href="/boutique" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.15em] text-white transition-all hover:-translate-y-0.5 hover:bg-neutral-800">
              Découvrir la boutique <span aria-hidden>→</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {wishedProducts.map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
        )}

        {!authenticated && ready && count > 0 && (
          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-[12px] font-black text-amber-900">Conservez vos favoris sur tous vos appareils</p><p className="mt-0.5 text-[11px] text-amber-700">Connectez-vous : votre sélection actuelle sera automatiquement ajoutée à votre compte.</p></div>
            <Link href="/connexion?redirect=%2Fwishlist" className="shrink-0 rounded-xl bg-amber-500 px-5 py-2.5 text-center text-[10px] font-black uppercase tracking-wider text-white">Se connecter</Link>
          </div>
        )}
      </section>
    </main>
  );
}
