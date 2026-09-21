import { currentLocale } from "@/i18n";

// Product media lives on the website; the local Metro proxy only serves /api.
const siteUrl = "https://lecomax.com";

export const moneyParts = (value: number, currency = "MAD") => {
  const safeCurrency = /^[A-Z]{3}$/.test(currency.toUpperCase()) ? currency.toUpperCase() : "MAD";
  return new Intl.NumberFormat(currentLocale(), {
    style: "currency",
    currency: safeCurrency,
    maximumFractionDigits: 2,
  }).formatToParts(value);
};

export const money = (value: number, currency = "MAD") =>
  moneyParts(value, currency).map((part) => part.value).join("");

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

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(currentLocale(), options).format(value);
