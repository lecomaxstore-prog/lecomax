import { OFFICIAL_SOCIAL_IMAGE, SOCIAL_IMAGE_METADATA } from "@/lib/social-image";
import { isBestsellerEligible, selectBestsellers } from "@/lib/bestseller-eligibility";
import { STOREFRONT_TITLE, STOREFRONT_DESCRIPTION } from "@/lib/storefront-metadata";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import HeroBanner from "@/components/HeroBanner";
import CategoryTiles from "@/components/CategoryTiles";
import ProductRail from "@/components/ProductRail";
import Image from "next/image";
import Link from "next/link";
import { ECOMEDIA_COMMUNITY_AUTHOR_PREFIX } from "@/lib/ecomedia";
import { supabaseServiceHeaders } from "@/lib/supabase-service-headers";

// Lazy-load heavy below-fold components — keeps initial JS bundle small
const OurProductsGrid = dynamic(() => import("@/components/OurProductsGrid"));
const ScrollReveal = dynamic(() => import("@/components/ScrollReveal"));
const Testimonials = dynamic(() => import("@/components/Testimonials"));
const NewsletterForm = dynamic(() => import("@/components/NewsletterForm"));
import { type CardProduct, products as catalogProducts } from "@/lib/products";
import { getDbProducts, getReviewStats } from "@/lib/db-server";
import type { HeroBannerRecord } from "@/lib/hero-banners";
import { shippingConfigFromSettings, formatShippingAmount, shippingSummary } from "@/lib/shipping-config";
import { getServerShippingConfig } from "@/lib/shipping-config-server";
import { serializeJsonLd } from "@/lib/seo";

const SITE_URL_PAGE = "https://lecomax.com";

const defaultHomeMetadata: Metadata = {
  title: STOREFRONT_TITLE,
  description: STOREFRONT_DESCRIPTION,
  keywords: [
    "boutique en ligne Maroc",
    "acheter chaussures Maroc",
    "vêtements sport Maroc",
    "écouteurs sans fil Maroc",
    "manette gaming Maroc",
    "livraison Maroc",
    "paiement à la livraison",
    "L'ecomax",
    "lecomax.com",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_MA",
    url: SITE_URL_PAGE,
    siteName: "L'ecomax",
    title: STOREFRONT_TITLE,
    description: STOREFRONT_DESCRIPTION,
    images: [SOCIAL_IMAGE_METADATA],
  },
  twitter: {
    card: "summary_large_image",
    title: STOREFRONT_TITLE,
    description: STOREFRONT_DESCRIPTION,
    images: [OFFICIAL_SOCIAL_IMAGE],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const config = await getServerShippingConfig();
  const replaceShipping = (value: unknown): string | undefined => typeof value === "string"
    ? value.replace(/\{\{shipping\}\}/g, `${formatShippingAmount(config.cost)} MAD`)
    : undefined;
  return {
    ...defaultHomeMetadata,
    description: replaceShipping(defaultHomeMetadata.description),
    openGraph: {
      ...defaultHomeMetadata.openGraph,
      description: replaceShipping(defaultHomeMetadata.openGraph?.description),
    },
    twitter: {
      ...defaultHomeMetadata.twitter,
      description: replaceShipping(defaultHomeMetadata.twitter?.description),
    },
  };
}

export const revalidate = 60; // ISR — revalidate every 60 seconds

async function getHeroImages() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/settings?key=in.(hero_image,hero_image_mobile,shipping_cost,free_shipping_threshold,shipping_estimated_days)&select=key,value`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return {};
    const rows: { key: string; value: string }[] = await res.json();
    return Object.fromEntries(rows.filter(r => r.value).map(r => [r.key, r.value]));
  } catch {
    return {};
  }
}

async function getHeroBanners(): Promise<HeroBannerRecord[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/banners?active=eq.true&select=*&order=sort_order.asc,created_at.asc`,
      { headers: supabaseServiceHeaders(), cache: "no-store" }
    );
    return response.ok ? await response.json() : [];
  } catch { return []; }
}

