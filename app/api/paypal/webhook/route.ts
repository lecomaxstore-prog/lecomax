import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPayPalWebhook } from "@/lib/paypal-server";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

type PayPalWebhookEvent = {
  id?: unknown;
  event_type?: unknown;
  resource?: { id?: unknown };
};

const PAYMENT_STATUS_BY_EVENT: Record<string, string> = {
  "PAYMENT.CAPTURE.COMPLETED": "captured",
  "PAYMENT.CAPTURE.PENDING": "pending",
  "PAYMENT.CAPTURE.DECLINED": "failed",
  "PAYMENT.CAPTURE.DENIED": "failed",
  "PAYMENT.CAPTURE.REFUNDED": "refunded",
  "PAYMENT.CAPTURE.REVERSED": "reversed",
};

function safeIdentifier(value: unknown, max = 100) {
  return typeof value === "string" && /^[A-Za-z0-9_.:-]+$/.test(value) ? value.slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  let event: PayPalWebhookEvent;
  try {
    event = await req.json() as PayPalWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook JSON." }, { status: 400 });
  }

  const eventId = safeIdentifier(event.id);
  const eventType = safeIdentifier(event.event_type);
  const captureId = safeIdentifier(event.resource?.id, 64) || null;
  if (!eventId || !eventType) return NextResponse.json({ error: "Invalid webhook event." }, { status: 400 });

  try {
    if (!(await verifyPayPalWebhook(req.headers, event))) {
      return NextResponse.json({ error: "Invalid PayPal signature." }, { status: 401 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "PAYPAL_WEBHOOK_HEADERS_MISSING") {
      return NextResponse.json({ error: "Missing PayPal signature headers." }, { status: 401 });
    }
    console.error("PayPal webhook verification unavailable:", message || error);
    return NextResponse.json({ error: "Webhook verification unavailable." }, { status: 503 });
  }

  const { data: processed, error: lookupError } = await supabase
    .from("paypal_webhook_events")
    .select("event_id")
    .eq("event_id", eventId)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Webhook storage unavailable." }, { status: 503 });
  if (processed) return NextResponse.json({ received: true, duplicate: true });

  const paymentStatus = PAYMENT_STATUS_BY_EVENT[eventType];
  if (paymentStatus && captureId) {
    const { error: updateError } = await supabase
      .from("orders")
      .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
      .eq("payment_reference", captureId);
    if (updateError) {
      console.error("PayPal webhook order reconciliation failed:", updateError);
      return NextResponse.json({ error: "Order reconciliation failed." }, { status: 503 });
    }
  }

  const { error: insertError } = await supabase.from("paypal_webhook_events").insert({
    event_id: eventId,
    event_type: eventType,
    capture_id: captureId,
  });
  if (insertError && insertError.code !== "23505") {
    console.error("PayPal webhook idempotency write failed:", insertError);
    return NextResponse.json({ error: "Webhook storage unavailable." }, { status: 503 });
  }

  return NextResponse.json({ received: true, duplicate: insertError?.code === "23505" });
}
