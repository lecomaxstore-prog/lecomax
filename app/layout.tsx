import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
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

const SITE_URL = "https://lecomax.ma";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "L'ecomax | Sport, Style & Performance au Maroc",
    template: "%s | L'ecomax",
  },
  description:
    "Boutique en ligne L'ecomax — chaussures, vêtements et accessoires tech pour le sport et le lifestyle. Livraison rapide au Maroc, retours sous 30 jours, paiement sécurisé.",
  keywords: [
    "L'ecomax",
    "boutique en ligne Maroc",
    "chaussures running",
    "accessoires tech",
    "écouteurs sans fil",
    "mode sport Maroc",
    "livraison Maroc",
  ],
  applicationName: "L'ecomax",
  authors: [{ name: "L'ecomax" }],
  creator: "L'ecomax",
  publisher: "L'ecomax",
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
    title: "L'ecomax | Sport, Style & Performance au Maroc",
    description:
      "Chaussures, vêtements et accessoires tech. Livraison rapide au Maroc, retours sous 30 jours, paiement sécurisé.",
    images: [
      {
        url: "/ecomax-hero-banner.jpg.png",
        width: 1200,
        height: 630,
        alt: "L'ecomax — Nouvelle collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "L'ecomax | Sport, Style & Performance au Maroc",
    description:
      "Chaussures, vêtements et accessoires tech. Livraison rapide au Maroc, retours sous 30 jours.",
    images: ["/ecomax-hero-banner.jpg.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
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
      {/* Organization structured data for rich search results */}
      <Script id="ld-org" type="application/ld+json" strategy="afterInteractive">{`
        {
          "@context": "https://schema.org",
          "@type": "OnlineStore",
          "name": "L'ecomax",
          "url": "${SITE_URL}",
          "logo": "${SITE_URL}/favicon.svg",
          "description": "Boutique en ligne L'ecomax — chaussures, vêtements et accessoires tech pour le sport et le lifestyle au Maroc.",
          "areaServed": "MA",
          "sameAs": [
            "https://www.instagram.com/lecomax",
            "https://www.tiktok.com/@lecomax",
            "https://www.facebook.com/lecomax"
          ]
        }
      `}</Script>
      <body className="min-h-screen flex flex-col font-sans">
        <CartProvider>
          <PageTracker />
          <AdminLayoutWrapper>
            <AnnouncementBar />
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
