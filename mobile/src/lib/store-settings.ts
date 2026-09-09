/** Public business settings. Existing settings rows remain the source of truth. */
export const STORE_SETTING_DEFAULTS = {
  store_name: "L’ECOMAX", store_email: "contact@lecomax.com", store_phone: "+212699289568",
  whatsapp_number: "212699289568", store_address: "", store_city: "", currency: "MAD",
  shipping_cost: "40", free_shipping_threshold: "500", free_shipping_enabled: "true",
  shipping_estimated_days: "2–5 jours ouvrables", checkout_minimum_order: "0",
  checkout_maximum_order: "0", maintenance_mode: "false", preorder_enabled: "true",
  tax_enabled: "false", tax_rate: "0", tax_included: "true", low_stock_threshold: "5",
  default_country: "MA", business_hours: "",
} as const;
export const STORE_SETTING_KEYS = Object.keys(STORE_SETTING_DEFAULTS);
export type StoreSettings = Record<keyof typeof STORE_SETTING_DEFAULTS, string>;
export function storeSettings(values: Record<string, unknown> = {}): StoreSettings {
  return Object.fromEntries(Object.entries(STORE_SETTING_DEFAULTS).map(([key, fallback]) =>
    [key, values[key] === undefined || values[key] === null ? fallback : String(values[key])])) as StoreSettings;
}

export function validateStoreSettings(values: Record<string, unknown>): string | null {
  const numeric: Record<string, number> = { shipping_cost: 100000, free_shipping_threshold: 1000000,
    checkout_minimum_order: 1000000, checkout_maximum_order: 1000000, tax_rate: 100, low_stock_threshold: 100000 };
  for (const [key, max] of Object.entries(numeric)) {
    if (!(key in values)) continue;
    const raw = values[key];
    if ((typeof raw !== "number" && typeof raw !== "string") || String(raw).trim() === "" ||
      !Number.isFinite(Number(raw)) || Number(raw) < 0 || Number(raw) > max ||
      (key === "low_stock_threshold" && !Number.isInteger(Number(raw))) ||
      Math.abs(Number(raw) * 100 - Math.round(Number(raw) * 100)) > 0.000001) return `Valeur invalide : ${key}.`;
  }
  for (const key of ["free_shipping_enabled", "maintenance_mode", "preorder_enabled", "tax_enabled", "tax_included"]) {
    if (key in values && ![true, false, "true", "false"].includes(values[key] as boolean)) return `Valeur invalide : ${key}.`;
  }
  // Prices and the existing PayPal conversion are denominated in MAD. Do not
  // relabel existing inventory as another currency without a conversion migration.
  if ("currency" in values && values.currency !== "MAD") return "La devise du catalogue et des paiements est MAD.";
  for (const key of ["store_name", "store_email", "store_phone", "whatsapp_number", "store_address", "store_city", "shipping_estimated_days", "default_country", "business_hours"]) {
    if (key in values && (typeof values[key] !== "string" || String(values[key]).length > 240)) return `Valeur invalide : ${key}.`;
  }
  if ("store_name" in values && !String(values.store_name).trim()) return "Le nom de la boutique est obligatoire.";
  if ("store_email" in values && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values.store_email))) return "Adresse e-mail invalide.";
  for (const key of ["store_phone", "whatsapp_number"]) if (key in values && values[key] !== "" && !/^\+?[\d ()-]{6,30}$/.test(String(values[key]))) return "Numéro de téléphone invalide.";
  if ("default_country" in values && values.default_country !== "MA") return "La livraison est actuellement disponible au Maroc (MA).";
  const min = Number(values.checkout_minimum_order ?? 0), max = Number(values.checkout_maximum_order ?? 0);
  if (max > 0 && min > max) return "Le maximum doit être supérieur ou égal au minimum.";
  return null;
}
