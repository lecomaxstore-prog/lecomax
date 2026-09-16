import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = { title: "Confirmation de commande", ...privatePageMetadata };

export default function ThankYouLayout({ children }: { children: React.ReactNode }) {
  return children;
}
