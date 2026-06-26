import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  categories,
  productsByCategory,
  subCategoriesFor,
  type CardProduct,
} from "@/lib/products";
import { getDbProducts, getReviewStats } from "@/lib/db-server";
import CategoryFilters from "@/components/CategoryFilters";

const valid = new Set(categories.map((c) => c.slug));

const SITE_URL = "https://lecomax.com";

const categoryMeta: Record<string, { title: string; description: string; keywords: string[] }> = {
  homme: {
    title: "Vêtements Homme | L'ecomax — Maroc",
    description: "Collection vêtements homme au Maroc : vestes, bombers, sweats et hoodies tendance. Livraison 35 MAD partout au Maroc. Paiement à la livraison.",
    keywords: ["vêtements homme Maroc", "veste homme Maroc", "bomber homme Maroc", "sweat hoodie homme", "mode homme Maroc"],
  },
  femme: {
    title: "Vêtements & Chaussons Femme | L'ecomax — Maroc",
    description: "Collection femme au Maroc : chaussons confortables, vestes, bombers et hoodies tendance. Style et chaleur au quotidien. Livraison 35 MAD. Paiement à la livraison.",
    keywords: ["vêtements femme Maroc", "chaussons femme Maroc", "chaussons hiver femme", "bomber femme Maroc", "mode femme Maroc"],
  },
  chaussures: {
    title: "Chaussures Sport & Lifestyle | L'ecomax — Maroc",
    description: "Chaussures running, trail et lifestyle au Maroc. Baskets respirantes légères disponibles en plusieurs coloris. Livraison 35 MAD partout au Maroc. Paiement à la livraison.",
    keywords: ["chaussures sport Maroc", "chaussures running Maroc", "baskets Maroc", "chaussures lifestyle Maroc", "sneakers Maroc"],
  },
  accessoires: {
    title: "Accessoires Tech & Gaming | L'ecomax — Maroc",
    description: "Accessoires tech au Maroc : manettes gaming sans fil, écouteurs TWS, enceintes Bluetooth, sacs à dos anti-vol. Livraison 35 MAD. Paiement à la livraison.",
    keywords: ["accessoires tech Maroc", "manette gaming Maroc", "écouteurs sans fil Maroc", "sac à dos Maroc", "enceinte bluetooth Maroc"],
  },
};

