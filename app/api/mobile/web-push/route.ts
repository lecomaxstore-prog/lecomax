import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit } from "@/lib/api-security";
import { getCustomerUser } from "@/lib/request-auth";

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.replace(/\s/g, "");
  return publicKey ? NextResponse.json({ publicKey }) : NextResponse.json({ error: "Notifications indisponibles." }, { status: 503 });
}
function validEndpoint(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port &&
      (url.hostname === "fcm.googleapis.com" || url.hostname === "updates.push.services.mozilla.com" || url.hostname.endsWith(".notify.windows.com") || url.hostname === "web.push.apple.com");
  } catch { return false; }
}
async function mutate(req: NextRequest, remove: boolean) {
  const blocked = enforceRateLimit(req, "mobile-web-push", 12, 60000);
  if (blocked) return blocked;
  const body = await req.json().catch(() => null);
  const endpoint = remove ? body?.endpoint : body?.subscription?.endpoint;
  if (!validEndpoint(endpoint) || typeof body?.installationId !== "string" || !/^[a-zA-Z0-9_-]{20,100}$/.test(body.installationId)) {
    return NextResponse.json({ error: "Abonnement invalide." }, { status: 400 });
  }
  const client = db();
  if (remove) {
    const { error } = await client.from("mobile_web_push_subscriptions").delete().eq("endpoint", endpoint).eq("installation_id", body.installationId);
    return error ? NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 }) : NextResponse.json({ ok: true });
  }
  const keys = body.subscription.keys;
  if (!keys || !/^[A-Za-z0-9_-]{80,100}$/.test(keys.p256dh) || !/^[A-Za-z0-9_-]{20,30}$/.test(keys.auth)) return NextResponse.json({ error: "Clés invalides." }, { status: 400 });
  const { data: setting, error: settingsError } = await client.from("settings").select("value").eq("key", "app_notifications_enabled").maybeSingle();
  if (settingsError || setting?.value === "false") return NextResponse.json({ error: "Notifications indisponibles." }, { status: 503 });
  const user = await getCustomerUser(req);
  const { error } = await client.from("mobile_web_push_subscriptions").upsert({ endpoint, p256dh: keys.p256dh, auth: keys.auth, installation_id: body.installationId, user_id: user?.id ?? null, updated_at: new Date().toISOString() }, { onConflict: "endpoint" });
  return error ? NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 }) : NextResponse.json({ ok: true });
}
export const POST = (req: NextRequest) => mutate(req, false);
export const DELETE = (req: NextRequest) => mutate(req, true);
