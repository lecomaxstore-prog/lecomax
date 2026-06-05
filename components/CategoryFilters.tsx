"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import type { CardProduct } from "@/lib/products";

type SortKey = "pertinence" | "prix-asc" | "prix-desc" | "nouveautes" | "promo";

const SORT_LABELS: Record<SortKey, string> = {
  pertinence: "Pertinence",
  "prix-asc": "Prix croissant",
  "prix-desc": "Prix decroissant",
  nouveautes: "Nouveautes",
  promo: "Promotions",
};

export default function CategoryFilters({
  products,
  subCategories,
}: {
  products: CardProduct[];
  subCategories: string[];
}) {
  const [activeSub, setActiveSub] = useState<string>("Tous");
  const [sort, setSort] = useState<SortKey>("pertinence");
  const [sortOpen, setSortOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = activeSub === "Tous" ? products : products.filter((p) => (p.subCategory ?? "") === activeSub);
    switch (sort) {
      case "prix-asc": list = [...list].sort((a, b) => a.price - b.price); break;
      case "prix-desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "nouveautes": list = [...list].sort((a) => (a.badge === "Nouveau" ? -1 : 1)); break;
      case "promo": list = [...list].sort((a) => (a.oldPrice ? -1 : 1)); break;
    }
    return list;
  }, [products, activeSub, sort]);

  return (
    <>
      {/* Filter + sort bar */}
      <div className="sticky top-[60px] z-30 bg-white/95 backdrop-blur-sm border-b border-neutral-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3.5">

            {/* Subcategory pills */}
            {["Tous", ...subCategories].map((s) => (
              <button
                key={s}
                onClick={() => setActiveSub(s)}
                className={`shrink-0 px-4 py-2 text-[12px] font-bold rounded-full transition-all duration-200 ${
                  activeSub === s
                    ? "text-black font-black shadow-sm"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-black"
                }`}
                style={activeSub === s ? { background: "#3ecf4c" } : {}}
              >
                {s}
              </button>
            ))}

            {/* Sort — pushed right */}
            <div className="ml-auto shrink-0 relative">
              <button
                onClick={() => setSortOpen((o) => !o)}
                className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 px-4 py-2 text-[12px] font-bold rounded-full uppercase tracking-wide transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M7 12h10M11 18h2"/></svg>
                Trier : {SORT_LABELS[sort]}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={`transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6"/></svg>
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-neutral-200 rounded-xl shadow-xl min-w-[200px] overflow-hidden">
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                    <button
                      key={k}
                      onClick={() => { setSort(k); setSortOpen(false); }}
                      className={`w-full text-left px-5 py-3 text-[13px] hover:bg-neutral-50 flex items-center justify-between transition-colors ${
                        sort === k ? "font-black" : "font-normal text-neutral-600"
                      }`}
                    >
                      {SORT_LABELS[k]}
                      {sort === k && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: "#3ecf4c" }}><path d="M20 6 9 17l-5-5"/></svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results header */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-3 flex items-center justify-between">
        <p className="text-[13px] text-neutral-500">
          <span className="font-black text-black">{filtered.length}</span>
          {" "}article{filtered.length > 1 ? "s" : ""}
          {activeSub !== "Tous" && (
            <> dans <span className="font-bold text-black">{activeSub}</span></>
          )}
        </p>
        {activeSub !== "Tous" && (
          <button
            onClick={() => setActiveSub("Tous")}
            className="text-[12px] text-neutral-500 hover:text-black flex items-center gap-1.5 transition-colors font-semibold"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            Effacer le filtre
          </button>
        )}
      </div>

      {/* Product grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        {filtered.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-neutral-50 border border-neutral-100">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-neutral-400">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <p className="text-neutral-500 text-[15px] mb-5">Aucun article pour ce filtre.</p>
            <button
              onClick={() => setActiveSub("Tous")}
              className="px-6 py-3 text-[12px] font-black uppercase tracking-wide rounded-full text-black transition-colors"
              style={{ background: "#3ecf4c" }}
            >
              Voir tous les articles
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
            {filtered.map((p, i) => (
              <CardReveal key={p.slug} delay={Math.min(i * 60, 480)}>
                <ProductCard product={p} />
              </CardReveal>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA strip */}
      <div className="border-t border-neutral-100 bg-neutral-50 py-10 text-center">
        <p className="text-[12px] uppercase tracking-[0.3em] text-neutral-400 mb-2">Livraison & retours</p>
        <p className="text-[14px] text-neutral-600">
          Livraison 35 MAD &nbsp;·&nbsp; Gratuite pour Sidi Bennour &nbsp;·&nbsp; Retours gratuits sous 30 jours
        </p>
        <div className="flex items-center justify-center gap-6 mt-5">
          <Link href="/aide" className="text-[12px] font-black uppercase tracking-wide underline underline-offset-4 hover:no-underline">
            Centre d&apos;aide
          </Link>
          <Link href="/suivre-commande" className="text-[12px] font-black uppercase tracking-wide underline underline-offset-4 hover:no-underline">
            Suivre ma commande
          </Link>
        </div>
      </div>
    </>
  );
}

/** Individual card with IntersectionObserver reveal + stagger delay */
function CardReveal({ children, delay }: { children: React.ReactNode; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add("in"), delay);
          obs.unobserve(el);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -30px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className="card-sr">
      {children}
    </div>
  );
}