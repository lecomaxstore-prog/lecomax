"use client";
import { usePathname } from "next/navigation";

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Hide site header/footer on admin AND ecomedia routes (both have their own layouts)
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/ecomedia")) return null;
  return <>{children}</>;
}
