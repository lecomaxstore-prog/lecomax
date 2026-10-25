export type SyntheticScenario = "free" | "paid" | "failed" | "timeout";

export type SyntheticResult = {
  ok: boolean;
  kind: "quote" | "order" | "email" | "sms" | "inventory";
  id: string;
  amount?: number;
  message?: string;
};

function enabled() {
  if (process.env.APP_ENV !== "staging" || process.env.NEXT_PUBLIC_APP_ENV !== "staging") {
    throw new Error("SYNTHETIC_STAGING_REQUIRED");
  }
  if (process.env.STAGING_SYNTHETIC_ENABLED !== "true") {
    throw new Error("SYNTHETIC_STAGING_DISABLED");
  }
}

export function syntheticQuote(scenario: SyntheticScenario): SyntheticResult {
  enabled();
  if (scenario === "failed") return { ok: false, kind: "quote", id: "quote-failed", message: "SYNTHETIC_QUOTE_FAILED" };
  if (scenario === "timeout") return { ok: false, kind: "quote", id: "quote-timeout", message: "SYNTHETIC_QUOTE_TIMEOUT" };
  return { ok: true, kind: "quote", id: `quote-${scenario}`, amount: scenario === "free" ? 0 : 40 };
}

export function syntheticOrder(method: "cod" | "paypal"): SyntheticResult {
  enabled();
  return { ok: true, kind: "order", id: `synthetic-order-${method}` };
}

export function syntheticSideEffect(kind: "email" | "sms" | "inventory"): SyntheticResult {
  enabled();
  return { ok: true, kind, id: `synthetic-${kind}-no-send` };
}
