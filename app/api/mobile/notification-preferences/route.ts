import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit } from "@/lib/api-security";
import { DEFAULT_MOBILE_NOTIFICATION_PREFERENCES } from "@/lib/mobile-campaign-policy";
import { getCustomerUser } from "@/lib/request-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const KEYS = Object.keys(DEFAULT_MOBILE_NOTIFICATION_PREFERENCES) as Array<keyof typeof DEFAULT_MOBILE_NOTIFICATION_PREFERENCES>;

export async function GET(req: NextRequest) {
  const blocked = enforceRateLimit(req, "mobile-notification-preferences:read", 60, 60_000);
  if (blocked) return blocked;
  const user = await getCustomerUser(req);
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const { data, error } = await supabase.from("mobile_notification_preferences").select("*").eq("user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Préférences indisponibles." }, { status: 500 });
  return NextResponse.json({ preferences: { ...DEFAULT_MOBILE_NOTIFICATION_PREFERENCES, ...(data ?? {}) } }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(req: NextRequest) {
  const blocked = enforceRateLimit(req, "mobile-notification-preferences:write", 30, 60_000);
  if (blocked) return blocked;
  const user = await getCustomerUser(req);
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Préférences invalides." }, { status: 400 });
  const preferences = Object.fromEntries(KEYS.map((key) => [key, typeof body[key] === "boolean" ? body[key] : DEFAULT_MOBILE_NOTIFICATION_PREFERENCES[key]]));
  const { error } = await supabase.from("mobile_notification_preferences").upsert({ user_id: user.id, ...preferences, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  return NextResponse.json({ preferences });
}
