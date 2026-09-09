import fr from "./locales/fr.json";
import en from "./locales/en.json";
import { msg, type TranslationKey } from "./index";

const known = new Map<string, TranslationKey>();
for (const catalog of [fr, en]) for (const [key, value] of Object.entries(catalog)) {
  if (!value.includes("{{")) known.set(value.trim().toLowerCase(), key as TranslationKey);
}

/** Display-only translation. Never change catalog IDs, variant values or user text. */
export function localizedContent(value?: string | null): string {
  if (!value) return "";
  const key = known.get(value.trim().toLowerCase());
  if (key) return msg(key);
  const minimum = /^Disponible dès (\d+(?:[.,]\d+)?) MAD$/i.exec(value);
  if (minimum) return msg("payment.minimum", { amount: minimum[1] });
  const maximum = /^Disponible jusqu[’']à (\d+(?:[.,]\d+)?) MAD$/i.exec(value);
  if (maximum) return msg("payment.maximum", { amount: maximum[1] });
  const days = /^(\d+)(?:\s*[–−-]\s*|\s+à\s+|\s+to\s+)?(\d+)?\s*(jours?(?:\s+ouvrables?|\s+ouvrés?)?|(?:business\s+)?days?)$/i.exec(value.trim());
  if (days) return msg(/ouvr|business/i.test(value) ? "delivery.businessDays" : "delivery.days", { range: days[2] ? `${days[1]}–${days[2]}` : days[1], count: Number(days[2] ?? days[1]) });
  return value;
}

export function paymentStatusLabel(status?: string | null) {
  const keys: Record<string, TranslationKey> = { pending: "orders.pending", paid: "orders.paid", completed: "orders.paid", failed: "orders.failed", refunded: "orders.refunded", cancelled: "orders.cancelled" };
  return msg(keys[status ?? "pending"] ?? "orders.pending");
}

export function orderStatusLabel(status: string) {
  const keys: Record<string, TranslationKey> = { pending: "orders.pending", confirmed: "orders.confirmed", processing: "orderTracking.preparing", shipped: "orderTracking.shipped", delivered: "orderTracking.delivered", cancelled: "orders.cancelled" };
  return msg(keys[status] ?? "orders.inProgress");
}
