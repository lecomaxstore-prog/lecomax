"use client";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { products as staticProducts, apiToCard, type CardProduct } from "@/lib/products";

export default function PromotionsPage() {
  const [list, setList] = useState<CardProduct[]>(staticProducts.filter((p) => p.oldPrice));

  useEffect(() => {
    fetch("/api/products?active=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const dbPromo = data.filter((p: { original_price: number | null; price: number }) =>
            p.original_price && p.original_price > p.price
          ).map(apiToCard);
          const staticSlugs = new Set(dbPromo.map((p) => p.slug));
          const staticPromo = staticProducts.filter((p) => p.oldPrice && !staticSlugs.has(p.slug));
          setList([...dbPromo, ...staticPromo]);
        }
      })
      .catch(() => {});
  }, []);
  return (
    <div>
      <section className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-xs uppercase tracking-[0.3em]">Offres</p>
          <h1 className="h-display text-5xl mt-2">Promotions</h1>
          <p className="mt-3 max-w-xl">
            Jusqu&apos;à -40% sur une sélection de chaussures et de vêtements.
          </p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {list.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
