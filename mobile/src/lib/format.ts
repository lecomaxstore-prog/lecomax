import { runtimeConfig } from "@/lib/runtime-config";

const siteUrl = runtimeConfig.apiUrl;

export const money = (value: number, currency = "MAD") => {
  const safeCurrency = /^[A-Z]{3}$/.test(currency.toUpperCase()) ? currency.toUpperCase() : "MAD";
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: safeCurrency,
    maximumFractionDigits: safeCurrency === "MAD" ? 0 : 2,
  }).format(value);
};

export const imageUrl = (value?: string | null) => {
  if (!value) return "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000";
  let normalized = value;
  try {
    normalized = decodeURI(value);
  } catch {
    // Keep malformed legacy paths usable; encodeURI will safely escape them below.
  }
  if (normalized.startsWith("http")) return encodeURI(normalized);
  const pathname = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return encodeURI(`${siteUrl}${pathname}`);
};

export const discount = (price: number, original?: number | null) =>
  original && original > price ? Math.round((1 - price / original) * 100) : 0;
