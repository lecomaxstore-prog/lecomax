import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = { title: "Facture", ...privatePageMetadata };

export default function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