const categorySeoContent: Record<string, { heading: string; body: string }> = {
  homme: {
    heading: "Vêtements Homme au Maroc — Style & Confort",
    body: "Découvrez notre collection de vêtements homme soigneusement sélectionnés pour le style et la performance. Vestes de sport, bombers tendance, sweats et hoodies disponibles dans des coupes modernes adaptées à toutes les morphologies. Chaque article est choisi pour son rapport qualité-prix exceptionnel. Livraison rapide à 35 MAD partout au Maroc — Casablanca, Rabat, Marrakech, Fès, Tanger, Agadir et toutes les villes. Paiement à la livraison disponible. Retours gratuits sous 30 jours.",
  },
  femme: {
    heading: "Vêtements & Chaussons Femme au Maroc — Confort & Tendance",
    body: "Retrouvez notre sélection de chaussons et vêtements pour femme adaptés à toutes les saisons. Chaussons d'intérieur en peluche chauds et moelleux, chaussons à fleurs tendance, chaussons extérieur antidérapants — des modèles confortables pour la maison et les courtes sorties. Également vestes et hoodies féminins pour compléter votre garde-robe. Articles en promotion régulièrement. Livraison 35 MAD partout au Maroc, paiement à la livraison, retours gratuits 30 jours.",
  },
  chaussures: {
    heading: "Chaussures de Sport & Running au Maroc",
    body: "Trouvez la chaussure idéale parmi notre sélection de baskets et chaussures de sport au Maroc. Modèles respirants ultra-légers pour la course à pied et la marche quotidienne, avec semelles souples pour un confort toute la journée. Disponibles en plusieurs couleurs et pointures (38 à 45). Idéales pour le running, le tennis et les activités sportives. Livraison express à 35 MAD partout au Maroc avec paiement à la livraison. Retours gratuits sous 30 jours.",
  },
  accessoires: {
    heading: "Accessoires Tech & Gaming au Maroc — Qualité Premium",
    body: "Explorez notre gamme d'accessoires tech sélectionnés pour leur qualité et innovation. Enceintes Bluetooth HiFi son stéréo cinéma, écouteurs sans fil TWS avec microphone intégré, manettes gaming sans fil compatibles iOS/PC/Switch/Android, sacs à dos anti-vol pour le voyage et le quotidien. Tous nos produits sont testés et garantis. Livraison à 35 MAD partout au Maroc — Casablanca, Rabat, Marrakech et toutes les villes. Paiement à la livraison, retours gratuits 30 jours.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = categories.find((c) => c.slug === category);
  if (!cat) return {};
  const meta = categoryMeta[category] ?? {
    title: `${cat.label} | L'ecomax`,
    description: cat.description,
    keywords: [],
  };
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: `${SITE_URL}/${category}/` },
    openGraph: {
      type: "website",
      locale: "fr_MA",
      url: `${SITE_URL}/${category}/`,
      title: meta.title,
      description: meta.description,
      images: [{ url: `${SITE_URL}${cat.hero}`, width: 1200, height: 630, alt: cat.label }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
  };
}

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

  // Check if it's a custom CMS page first
  if (!valid.has(category as never)) {
    const supa = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: page } = await supa.from("pages").select("*").eq("slug", category).eq("active", true).single();
    if (page) return <CustomPage page={page} />;
    notFound();
  }

  const cat = categories.find((c) => c.slug === category)!;

  // Fetch DB products + static products, deduplicated by slug
  const [dbProducts, staticList, reviewStats] = await Promise.all([
    getDbProducts({ category, activeOnly: true }),
    Promise.resolve(productsByCategory(category) as CardProduct[]),
    getReviewStats(),
  ]);
  const dbSlugs = new Set(dbProducts.map((p) => p.slug));
  const list: CardProduct[] = [
    ...dbProducts,
    ...staticList.filter((p) => !dbSlugs.has(p.slug)),
  ].map((p) => ({
    ...p,
    rating: reviewStats[p.slug]?.rating,
    reviewCount: reviewStats[p.slug]?.count,
  }));

  // Build subCategories from merged list
  const subCategoriesFromDb = [...new Set(dbProducts.map((p) => p.subCategory).filter(Boolean))] as string[];
  const staticSubs = subCategoriesFor(category);
  const subCategories = [...new Set([...subCategoriesFromDb, ...staticSubs])];

  const newCount = list.filter((p) => p.badge === "Nouveau").length;
  const promoCount = list.filter((p) => p.oldPrice).length;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${SITE_URL}/${category}/#breadcrumb`,
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": cat.label, "item": `${SITE_URL}/${category}/` },
    ],
  };

  const categoryPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": categoryMeta[category]?.title ?? `${cat.label} | L'ecomax`,
    "description": categoryMeta[category]?.description ?? cat.description,
    "url": `${SITE_URL}/${category}/`,
    "inLanguage": "fr-MA",
    "numberOfItems": list.length,
    "breadcrumb": { "@id": `${SITE_URL}/${category}/#breadcrumb` },
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryPageSchema) }} />
      {/* Hero */}
      <section className="relative h-[58vh] min-h-[380px] bg-black overflow-hidden">
        <Image
          src={cat.hero}
          alt={cat.label}
          fill
          priority
          sizes="100vw"
          className="object-cover scale-[1.03] transition-transform duration-[8s] ease-out"
          style={{ objectPosition: category === 'chaussures' ? 'center 65%' : 'center 20%' }}
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

      {/* SEO content block */}
      {categorySeoContent[category] && (
        <section className="max-w-4xl mx-auto px-6 py-16 border-t border-neutral-100">
          <h2 className="text-xl font-black mb-4 text-neutral-800">
            {categorySeoContent[category].heading}
          </h2>
          <p className="text-neutral-500 text-[14px] leading-relaxed">
            {categorySeoContent[category].body}
          </p>
        </section>
      )}
    </div>
  );
}

// ─── Custom CMS Page renderer ────────────────────────────────────────────────
function CustomPage({ page }: {
  page: { title: string; slug: string; content: string | null; meta_title: string | null };
}) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <nav className="flex items-center gap-2 text-neutral-400 text-[11px] uppercase tracking-[0.2em] mb-8">
        <Link href="/" className="hover:text-black transition-colors">Accueil</Link>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
        <span className="text-neutral-700 font-semibold">{page.title}</span>
      </nav>
      <h1 className="text-4xl font-black mb-8 leading-tight">{page.title}</h1>
      {page.content ? (
        <div
          className="prose prose-neutral max-w-none prose-headings:font-black prose-a:text-black prose-a:underline prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      ) : (
        <p className="text-neutral-400">Cette page est vide pour l&apos;instant.</p>
      )}
    </div>
  );
}