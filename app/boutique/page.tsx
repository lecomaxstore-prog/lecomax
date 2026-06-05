"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import { products as staticProducts, apiToCard, type CardProduct } from "@/lib/products";

const CATEGORIES = [
  { id: "all", label: "Tout voir" },
  { id: "chaussures", label: "Chaussures" },
  { id: "accessoires", label: "Accessoires" },
  { id: "homme", label: "Homme" },
  { id: "femme", label: "Femme" },
] as const;

const SORTS = [
  { id: "default", label: "Nouveautés" },
  { id: "price-asc", label: "Prix croissant" },
  { id: "price-desc", label: "Prix décroissant" },
  { id: "promo", label: "Promotions" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];
type SortId = (typeof SORTS)[number]["id"];

export default function BoutiquePage() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [activeSort, setActiveSort] = useState<SortId>("default");
  const [dbProducts, setDbProducts] = useState<CardProduct[]>([]);

  useEffect(() => {
    fetch("/api/products?active=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const cards = data.map(apiToCard);
          // deduplicate by slug (prefer DB version)
          const staticSlugs = new Set(cards.map((p) => p.slug));
          const merged = [...cards, ...staticProducts.filter((p) => !staticSlugs.has(p.slug))];
          setDbProducts(merged);
        }
      })
      .catch(() => {});
  }, []);

  const allProducts: CardProduct[] = dbProducts.length > 0 ? dbProducts : staticProducts;

  const filtered = useMemo(() => {
    let list = activeCategory === "all"
      ? allProducts
      : allProducts.filter((p) => p.category === activeCategory);

    if (activeSort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (activeSort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (activeSort === "promo") list = list.filter((p) => p.oldPrice);

    return list;
  }, [activeCategory, activeSort, allProducts]);

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      {/* ── Hero ── */}
      <div className="bg-black text-white relative overflow-hidden">
        <Image
          src="/images/pages images/notre boutique image.png"
          alt="Notre Boutique"
          fill
          className="object-cover opacity-15"
          priority
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-20">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40 mb-6">
            <Link href="/" className="hover:text-white/70 transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-white/70">Boutique</span>
          </nav>

          <div className="flex flex-col gap-6">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30 mb-3">
                L&apos;ecomax
              </p>
              <h1 className="font-black text-4xl md:text-5xl uppercase tracking-tight leading-none">
                Notre
                <span className="block" style={{ color: "#3ecf4c" }}>Boutique</span>
              </h1>
              <p className="text-white/50 text-sm mt-4 max-w-md">
                Découvrez tous nos articles — chaussures, accessoires et plus encore.
                Livraison offerte au Maroc.
              </p>
            </div>

            {/* Stats inline strip */}
            <div className="flex items-center gap-0 w-fit rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="flex items-center gap-3 px-5 py-3.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                <p className="font-black text-2xl leading-none" style={{ color: "#3ecf4c" }}>{allProducts.length}</p>
                <p className="text-white/50 text-[11px] uppercase tracking-wider font-bold leading-tight">Articles<br/>en vente</p>
              </div>
              <div className="w-px self-stretch" style={{ background: "rgba(255,255,255,0.1)" }} />
              <div className="flex items-center gap-3 px-5 py-3.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                <p className="font-black text-2xl leading-none" style={{ color: "#3ecf4c" }}>{allProducts.filter(p => p.oldPrice).length}</p>
                <p className="text-white/50 text-[11px] uppercase tracking-wider font-bold leading-tight">Articles<br/>en promo</p>
              </div>
              <div className="w-px self-stretch" style={{ background: "rgba(255,255,255,0.1)" }} />
              <div className="flex items-center gap-3 px-5 py-3.5" style={{ background: "rgba(62,207,76,0.1)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                <p className="text-[11px] uppercase tracking-wider font-black leading-tight" style={{ color: "#3ecf4c" }}>Livraison<br/>gratuite</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky filter bar ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between gap-4 py-3 overflow-x-auto">
            {/* Category tabs */}
            <div className="flex items-center gap-1 shrink-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-[12px] font-black uppercase tracking-wide transition-all duration-150 whitespace-nowrap ${
                    activeCategory === cat.id
                      ? "bg-black text-white"
                      : "bg-transparent text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort select */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider hidden sm:block">Trier</span>
              <select
                value={activeSort}
                onChange={(e) => setActiveSort(e.target.value as SortId)}
                className="text-[12px] font-bold border border-neutral-200 rounded-xl px-3 py-2 bg-white outline-none cursor-pointer focus:border-neutral-400 transition-colors"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Product grid ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {filtered.length === 0 ? (
          <div className="py-32 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <h3 className="font-black text-xl uppercase tracking-wide mb-2">Aucun article trouvé</h3>
            <p className="text-neutral-400 text-sm mb-6">Essayez une autre catégorie ou un autre filtre.</p>
            <button
              onClick={() => { setActiveCategory("all"); setActiveSort("default"); }}
              className="px-6 py-3 bg-black text-white font-black uppercase text-[11px] tracking-[0.12em] rounded-xl hover:opacity-80 transition-opacity"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <p className="text-[12px] text-neutral-400 font-semibold mb-5">
              {filtered.length} article{filtered.length > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filtered.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Bottom banner ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <div className="rounded-2xl overflow-hidden bg-black text-white px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-2 font-bold">Besoin d&apos;aide ?</p>
            <h3 className="font-black text-2xl uppercase">On est là pour vous</h3>
            <p className="text-white/50 text-sm mt-1">Notre équipe répond 7j/7 sur WhatsApp.</p>
          </div>
          <a
            href="https://wa.me/212699289568"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-3 rounded-xl font-black text-black text-[12px] uppercase tracking-wide transition-all hover:opacity-90 active:scale-[0.98] shrink-0"
            style={{ background: "#3ecf4c" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contacter sur WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
