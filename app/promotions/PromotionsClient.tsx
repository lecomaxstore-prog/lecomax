"use client";
import { useStoreRefresh } from "@/lib/use-store-refresh";
import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import { apiToCard, type CardProduct } from "@/lib/products";
import { selectPromotionProducts } from "@/mobile/src/lib/store-promotions";

export default function PromotionsClient({ initialProducts }: { initialProducts: CardProduct[] }) {
  const [list, setList] = useState<CardProduct[]>(initialProducts);

  useStoreRefresh(async (signal) => {
    const [products, promotions] = await Promise.all(
      ["/api/products?active=true", "/api/promotions"].map(async (url) => {
        const response = await fetch(url, { signal, cache: "no-store" });
        if (!response.ok) throw new Error("Store data unavailable");
        const rows = await response.json();
        if (!Array.isArray(rows)) throw new Error("Invalid store data");
        return rows;
      }),
    );
    setList(selectPromotionProducts(products, promotions).map(apiToCard));
  });
  return (
    <div>
      <section className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-xs uppercase tracking-[0.3em]">Offres</p>
          <h1 className="h-display text-5xl mt-2">Promotions</h1>
          <p className="mt-3 max-w-xl">
            Découvrez les offres et la sélection du moment.
          </p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {list.length === 0 && <p className="text-neutral-500 py-20 text-center">Aucune promotion pour le moment.</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {list.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
