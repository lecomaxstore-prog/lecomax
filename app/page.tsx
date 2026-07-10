import type { Metadata } from "next";
import dynamic from "next/dynamic";
import HeroBanner from "@/components/HeroBanner";
import CategoryTiles from "@/components/CategoryTiles";
import ProductRail from "@/components/ProductRail";
import Image from "next/image";
import Link from "next/link";

// Lazy-load heavy below-fold components — keeps initial JS bundle small
const OurProductsGrid = dynamic(() => import("@/components/OurProductsGrid"));
const ScrollReveal = dynamic(() => import("@/components/ScrollReveal"));
const Testimonials = dynamic(() => import("@/components/Testimonials"));
const NewsletterForm = dynamic(() => import("@/components/NewsletterForm"));
import { products as staticProducts, type CardProduct } from "@/lib/products";
import { getDbProducts, getReviewStats } from "@/lib/db-server";

const SITE_URL_PAGE = "https://lecomax.com";

export const metadata: Metadata = {
  title: "L'ecomax — Chaussures, Vêtements & Accessoires Tech au Maroc",
  description:
    "L'ecomax : boutique en ligne au Maroc — chaussures running, vêtements tendance, écouteurs Bluetooth, enceintes HiFi et manettes gaming. Livraison 35 MAD partout au Maroc. Paiement à la livraison. Retours gratuits 30 jours.",
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
    title: "L'ecomax — Chaussures, Vêtements & Accessoires Tech au Maroc",
    description:
      "Boutique en ligne Maroc — chaussures, vêtements sport, écouteurs, enceintes et gaming. Livraison 35 MAD partout au Maroc. Paiement à la livraison.",
    images: [
      {
        url: `${SITE_URL_PAGE}/ecomax-hero-banner.jpg.png`,
        width: 1200,
        height: 630,
        alt: "L'ecomax — Boutique en ligne Maroc",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "L'ecomax — Chaussures, Vêtements & Accessoires Tech au Maroc",
    description:
      "Boutique en ligne Maroc — chaussures, vêtements, écouteurs, enceintes et gaming. Livraison 35 MAD.",
    images: [`${SITE_URL_PAGE}/ecomax-hero-banner.jpg.png`],
  },
};

export const revalidate = 60; // ISR — revalidate every 60 seconds

async function getHeroImages() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/settings?key=in.(hero_image,hero_image_mobile,shipping_cost)&select=key,value`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return {};
    const rows: { key: string; value: string }[] = await res.json();
    return Object.fromEntries(rows.filter(r => r.value).map(r => [r.key, r.value]));
  } catch {
    return {};
  }
}

export default async function HomePage() {
  // Merge DB products with static, DB products appear first
  const [dbProducts, heroImages, reviewStats] = await Promise.all([
    getDbProducts({ activeOnly: true }),
    getHeroImages(),
    getReviewStats(),
  ]);

  // Fetch latest Ecomedia post for homepage teaser
  let latestPost: { id: string; title: string; content?: string; slug: string; media_url?: string; thumbnail_url?: string; likes_count: number; comments_count: number } | null = null;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/ecomedia_posts?is_published=eq.true&order=created_at.desc&limit=1&select=id,title,content,slug,media_url,thumbnail_url,likes_count,comments_count`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        next: { revalidate: 60 },
      }
    );
    if (res.ok) { const rows = await res.json(); latestPost = rows[0] ?? null; }
  } catch { /* silent */ }

  const dbSlugs = new Set(dbProducts.map((p) => p.slug));
  const allProducts: CardProduct[] = [
    ...dbProducts,
    ...(staticProducts as CardProduct[]).filter((p) => !dbSlugs.has(p.slug)),
  ].map((p) => ({
    ...p,
    rating: reviewStats[p.slug]?.rating,
    reviewCount: reviewStats[p.slug]?.count,
  }));

  const newArrivals = allProducts.filter((p) => p.badge === "Nouveau");
  const bestSellers = allProducts.filter((p) => p.badge === "Bestseller");
  // Fall back: if no featured in DB, show first 4 DB products as "nouveautés"
  const featuredForRail = (newArrivals.length > 0 ? newArrivals : dbProducts).slice(0, 8);
  const bestSellersForRail = bestSellers.length > 0 ? bestSellers : dbProducts.slice(0, 8);

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
      ...(p.price ? { "offers": { "@type": "Offer", "price": p.price, "priceCurrency": "MAD", "availability": "https://schema.org/InStock" } } : {}),
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
          "text": "La livraison est à 35 MAD partout au Maroc, quel que soit le montant de la commande. Les commandes sont expédiées sous 24h et livrées en 2 à 5 jours ouvrables."
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
          "text": "Vous disposez de 30 jours après réception pour retourner un article. Les retours sont gratuits et le remboursement est effectué sous 3 à 5 jours ouvrables."
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
          "text": "L'ecomax propose des chaussures de sport et lifestyle, des vêtements tendance (homme et femme), des écouteurs Bluetooth, des enceintes HiFi et des accessoires gaming comme des manettes sans fil. Tous les produits sont sélectionnés pour leur qualité et leur rapport qualité-prix."
        }
      }
    ]
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL_PAGE}/#webpage`,
    "url": SITE_URL_PAGE,
    "name": "L'ecomax — Chaussures, Vêtements & Accessoires Tech au Maroc",
    "description": "Boutique en ligne au Maroc — chaussures running, vêtements tendance, écouteurs Bluetooth, enceintes HiFi et accessoires gaming. Livraison 35 MAD partout au Maroc.",
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <HeroBanner
        heroImage={heroImages.hero_image}
        heroImageMobile={heroImages.hero_image_mobile}
        shippingCost={heroImages.shipping_cost}
      />

      <ProductRail
        title="Nouveautés"
        products={featuredForRail}
        cta={{ label: "Tout voir", href: "/nouveautes" }}
      />

      <CategoryTiles />

      <OurProductsGrid products={allProducts} />

      <ProductRail
        title="Bestsellers"
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
        products={allProducts.filter((p) => p.oldPrice)}
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
            src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=80"
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
      <section className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold">Ecomedia</p>
            </div>
            <h2 className="h-display text-4xl md:text-[3rem] leading-[1.02]">
              Notre<br/>communauté
            </h2>
          </div>
          <Link
            href="/ecomedia"
            className="inline-flex items-center gap-2.5 bg-black text-white px-7 py-3.5 font-black uppercase text-[11px] tracking-[0.18em] hover:bg-neutral-800 active:scale-[0.97] transition-all self-start md:self-auto shrink-0"
          >
            Rejoindre
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>

        {/* Feature banner */}
        <div className="relative overflow-hidden rounded-2xl bg-neutral-950 p-8 md:p-12">
          {/* Glows */}
          <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] animate-ecomedia-glow" style={{ background: "#3ecf4c" }} />
          <div className="pointer-events-none absolute -bottom-20 right-1/3 w-64 h-64 rounded-full blur-[100px] animate-ecomedia-glow delay-300" style={{ background: "#16b277" }} />

          <div className={`relative grid gap-10 items-center ${latestPost ? "md:grid-cols-[1fr_300px]" : "md:grid-cols-[1fr_auto]"}`}>
            <div className="flex flex-col gap-6">
              {/* Label */}
              <div className="flex items-center gap-3 animate-ecomedia-fade-up">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.35em] text-[#3ecf4c]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf4c] animate-pulse" />
                  Nouveau sur Ecomedia
                </span>
              </div>

              {/* Headline */}
              <div className="animate-ecomedia-fade-up delay-100">
                <h3 className="h-display text-4xl md:text-[3rem] text-white leading-[1.02] tracking-tight mb-4">
                  Actus, offres &amp;<br/>
                  <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.25)", color: "transparent" }}>
                    vidéos exclusives
                  </span>
                </h3>
                <p className="text-neutral-400 text-[14px] leading-relaxed max-w-sm">
                  Photos produits, offres flash, vidéos en avant-première et toute l&apos;actualité L&apos;ecomax — en un seul endroit.
                </p>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-6 animate-ecomedia-fade-up delay-200">
                {[
                  { icon: "❤️", label: "J'aime" },
                  { icon: "💬", label: "Commentez" },
                  { icon: "🔔", label: "Alertes" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="text-base">{s.icon}</span>
                    <span className="text-[11px] font-semibold text-neutral-400">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="animate-ecomedia-fade-up delay-300">
                <Link
                  href="/ecomedia"
                  className="self-start inline-flex items-center gap-2.5 bg-[#3ecf4c] text-black font-black text-[11px] uppercase tracking-[0.2em] px-6 py-3.5 rounded-xl hover:bg-white active:scale-[0.97] transition-all group/btn"
                >
                  Explorer Ecomedia
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover/btn:translate-x-0.5 transition-transform"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              </div>
            </div>

            {/* Latest post card OR stats */}
            {latestPost ? (
              <Link href={`/ecomedia/${latestPost.slug}`} className="group shrink-0 block w-full animate-ecomedia-slide-in delay-400">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 group-hover:border-[#3ecf4c]/50 transition-all duration-500 animate-ecomedia-float">

                  {/* Full-bleed image */}
                  {(latestPost.thumbnail_url || latestPost.media_url) ? (
                    <div className="relative w-full aspect-square overflow-hidden">
                      <Image
                        src={latestPost.thumbnail_url || latestPost.media_url!}
                        alt={latestPost.title}
                        fill
                        className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                        sizes="(max-width: 768px) 100vw, 320px"
                      />
                      {/* Multi-layer dark overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                      {/* Top header — avatar + username */}
                      <div className="absolute top-0 left-0 right-0 px-4 pt-4 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full border-2 border-[#3ecf4c] overflow-hidden shrink-0 bg-black">
                          <img src="/images/lm-icon.svg" alt="L'ecomax" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[12px] font-black text-white drop-shadow-md">L&apos;ecomax</span>
                        <span className="ml-auto flex items-center gap-1 bg-black/50 backdrop-blur-sm border border-white/10 rounded-full px-2 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf4c] animate-pulse" />
                          <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">Live</span>
                        </span>
                      </div>

                      {/* Bottom content overlay */}
                      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
                        <p className="text-white font-black text-[15px] leading-snug mb-2 drop-shadow-md line-clamp-2">
                          {latestPost.title}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-3 text-white/60 text-[11px]">
                            <span className="flex items-center gap-1">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                              {latestPost.likes_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                              {latestPost.comments_count}
                            </span>
                          </div>
                          <span className="ml-auto flex items-center gap-1.5 bg-[#3ecf4c] text-black text-[10px] font-black px-3 py-1.5 rounded-full group-hover:bg-white transition-colors">
                            Voir le post
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* No image fallback */
                    <div className="relative bg-white/[0.03] p-5">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-7 h-7 rounded-full border-2 border-[#3ecf4c] overflow-hidden bg-black shrink-0">
                          <img src="/images/lm-icon.svg" alt="L'ecomax" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[12px] font-black text-white">L&apos;ecomax</span>
                      </div>
                      <p className="text-white font-black text-[16px] leading-snug mb-2">{latestPost.title}</p>
                      {latestPost.content && <p className="text-neutral-400 text-[12px] line-clamp-3 mb-4">{latestPost.content}</p>}
                      <span className="inline-flex items-center gap-1.5 bg-[#3ecf4c] text-black text-[10px] font-black px-3 py-1.5 rounded-full">
                        Voir le post <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <div className="flex md:flex-col gap-6 md:gap-8 shrink-0">
                {[
                  { icon: "❤️", label: "J'aime", sub: "Réagissez" },
                  { icon: "💬", label: "Commentaires", sub: "Discutez" },
                  { icon: "↗️", label: "Partagez", sub: "Diffusez" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <p className="text-white text-[11px] font-bold">{s.label}</p>
                    <p className="text-neutral-500 text-[10px]">{s.sub}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA row */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
          <p className="text-sm text-neutral-500">
            Rejoignez la communauté L&apos;ecomax et ne ratez plus aucune actualité.
          </p>
          <Link
            href="/ecomedia"
            className="flex items-center gap-2 text-sm font-black text-black hover:text-[#16b277] transition-colors group"
          >
            Explorer Ecomedia
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
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
          L&apos;ecomax — Boutique en ligne au Maroc : Mode, Sport &amp; Tech
        </h2>
        <div className="grid md:grid-cols-2 gap-8 text-neutral-500 text-[14px] leading-relaxed">
          <div>
            <p>
              L&apos;ecomax est une boutique en ligne marocaine spécialisée dans les vêtements tendance, les chaussures de sport et les accessoires tech. Retrouvez une sélection soignée de baskets respirantes pour la course à pied, de chaussons confortables pour femme, de vestes et hoodies homme et femme, ainsi que des accessoires gaming et audio de qualité premium.
            </p>
          </div>
          <div>
            <p>
              Nous livrons partout au Maroc — Casablanca, Rabat, Marrakech, Fès, Tanger, Agadir, Meknès, Oujda et toutes les villes — à seulement 35 MAD. Paiement à la livraison disponible sur toutes les commandes. Retours gratuits sous 30 jours. Commandez en toute confiance sur lecomax.com.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
