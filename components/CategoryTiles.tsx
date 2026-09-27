"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useStoreRefresh } from "@/lib/use-store-refresh";
import { products as catalogProducts } from "@/lib/products";

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

const printedClothingImages: Record<string, string> = {
  homme: "/images/collection-homme-printed-v3.webp",
  femme: "/images/collection-femme-printed-v3.webp",
  chaussures: "/images/collection-chaussures-v4.webp",
  accessoires: "/images/collection-accessoires-v4.webp",
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

  useStoreRefresh(async (signal) => {
    await Promise.all([
      fetch("/api/categories", { signal, cache: "no-store" }).then((response) => { if (!response.ok) throw new Error("Categories unavailable"); return response.json(); }),
      fetch("/api/products?active=true", { signal, cache: "no-store" }).then((response) => { if (!response.ok) throw new Error("Products unavailable"); return response.json(); }),
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
  });

  const fallbackCategories: StoreCategory[] = [
    { slug: "homme", label: "Homme", image: null, sort_order: 1 },
    { slug: "femme", label: "Femme", image: null, sort_order: 2 },
    { slug: "chaussures", label: "Chaussures", image: null, sort_order: 3 },
    { slug: "accessoires", label: "Accessoires", image: null, sort_order: 4 },
  ];
  const sourceCategories = dbCategories.length ? dbCategories : fallbackCategories;
  const sourceCounts = Object.keys(counts).length ? counts : catalogProducts.reduce<Record<string, number>>((result, product) => {
    result[product.category] = (result[product.category] || 0) + 1;
    return result;
  }, {});
  const categories = [...sourceCategories].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)).map((category) => ({
    ...category,
    count: sourceCounts[category.slug] ?? 0,
  }));
  const total = categories.reduce((sum, category) => sum + category.count, 0);

  return (
    <section data-source-file="components/CategoryTiles.tsx" hidden={!categories.length} className="mx-auto max-w-7xl px-4 pb-7 pt-10 sm:pb-10 md:px-6 md:pt-14" ref={ref}>
      <div className="mb-8 flex items-end justify-between border-b border-neutral-100 pb-6" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(18px)", transition: "all .6s ease" }}>
        <div><p className="mb-2 text-[10px] font-black uppercase tracking-[.28em] text-[#22a936]">Collections</p><h2 className="h-display text-3xl md:text-[2.6rem]">Acheter par catégorie</h2></div>
        <span className="hidden text-[11px] font-bold uppercase tracking-[.2em] text-neutral-400 md:block">{total} articles</span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-6 sm:gap-y-9 lg:grid-cols-4">
        {categories.map((category, index) => (
          <CategoryTile key={category.id ?? category.slug} category={category} index={index} visible={visible} />
        ))}
      </div>
    </section>
  );
}

function CategoryTile({ category, index, visible }: { category: StoreCategory & { count: number }; index: number; visible: boolean }) {
  const printedImage = printedClothingImages[category.slug];
  const collectionImage = ["homme", "femme", "chaussures", "accessoires"].includes(category.slug)
    ? `/images/collection-${category.slug}-v2.webp`
    : null;
  // Replace the original campaign photos while retaining custom admin uploads.
  const isDefaultImage = (image: string | null | undefined) => !image || image === fallbackImages[category.slug] || image === collectionImage;
  const desktop = printedImage && isDefaultImage(category.image)
    ? printedImage
    : category.image || collectionImage || fallbackImages[category.slug] || "/images/pages images/homme.png";
  const mobile = printedImage && category.image_mobile && isDefaultImage(category.image_mobile)
    ? printedImage
    : category.image_mobile || desktop;
  const desktopPosition = desktop === printedImage || desktop === collectionImage ? "50% 50%" : category.image_position || "50% 50%";
  const mobilePosition = mobile === printedImage || mobile === collectionImage ? "50% 50%" : category.image_mobile_position || desktopPosition;
  return (
    <Link
      href={`/boutique?cat=${encodeURIComponent(category.slug)}`}
      className="group block min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#183c30] focus-visible:ring-offset-4"
      style={{ opacity: visible ? 1 : 0, transition: `opacity .6s ease ${index * .08}s` }}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#f3efe7]">
        {/* Collection artwork uses a centered crop on both screen sizes. */}
        <picture>
          <source media="(min-width: 768px)" srcSet={desktop} />
          <img
            src={mobile}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover [object-position:var(--crop-mobile)] transition-transform duration-700 group-hover:scale-[1.035] motion-reduce:transition-none md:[object-position:var(--crop-desktop)]"
            style={{ "--crop-mobile": mobilePosition, "--crop-desktop": desktopPosition } as CSSProperties}
          />
        </picture>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-black/[0.035]" />
      </div>
      <div className="flex items-center justify-between gap-2 border-b border-[#e8e8e1] px-0.5 pb-3 pt-3.5 sm:pb-4 sm:pt-4">
        <div className="min-w-0">
          <h3 className="break-words text-[15px] font-medium leading-6 tracking-[-0.02em] text-[#252d27] sm:text-lg">{category.label}</h3>
          <p className="mt-0.5 text-[10px] leading-5 tracking-[0.025em] text-[#7b8077] sm:text-xs">{category.count} article{category.count !== 1 ? "s" : ""}</p>
        </div>
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#dde4dc] text-[#183c30] transition-colors duration-200 group-hover:border-[#183c30] group-hover:bg-[#183c30] group-hover:text-white group-focus-visible:bg-[#183c30] group-focus-visible:text-white sm:h-9 sm:w-9">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
        </span>
      </div>
    </Link>
  );
}
