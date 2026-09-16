import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nouveau mot de passe | L’ecomax",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function PasswordResetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
