"use client";

import { useEffect, useState } from "react";
import { brandId, mergeBrands, type ProductBrand } from "@/mobile/src/lib/product-brands";
import { loadProductBrands } from "@/lib/product-brand-client";

/** Uses the same registry and bundled artwork as the Expo product screen. */
export default function ProductBrandMark({ name, compact = false }: { name: string; compact?: boolean }) {
  const [saved, setSaved] = useState<ProductBrand[]>([]);
  const [failedLogos, setFailedLogos] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      void loadProductBrands().then(rows => { if (active) setSaved(rows); })
        .catch(() => { /* Keep bundled artwork or the brand name when offline. */ });
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("focus", refresh); };
  }, []);
  const brand = mergeBrands(saved, [name]).find(item => item.id === brandId(name));
  const fallback = mergeBrands([]).find(item => item.id === brandId(name))?.logo;
  const logo = [brand?.logo, fallback].find(url => url && !failedLogos.includes(url));
  if (logo) return <img src={logo} alt={name} onError={() => setFailedLogos(current => [...current, logo])} className={`${compact ? "h-5 w-16" : "h-8 w-24"} object-contain object-left`} />;
  return <span className="truncate text-xs font-semibold uppercase tracking-wider text-neutral-500">{name}</span>;
}
