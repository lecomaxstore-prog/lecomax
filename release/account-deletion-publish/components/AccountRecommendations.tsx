"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { apiToCard, products, formatMAD, type CardProduct } from "@/lib/products";
import { personalizeProducts, recordProductSignal, SHOPPING_PROFILE_EVENT } from "@/lib/personalization";
import { useWishlist } from "@/components/WishlistContext";

export default function AccountRecommendations() {
  const { slugs } = useWishlist();
  const [catalogue, setCatalogue] = useState<CardProduct[]>(products);
  const [ranked, setRanked] = useState<CardProduct[]>([]);
  const [trendSlugs, setTrendSlugs] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    // Live inventory is authoritative; static products only cover API outages.
    fetch("/api/products?active=true", { signal: controller.signal })
      .then(async response => {
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data)) setCatalogue(data.map(apiToCard));
      }).catch(() => {});
    fetch("/api/recommendations?limit=80", { signal: controller.signal })
      .then(async response => {
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data.slugs)) setTrendSlugs(data.slugs.filter((slug: unknown) => typeof slug === "string"));
      }).catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const refresh = () => {
      const positions = new Map(trendSlugs.map((slug, index) => [slug, index]));
      const available = [...new Map(catalogue.filter(product => product.stock === undefined || product.stock > 0)
        .map(product => [product.slug, product])).values()]
        .sort((a, b) => (positions.get(a.slug) ?? Infinity) - (positions.get(b.slug) ?? Infinity));
      setRanked(personalizeProducts(available, slugs).slice(0, 4));
    };
    refresh();
    const events = [SHOPPING_PROFILE_EVENT, "lecomax-consent-change", "storage", "focus"];
    events.forEach(event => window.addEventListener(event, refresh));
    return () => events.forEach(event => window.removeEventListener(event, refresh));
  }, [catalogue, trendSlugs, slugs]);

  return (
    <section className="account-recommendations" aria-labelledby="account-recommendations-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#71806a]">
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" /></svg>
            À découvrir
          </p>
          <h2 id="account-recommendations-title" className="text-[20px] font-semibold leading-tight tracking-[-0.035em] text-[#183c30] sm:text-[24px]">Juste pour vous</h2>
        </div>
        <Link href="/nouveautes" className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#dce4d6] bg-white/80 px-3.5 text-[11px] font-semibold text-[#344f3a] transition-colors hover:border-[#a7b99a] hover:bg-white sm:px-4 sm:text-xs">
          Voir tout
          <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
        </Link>
      </div>
      {ranked.length > 0 ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {ranked.map(product => (
            <Link key={product.slug} href={`/produit/${product.slug}`} onClick={() => recordProductSignal(product, 2)} className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-colors hover:border-[#91a98a]">
              <div className="relative aspect-square overflow-hidden bg-neutral-50">
                <Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1279px) 35vw, 230px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                {product.badge && <span className="absolute top-2 left-2 rounded-full bg-[#183c30] px-2.5 py-1 text-[10px] font-semibold text-white">{product.badge}</span>}
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="mb-2 line-clamp-2 min-h-10 text-[13px] font-semibold leading-5 text-neutral-800">{product.name}</h3>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-[15px] font-semibold text-[#183c30]">{formatMAD(product.price)}</span>
                  {product.oldPrice && product.oldPrice > product.price && <span className="text-xs text-neutral-500 line-through">{formatMAD(product.oldPrice)}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : <p className="rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-500">Votre prochaine découverte arrive bientôt. Retrouvez nos nouveautés en boutique.</p>}
    </section>
  );
}
