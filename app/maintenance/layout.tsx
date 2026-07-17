import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = { title: "Maintenance", ...privatePageMetadata };

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
