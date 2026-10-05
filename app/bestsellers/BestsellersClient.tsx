"use client";
import { useStoreRefresh } from "@/lib/use-store-refresh";
import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import { apiToCard, type CardProduct } from "@/lib/products";
import { selectStoreBestsellers } from "@/lib/store-collections";

export default function BestsellersClient({ initialProducts }: { initialProducts: CardProduct[] }) {
  const [list, setList] = useState<CardProduct[]>(initialProducts);

  useStoreRefresh(async (signal) => {
    await fetch("/api/products?active=true", { signal, cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setList(selectStoreBestsellers(data.map(apiToCard)));
        }
      })
      .catch(() => {});
  });

  return (
    <div>
      <section className="bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Populaires</p>
          <h1 className="h-display text-5xl mt-2">Bestsellers</h1>
          <p className="mt-3 max-w-xl text-white/70">
            Les produits préférés de nos clients — ceux qu&apos;on ne peut plus arrêter de commander.
          </p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {list.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {list.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-neutral-500 py-20 text-center">Aucun bestseller pour le moment.</p>
        )}
      </section>
    </div>
  );
}
