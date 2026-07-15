import type { Metadata } from "next";
import { withShippingMetadata } from "@/lib/shipping-config-server";

const baseMetadata: Metadata = {
  title: "Bestsellers | L'ecomax — Les Plus Vendus au Maroc",
  description:
    "Les produits les plus populaires de L'ecomax : chaussures, vêtements et accessoires tech bestsellers. Livraison 35 MAD partout au Maroc. Paiement à la livraison.",
  keywords: [
    "bestsellers Maroc",
    "produits populaires Maroc",
    "meilleures ventes Maroc",
    "chaussures tendance Maroc",
    "L'ecomax bestsellers",
  ],
  alternates: { canonical: "https://lecomax.com/bestsellers/" },
  openGraph: {
    type: "website",
    locale: "fr_MA",
    url: "https://lecomax.com/bestsellers/",
    title: "Bestsellers | L'ecomax — Les Plus Vendus au Maroc",
    description: "Les produits bestsellers de L'ecomax. Livraison 35 MAD au Maroc.",
    images: [
      {
        url: "https://lecomax.com/ecomax-hero-banner.jpg.png",
        width: 1200,
        height: 630,
        alt: "Bestsellers L'ecomax",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bestsellers | L'ecomax — Les Plus Vendus au Maroc",
    description: "Les produits bestsellers de L'ecomax au Maroc.",
  },
};

export function generateMetadata() { return withShippingMetadata(baseMetadata); }

export default function BestsellersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
