import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = { title: "Créer un compte", ...privatePageMetadata };

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
