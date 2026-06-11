import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boutique | L'ecomax — Chaussures, Vêtements & Accessoires Maroc",
  description:
    "Explorez toute la boutique L'ecomax : chaussures de sport, vêtements homme & femme, écouteurs, enceintes et gaming. Livraison 35 MAD partout au Maroc. Paiement à la livraison.",
  keywords: [
    "boutique en ligne Maroc",
    "chaussures Maroc",
    "vêtements sport Maroc",
    "accessoires tech Maroc",
    "acheter en ligne Maroc",
    "L'ecomax boutique",
  ],
  alternates: { canonical: "/boutique" },
  openGraph: {
    type: "website",
    locale: "fr_MA",
    url: "https://lecomax.com/boutique",
    title: "Boutique | L'ecomax — Chaussures, Vêtements & Accessoires Maroc",
    description:
      "Explorez toute la boutique L'ecomax : chaussures, vêtements, écouteurs et gaming. Livraison 35 MAD au Maroc.",
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

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
