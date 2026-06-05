"use client";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { products as staticProducts, apiToCard, type CardProduct } from "@/lib/products";

export default function NouveautesPage() {
  const [list, setList] = useState<CardProduct[]>(
    staticProducts.filter((p) => p.badge === "Nouveau")
  );

  useEffect(() => {
    fetch("/api/products?active=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const dbCards = data.map(apiToCard);
          const staticSlugs = new Set(dbCards.map((p) => p.slug));
          const staticNew = staticProducts.filter((p) => p.badge === "Nouveau" && !staticSlugs.has(p.slug));
          setList([...dbCards, ...staticNew]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <section className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Collection</p>
          <h1 className="h-display text-5xl mt-2">Nouveautés</h1>
          <p className="mt-3 max-w-xl text-white/70">
            Découvrez les dernières arrivées de la saison — styles inédits et éditions limitées.
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
          <p className="text-neutral-500 py-20 text-center">Aucune nouveauté pour le moment. Revenez bientôt !</p>
        )}
      </section>
    </div>
  );
}
