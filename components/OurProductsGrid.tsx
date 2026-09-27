"use client";
import ProductCard from "./CollectionProductCard";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CardProduct } from "@/lib/products";
import { personalizeProducts, recordCategorySignal } from "@/lib/personalization";

const COLOR_MAP: Record<string, string> = {
  "Noir": "#0a0a0a", "Blanc": "#f5f5f5", "Gris": "#9ca3af",
  "Bleu": "#3b82f6", "Rouge": "#dc2626", "Vert": "#22c55e",
  "Jaune": "#facc15", "Rose": "#f9a8d4", "Beige": "#f5f0e8",
  "Caramel": "#d4a574", "Marine": "#1e3a5f", "Kaki": "#8b7355",
  "�dition Standard": "#1a1a2e",
};
const getHex = (name: string) => COLOR_MAP[name.split("/")[0].trim()] ?? "#e5e7eb";

const TABS = [
  { key: "tous",        label: "Tous",        icon: "M4 6h16M4 12h16M4 18h16" },
  { key: "accessoires", label: "Accessoires", icon: "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" },
  { key: "chaussures",  label: "Chaussures",  icon: "M3 7c3-2 6-2 9 0s6 2 9 0v11c-3 2-6 2-9 0s-6-2-9 0V7z" },
  { key: "homme",       label: "Homme",       icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { key: "femme",       label: "Femme",       icon: "M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 10c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" },
];

const MOBILE_INITIAL_PRODUCT_COUNT = 8;
const DESKTOP_INITIAL_PRODUCT_COUNT = 16;
const PRODUCT_LOAD_STEP = 8;

function useInView(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}


export default function OurProductsGrid({ products }: { products: CardProduct[] }) {
  const [active, setActive] = useState("tous");
  const [mobileDisplayed, setMobileDisplayed] = useState(MOBILE_INITIAL_PRODUCT_COUNT);
  const [desktopDisplayed, setDesktopDisplayed] = useState(DESKTOP_INITIAL_PRODUCT_COUNT);
  const [rankedProducts, setRankedProducts] = useState(products);
  const { ref, visible } = useInView();

  useEffect(() => {
    setRankedProducts(personalizeProducts(products));
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        let sessionId = "";
        const consentRaw = localStorage.getItem("lecomax_cookie_consent");
        const consent = consentRaw ? JSON.parse(consentRaw) : null;
        if (consent?.data_collection === true) {
          sessionId = localStorage.getItem("lecomax_session_id") || "";
        }
        const params = new URLSearchParams({ limit: String(Math.min(80, Math.max(4, products.length))) });
        if (sessionId) params.set("mode", "personalized");
        const response = await fetch(`/api/recommendations?${params}`, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            ...(sessionId ? { "x-lecomax-session": sessionId } : {}),
          },
        });
        if (!response.ok) return;
        const data = await response.json() as { slugs?: unknown };
        if (!Array.isArray(data.slugs)) return;
        const positions = new Map(
          data.slugs
            .filter((slug): slug is string => typeof slug === "string")
            .map((slug, index) => [slug, index]),
        );
        const serverRanked = [...products].sort((a, b) => {
          const aRank = positions.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
          const bRank = positions.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
          return aRank - bRank;
        });
        setRankedProducts(personalizeProducts(serverRanked));
      } catch {
        // Keep the instant local/catalogue order when intelligence is unavailable.
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [products]);

  const filtered = active === "tous"
    ? rankedProducts
    : rankedProducts.filter((p) => p.category === active);

  const visibleProducts = filtered.slice(0, Math.max(mobileDisplayed, desktopDisplayed));
  const mobileHasMore = filtered.length > mobileDisplayed;
  const desktopHasMore = filtered.length > desktopDisplayed;

  const handleTab = (key: string) => {
    setActive(key);
    if (key !== "tous") recordCategorySignal(key, 4);
    setMobileDisplayed(MOBILE_INITIAL_PRODUCT_COUNT);
    setDesktopDisplayed(DESKTOP_INITIAL_PRODUCT_COUNT);
  };

  const loadMore = (mode: "mobile" | "desktop") => {
    if (mode === "mobile") {
      setMobileDisplayed((count) => Math.min(count + PRODUCT_LOAD_STEP, filtered.length));
      return;
    }
    setDesktopDisplayed((count) => Math.min(count + PRODUCT_LOAD_STEP, filtered.length));
  };

  const loadMoreControl = (mode: "mobile" | "desktop") => {
    const count = mode === "mobile" ? mobileDisplayed : desktopDisplayed;
    const shown = Math.min(count, filtered.length);
    const hasMore = mode === "mobile" ? mobileHasMore : desktopHasMore;
    const nextBatch = Math.min(PRODUCT_LOAD_STEP, filtered.length - shown);
    if (!hasMore) return null;

    return (
      <div className={`${mode === "mobile" ? "flex sm:hidden" : "hidden sm:flex"} mt-9 flex-col items-center sm:mt-11`}>
        <div className="w-full max-w-[220px]">
          <p className="mb-2 text-center text-[11px] font-medium text-neutral-500">
            {shown} produits sur {filtered.length}
          </p>
          <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
              style={{ width: `${(shown / filtered.length) * 100}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadMore(mode)}
          aria-label={`Afficher ${nextBatch} produit${nextBatch > 1 ? "s" : ""} suppl�mentaire${nextBatch > 1 ? "s" : ""}`}
          className="group mt-4 inline-flex h-11 w-full max-w-[220px] items-center justify-center gap-2.5 rounded-lg border border-neutral-200 bg-neutral-100 px-5 text-neutral-800 transition-colors duration-200 hover:bg-neutral-200"
        >
          <span className="text-[11px] font-bold">
            Afficher {nextBatch} produit{nextBatch > 1 ? "s" : ""} de plus
          </span>
          <span className="transition-transform duration-200 group-hover:translate-y-0.5" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m7 10 5 5 5-5" />
            </svg>
          </span>
        </button>
      </div>
    );
  };

  return (
    <section data-source-file="components/OurProductsGrid.tsx" id="nos-produits" className="border-y border-neutral-100 bg-neutral-50/60 pb-10 pt-7 sm:py-10 md:py-12" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* ── Header ── */}
        <div
          className="mb-5 flex items-end justify-between gap-3 border-b border-[#e0e5dd] pb-5 sm:mb-6 sm:gap-8 sm:pb-6"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div className="min-w-0">
            <p className="mb-2 flex items-center gap-2 text-[8px] font-semibold uppercase tracking-[0.18em] text-[#65816c] sm:text-[10px]">
              <span aria-hidden="true" className="h-px w-6 bg-[#8fa38d]" />
              Catalogue complet
            </p>
            <h2 className="text-[28px] font-medium leading-[1.15] tracking-[-0.045em] text-[#183c30] sm:text-[36px] md:text-[42px]">
              Nos produits
            </h2>
            <p className="mt-1.5 text-[11px] leading-5 text-[#7b8279] sm:text-[13px]">
              {products.length} article{products.length !== 1 ? "s" : ""} à découvrir
            </p>
          </div>
          <Link
            href="/boutique"
            className="group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[#dce3d8] bg-white py-1.5 pl-3 pr-1.5 text-[11px] font-medium text-[#183c30] transition-colors duration-200 hover:border-[#183c30] hover:bg-[#f0f3ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#183c30] focus-visible:ring-offset-4 sm:gap-4 sm:pl-5 sm:text-xs"
          >
            <span className="sm:hidden">Voir tout</span>
            <span className="hidden sm:inline">Voir la boutique</span>
            <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-[#183c30] text-white sm:h-8 sm:w-8">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        </div>

        {/* ── Grid ── */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.4s ease 0.2s",
          }}
        >
          {visibleProducts.map((p, i) => (
            <ProductCard
              key={`${active}-${p.slug}`}
              product={p}
              index={i}
              visibilityClass={
                i >= mobileDisplayed
                  ? "hidden sm:block"
                  : i >= desktopDisplayed
                    ? "sm:hidden"
                    : ""
              }
            />
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-14 h-14 mx-auto mb-4 border-2 border-neutral-200 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4d4d4" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <p className="text-neutral-400 text-[13px] font-semibold">Aucun produit dans cette catégorie.</p>
          </div>
        )}

        {/* ── Responsive load more controls ── */}
        {loadMoreControl("mobile")}
        {loadMoreControl("desktop")}
      </div>

      <style jsx>{`
        @keyframes cardFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

