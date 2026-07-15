import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/push/subscribe — save a new subscription
export async function POST(req: NextRequest) {
  let body: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { endpoint, keys } = body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Missing subscription fields" }, { status: 400 });
  }

  const rawUserAgent = req.headers.get("user-agent") ?? "";
  const { data: existing } = await supabase
    .from("push_subscriptions")
    .select("user_agent")
    .eq("endpoint", endpoint)
    .maybeSingle();
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/push/subscribe — remove a subscription (body: { endpoint })
export async function DELETE(req: NextRequest) {
  let body: { endpoint?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", body.endpoint);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// GET /api/push/subscribe — count subscribers (admin)
export async function GET() {
  const { count, error } = await supabase
    .from("push_subscriptions")
    .select("*", { count: "exact", head: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: count ?? 0 });
}
