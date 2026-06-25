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
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/settings?key=in.(hero_image,hero_image_mobile)&select=key,value`,
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
  const dbSlugs = new Set(dbProducts.map((p) => p.slug));
  const allProducts: CardProduct[] = [
    ...dbProducts,
    ...(staticProducts as CardProduct[]).filter((p) => !dbSlugs.has(p.slug)),
  ].map((p) => ({
    ...p,
    rating: reviewStats[p.slug]?.rating ?? p.rating,
    reviewCount: reviewStats[p.slug]?.count ?? p.reviewCount,
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
    </>
  );
}
