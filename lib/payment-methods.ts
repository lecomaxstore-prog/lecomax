export type PaymentProvider = "cod" | "paypal";

export type PaymentMethod = {
  provider: PaymentProvider;
  enabled: boolean;
  title: string;
  description: string;
  recommended: boolean;
  sortOrder: number;
  minimum: number;
  maximum: number | null;
  cities: string[];
  fee: number;
  maintenance: boolean;
  unavailableMessage: string;
};

export const PAYMENT_SETTING_DEFAULTS = {
  payment_cod_title: "Paiement à la livraison",
  payment_cod_description: "Payez à la réception de votre commande",
  payment_cod_recommended: "true",
  payment_cod_sort_order: "10",
  payment_cod_minimum: "0",
  payment_cod_maximum: "0",
  payment_cod_cities: "",
  payment_cod_fee: "0",
  payment_cod_maintenance: "false",
  payment_cod_unavailable_message: "Temporairement indisponible",
  payment_paypal_title: "PayPal",
  payment_paypal_description: "Paiement en ligne rapide et sécurisé",
  payment_paypal_recommended: "false",
  payment_paypal_sort_order: "20",
  payment_paypal_minimum: "0",
  payment_paypal_maximum: "0",
  payment_paypal_cities: "",
  payment_paypal_fee: "0",
  payment_paypal_maintenance: "false",
  payment_paypal_unavailable_message: "PayPal est momentanément indisponible",
} as const;

export const PAYMENT_SETTING_KEYS = Object.keys(PAYMENT_SETTING_DEFAULTS);

function numberSetting(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function booleanSetting(value: unknown, fallback: boolean) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
}

function textSetting(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function citiesSetting(value: unknown) {
  if (typeof value !== "string") return [];
  return [...new Set(value.split(",").map((city) => city.trim()).filter(Boolean))];
}

export function normalizePaymentCity(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]/g, "");
}

export function paymentMethodsFromSettings(
  settings: Record<string, unknown>,
): PaymentMethod[] {
  return (["cod", "paypal"] as const)
    .map((provider) => {
      const defaults = PAYMENT_SETTING_DEFAULTS;
      const maximum = numberSetting(
        settings[`payment_${provider}_maximum`],
        Number(defaults[`payment_${provider}_maximum`]),
      );
      return {
        provider,
        enabled: booleanSetting(
          settings[provider === "cod" ? "enable_cod" : "enable_paypal"],
          true,
        ),
        title: textSetting(
          settings[`payment_${provider}_title`],
          defaults[`payment_${provider}_title`],
        ),
        description: textSetting(
          settings[`payment_${provider}_description`],
          defaults[`payment_${provider}_description`],
        ),
        recommended: booleanSetting(
          settings[`payment_${provider}_recommended`],
          defaults[`payment_${provider}_recommended`] === "true",
        ),
        sortOrder: numberSetting(
          settings[`payment_${provider}_sort_order`],
          Number(defaults[`payment_${provider}_sort_order`]),
        ),
        minimum: numberSetting(
          settings[`payment_${provider}_minimum`],
          Number(defaults[`payment_${provider}_minimum`]),
        ),
        maximum: maximum > 0 ? maximum : null,
        cities: citiesSetting(settings[`payment_${provider}_cities`]),
        fee: numberSetting(
          settings[`payment_${provider}_fee`],
          Number(defaults[`payment_${provider}_fee`]),
        ),
        maintenance: booleanSetting(
          settings[`payment_${provider}_maintenance`],
          false,
        ),
        unavailableMessage: textSetting(
          settings[`payment_${provider}_unavailable_message`],
          defaults[`payment_${provider}_unavailable_message`],
        ),
      };
    })
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function paymentMethodAvailability(
  method: PaymentMethod,
  city: string,
  merchandiseTotal: number,
) {
  if (!method.enabled) return { available: false, reason: method.unavailableMessage };
  if (method.maintenance) return { available: false, reason: method.unavailableMessage };
  if (merchandiseTotal < method.minimum) {
    return {
      available: false,
      reason: `Disponible dès ${method.minimum} MAD`,
    };
  }
  if (method.maximum !== null && merchandiseTotal > method.maximum) {
    return {
      available: false,
      reason: `Disponible jusqu’à ${method.maximum} MAD`,
    };
  }
  const normalizedCity = normalizePaymentCity(city);
  if (
    method.cities.length &&
    !method.cities.some(
      (candidate) => normalizePaymentCity(candidate) === normalizedCity,
    )
  ) {
    return { available: false, reason: method.unavailableMessage };
  }
  return { available: true, reason: "" };
}

export function validatePaymentSetting(key: string, value: unknown) {
  if (!PAYMENT_SETTING_KEYS.includes(key)) return undefined;
  if (/(recommended|maintenance)$/.test(key)) {
    return value === "true" || value === "false"
      ? undefined
      : `Le réglage ${key} doit être un booléen.`;
  }
  if (/(sort_order|minimum|maximum|fee)$/.test(key)) {
    const amount = Number(value);
    return Number.isFinite(amount) && amount >= 0 && amount <= 1_000_000
      ? undefined
      : `Le montant ${key} est invalide.`;
  }
  const limit = key.endsWith("_cities") ? 1000 : key.endsWith("_description") ? 160 : 100;
  return typeof value === "string" && value.trim().length <= limit
    ? undefined
    : `Le texte ${key} est invalide.`;
}
