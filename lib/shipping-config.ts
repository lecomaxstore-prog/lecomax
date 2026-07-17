export type ShippingConfig = {
  cost: number;
  freeThreshold: number;
  estimatedDays: string;
};

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  cost: 35,
  freeThreshold: 500,
  estimatedDays: "2–5 jours ouvrables",
};

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
    freeThreshold: nonNegativeNumber(settings?.free_shipping_threshold, DEFAULT_SHIPPING_CONFIG.freeThreshold),
    estimatedDays: deliveryEstimate(settings?.shipping_estimated_days),
  };
}

export function calculateShipping(subtotal: number, config: ShippingConfig) {
  return config.freeThreshold > 0 && subtotal >= config.freeThreshold ? 0 : config.cost;
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
