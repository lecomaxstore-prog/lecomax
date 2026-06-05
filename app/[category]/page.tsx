import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  categories,
  productsByCategory,
  subCategoriesFor,
  type CardProduct,
} from "@/lib/products";
import { getDbProducts } from "@/lib/db-server";
import CategoryFilters from "@/components/CategoryFilters";

const valid = new Set(categories.map((c) => c.slug));

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!valid.has(category as never)) notFound();

  const cat = categories.find((c) => c.slug === category)!;

  // Fetch DB products + static products, deduplicated by slug
  const [dbProducts, staticList] = await Promise.all([
    getDbProducts({ category, activeOnly: true }),
    Promise.resolve(productsByCategory(category) as CardProduct[]),
  ]);
  const dbSlugs = new Set(dbProducts.map((p) => p.slug));
  const list: CardProduct[] = [...dbProducts, ...staticList.filter((p) => !dbSlugs.has(p.slug))];

  // Build subCategories from merged list
  const subCategoriesFromDb = [...new Set(dbProducts.map((p) => p.subCategory).filter(Boolean))] as string[];
  const staticSubs = subCategoriesFor(category);
  const subCategories = [...new Set([...subCategoriesFromDb, ...staticSubs])];

  const newCount = list.filter((p) => p.badge === "Nouveau").length;
  const promoCount = list.filter((p) => p.oldPrice).length;

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[58vh] min-h-[380px] bg-black overflow-hidden">
        <Image
          src={cat.hero}
          alt={cat.label}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-[1.03] transition-transform duration-[8s] ease-out"
        />
        {/* Multi-layer gradient: dark bottom + slight vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/10" />

        {/* Green top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, #3ecf4c, #6bdd6b, #3ecf4c)" }} />

        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 flex flex-col justify-end pb-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-white/40 text-[11px] uppercase tracking-[0.2em] mb-5">
            <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
            <span className="text-white/80 font-semibold">{cat.label}</span>
          </nav>

          {/* Category title */}
          <h1 className="h-display text-5xl md:text-[72px] text-white leading-[0.9] tracking-tight">
            {cat.label}
          </h1>

          {/* Description */}
          <p className="mt-4 text-white/55 max-w-lg text-[14px] leading-relaxed">
            {cat.description}
          </p>

          {/* Stats row */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 text-[12px] font-black uppercase tracking-wide px-3 py-1.5 rounded-full"
              style={{ background: "rgba(62,207,76,0.15)", color: "#3ecf4c", border: "1px solid rgba(62,207,76,0.3)" }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M7 12h10M11 18h2"/></svg>
              {list.length} article{list.length !== 1 ? "s" : ""}
            </span>
            {newCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide px-3 py-1.5 rounded-full bg-white text-black">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                {newCount} nouveauté{newCount !== 1 ? "s" : ""}
              </span>
            )}
            {promoCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide px-3 py-1.5 rounded-full bg-red-600 text-white">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                {promoCount} en promo
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Filters + grid */}
      <CategoryFilters products={list} subCategories={subCategories} />
    </div>
  );
}