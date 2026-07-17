import type { Metadata } from "next";
import EcomediaLayout from "@/components/ecomedia/EcomediaLayout";

// Ecomedia-specific favicon (green Instagram-style icon as SVG data URI)
const FAVICON = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%230d0d0d'/><path d='M16 7L8 11l8 4 8-4-8-4zM8 21l8 4 8-4M8 16l8 4 8-4' stroke='%233ecf4c' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg>`;

export const metadata: Metadata = {
  title: { default: "Ecomedia | L'ecomax", template: "%s" },
  description: "Découvrez les actualités, offres exclusives et vidéos produits de L'ecomax.",
  icons: { icon: FAVICON, apple: FAVICON },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <EcomediaLayout>{children}</EcomediaLayout>;
}
