import type { Metadata } from "next";
import { withShippingMetadata } from "@/lib/shipping-config-server";

const baseMetadata: Metadata = {
  title: "Nouveautés | L'ecomax — Dernières Arrivées au Maroc",
  description:
    "Découvrez les nouveautés L'ecomax : chaussures, vêtements et accessoires tech. Livraison {{shipping}} partout au Maroc et paiement à la livraison.",
  keywords: [
    "nouveautés mode Maroc",
    "nouvelles chaussures Maroc",
    "nouvelles collections Maroc",
    "dernières arrivées L'ecomax",
    "édition limitée Maroc",
  ],
  alternates: { canonical: "https://lecomax.com/nouveautes/" },
  openGraph: {
    type: "website",
    locale: "fr_MA",
    url: "https://lecomax.com/nouveautes/",
    title: "Nouveautés | L'ecomax — Dernières Arrivées au Maroc",
    description:
      "Découvrez les dernières nouveautés L'ecomax : styles inédits et éditions limitées. Livraison {{shipping}} au Maroc.",
    images: [
      {
        url: "https://lecomax.com/ecomax-hero-banner.jpg.png",
        width: 1200,
        height: 630,
        alt: "Nouveautés L'ecomax",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nouveautés | L'ecomax — Dernières Arrivées au Maroc",
    description: "Découvrez les dernières arrivées L'ecomax au Maroc.",
  },
};

export function generateMetadata() { return withShippingMetadata(baseMetadata); }

export default function NouveautesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
