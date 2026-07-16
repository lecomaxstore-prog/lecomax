import { PAYPAL_CURRENCY, paypalAmountFromMad } from "@/lib/paypal-money";

const PAYPAL_ID = /^[A-Z0-9_-]{8,64}$/i;

type PayPalCapture = {
  id?: string;
  status?: string;
  amount?: { currency_code?: string; value?: string };
};

type PayPalOrder = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    payments?: { captures?: PayPalCapture[] };
  }>;
};

function apiBase() {
  return process.env.PAYPAL_ENVIRONMENT === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

function credentials() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !secret) throw new Error("PAYPAL_NOT_CONFIGURED");
  return { clientId, secret };
}

async function paypalAccessToken() {
  const { clientId, secret } = credentials();
  const response = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({})) as { access_token?: string };
  if (!response.ok || !body.access_token) throw new Error("PAYPAL_AUTH_FAILED");
  return body.access_token;
}

export async function verifyPayPalCapture(input: {
  orderId: string;
  captureId: string;
  expectedMad: number;
}) {
  if (!PAYPAL_ID.test(input.orderId) || !PAYPAL_ID.test(input.captureId)) {
    throw new Error("PAYPAL_ID_INVALID");
  }

  const token = await paypalAccessToken();
  const response = await fetch(`${apiBase()}/v2/checkout/orders/${encodeURIComponent(input.orderId)}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  const order = await response.json().catch(() => ({})) as PayPalOrder;
  if (!response.ok) throw new Error("PAYPAL_ORDER_NOT_FOUND");
  if (order.id !== input.orderId || order.status !== "COMPLETED") throw new Error("PAYPAL_ORDER_NOT_COMPLETED");

  const captures = order.purchase_units?.flatMap((unit) => unit.payments?.captures ?? []) ?? [];
  const capture = captures.find((candidate) => candidate.id === input.captureId);
  if (!capture || capture.status !== "COMPLETED") throw new Error("PAYPAL_CAPTURE_NOT_COMPLETED");

  const expectedAmount = paypalAmountFromMad(input.expectedMad);
  if (capture.amount?.currency_code !== PAYPAL_CURRENCY || capture.amount.value !== expectedAmount) {
    throw new Error("PAYPAL_AMOUNT_MISMATCH");
  }

  return { orderId: input.orderId, captureId: input.captureId, currency: PAYPAL_CURRENCY, amount: expectedAmount };
}

export async function verifyPayPalWebhook(headers: Headers, webhookEvent: unknown) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (!webhookId) throw new Error("PAYPAL_WEBHOOK_NOT_CONFIGURED");
  const requiredHeaders = {
    transmission_id: headers.get("paypal-transmission-id"),
    transmission_time: headers.get("paypal-transmission-time"),
    cert_url: headers.get("paypal-cert-url"),
    auth_algo: headers.get("paypal-auth-algo"),
    transmission_sig: headers.get("paypal-transmission-sig"),
  };
  if (Object.values(requiredHeaders).some((value) => !value)) throw new Error("PAYPAL_WEBHOOK_HEADERS_MISSING");

  const token = await paypalAccessToken();
  const response = await fetch(`${apiBase()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...requiredHeaders, webhook_id: webhookId, webhook_event: webhookEvent }),
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({})) as { verification_status?: string };
  return response.ok && result.verification_status === "SUCCESS";
}
