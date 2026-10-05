import { getServerShippingConfig } from "@/lib/shipping-config-server";
import { freeShippingLabel } from "@/lib/shipping-config";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const shipping = freeShippingLabel(await getServerShippingConfig());
  return {
  title: "ecoClub — Programme de Fidélité | L'ecomax",
  description:
    `Rejoignez ecoClub, le programme de fidélité L’ecomax. Gagnez des points sur chaque achat. ${shipping}.`,
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
      `Gagnez des points et profitez de réductions avec ecoClub. ${shipping}.`,
    url: "https://lecomax.com/ecoclub/",
  },
  };
}

export default function EcoclubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
