import type { Metadata } from "next";
import { withShippingMetadata } from "@/lib/shipping-config-server";

const baseMetadata: Metadata = {
  title: "Boutique | L'ecomax — Chaussures, Vêtements & Accessoires Maroc",
  description:
    "Chaussures, mode homme et femme, écouteurs, enceintes et accessoires gaming. Livraison {{shipping}} partout au Maroc et paiement à la livraison.",
  keywords: [
    "boutique en ligne Maroc",
    "chaussures Maroc",
    "vêtements sport Maroc",
    "accessoires tech Maroc",
    "acheter en ligne Maroc",
    "L'ecomax boutique",
  ],
  alternates: { canonical: "https://lecomax.com/boutique/" },
  openGraph: {
    type: "website",
    locale: "fr_MA",
    url: "https://lecomax.com/boutique/",
    title: "Boutique | L'ecomax — Chaussures, Vêtements & Accessoires Maroc",
    description:
      "Explorez toute la boutique L'ecomax : chaussures, vêtements, écouteurs et gaming. Livraison {{shipping}} au Maroc.",
    images: [
      {
        url: "https://lecomax.com/ecomax-hero-banner.jpg.png",
        width: 1200,
        height: 630,
        alt: "L'ecomax Boutique",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Boutique | L'ecomax — Chaussures, Vêtements & Accessoires Maroc",
    description: "Explorez toute la boutique L'ecomax au Maroc.",
  },
};

export function generateMetadata() { return withShippingMetadata(baseMetadata); }

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
