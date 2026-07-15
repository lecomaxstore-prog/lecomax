import type { Metadata } from "next";
import { withShippingMetadata } from "@/lib/shipping-config-server";

const baseMetadata: Metadata = {
  title: "Promotions & Soldes | L'ecomax — Maroc",
  description:
    "Profitez des meilleures promotions et soldes L'ecomax : chaussures, vêtements et accessoires tech à prix réduits. Livraison 35 MAD. Paiement à la livraison.",
  keywords: [
    "promotions Maroc",
    "soldes chaussures Maroc",
    "remises vêtements Maroc",
    "bons plans L'ecomax",
    "prix réduits Maroc",
  ],
  alternates: { canonical: "https://lecomax.com/promotions/" },
  openGraph: {
    type: "website",
    locale: "fr_MA",
    url: "https://lecomax.com/promotions/",
    title: "Promotions & Soldes | L'ecomax — Maroc",
    description: "Meilleures promotions L'ecomax. Livraison 35 MAD au Maroc.",
    images: [
      {
        url: "https://lecomax.com/ecomax-hero-banner.jpg.png",
        width: 1200,
        height: 630,
        alt: "Promotions L'ecomax",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Promotions & Soldes | L'ecomax — Maroc",
    description: "Meilleures promotions L'ecomax au Maroc.",
  },
};

export function generateMetadata() { return withShippingMetadata(baseMetadata); }

export default function PromotionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
