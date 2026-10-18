import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useState } from "react";
import { Text, StyleSheet } from "react-native";
import { apiRequest } from "@/lib/api-client";
import { brandId, DEFAULT_BRANDS, mergeBrands, validateBrand } from "@/lib/product-brands";
import { typography } from "@/constants/theme";

// Bundled marks remain available offline and while the registry is loading.
const BUNDLED_LOGOS: Record<string, number> = {
  asics: require("../../assets/images/brands/asics.png"),
  puma: require("../../assets/images/brands/puma.png"),
  adidas: require("../../assets/images/brands/adidas.png"),
  nike: require("../../assets/images/brands/nike.png"),
  newbalance: require("../../assets/images/brands/newbalance.png"),
  reebok: require("../../assets/images/brands/reebok.png"),
  underarmour: require("../../assets/images/brands/underarmour.png"),
  lenovo: require("../../assets/images/brands/lenovo.png"),
  sony: require("../../assets/images/brands/sony.png"),
  jordan: require("../../assets/images/brands/jordan.png"),
  baasploa: require("../../assets/images/brands/baasploa.png"),
  genai: require("../../assets/images/brands/genai.png"),
  kemei: require("../../assets/images/brands/kemei.png"),
  ellesse: require("../../assets/images/brands/ellesse.png"),
  kangol: require("../../assets/images/brands/kangol.png"),
  joma: require("../../assets/images/brands/joma.png"),
  emporioarmani: require("../../assets/images/brands/emporioarmani.png"),
  fila: require("../../assets/images/brands/fila.png"),
  thenorthface: require("../../assets/images/brands/thenorthface.png"),
  zara: require("../../assets/images/brands/zara.png"),
  uniqlo: require("../../assets/images/brands/uniqlo.png"),
  samsung: require("../../assets/images/brands/samsung.png"),
  apple: require("../../assets/images/brands/apple.png"),
  xiaomi: require("../../assets/images/brands/xiaomi.png"),
  huawei: require("../../assets/images/brands/huawei.png"),
  hp: require("../../assets/images/brands/hp.png"),
  dell: require("../../assets/images/brands/dell.png"),
  asus: require("../../assets/images/brands/asus.png"),
  acer: require("../../assets/images/brands/acer.png"),
  jbl: require("../../assets/images/brands/jbl.png"),
};

export function ProductBrandMark({ name, compact = false }: { name: string; compact?: boolean }) {
  const [failedLogo, setFailedLogo] = useState<string>();
  const { data = DEFAULT_BRANDS } = useQuery({
    queryKey: ["product-brands"],
    queryFn: async ({ signal }) => {
      const rows = await apiRequest<unknown>("/api/products/brands", { signal, retries: 0 });
      if (!Array.isArray(rows)) throw new Error("Invalid brands response");
      return mergeBrands(rows.flatMap(row => { const brand = validateBrand(row); return brand ? [brand] : []; }));
    },
    staleTime: 30_000,
    retry: false,
  });
  const brand = data.find(item => item.id === brandId(name));
  const bundledLogo = BUNDLED_LOGOS[brandId(name).replace(/[\s-]+/g, "")];
  const remoteLogo = brand?.logo.startsWith("https://") ? brand.logo : undefined;
  const source = remoteLogo && failedLogo !== remoteLogo ? { uri: remoteLogo } : bundledLogo;
  if (source) {
    return <Image
      key={`${name}-${remoteLogo === failedLogo ? "fallback" : "logo"}`}
      source={source}
      accessibilityLabel={name}
      accessible
      contentFit="contain"
      contentPosition="left center"
      style={[styles.logo, compact && styles.compactLogo]}
      onError={() => { if (remoteLogo) setFailedLogo(remoteLogo); }}
    />;
  }
  return <Text numberOfLines={1} style={[styles.name, compact && styles.compactName]}>{name}</Text>;
}

const styles = StyleSheet.create({
  logo: { width: 92, height: 32 },
  compactLogo: { width: 64, height: 20, flexShrink: 1 },
  compactName: { fontSize: 9, letterSpacing: 0.7, flexShrink: 1 },
  name: { color: "#173D2A", fontSize: 11, fontFamily: typography.semibold, letterSpacing: 1.4 },
});
