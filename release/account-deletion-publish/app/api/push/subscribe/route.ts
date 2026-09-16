import { publicDatabaseError } from "@/lib/public-error";
import { protectAdminRead, protectAdminMutation } from "@/lib/api-security";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { validPushEndpoint } from "@/lib/push-endpoint";
import { enforceRateLimit } from "@/lib/api-security";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/push/subscribe — save a new subscription
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "push:subscribe", 20, 60_000);
  if (limited) return limited;
  let body: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  try { body = await readJsonLimited(req); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { endpoint, keys } = body;
  if (!validPushEndpoint(endpoint) || typeof keys?.p256dh !== "string" || typeof keys?.auth !== "string" || !/^[A-Za-z0-9_-]{80,100}$/.test(keys.p256dh) || !/^[A-Za-z0-9_-]{20,30}$/.test(keys.auth)) {
    return NextResponse.json({ error: "Missing subscription fields" }, { status: 400 });
  }

  const rawUserAgent = (req.headers.get("user-agent") ?? "").replace(/\[LECOMAX_ADMIN\]/g, "").slice(0, 512);
  const { data: existing } = await supabase
    .from("push_subscriptions")
    .select("user_agent")
    .eq("endpoint", endpoint)
    .maybeSingle();
  if (existing?.user_agent?.startsWith("[LECOMAX_ADMIN] ")) return NextResponse.json({ ok: true });
  // A device promoted to admin must never silently fall back into the customer audience.
  const userAgent = existing?.user_agent?.startsWith("[LECOMAX_ADMIN] ")
    ? existing.user_agent
    : rawUserAgent;

  // Upsert — avoid duplicates by endpoint
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { endpoint, p256dh: keys.p256dh, auth: keys.auth, user_agent: userAgent },
      { onConflict: "endpoint" }
    );

  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/push/subscribe — remove a subscription (body: { endpoint })
export async function DELETE(req: NextRequest) {
  let body: { endpoint?: string };
  try { body = await readJsonLimited(req); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", body.endpoint);

  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// GET /api/push/subscribe — count subscribers (admin)
export async function GET(req: NextRequest) {
  const securityDenied = await protectAdminRead(req, { key: "push/subscribe/route.ts:GET" });
  if (securityDenied) return securityDenied;
  const { count, error } = await supabase
    .from("push_subscriptions")
    .select("*", { count: "exact", head: true });
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json({ count: count ?? 0 });
}
