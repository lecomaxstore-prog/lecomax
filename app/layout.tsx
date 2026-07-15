import type { Metadata } from "next";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";

import { CartProvider } from "@/components/CartContext";
import { WishlistProvider } from "@/components/WishlistContext";
import PageTracker from "@/components/PageTracker";
import AdminLayoutWrapper from "@/components/AdminLayoutWrapper";
import SiteProtection from "@/components/SiteProtection";
import CookieBanner from "@/components/CookieBanner";
import DataCollector from "@/components/DataCollector";
import BackToTop from "@/components/BackToTop";
import AdsDisplay from "@/components/AdsDisplay";
import PushPrompt from "@/components/PushPrompt";
import ChatWidget from "@/components/ChatWidget";
import { createClient } from "@supabase/supabase-js";


const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

const SITE_URL = "https://lecomax.com";

const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  manifest: "/manifest.json?v=2",
  title: {
    default: "L'ecomax — Mode, Tech & Sport · Livraison partout au Maroc",
    template: "%s · L'ecomax",
  },
  description:
    "L'ecomax est la boutique en ligne au Maroc pour acheter des chaussures de sport, vêtements tendance, écouteurs sans fil TWS, enceintes bluetooth et accessoires gaming. Livraison 35 MAD partout au Maroc, paiement à la livraison, retours gratuits sous 30 jours. Commandez sur lecomax.com.",
  keywords: [
    "L'ecomax",
    "lecomax",
    "boutique en ligne Maroc",
    "chaussures sport Maroc",
    "chaussures running Maroc",
    "vêtements sport Maroc",
    "accessoires tech Maroc",
    "écouteurs sans fil Maroc",
    "enceinte bluetooth Maroc",
    "manette gaming Maroc",
    "sac à dos Maroc",
    "livraison Maroc",
    "paiement à la livraison",
    "mode sport Maroc",
    "acheter chaussures Maroc",
    "accessoires Sidi Bennour",
  ],
  applicationName: "L'ecomax",
  authors: [{ name: "L'ecomax", url: SITE_URL }],
  creator: "L'ecomax",
  publisher: "L'ecomax",
  category: "shopping",
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { url: "/favicon.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/favicon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    other: [
      { rel: "mask-icon", url: "/favicon.png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "fr_MA",
    url: SITE_URL,
    siteName: "L'ecomax",
    title: "L'ecomax | Chaussures, Vêtements & Accessoires Tech au Maroc",
    description:
      "Boutique en ligne au Maroc — chaussures, vêtements sport, écouteurs, enceintes et gaming. Livraison 35 MAD partout au Maroc. Paiement à la livraison.",
    images: [
      {
        url: "/ecomax-hero-banner.jpg.png",
        width: 1200,
        height: 630,
        alt: "L'ecomax — Boutique en ligne Maroc",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "L'ecomax | Chaussures, Vêtements & Accessoires Tech au Maroc",
    description:
      "Boutique en ligne Maroc — chaussures, vêtements, écouteurs, enceintes. Livraison 35 MAD. Paiement à la livraison.",
    images: ["/ecomax-hero-banner.jpg.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: "NkVjvr5b1I2GKIs6YjwtU1HEPQNHUjPBgY8RHD1kRWQ",
  },
  formatDetection: { telephone: false },
  other: {
    "theme-color": "#3ecf4c",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase.from("settings").select("key,value").in("key", [
      "store_name", "seo_title", "seo_description", "favicon_image", "og_image",
    ]);
    const settings = Object.fromEntries((data ?? []).map((row) => [row.key, String(row.value ?? "")]));
    const storeName = settings.store_name || "L'ecomax";
    const seoTitle = settings.seo_title?.trim();
    const seoDescription = settings.seo_description?.trim();
    const favicon = settings.favicon_image?.trim();
    const ogImage = settings.og_image?.trim();

    return {
      ...defaultMetadata,
      applicationName: storeName,
      title: seoTitle ? { default: seoTitle, template: `%s · ${storeName}` } : defaultMetadata.title,
      description: seoDescription || defaultMetadata.description,
      icons: favicon ? { icon: favicon, shortcut: favicon, apple: favicon } : defaultMetadata.icons,
      openGraph: {
        ...defaultMetadata.openGraph,
        siteName: storeName,
        title: seoTitle || defaultMetadata.openGraph?.title,
        description: seoDescription || defaultMetadata.openGraph?.description,
        images: ogImage ? [{ url: ogImage, alt: storeName }] : defaultMetadata.openGraph?.images,
      },
      twitter: {
        ...defaultMetadata.twitter,
        title: seoTitle || defaultMetadata.twitter?.title,
        description: seoDescription || defaultMetadata.twitter?.description,
        images: ogImage ? [ogImage] : defaultMetadata.twitter?.images,
      },
    };
  } catch {
    return defaultMetadata;
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${sora.variable}`}>
      <head>
        {/* Preconnect to external origins for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <meta name="theme-color" content="#3ecf4c" />
        {/* Google Analytics GA4 */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-9N1CPZQ1HG" strategy="afterInteractive" />
        <Script id="ga-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-9N1CPZQ1HG', { page_path: window.location.pathname });
        `}</Script>
        {/* Trustpilot TrustBox widget bootstrap */}
        <Script src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js" strategy="lazyOnload" />
        {/* Microsoft Clarity — heatmaps & session recordings */}
        <Script id="clarity-init" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window,document,"clarity","script","x510dwwy6k");
        `}</Script>
        {/* Organization + WebSite structured data — server-rendered for Googlebot */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "${SITE_URL}/#organization",
      "name": "L'ecomax",
      "alternateName": "Lecomax",
      "url": "${SITE_URL}",
      "foundingLocation": { "@type": "Place", "name": "Sidi Bennour, Maroc" },
      "logo": { "@type": "ImageObject", "url": "${SITE_URL}/images/lecomax%20logo.png" },
      "description": "L'ecomax est une boutique en ligne marocaine fondée à Sidi Bennour, spécialisée dans les chaussures de sport, vêtements tendance, écouteurs sans fil, enceintes bluetooth et accessoires gaming. Livraison 35 MAD partout au Maroc.",
      "areaServed": { "@type": "Country", "name": "Maroc" },
      "contactPoint": { "@type": "ContactPoint", "contactType": "customer service", "telephone": "+212-699-289-568", "availableLanguage": ["French", "Arabic"] },
      "sameAs": ["https://www.instagram.com/lecomaxcom", "https://www.tiktok.com/@lecomaxcom", "https://www.facebook.com/lecomaxcom"]
    },
    {
      "@type": "WebSite",
      "@id": "${SITE_URL}/#website",
      "url": "${SITE_URL}",
      "name": "L'ecomax",
      "description": "Boutique en ligne au Maroc — chaussures, vêtements, accessoires tech",
      "publisher": { "@id": "${SITE_URL}/#organization" },
      "potentialAction": { "@type": "SearchAction", "target": "${SITE_URL}/boutique?q={search_term_string}", "query-input": "required name=search_term_string" },
      "inLanguage": "fr-MA"
    },
    {
      "@type": ["Store", "LocalBusiness"],
      "@id": "${SITE_URL}/#store",
      "name": "L'ecomax",
      "url": "${SITE_URL}",
      "image": "${SITE_URL}/ecomax-hero-banner.jpg.png",
      "description": "L'ecomax — boutique en ligne au Maroc : chaussures sport, vêtements tendance, écouteurs sans fil, enceintes bluetooth et accessoires gaming. Livraison 35 MAD partout au Maroc, paiement à la livraison.",
      "priceRange": "69 MAD - 849 MAD",
      "currenciesAccepted": "MAD",
      "paymentAccepted": "Paiement à la livraison, Carte bancaire, PayPal",
      "telephone": "+212-699-289-568",
      "email": "contact@lecomax.com",
      "address": { "@type": "PostalAddress", "addressLocality": "Sidi Bennour", "addressRegion": "Doukkala-Abda", "addressCountry": "MA" },
      "geo": { "@type": "GeoCoordinates", "latitude": 32.6528, "longitude": -8.4236 },
      "openingHoursSpecification": { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], "opens": "08:00", "closes": "22:00" },
      "hasMap": "https://maps.google.com/?q=Sidi+Bennour+Maroc",
      "areaServed": { "@type": "Country", "name": "Maroc" },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Boutique L'ecomax",
        "itemListElement": [
          { "@type": "OfferCatalog", "name": "Chaussures de sport" },
          { "@type": "OfferCatalog", "name": "Vêtements tendance" },
          { "@type": "OfferCatalog", "name": "Écouteurs sans fil" },
          { "@type": "OfferCatalog", "name": "Enceintes Bluetooth" },
          { "@type": "OfferCatalog", "name": "Accessoires gaming" }
        ]
      },
      "sameAs": ["https://www.instagram.com/lecomaxcom", "https://www.tiktok.com/@lecomaxcom", "https://www.facebook.com/lecomaxcom"]
    }
  ]
}` }} />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <CartProvider>
          <WishlistProvider>
          <SiteProtection />
          <PageTracker />
          <AdminLayoutWrapper>
            <AnnouncementBar />
            <Header />
          </AdminLayoutWrapper>
          <main className="flex-1">{children}</main>
          <AdminLayoutWrapper>

            <Footer />
          </AdminLayoutWrapper>
          <AdminLayoutWrapper>
            <ChatWidget />
          </AdminLayoutWrapper>
          <AdminLayoutWrapper>
            <CookieBanner />
          </AdminLayoutWrapper>
          <DataCollector />
          <BackToTop />
          <AdsDisplay />
          <PushPrompt />
          {process.env.NODE_ENV === "production" && <SpeedInsights />}
          {process.env.NODE_ENV === "production" && <Analytics />}
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
