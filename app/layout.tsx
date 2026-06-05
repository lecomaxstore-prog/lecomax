import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { CartProvider } from "@/components/CartContext";
import PageTracker from "@/components/PageTracker";
import AdminLayoutWrapper from "@/components/AdminLayoutWrapper";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "L'ecomax | Chaussures, Vêtements & Accessoires Tech au Maroc",
    template: "%s | L'ecomax Maroc",
  },
  description:
    "L'ecomax — boutique en ligne au Maroc. Chaussures de sport, vêtements tendance, écouteurs sans fil, enceintes et accessoires gaming. Livraison partout au Maroc 35 MAD. Retours gratuits sous 30 jours. Paiement à la livraison.",
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
      { url: "/fav icon.png", sizes: "32x32", type: "image/png" },
      { url: "/fav icon.png", sizes: "64x64", type: "image/png" },
      { url: "/fav icon.png", sizes: "192x192", type: "image/png" },
      { url: "/fav icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/fav icon.png", sizes: "180x180", type: "image/png" },
    shortcut: "/fav icon.png",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${sora.variable}`}>
      {/* Google Analytics GA4 */}
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-9N1CPZQ1HG" strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-9N1CPZQ1HG', { page_path: window.location.pathname });
      `}</Script>
      {/* Organization + WebSite structured data for rich search results */}
      <Script id="ld-org" type="application/ld+json" strategy="afterInteractive">{`
        {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "${SITE_URL}/#organization",
              "name": "L'ecomax",
              "url": "${SITE_URL}",
              "logo": {
                "@type": "ImageObject",
                "url": "${SITE_URL}/favicon.svg",
                "width": 200,
                "height": 60
              },
              "description": "Boutique en ligne marocaine spécialisée dans les chaussures de sport, vêtements tendance, écouteurs sans fil, enceintes bluetooth et accessoires gaming.",
              "areaServed": {
                "@type": "Country",
                "name": "Maroc"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "telephone": "+212-699-289-568",
                "availableLanguage": ["French", "Arabic"]
              },
              "sameAs": [
                "https://www.instagram.com/lecomax",
                "https://www.tiktok.com/@lecomax",
                "https://www.facebook.com/lecomax"
              ]
            },
            {
              "@type": "WebSite",
              "@id": "${SITE_URL}/#website",
              "url": "${SITE_URL}",
              "name": "L'ecomax",
              "description": "Boutique en ligne au Maroc — chaussures, vêtements, accessoires tech",
              "publisher": { "@id": "${SITE_URL}/#organization" },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "${SITE_URL}/boutique?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "inLanguage": "fr-MA"
            },
            {
              "@type": "Store",
              "@id": "${SITE_URL}/#store",
              "name": "L'ecomax",
              "url": "${SITE_URL}",
              "image": "${SITE_URL}/ecomax-hero-banner.jpg.png",
              "description": "L'ecomax — chaussures sport, vêtements, écouteurs, enceintes et gaming. Livraison 35 MAD partout au Maroc.",
              "priceRange": "69 MAD - 499 MAD",
              "currenciesAccepted": "MAD",
              "paymentAccepted": "Paiement à la livraison, Carte bancaire",
              "hasMap": "https://maps.google.com/?q=Maroc",
              "areaServed": "Maroc"
            }
          ]
        }
      `}</Script>
      <body className="min-h-screen flex flex-col font-sans">
        <CartProvider>
          <PageTracker />
          <AdminLayoutWrapper>
            <Header />
          </AdminLayoutWrapper>
          <main className="flex-1">{children}</main>
          <AdminLayoutWrapper>
            <Footer />
          </AdminLayoutWrapper>
        </CartProvider>
      </body>
    </html>
  );
}
