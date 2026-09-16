import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ecoClub — Programme de Fidélité | L'ecomax",
  description:
    "Rejoignez ecoClub, le programme de fidélité L'ecomax. Gagnez des points sur chaque achat, obtenez la livraison gratuite permanente et profitez d'avantages exclusifs.",
  keywords: [
    "programme fidélité Maroc",
    "ecoClub lecomax",
    "points fidélité boutique Maroc",
    "avantages membres Maroc",
    "livraison gratuite Maroc",
  ],
  alternates: { canonical: "https://lecomax.com/ecoclub/" },
  openGraph: {
    title: "ecoClub — Programme de Fidélité | L'ecomax",
    description:
      "Gagnez des points, obtenez la livraison gratuite et des réductions exclusives avec ecoClub.",
    url: "https://lecomax.com/ecoclub/",
  },
};

export default function EcoclubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
