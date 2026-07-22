export const CHECKOUT_SETTINGS_DEFAULTS = {
  checkout_contact_title: "Vos coordonnées",
  checkout_contact_subtitle: "Pour vous contacter au sujet de votre commande",
  checkout_delivery_title: "Adresse de livraison",
  checkout_delivery_subtitle: "Indiquez précisément où recevoir votre colis",
  checkout_payment_title: "Mode de paiement",
  checkout_payment_subtitle: "Choisissez votre option de règlement",
  checkout_button_label: "Confirmer ma commande",
  checkout_notice: "",
  checkout_minimum_order: "0",
  checkout_trust_title: "Commande 100% sécurisée",
  checkout_trust_delivery: "Livraison rapide",
  checkout_trust_payment: "Paiement sûr",
  checkout_trust_returns: "Retours 30j",
  checkout_terms_note: "Paiement à la livraison disponible.",
  checkout_show_reassurance: "true",
  enable_cod: "true",
  enable_paypal: "true",
  enable_coupons: "true",
} as const;

export type CheckoutSettingKey = keyof typeof CHECKOUT_SETTINGS_DEFAULTS;
export type CheckoutSettings = Record<CheckoutSettingKey, string>;
export const CHECKOUT_SETTING_KEYS = Object.keys(CHECKOUT_SETTINGS_DEFAULTS) as CheckoutSettingKey[];

const TEXT_LIMITS: Partial<Record<CheckoutSettingKey, number>> = {
  checkout_contact_title: 80, checkout_contact_subtitle: 140,
  checkout_delivery_title: 80, checkout_delivery_subtitle: 140,
  checkout_payment_title: 80, checkout_payment_subtitle: 140,
  checkout_button_label: 40, checkout_notice: 240, checkout_trust_title: 80,
  checkout_trust_delivery: 60, checkout_trust_payment: 60,
  checkout_trust_returns: 60, checkout_terms_note: 180,
};
const BOOLEAN_KEYS = new Set<CheckoutSettingKey>(["checkout_show_reassurance", "enable_cod", "enable_paypal", "enable_coupons"]);

export function normalizeCheckoutSettings(value: unknown): { settings?: CheckoutSettings; error?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { error: "Configuration du checkout invalide." };
  const input = value as Record<string, unknown>;
  const unknown = Object.keys(input).filter((key) => !CHECKOUT_SETTING_KEYS.includes(key as CheckoutSettingKey));
  if (unknown.length) return { error: `Réglage non autorisé : ${unknown[0]}.` };
  const settings = { ...CHECKOUT_SETTINGS_DEFAULTS } as CheckoutSettings;

  for (const key of CHECKOUT_SETTING_KEYS) {
    const raw = key in input ? input[key] : CHECKOUT_SETTINGS_DEFAULTS[key];
    if (BOOLEAN_KEYS.has(key)) {
      if (raw !== true && raw !== false && raw !== "true" && raw !== "false") return { error: `Valeur invalide pour ${key}.` };
      settings[key] = String(raw);
      continue;
    }
    if (key === "checkout_minimum_order") {
      const amount = Number(raw);
      if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) return { error: "Le minimum de commande est invalide." };
      settings[key] = String(Math.round(amount * 100) / 100);
      continue;
    }
    if (typeof raw !== "string") return { error: `Valeur invalide pour ${key}.` };
    const cleaned = raw.trim();
    if (key !== "checkout_notice" && !cleaned) return { error: `Le champ ${key} est obligatoire.` };
    if (cleaned.length > (TEXT_LIMITS[key] ?? 200)) return { error: `Le champ ${key} est trop long.` };
    settings[key] = cleaned;
  }
  return { settings };
}

export function checkoutSettingsFromRows(rows: Array<{ key: string; value: unknown }> | null | undefined): CheckoutSettings {
  const values = { ...CHECKOUT_SETTINGS_DEFAULTS } as CheckoutSettings;
  for (const row of rows ?? []) if (CHECKOUT_SETTING_KEYS.includes(row.key as CheckoutSettingKey)) values[row.key as CheckoutSettingKey] = String(row.value ?? "");
  return values;
}
