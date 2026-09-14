"use client";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { products as staticProducts, apiToCard, type CardProduct } from "@/lib/products";
import { selectBestsellers } from "@/lib/bestseller-eligibility";

export default function BestsellersPage() {
  const [list, setList] = useState<CardProduct[]>(
    selectBestsellers(staticProducts, staticProducts.filter((p) => p.badge === "Bestseller"))
  );

  useEffect(() => {
    fetch("/api/products?active=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const dbFeatured = data.filter((p: { featured: boolean }) => p.featured).map(apiToCard);
          setList(selectBestsellers(data.map(apiToCard), dbFeatured));
        }
      })
      .catch(() => {});
  }, []);

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
