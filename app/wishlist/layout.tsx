import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes favoris | L'ecomax",
  description: "Retrouvez les produits enregistrés dans votre liste de favoris L'ecomax.",
  robots: { index: false, follow: false },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
