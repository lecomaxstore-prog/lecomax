import { readJsonLimited } from "@/lib/request-body";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPayPalWebhook } from "@/lib/paypal-server";
import { paypalWebhookChange } from "@/lib/paypal-webhook-event";
import { securityLog } from "@/lib/security-log";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export async function POST(req: NextRequest) {
  let event: unknown;
  try {
    event = await readJsonLimited(req) ;
  } catch {
    return NextResponse.json({ error: "Invalid webhook JSON." }, { status: 400 });
  }

  const change = paypalWebhookChange(event);
  if (!change) return NextResponse.json({ error: "Invalid webhook event." }, { status: 400 });

  try {
    if (!(await verifyPayPalWebhook(req.headers, event))) {
      securityLog("webhook_rejected", "/api/paypal/webhook");
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

  const { data, error } = await supabase.rpc("reconcile_paypal_webhook", {
    p_event_id: change.eventId, p_event_type: change.eventType,
    p_capture_id: change.captureId, p_status: change.status, p_created_at: change.createdAt,
  });
  if (error) {
    // A missing migration or an order still being created must trigger a retry.
    console.error("PayPal reconciliation unavailable", { code: error.code });
    return NextResponse.json({ error: "Order reconciliation unavailable." }, { status: 503 });
  }
  revalidateTag("storefront-products");
  return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
}
