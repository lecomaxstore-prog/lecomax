import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = { title: "Suivre une commande", ...privatePageMetadata };

export default function TrackingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
