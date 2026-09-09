import { STORE_SETTING_DEFAULTS } from "./store-settings.ts";
export type ShippingConfig = {
  cost: number;
  freeThreshold: number;
  estimatedDays: string;
  freeShippingEnabled?: boolean;
};

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  cost: Number(STORE_SETTING_DEFAULTS.shipping_cost),
  freeThreshold: Number(STORE_SETTING_DEFAULTS.free_shipping_threshold),
  estimatedDays: STORE_SETTING_DEFAULTS.shipping_estimated_days,
};

// A one-dirham courtesy margin avoids charging delivery when a cart lands at
// 499 MAD against a displayed 500 MAD free-shipping threshold.
export const FREE_SHIPPING_GRACE_AMOUNT = 1;

function deliveryEstimate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return DEFAULT_SHIPPING_CONFIG.estimatedDays;
  const configured = value.trim();

  // Retire the former 24–48h promise while preserving deliberate custom values.
  return /^(?:24\s*[–-]\s*48\s*h(?:eures?)?|48\s*h)$/i.test(configured)
    ? DEFAULT_SHIPPING_CONFIG.estimatedDays
    : configured;
}

function nonNegativeNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function shippingConfigFromSettings(settings: Record<string, unknown> | null | undefined): ShippingConfig {
  return {
    cost: nonNegativeNumber(settings?.shipping_cost, DEFAULT_SHIPPING_CONFIG.cost),
    freeShippingEnabled: String(settings?.free_shipping_enabled) !== "false",
    freeThreshold: String(settings?.free_shipping_enabled) === "false" ? 0 : nonNegativeNumber(settings?.free_shipping_threshold, DEFAULT_SHIPPING_CONFIG.freeThreshold),
    estimatedDays: deliveryEstimate(settings?.shipping_estimated_days),
  };
}

export function effectiveFreeShippingMinimum(freeThreshold: number) {
  const graceAmount = freeThreshold > FREE_SHIPPING_GRACE_AMOUNT ? FREE_SHIPPING_GRACE_AMOUNT : 0;
  return Math.max(0, freeThreshold - graceAmount);
}

export function qualifiesForFreeShipping(subtotal: number, freeThreshold: number) {
  return freeThreshold > 0 && subtotal >= effectiveFreeShippingMinimum(freeThreshold);
}

export function calculateShipping(subtotal: number, config: ShippingConfig) {
  return qualifiesForFreeShipping(subtotal, config.freeThreshold) ? 0 : config.cost;
}

export function formatShippingAmount(value: number) {
  return new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 2 }).format(value);
}

export function shippingSummary(config: ShippingConfig) {
  const cost = formatShippingAmount(config.cost);
  const threshold = formatShippingAmount(config.freeThreshold);
  return config.freeThreshold > 0
    ? `Livraison ${cost} MAD partout au Maroc, offerte dès ${threshold} MAD d'achats.`
    : `Livraison ${cost} MAD partout au Maroc.`;
}
