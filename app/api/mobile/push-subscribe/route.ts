import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCustomerUser } from "@/lib/request-auth";
import { enforceRateLimit } from "@/lib/api-security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function validExpoToken(value: unknown) {
  return typeof value === "string"
    && /^(Expo|Exponent)PushToken\[[A-Za-z0-9_-]{10,220}\]$/.test(value);
}

function validInstallationId(value: unknown) {
  return typeof value === "string"
    && value.length >= 20
    && value.length <= 100
    && /^[A-Za-z0-9_-]+$/.test(value);
}

export async function POST(req: NextRequest) {
  const blocked = enforceRateLimit(req, "mobile-push-subscribe", 12, 60_000);
  if (blocked) return blocked;
  const user = await getCustomerUser(req);
  let body: { token?: unknown; platform?: unknown; installationId?: unknown };
  try { body = await readJsonLimited(req); }
  catch { return NextResponse.json({ error: "Requête JSON invalide." }, { status: 400 }); }
  if (!validExpoToken(body.token) || !["ios", "android"].includes(String(body.platform)) || !validInstallationId(body.installationId)) {
    return NextResponse.json({ error: "Jeton de notification invalide." }, { status: 400 });
  }
  const { data: notificationSetting, error: settingsError } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "app_notifications_enabled")
    .maybeSingle();
  if (settingsError || notificationSetting?.value === "false") {
    return NextResponse.json({ error: "Les notifications mobiles sont temporairement désactivées." }, { status: 503 });
  }
  const { error } = await supabase.from("mobile_push_tokens").upsert({
    user_id: user?.id ?? null,
    installation_id: body.installationId,
    token: body.token,
    platform: body.platform,
    active: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: "token" });
  if (error) return NextResponse.json({ error: "Impossible d’activer les notifications." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const blocked = enforceRateLimit(req, "mobile-push-unsubscribe", 12, 60_000);
  if (blocked) return blocked;
  const user = await getCustomerUser(req);
  let body: { token?: unknown; installationId?: unknown };
  try { body = await readJsonLimited(req); }
  catch { return NextResponse.json({ error: "Requête JSON invalide." }, { status: 400 }); }
  if (!validExpoToken(body.token) || !validInstallationId(body.installationId)) return NextResponse.json({ error: "Jeton invalide." }, { status: 400 });
  let query = supabase
    .from("mobile_push_tokens")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("token", body.token);
  query = user ? query.eq("user_id", user.id) : query.eq("installation_id", body.installationId);
  const { error } = await query;
  if (error) return NextResponse.json({ error: "Impossible de désactiver les notifications." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
