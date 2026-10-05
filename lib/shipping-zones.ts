import { calculateShipping, DEFAULT_SHIPPING_CONFIG, type ShippingConfig } from "./shipping-config.ts";

export type ShippingZoneRule = {
  id: string;
  name: string;
  cities: string[] | null;
  standard_rate: number;
  free_threshold: number | null;
  estimated_days: string | null;
  sort_order: number | null;
  active: boolean;
};

export type ShippingQuote = {
  cost: number;
  freeThreshold: number;
  estimatedDays: string;
  zoneId: string | null;
  zoneName: string;
};

type CleanShippingZoneResult =
  | { payload: Record<string, unknown>; error?: never }
  | { error: string; payload?: never };

export function cleanShippingZonePayload(value: unknown, partial = false): CleanShippingZoneResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { error: "Zone de livraison invalide." } as const;
  const input = value as Record<string, unknown>;
  const payload: Record<string, unknown> = {};

  if (!partial || "name" in input) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name || name.length > 100) return { error: "Le nom de la zone doit contenir entre 1 et 100 caractères." } as const;
    payload.name = name;
  }
  if (!partial || "cities" in input) {
    if (!Array.isArray(input.cities) || input.cities.length > 200) return { error: "La liste des villes est invalide." } as const;
    const cities = [...new Map(input.cities.map((city) => String(city).trim()).filter(Boolean).map((city) => [normalizeCity(city), city])).values()];
    if (cities.some((city) => city.length > 100)) return { error: "Le nom d'une ville est trop long." } as const;
    payload.cities = cities;
  }
  for (const key of ["standard_rate", "express_rate", "free_threshold"] as const) {
    if (!partial || key in input) {
      if (input[key] === null && key !== "standard_rate") {
        payload[key] = null;
      } else {
        if ((typeof input[key] !== "number" && typeof input[key] !== "string") || String(input[key]).trim() === "") return { error: `Montant invalide pour ${key}.` } as const;
        const number = Number(input[key]);
        if (!Number.isFinite(number) || number < 0 || number > 100000 || Math.abs(number * 100 - Math.round(number * 100)) > 0.000001) return { error: `Montant invalide pour ${key}.` } as const;
        payload[key] = number;
      }
    }
  }
  if (!partial || "estimated_days" in input) {
    const estimate = typeof input.estimated_days === "string" ? input.estimated_days.trim() : "";
    if (!estimate || estimate.length > 80) return { error: "Le délai estimé doit contenir entre 1 et 80 caractères." } as const;
    payload.estimated_days = estimate;
  }
  if (!partial || "active" in input) {
    if (typeof input.active !== "boolean") return { error: "Le statut de la zone est invalide." } as const;
    payload.active = input.active;
  }
  if (!partial || "sort_order" in input) {
    const order = Number(input.sort_order ?? 0);
    if (!Number.isInteger(order) || order < -10000 || order > 10000) return { error: "L'ordre de priorité est invalide." } as const;
    payload.sort_order = order;
  }
  return { payload } as const;
}

export function normalizeCity(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]/g, "");
}

function validNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function resolveShippingQuote(
  city: string,
  subtotal: number,
  zones: ShippingZoneRule[],
  fallback: ShippingConfig,
): ShippingQuote {
  const normalizedCity = normalizeCity(city);
  const activeZones = zones.filter((zone) => zone.active);
  const explicitZones = activeZones
    .filter((zone) => (zone.cities ?? []).some((candidate) => normalizeCity(candidate) === normalizedCity))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const fallbackZones = activeZones
    .filter((zone) => !zone.cities || zone.cities.length === 0)
    .sort((a, b) => (b.sort_order ?? 0) - (a.sort_order ?? 0));
  const zone = explicitZones[0] ?? fallbackZones[0] ?? null;

  const config: ShippingConfig = zone && (zone.cities?.length ?? 0) > 0
    ? {
        cost: validNumber(zone.standard_rate, fallback.cost),
        freeThreshold: zone.free_threshold === null
          ? fallback.freeThreshold
          : validNumber(zone.free_threshold, fallback.freeThreshold),
        estimatedDays: DEFAULT_SHIPPING_CONFIG.estimatedDays,
      }
    : fallback;

  return {
    cost: calculateShipping(subtotal, fallback.freeShippingEnabled === false ? { ...config, freeThreshold: 0 } : config),
    freeThreshold: fallback.freeShippingEnabled === false ? 0 : config.freeThreshold,
    estimatedDays: DEFAULT_SHIPPING_CONFIG.estimatedDays,
    zoneId: zone?.id ?? null,
    zoneName: zone?.name ?? "Tarif national",
  };
}
