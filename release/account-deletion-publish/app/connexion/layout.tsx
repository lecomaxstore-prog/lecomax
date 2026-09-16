import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = { title: "Connexion", ...privatePageMetadata };

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
