"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { categories as fallbackCategories, productsByCategory } from "@/lib/products";

type StoreCategory = {
  id?: string;
  slug: string;
  label: string;
  description?: string | null;
  image: string | null;
  image_mobile?: string | null;
  image_position?: string | null;
  image_mobile_position?: string | null;
  active?: boolean;
  sort_order?: number;
};

const fallbackImages: Record<string, string> = {
  homme: "/images/pages images/homme.png",
  femme: "/images/pages images/femme.png",
  chaussures: "/images/pages images/chaussures.png",
  accessoires: "/images/pages images/accessoires.png",
};

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.08 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

export default function CategoryTiles() {
  const [dbCategories, setDbCategories] = useState<StoreCategory[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const { ref, visible } = useInView();

  useEffect(() => {
    Promise.all([
      fetch("/api/categories", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/products?active=true&fields=category").then((response) => response.json()),
    ]).then(([categoryData, productData]) => {
      if (Array.isArray(categoryData)) setDbCategories(categoryData.filter((category) => category.active !== false));
      if (Array.isArray(productData)) {
        const nextCounts: Record<string, number> = {};
        for (const product of productData as { category?: string }[]) {
          const category = product.category?.toLowerCase();
          if (category) nextCounts[category] = (nextCounts[category] || 0) + 1;
        }
        setCounts(nextCounts);
      }
    }).catch(() => {});
  }, []);

  const fallback: StoreCategory[] = fallbackCategories.map((category, index) => ({
    slug: category.slug,
    label: category.label,
    description: category.description,
    image: fallbackImages[category.slug],
    image_mobile: fallbackImages[category.slug],
    image_position: category.slug === "chaussures" ? "50% 65%" : "50% 50%",
    image_mobile_position: category.slug === "femme" ? "65% 50%" : "50% 50%",
    active: true,
    sort_order: (index + 1) * 10,
  }));
  const source = dbCategories.length ? dbCategories : fallback;
  const categories = [...source].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)).map((category) => ({
    ...category,
    count: counts[category.slug] ?? productsByCategory(category.slug).length,
  }));
  const total = categories.reduce((sum, category) => sum + category.count, 0);

  if (!categories.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6" ref={ref}>
      <div className="mb-8 flex items-end justify-between border-b border-neutral-100 pb-6" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(18px)", transition: "all .6s ease" }}>
        <div><p className="mb-2 text-[10px] font-black uppercase tracking-[.28em] text-[#22a936]">Collections</p><h2 className="h-display text-3xl md:text-[2.6rem]">Acheter par catégorie</h2></div>
        <span className="hidden text-[11px] font-bold uppercase tracking-[.2em] text-neutral-400 md:block">{total} articles</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:gap-4">
        {categories.map((category, index) => (
          <CategoryTile key={category.id ?? category.slug} category={category} index={index} visible={visible} />
        ))}
      </div>
    </section>
  );
}

function CategoryTile({ category, index, visible }: { category: StoreCategory & { count: number }; index: number; visible: boolean }) {
  const desktop = category.image || fallbackImages[category.slug] || "/images/pages images/homme.png";
  const mobile = category.image_mobile || desktop;
  const desktopPosition = category.image_position || "50% 50%";
  const mobilePosition = category.image_mobile_position || desktopPosition;
  return (
    <Link href={`/boutique?cat=${encodeURIComponent(category.slug)}`} className="group relative block aspect-[3/4] overflow-hidden rounded-sm bg-neutral-900 md:aspect-[4/3]" style={{ opacity: visible ? 1 : 0, clipPath: visible ? "inset(0)" : "inset(100% 0 0 0)", transition: `opacity .1s, clip-path .8s cubic-bezier(.76,0,.24,1) ${.08 + index * .1}s` }}>
      {/* Separate responsive elements allow independent crop positions. */}
      <img src={mobile} alt={category.label} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] md:hidden" style={{ objectPosition: mobilePosition }} />
      <img src={desktop} alt={category.label} className="hidden h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] md:block" style={{ objectPosition: desktopPosition }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-[3px] origin-bottom scale-y-0 bg-[#3ecf4c] transition-transform duration-500 group-hover:scale-y-100" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white md:p-7" style={{ textShadow: "0 1px 9px rgba(0,0,0,.85)" }}>
        <div className="mb-1 flex items-center gap-2"><p className="text-[8px] font-black uppercase tracking-[.3em] text-white/65 md:text-[9px]">Collection</p>{category.count > 0 && <span className="rounded-full bg-white/15 px-2 py-0.5 text-[8px] font-bold backdrop-blur">{category.count}</span>}</div>
        <h3 className="h-display text-xl leading-tight md:text-3xl">{category.label}</h3>
        <span className="mt-3 inline-flex translate-y-2 items-center gap-2 bg-[#3ecf4c] px-3 py-2 text-[9px] font-black uppercase tracking-[.16em] text-black opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100 md:px-4 md:text-[10px]">Explorer <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
      </div>
    </Link>
  );
}
