const CODE_PATTERN = /^[A-Z0-9_-]{3,40}$/;

export function cleanCouponPayload(value: unknown, partial = false) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: "Configuration du code promo invalide." } as const;
  }
  const input = value as Record<string, unknown>;
  const allowed = new Set([
    "code",
    "type",
    "value",
    "min_order",
    "max_uses",
    "expires_at",
    "active",
  ]);
  const unknown = Object.keys(input).find((key) => !allowed.has(key));
  if (unknown) return { error: `Champ non autorisé : ${unknown}.` } as const;
  const payload: Record<string, unknown> = {};

  if (!partial || "code" in input) {
    const code = String(input.code ?? "").trim().toUpperCase();
    if (!CODE_PATTERN.test(code)) {
      return { error: "Le code doit contenir 3 à 40 lettres, chiffres, tirets ou underscores." } as const;
    }
    payload.code = code;
  }
  if (!partial || "type" in input) {
    if (input.type !== "percent" && input.type !== "fixed") {
      return { error: "Type de réduction invalide." } as const;
    }
    payload.type = input.type;
  }
  if (!partial || "value" in input) {
    const amount = Number(input.value);
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 1_000_000 ||
      (input.type === "percent" && amount > 100)
    ) {
      return { error: "Valeur de réduction invalide." } as const;
    }
    payload.value = amount;
  }
  for (const key of ["min_order", "max_uses"] as const) {
    if (!partial || key in input) {
      if (input[key] === null || input[key] === "" || input[key] === undefined) {
        payload[key] = null;
      } else {
        const amount = Number(input[key]);
        if (
          !Number.isFinite(amount) ||
          amount < 0 ||
          amount > 1_000_000 ||
          (key === "max_uses" && !Number.isInteger(amount))
        ) {
          return { error: `${key} est invalide.` } as const;
        }
        payload[key] = amount;
      }
    }
  }
  if (!partial || "expires_at" in input) {
    if (!input.expires_at) payload.expires_at = null;
    else {
      const date = new Date(String(input.expires_at));
      if (Number.isNaN(date.getTime())) {
        return { error: "Date d’expiration invalide." } as const;
      }
      payload.expires_at = date.toISOString();
    }
  }
  if (!partial || "active" in input) {
    if (typeof input.active !== "boolean") {
      return { error: "Statut du code promo invalide." } as const;
    }
    payload.active = input.active;
  }
  return { payload } as const;
}