export default async function HomePage() {
  // Read the same live catalogue used by the app.
  const [dbProducts, heroImages, heroBanners, reviewStats, promotionProducts] = await Promise.all([
    getDbProducts({ activeOnly: true }),
    getHeroImages(),
    getHeroBanners(),
    getReviewStats(),
    getDbProducts({ activeOnly: true, promotionOnly: true }),
  ]);
  const shippingConfig = shippingConfigFromSettings(heroImages);

  // The homepage promotes the latest official photo post, never a text-only
  // guide or a video. Text content remains available in the Ecomedia feed.
  let latestPost: { id: string; title: string; content?: string; slug: string; media_url?: string; thumbnail_url?: string; likes_count: number; comments_count: number } | null = null;
  try {
    const ecomediaParams = new URLSearchParams({
      is_published: "eq.true",
      type: "eq.image",
      media_url: "not.is.null",
      or: `(cta_text.is.null,cta_text.not.like.${ECOMEDIA_COMMUNITY_AUTHOR_PREFIX}*)`,
      order: "created_at.desc",
      limit: "1",
      select: "id,title,content,slug,media_url,thumbnail_url,likes_count,comments_count",
    });
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/ecomedia_posts?${ecomediaParams}`,
      {
        headers: supabaseServiceHeaders(),
        cache: "no-store",
      }
    );
    if (res.ok) { const rows = await res.json(); latestPost = rows[0] ?? null; }
  } catch { /* silent */ }

  // Keep the storefront populated while the live catalogue is unavailable.
  const sourceProducts = dbProducts.length > 0 ? dbProducts : catalogProducts;
  const allProducts: CardProduct[] = sourceProducts.map((p) => ({
    ...p,
    rating: reviewStats[p.slug]?.rating,
    reviewCount: reviewStats[p.slug]?.count,
  }));

  // Preserve the original selection; automatically include products created
  // after this feature was enabled. The live catalogue is newest first.
  const automaticNewArrivalsSince = Date.parse("2026-09-15T10:14:41Z");
  const originalNewArrivals = allProducts.filter((product) => product.badge === "Nouveau");
  const existingSelection = originalNewArrivals.length > 0 ? originalNewArrivals : allProducts;
  const futureNewArrivals = allProducts.filter((product) =>
    product.createdAt && Date.parse(product.createdAt) >= automaticNewArrivalsSince
  );
  const futureSlugs = new Set(futureNewArrivals.map((product) => product.slug));
  const newArrivals: CardProduct[] = [
    ...futureNewArrivals,
    ...existingSelection.filter((product) => !futureSlugs.has(product.slug)),
  ].slice(0, 8).map((product) => ({
    ...product,
    badge: "Nouveau",
  }));
  const bestsellerCandidates = allProducts.filter(isBestsellerEligible);
  const bestSellers = bestsellerCandidates.filter((p) => p.badge === "Bestseller");
  const bestSellersForRail = selectBestsellers(allProducts, bestSellers.length > 0 ? bestSellers : bestsellerCandidates).slice(0, 8);

  const SITE_URL = "https://lecomax.com";
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Produits L'ecomax",
    "url": SITE_URL,
    "numberOfItems": allProducts.length,
    "itemListElement": allProducts.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": `${SITE_URL}/produit/${p.slug}/`,
      "name": p.name,
    })),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Quels sont les frais de livraison au Maroc ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${shippingSummary(shippingConfig)} Le délai estimé est de ${shippingConfig.estimatedDays}.`
        }
      },
      {
        "@type": "Question",
        "name": "Puis-je payer à la livraison sur L'ecomax ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Oui, L'ecomax propose le paiement à la livraison (Cash on Delivery) partout au Maroc. Vous payez uniquement à la réception de votre commande."
        }
      },
      {
        "@type": "Question",
        "name": "Quelle est la politique de retour de L'ecomax ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Vous disposez de 30 jours après réception pour demander un retour, sous réserve des conditions de notre politique de retour. Consultez la page Retours pour les modalités et délais de remboursement."
        }
      },
      {
        "@type": "Question",
        "name": "L'ecomax livre-t-il dans toutes les villes du Maroc ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Oui, L'ecomax livre dans toutes les villes du Maroc : Casablanca, Rabat, Marrakech, Fès, Tanger, Agadir, Meknès, Oujda, Sidi Bennour et partout ailleurs."
        }
      },
      {
        "@type": "Question",
        "name": "Comment suivre ma commande L'ecomax ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Vous pouvez suivre votre commande en temps réel sur la page de suivi de commande disponible sur lecomax.com/suivre-commande. Un numéro de suivi vous est envoyé par SMS dès l'expédition."
        }
      },
      {
        "@type": "Question",
        "name": "Quels types de produits vend L'ecomax ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "L'ecomax est une marketplace lifestyle généraliste, ouverte à tous les univers du quotidien. Découvrez nos catégories et nos produits disponibles : notre sélection évolue au fil des nouveautés, sans se limiter à la mode, au sport ou à la tech."
        }
      }
    ]
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL_PAGE}/#webpage`,
    "url": SITE_URL_PAGE,
    "name": STOREFRONT_TITLE,
    "description": `Boutique en ligne au Maroc — chaussures running, vêtements tendance, écouteurs Bluetooth, enceintes HiFi et accessoires gaming. Livraison ${formatShippingAmount(shippingConfig.cost)} MAD partout au Maroc.`,
    "isPartOf": { "@id": `${SITE_URL_PAGE}/#website` },
    "about": { "@id": `${SITE_URL_PAGE}/#organization` },
    "inLanguage": "fr-MA",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE_URL_PAGE }
      ]
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(webPageSchema) }} />
      <HeroBanner
        banners={heroBanners}
        heroImage={heroImages.hero_image}
        heroImageMobile={heroImages.hero_image_mobile}
        shippingCost={heroImages.shipping_cost}
      />

      <ProductRail
        title="Nouveautés"
        cardStyle="collection"
        products={newArrivals}
        cta={{ label: "Tout voir", href: "/nouveautes" }}
      />

      <CategoryTiles />

      <OurProductsGrid products={allProducts} />

      <ProductRail
        title="Bestsellers"
        refined
        products={bestSellersForRail}
        cta={{ label: "Tout voir", href: "/bestsellers" }}
      />

      {/* ── Promo strip ─────────────────────────────────────────── */}
      <ScrollReveal direction="scale">
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <Image
          src="/images/promotion%20section%20photo.png"
          alt="Promotion L'ecomax"
          fill
          sizes="100vw"
          className="object-cover object-[center_15%] opacity-90"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 flex flex-col md:flex-row md:items-center md:justify-between gap-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold mb-4">
              Offre limitée
            </p>
            <h2 className="h-display text-4xl md:text-[5.5rem] max-w-xl leading-[0.88]">
              Jusqu&apos;à&nbsp;
              <span className="text-[#3ecf4c]">−40%</span>
              <br />sur une sélection
            </h2>
          </div>
          <div className="flex flex-col gap-5 md:items-end">
            <p className="text-white/50 max-w-xs text-[13px] leading-relaxed md:text-right">
              Réductions exceptionnelles sur des incontournables.
              Tant qu&apos;il y en a.
            </p>
            <Link
              href="/promotions"
              className="self-start md:self-auto bg-[#3ecf4c] text-black px-8 py-4 font-black uppercase text-[11px] tracking-[0.18em] hover:bg-[#34b841] active:scale-[0.97] transition-all inline-flex items-center gap-2.5"
            >
              Voir les promos
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </section>
      </ScrollReveal>

      <ProductRail
        title="En promotion"
        products={(promotionProducts.length > 0 ? promotionProducts : allProducts.filter(p => (p.oldPrice ?? 0) > p.price)).slice(0, 8).map(p => ({ ...p, rating: reviewStats[p.slug]?.rating, reviewCount: reviewStats[p.slug]?.count }))}
        cta={{ label: "Voir les promos", href: "/promotions" }}
      />

      <Testimonials />

      {/* ── ecoClub ─────────────────────────────────────────────── */}      <ScrollReveal direction="up">      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-[1.2fr_1fr] gap-12 items-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold mb-4">
            ecoClub
          </p>
          <h2 className="h-display text-4xl md:text-[3.5rem]">
            Plus que des<br/>récompenses
          </h2>
          <p className="mt-5 text-neutral-500 max-w-lg text-[14px] leading-relaxed">
            Adhérez gratuitement et profitez d&apos;avantages exclusifs : accès
            anticipé aux nouveautés, livraison gratuite, et invitations à des
            événements.
          </p>
          <ul className="mt-6 space-y-3">
            {["Accès anticipé aux nouveautés", "Livraison gratuite permanente", "Offres membres exclusives"].map(b => (
              <li key={b} className="flex items-center gap-3 text-[13px] text-neutral-600">
                <span className="w-5 h-5 shrink-0 bg-black text-white flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                {b}
              </li>
            ))}
          </ul>
          <Link
            href="/connexion"
            className="inline-flex items-center gap-2.5 mt-8 bg-black text-white px-8 py-4 font-black uppercase text-[11px] tracking-[0.18em] hover:bg-neutral-800 active:scale-[0.97] transition-all"
          >
            Rejoindre l&apos;ecoClub
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
        <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden group">
          <Image
            src="/images/ecoclub-community.jpg"
            alt="Communauté ecoClub"
            fill
            sizes="(min-width: 768px) 40vw, 100vw"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
          />
          {/* Minimal overlay */}
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-500" />
        </div>
      </section>
      </ScrollReveal>

      {/* ── Ecomedia Community ─────────────────────────────────── */}
      <ScrollReveal direction="up">
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-6 md:py-24">
        <div className="mb-9 grid gap-7 border-b border-neutral-200 pb-9 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950 shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.34em] text-neutral-950">Ecomedia</p>
                <p className="mt-0.5 text-[10px] font-medium text-neutral-400">Le média social de L&apos;ecomax</p>
              </div>
            </div>
            <h2 className="h-display text-[2.7rem] leading-[.92] tracking-[-.035em] text-neutral-950 sm:text-5xl md:text-[4.4rem]">
              Plus qu&apos;une boutique.<br/><span className="text-neutral-400">Une communauté.</span>
            </h2>
          </div>
          <div className="max-w-sm md:text-right">
            <p className="mb-5 text-sm leading-6 text-neutral-500">Découvrez les nouveautés, les coulisses et les offres réservées à notre communauté.</p>
            <Link href="/ecomedia" className="group inline-flex min-h-12 items-center gap-4 bg-neutral-950 px-6 text-[10px] font-black uppercase tracking-[.2em] text-white transition hover:bg-[#16b277] active:scale-[.98]">
              Rejoindre Ecomedia
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-1" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.75rem] border border-neutral-800 bg-[#080b09] text-white shadow-[0_30px_80px_rgba(0,0,0,.14)]">
          <div className="pointer-events-none absolute inset-0 opacity-[.035]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
          <div className="pointer-events-none absolute -left-48 top-0 h-[500px] w-[500px] rounded-full bg-[#3ecf4c]/10 blur-[120px]" />

          <div className={`relative grid ${latestPost ? "lg:grid-cols-[1.05fr_.95fr]" : ""}`}>
            <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-14">
              <div>
                <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
                  <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.3em] text-[#3ecf4c]"><span className="h-1.5 w-1.5 rounded-full bg-[#3ecf4c] shadow-[0_0_12px_#3ecf4c]"/>En direct de la communauté</span>
                  <span className="font-mono text-[10px] text-white/60">ECOMEDIA</span>
                </div>
                <h3 className="max-w-xl text-[1.9rem] font-semibold leading-[1.18] tracking-[-.035em] sm:text-4xl lg:text-5xl">
                  L&apos;actualité L&apos;ecomax,<br/><span className="text-[#3ecf4c]">en avant-première.</span>
                </h3>
                <p className="mt-5 max-w-lg text-sm leading-7 text-[#becbc0]">Nouveautés, inspirations et coulisses : découvrez ce qui anime L’ECOMAX et partagez vos envies avec la communauté.</p>

                <div className="mt-7 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { label: "Découvrir", sub: "Les nouveautés", path: "M4 12h16M12 4v16" },
                    { label: "Échanger", sub: "Avec la marque", path: "M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2v10Z" },
                    { label: "Profiter", sub: "Des offres privées", path: "M20 12v8H4v-8M2 7h20v5H2zM12 7v13M12 7H7.5a2.5 2.5 0 110-5C11 2 12 7 12 7Zm0 0h4.5a2.5 2.5 0 100-5C13 2 12 7 12 7Z" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[.04] p-4 sm:flex-col sm:items-start sm:gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3ecf4c]/10">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8cde91" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={item.path}/></svg>
                      </span>
                      <div><p className="text-[13px] font-semibold text-white">{item.label}</p><p className="mt-1 text-xs leading-5 text-[#becbc0]">{item.sub}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
                <Link href="/ecomedia" className="group inline-flex min-h-12 w-full items-center justify-between gap-6 rounded-xl bg-[#c4e8b4] px-5 py-3 text-sm font-semibold text-[#173c28] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c4e8b4] sm:w-auto">
                  Explorer le fil
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-1" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </Link>
                <span className="flex items-center gap-2 text-xs text-[#becbc0]"><span className="h-1.5 w-1.5 rounded-full bg-[#8cde91]"/>Toute l’actualité, au même endroit</span>
              </div>
            </div>

            {latestPost ? (
              <div className="relative flex items-center justify-center border-t border-white/10 bg-white/[.025] p-6 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
                <Link href={`/ecomedia/${latestPost.slug}`} className="group block w-full max-w-[430px]" aria-label={`Voir la publication : ${latestPost.title}`}>
                  <div className="overflow-hidden rounded-[1.4rem] border border-white/15 bg-[#111512] shadow-[0_28px_70px_rgba(0,0,0,.5)] transition duration-500 group-hover:-translate-y-1 group-hover:border-[#3ecf4c]/60">
                    <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#3ecf4c]/60 bg-black p-1"><img src="/brand/lecomax-premium-icon.png" alt="" className="h-full w-full object-cover" /></div>
                      <div><p className="text-[11px] font-black">L&apos;ecomax</p><p className="mt-0.5 text-[9px] text-white/35">Publication officielle</p></div>
                      <span className="ml-auto flex items-center gap-1.5 rounded-full border border-[#3ecf4c]/25 bg-[#3ecf4c]/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-[#3ecf4c]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3ecf4c]"/>Nouveau</span>
                    </div>

                    {(latestPost.thumbnail_url || latestPost.media_url) ? (
                      <div className="overflow-hidden bg-neutral-900">
                        <img
                          src={latestPost.thumbnail_url || latestPost.media_url!}
                          alt={latestPost.title}
                          loading="lazy"
                          decoding="async"
                          className="block h-auto w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.012]"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-[radial-gradient(circle_at_center,rgba(62,207,76,.15),transparent_65%)] p-10 text-center"><p className="h-display text-3xl leading-tight">{latestPost.title}</p></div>
                    )}

                    <div className="p-4 sm:p-5">
                      <p className="line-clamp-2 text-sm font-black leading-5 text-white">{latestPost.title}</p>
                      {latestPost.content && <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-white/40">{latestPost.content}</p>}
                      <div className="mt-4 flex items-center border-t border-white/10 pt-4 text-[10px] text-white/45">
                        <span className="flex items-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 00-7.8 7.8l1.1 1.1L12 21.2l7.8-7.8a5.5 5.5 0 000-7.8Z"/></svg>{latestPost.likes_count}</span>
                        <span className="ml-4 flex items-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10Z"/></svg>{latestPost.comments_count}</span>
                        <span className="ml-auto flex items-center gap-2 font-black uppercase tracking-wider text-[#3ecf4c]">Voir le post <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-1" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ) : (
              <div className="mx-6 mb-6 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.03] p-4 sm:mx-10 sm:mb-10 lg:mx-14 lg:mb-14">
                <svg className="mt-0.5 shrink-0 text-[#8cde91]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 4h16v12H8l-4 4V4Z"/></svg>
                <div><p className="text-sm font-medium text-white">À découvrir prochainement</p><p className="mt-1 text-xs leading-5 text-[#becbc0]">Les nouvelles publications apparaîtront ici.</p></div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 px-1 text-[10px] font-bold uppercase tracking-[.16em] text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <span>Produits · Conseils · Coulisses · Offres privées</span>
          <span className="normal-case tracking-normal text-neutral-500">Une publication L&apos;ecomax, pensée pour la communauté.</span>
        </div>
      </section>
      </ScrollReveal>

      {/* ── Newsletter ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-neutral-950 border-t border-white/5">
        {/* Glow blob */}
        <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.06] blur-[120px] -translate-y-1/2 translate-x-1/4" style={{ background: "#3ecf4c" }} />

        <div className="relative grid md:grid-cols-2 gap-0 items-stretch">

          {/* ── Left: photo ─────────────────────────── */}
          <div className="relative h-full min-h-[340px] overflow-hidden">
            <Image
              src="/images/newsletter.png"
              alt="Newsletter L'ecomax"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
            {/* Bottom gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />
            {/* Stats bar pinned to bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-6 px-8 pb-6">
              {[
                { num: "117", label: "Abonnés" },
                { num: "100%", label: "Sans spam" },
                { num: "1 clic", label: "Résiliation" },
              ].map(({ num, label }) => (
                <div key={label}>
                  <p className="text-white font-black text-[17px] h-display leading-none">{num}</p>
                  <p className="text-neutral-400 text-[10px] uppercase tracking-[0.12em] mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: copy + form ────────────────────────── */}
          <div className="flex flex-col justify-center border-t border-white/5 pt-10 md:border-t-0 md:pt-0 md:border-l md:border-white/5 px-8 md:px-16 lg:px-24 py-16 md:py-24">
            <div className="inline-flex items-center gap-2 mb-5 self-start px-3 py-1.5 border border-[#3ecf4c]/30" style={{ background: "rgba(62,207,76,0.06)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf4c] animate-pulse" />
              <p className="text-[#3ecf4c] text-[10px] font-black uppercase tracking-[0.4em]">Newsletter exclusive</p>
            </div>

            <h2 className="h-display text-[2.6rem] md:text-[3.2rem] text-white leading-[0.9] mb-5">
              Soyez<br />
              <span className="text-[#3ecf4c]">les premiers</span><br />
              informés.
            </h2>

            <p className="text-neutral-400 text-[13px] leading-relaxed max-w-[340px] mb-8">
              Offres exclusives, nouveautés et ventes privées — directement dans votre boîte mail, avant tout le monde.
            </p>

            <NewsletterForm />

            <ul className="space-y-2 mt-6 pt-6 border-t border-white/5">
              {[
                "Offres exclusives membres",
                "Alertes nouveautés en avant-première",
                "Accès aux ventes privées",
              ].map((label) => (
                <li key={label} className="flex items-center gap-2.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-[12px] text-neutral-500">{label}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

      {/* ── SEO text block ──────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-neutral-100">
        <h2 className="text-xl font-black mb-6 text-neutral-800">
          L&apos;ecomax — Votre marketplace lifestyle au Maroc
        </h2>
        <div className="grid md:grid-cols-2 gap-8 text-neutral-500 text-[14px] leading-relaxed">
          <div>
            <p>
              L&apos;ecomax est une marketplace lifestyle généraliste qui réunit des trouvailles, des envies et des essentiels pour votre quotidien. Explorez nos univers et découvrez une sélection qui s&apos;enrichit au fil des nouveautés. Une seule adresse pour accompagner votre style de vie, aujourd&apos;hui et demain.
            </p>
          </div>
          <div>
            <p>
              Nous livrons partout au Maroc — Casablanca, Rabat, Marrakech, Fès, Tanger, Agadir, Meknès, Oujda et toutes les villes — à seulement {formatShippingAmount(shippingConfig.cost)} MAD. {shippingConfig.freeThreshold > 0 && <>Livraison offerte dès {formatShippingAmount(shippingConfig.freeThreshold)} MAD d&apos;achats. </>}Paiement à la livraison disponible sur toutes les commandes. Retours sous 30 jours, selon conditions. Commandez en toute confiance sur lecomax.com.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
