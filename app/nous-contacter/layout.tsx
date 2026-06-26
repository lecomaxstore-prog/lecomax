import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nous Contacter | L'ecomax — Service Client Maroc",
  description:
    "Contactez L'ecomax : WhatsApp, email ou formulaire de contact. Notre équipe répond rapidement à vos questions sur les commandes, la livraison et les retours.",
  keywords: [
    "contact lecomax",
    "service client Maroc",
    "WhatsApp boutique Maroc",
    "nous contacter lecomax",
    "support client Maroc",
  ],
  alternates: { canonical: "https://lecomax.com/nous-contacter/" },
  openGraph: {
    title: "Nous Contacter | L'ecomax",
    description:
      "Contactez notre équipe par WhatsApp, email ou formulaire. Réponse rapide garantie.",
    url: "https://lecomax.com/nous-contacter/",
  },
};

export default function NousContacterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
