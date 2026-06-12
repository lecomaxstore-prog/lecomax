import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aide & FAQ | L'ecomax — Questions Fréquentes",
  description:
    "Trouvez les réponses à vos questions : livraison au Maroc, retours, paiement à la livraison, suivi de commande et compte client. Service client L'ecomax.",
  keywords: [
    "aide lecomax",
    "FAQ boutique Maroc",
    "livraison Maroc délai",
    "retours gratuits Maroc",
    "paiement livraison Maroc",
    "suivi commande Maroc",
  ],
  alternates: { canonical: "/aide" },
  openGraph: {
    title: "Aide & FAQ | L'ecomax",
    description:
      "Réponses à toutes vos questions sur la livraison, les retours et le paiement chez L'ecomax.",
    url: "https://lecomax.com/aide",
  },
};

export default function AideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
