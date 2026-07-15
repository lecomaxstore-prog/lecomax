export type ShippingConfig = {
  cost: number;
  freeThreshold: number;
  estimatedDays: string;
};

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  cost: 35,
  freeThreshold: 500,
  estimatedDays: "2-5 jours ouvrables",
};

function nonNegativeNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function shippingConfigFromSettings(settings: Record<string, unknown> | null | undefined): ShippingConfig {
  return {
    cost: nonNegativeNumber(settings?.shipping_cost, DEFAULT_SHIPPING_CONFIG.cost),
    freeThreshold: nonNegativeNumber(settings?.free_shipping_threshold, DEFAULT_SHIPPING_CONFIG.freeThreshold),
    estimatedDays: typeof settings?.shipping_estimated_days === "string" && settings.shipping_estimated_days.trim()
      ? settings.shipping_estimated_days.trim()
      : DEFAULT_SHIPPING_CONFIG.estimatedDays,
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
