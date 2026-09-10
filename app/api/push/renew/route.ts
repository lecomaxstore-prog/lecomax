import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Subscription = { endpoint: string; keys: { p256dh: string; auth: string } };
function valid(value: unknown): value is Subscription {
  const subscription = value as Partial<Subscription> | null;
  if (!subscription || typeof subscription.endpoint !== "string" ||
    typeof subscription.keys?.p256dh !== "string" || typeof subscription.keys.auth !== "string" ||
    !subscription.keys.p256dh || !subscription.keys.auth) return false;
  try { return new URL(subscription.endpoint).protocol === "https:"; } catch { return false; }
}

/** Browser rotation proves possession of the OLD subscription's private auth
 * secret. Audience is copied from the server, never accepted from the caller.
 * This also works after the admin login cookie expires while the page is closed.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!valid(body?.oldSubscription) || !valid(body?.subscription)) {
    return NextResponse.json({ error: "Abonnement incomplet" }, { status: 400 });
  }
  const old: Subscription = body.oldSubscription;
  const next: Subscription = body.subscription;
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: previous, error } = await db.from("push_subscriptions")
    .select("user_agent").eq("endpoint", old.endpoint)
    .eq("p256dh", old.keys.p256dh).eq("auth", old.keys.auth).maybeSingle();
  if (error) return NextResponse.json({ error: "Renouvellement indisponible" }, { status: 503 });
  if (!previous) {
    // A successful renewal may be retried after its response was lost offline.
    const { data: existing, error: lookupError } = await db.from("push_subscriptions")
      .select("endpoint").eq("endpoint", next.endpoint)
      .eq("p256dh", next.keys.p256dh).eq("auth", next.keys.auth).maybeSingle();
    if (lookupError) return NextResponse.json({ error: "Renouvellement indisponible" }, { status: 503 });
    return NextResponse.json(existing ? { ok: true } : { error: "Abonnement non reconnu" }, { status: existing ? 200 : 403 });
  }
  const { error: saveError } = await db.from("push_subscriptions").upsert({
    endpoint: next.endpoint, p256dh: next.keys.p256dh, auth: next.keys.auth,
    user_agent: previous.user_agent,
  }, { onConflict: "endpoint" });
  if (saveError) return NextResponse.json({ error: "Renouvellement indisponible" }, { status: 503 });
  if (old.endpoint !== next.endpoint) {
    const { error: deleteError } = await db.from("push_subscriptions").delete()
      .eq("endpoint", old.endpoint).eq("auth", old.keys.auth).eq("p256dh", old.keys.p256dh);
    if (deleteError) return NextResponse.json({ error: "Renouvellement à terminer" }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
