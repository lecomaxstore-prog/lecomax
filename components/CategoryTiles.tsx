"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { getImageProps } from "next/image";
import { canOptimizeHero } from "./ResponsiveHeroImage";
import Link from "next/link";
import styles from "./CategoryTiles.module.css";
import { useStoreRefresh } from "@/lib/use-store-refresh";
import { categoryProductCounts, normalizeCategory } from "@/lib/storefront-catalogue";
import { categories as catalogueCategories } from "@/lib/products";

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
  homme: "/images/collection-homme-white-v5.webp",
  femme: "/images/collection-femme-white-v5.webp",
  chaussures: "/images/collection-chaussures-white-v5.webp",
  accessoires: "/images/collection-accessoires-white-v5.webp",
};

export default function CategoryTiles({ initialCounts }: { initialCounts: Record<string, number> }) {
  const [dbCategories, setDbCategories] = useState<StoreCategory[]>([]);
  const [counts, setCounts] = useState(initialCounts);

  useStoreRefresh(async (signal) => {
    await Promise.all([
      fetch("/api/categories", { signal, cache: "no-store" }).then((response) => { if (!response.ok) throw new Error("Categories unavailable"); return response.json(); }),
      fetch("/api/products?active=true", { signal, cache: "no-store" }).then((response) => { if (!response.ok) throw new Error("Products unavailable"); return response.json(); }),
    ]).then(([categoryData, productData]) => {
      if (Array.isArray(categoryData)) setDbCategories(categoryData.filter((category) => category.active !== false));
      if (Array.isArray(productData)) {
        setCounts(categoryProductCounts(productData));
      }
    }).catch(() => {});
  });

  const fallbackCategories: StoreCategory[] = catalogueCategories.map(({ slug, label }, index) => ({
    slug, label, image: null, sort_order: index + 1,
  }));
  const sourceCategories = dbCategories.length ? dbCategories : fallbackCategories;
  const categories = [...sourceCategories].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)).map((category) => ({
    ...category,
    count: counts[normalizeCategory(category.slug)] ?? 0,
  }));
  const total = categories.reduce((sum, category) => sum + category.count, 0);

  return (
    <section data-source-file="components/CategoryTiles.tsx" hidden={!categories.length} className={styles.section} aria-labelledby="collections-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}><span aria-hidden="true" />Les collections</p>
          <h2 id="collections-title" className={styles.title}>Acheter par catégorie</h2>
          <p className={styles.intro}>Trouvez les pièces qui vous ressemblent.</p>
        </div>
        <span className={styles.total}>{total} article{total !== 1 ? "s" : ""} à découvrir</span>
      </div>
      <div className={styles.grid}>
        {categories.map((category) => (
          <CategoryTile key={category.id ?? category.slug} category={category} />
        ))}
      </div>
    </section>
  );
}

function CategoryTile({ category }: { category: StoreCategory & { count: number } }) {
  const [original, setOriginal] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const printedImage = printedClothingImages[category.slug];
  const collectionImage = ["homme", "femme", "chaussures", "accessoires"].includes(category.slug)
    ? `/images/collection-${category.slug}-v2.webp`
    : null;
  // Replace the original campaign photos while retaining custom admin uploads.
  const isDefaultImage = (image: string | null | undefined) => !image || image === fallbackImages[category.slug] || image === collectionImage || image === `/images/collection-${category.slug}-v4.webp` || image === `/images/collection-${category.slug}-printed-v3.webp`;
  const desktop = printedImage && isDefaultImage(category.image)
    ? printedImage
    : category.image || collectionImage || fallbackImages[category.slug] || "/images/pages images/homme.png";
  const mobile = printedImage && category.image_mobile && isDefaultImage(category.image_mobile)
    ? printedImage
    : category.image_mobile || desktop;
  const desktopPosition = desktop === printedImage || desktop === collectionImage ? "50% 50%" : category.image_position || "50% 50%";
  const mobilePosition = mobile === printedImage || mobile === collectionImage ? "50% 50%" : category.image_mobile_position || desktopPosition;
  const sizes = "(min-width: 1280px) 290px, (min-width: 1024px) calc(25vw - 30px), (min-width: 768px) calc(50vw - 36px), (min-width: 640px) calc(50vw - 28px), calc(50vw - 24px)";
  const propsFor = (src: string) => getImageProps({
    src, alt: "", width: 960, height: 1200, sizes, quality: 75,
    unoptimized: original || !canOptimizeHero(src),
  }).props;
  const desktopProps = propsFor(desktop);
  const mobileProps = propsFor(mobile);
  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.currentSrc && image.naturalWidth === 0) setOriginal(true);
  }, [desktop, mobile]);
  return (
    <Link
      href={`/boutique?cat=${encodeURIComponent(category.slug)}`}
      className={styles.card}
      data-portrait={["homme", "femme"].includes(category.slug) || undefined}
      data-white-desktop={desktop.includes("-white-v5.webp") || undefined}
      data-white-mobile={mobile.includes("-white-v5.webp") || undefined}
    >
      <div className={styles.artwork}>
        {/* Collection artwork uses a centered crop on both screen sizes. */}
        <picture>
          <source media="(min-width: 768px)" srcSet={desktopProps.srcSet || desktopProps.src.replace(/[\s,]/g, encodeURIComponent)} sizes={sizes} />
          <img
            ref={imageRef}
            {...mobileProps}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => { if (!original) setOriginal(true); }}
            className={styles.image}
            style={{ "--crop-mobile": mobilePosition, "--crop-desktop": desktopPosition } as CSSProperties}
          />
        </picture>
        <div aria-hidden="true" className={styles.shade} />
      </div>
      <span className={styles.count}>{category.count} article{category.count !== 1 ? "s" : ""}</span>
      <div className={styles.caption}>
        <div className={styles.label}>
          <h3>{category.label}</h3>
          <span className={styles.explore}>Découvrir</span>
        </div>
        <span aria-hidden="true" className={styles.arrow}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
        </span>
      </div>
    </Link>
  );
}
