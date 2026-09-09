"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
const MOBILE_PRODUCTS_PER_PAGE = 12;
const DESKTOP_PRODUCTS_PER_PAGE = 16;

export default function BoutiquePage() {
  return <BoutiqueContent />;
}

function BoutiqueContent() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [activeSort, setActiveSort] = useState<SortId>("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(DESKTOP_PRODUCTS_PER_PAGE);
  const [dbProducts, setDbProducts] = useState<CardProduct[] | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("cat");
    const sort = params.get("sort");
    const page = Number.parseInt(params.get("page") ?? "1", 10);
    if (CATEGORIES.some((item) => item.id === category)) setActiveCategory(category as CategoryId);
    if (SORTS.some((item) => item.id === sort)) setActiveSort(sort as SortId);
    if (Number.isFinite(page) && page > 1) setCurrentPage(page);
  }, []);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 639px)");
    const syncPageSize = () => {
      setProductsPerPage(mobileQuery.matches ? MOBILE_PRODUCTS_PER_PAGE : DESKTOP_PRODUCTS_PER_PAGE);
    };
    syncPageSize();
    mobileQuery.addEventListener("change", syncPageSize);
    return () => mobileQuery.removeEventListener("change", syncPageSize);
  }, []);

  const updateURL = (cat: CategoryId, sort: SortId, page = 1) => {
    const params = new URLSearchParams();
    if (cat !== "all") params.set("cat", cat);
    if (sort !== "default") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    router.replace(`/boutique${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const setCategory = (cat: CategoryId) => {
    setActiveCategory(cat);
    setCurrentPage(1);
    updateURL(cat, activeSort, 1);
  };
  const setSort = (sort: SortId) => {
    setActiveSort(sort);
    setCurrentPage(1);
    updateURL(activeCategory, sort, 1);
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/products?active=true").then((r) => r.json()),
      fetch("/api/reviews/stats").then((r) => r.json()).catch(() => ({})),
    ]).then(([data, reviewStats]) => {
      if (Array.isArray(data)) {
        const cards = data.map(apiToCard).map((p: CardProduct) => ({
          ...p,
          rating: (reviewStats as Record<string, { rating: number; count: number }>)[p.slug]?.rating,
          reviewCount: (reviewStats as Record<string, { rating: number; count: number }>)[p.slug]?.count,
        }));
        // A successful API response is the canonical catalogue. Static products
        // are only an offline fallback; merging them here resurrected products
        // that had been removed from the database and could not be managed in admin.
        setDbProducts(cards);
      }
    }).catch(() => {});
  }, []);

  const allProducts: CardProduct[] = dbProducts ?? staticProducts;

  const filtered = useMemo(() => {
    let list = activeCategory === "all"
      ? allProducts
      : allProducts.filter((p) => p.category === activeCategory);

    if (activeSort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (activeSort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (activeSort === "promo") list = list.filter((p) => p.oldPrice);

    return list;
  }, [activeCategory, activeSort, allProducts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / productsPerPage));
  const visiblePage = Math.min(currentPage, totalPages);
  const paginatedProducts = filtered.slice(
    (visiblePage - 1) * productsPerPage,
    visiblePage * productsPerPage
  );

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage === visiblePage) return;
    setCurrentPage(nextPage);
    updateURL(activeCategory, activeSort, nextPage);
    requestAnimationFrame(() => {
      const top = (resultsRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 132;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      {/* ── Hero ── */}
      <div className="bg-black text-white relative overflow-hidden">
        <Image
          src="/images/pages images/notre boutique image.png"
          alt="Notre Boutique"
          fill
          className="object-cover"
          style={{ objectPosition: 'center 15%' }}
          priority
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.92)_0%,rgba(0,0,0,.78)_28%,rgba(0,0,0,.42)_44%,rgba(0,0,0,.08)_58%,transparent_70%)]"
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
      <div className="sticky top-[60px] z-30 border-b border-neutral-200/80 bg-white/95 shadow-[0_8px_24px_rgba(0,0,0,.04)] backdrop-blur-xl lg:top-[96px]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col items-stretch gap-2.5 py-2.5 sm:flex-row sm:items-center sm:gap-4 sm:py-3">
            {/* Category tabs */}
            <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain [scrollbar-width:none] sm:flex-1 [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max items-center gap-1 rounded-2xl bg-neutral-100 p-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    aria-pressed={activeCategory === cat.id}
                    className={`min-h-10 whitespace-nowrap rounded-xl px-3.5 text-[11px] font-black uppercase tracking-[0.06em] transition-all duration-200 sm:min-h-9 sm:px-4 ${
                      activeCategory === cat.id
                        ? "bg-neutral-950 text-white shadow-[0_4px_12px_rgba(0,0,0,.16)]"
                        : "text-neutral-500 hover:bg-white hover:text-neutral-950 hover:shadow-sm"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort select */}
            <div className="flex w-full shrink-0 items-center gap-3 border-t border-neutral-200/80 pt-2.5 sm:w-auto sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.14em] text-neutral-400 sm:hidden md:block">Trier par</span>
              <div className="relative min-w-0 flex-1 sm:flex-none">
                <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 6h18M7 12h10M11 18h2" />
                </svg>
                <select
                  value={activeSort}
                  onChange={(e) => setSort(e.target.value as SortId)}
                  aria-label="Trier les produits"
                  className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-neutral-200 bg-white py-0 pl-9 pr-9 text-[11px] font-black text-neutral-800 shadow-sm outline-none transition-all hover:border-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10 sm:min-w-[164px] sm:text-[12px]"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                <svg aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Product grid ── */}
      <div ref={resultsRef} data-product-grid className="max-w-7xl mx-auto px-4 md:px-6 py-10">
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
              onClick={() => {
                setActiveCategory("all");
                setActiveSort("default");
                setCurrentPage(1);
                updateURL("all", "default", 1);
              }}
              className="px-6 py-3 bg-black text-white font-black uppercase text-[11px] tracking-[0.12em] rounded-xl hover:opacity-80 transition-opacity"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <p className="text-[12px] text-neutral-400 font-semibold mb-5">
              {filtered.length > productsPerPage
                ? `${(visiblePage - 1) * productsPerPage + 1}–${Math.min(visiblePage * productsPerPage, filtered.length)} sur `
                : ""}
              {filtered.length} article{filtered.length > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Pagination des produits" className="mt-10 flex max-w-full items-center justify-start gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => goToPage(visiblePage - 1)}
                  disabled={visiblePage === 1}
                  aria-label="Page précédente"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-all hover:border-neutral-950 hover:bg-neutral-950 hover:text-white disabled:pointer-events-none disabled:opacity-35"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => goToPage(page)}
                    aria-label={`Page ${page}`}
                    aria-current={page === visiblePage ? "page" : undefined}
                    className={`h-11 min-w-11 rounded-xl px-3 text-[12px] font-black transition-all ${
                      page === visiblePage
                        ? "bg-neutral-950 text-white shadow-[0_6px_16px_rgba(0,0,0,.18)]"
                        : "border border-neutral-200 bg-white text-neutral-600 shadow-sm hover:border-neutral-950 hover:text-neutral-950"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => goToPage(visiblePage + 1)}
                  disabled={visiblePage === totalPages}
                  aria-label="Page suivante"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-all hover:border-neutral-950 hover:bg-neutral-950 hover:text-white disabled:pointer-events-none disabled:opacity-35"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </nav>
            )}
          </>
        )}
      </div>

      {/* ── Bottom banner ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <div className="rounded-2xl overflow-hidden bg-black text-white px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-2 font-bold">Besoin d&apos;aide ?</p>
            <h3 className="font-black text-2xl uppercase">On est là pour vous</h3>
            <p className="text-white/50 text-sm mt-1">Contactez notre service client.</p>
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
