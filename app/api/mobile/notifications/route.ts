import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCustomerUser } from "@/lib/request-auth";
import { enforceRateLimit } from "@/lib/api-security";
import { preferenceAllowsCategory, type MobileAudience, type MobileNotificationCategory } from "@/lib/mobile-campaign-policy";
import { resolveMobileAudienceUserIds } from "@/lib/mobile-campaigns";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cors(req: NextRequest, response: NextResponse) {
  const origin = req.headers.get("origin");
  const allowed = origin === "https://lecomax.com"
    || origin === "https://app.lecomax.com"
    || Boolean(origin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin));
  if (origin && allowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.append("Vary", "Origin");
  }
  return response;
}

export function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  response.headers.set("Access-Control-Max-Age", "86400");
  return cors(req, response);
}

export async function GET(req: NextRequest) {
  const blocked = enforceRateLimit(req, "mobile-notifications:read", 90, 60_000);
  if (blocked) return cors(req, blocked);
  const user = await getCustomerUser(req);
  const platform = req.nextUrl.searchParams.get("platform");
  const { data, error } = await supabase.from("mobile_notifications")
    .select("id,title,body,deep_link,image_url,audience,audience_user_ids,category,published_at,expires_at")
    .lte("published_at", new Date().toISOString()).order("published_at", { ascending: false }).limit(100);
  if (error) return cors(req, NextResponse.json({ error: "Notifications indisponibles." }, { status: 500 }));
  const now = Date.now();
  const segmentedAudiences = [...new Set((data ?? []).map((item) => item.audience).filter((value) => !["all", "android", "ios", "users"].includes(value)))];
  const segmentUsers = new Map<string, Set<string> | null>();
  if (user) {
    await Promise.all(segmentedAudiences.map(async (audience) => {
      segmentUsers.set(audience, await resolveMobileAudienceUserIds(audience as MobileAudience));
    }));
  }
  const { data: preferenceRow, error: preferenceError } = user
    ? await supabase.from("mobile_notification_preferences").select("*").eq("user_id", user.id).maybeSingle()
    : { data: null, error: null };
  if (preferenceError) return cors(req, NextResponse.json({ error: "Préférences indisponibles." }, { status: 503 }));
  const visible = (data ?? []).filter((item) => {
    if (item.expires_at && new Date(item.expires_at).getTime() <= now) return false;
    if (!preferenceAllowsCategory(item.category as MobileNotificationCategory, preferenceRow)) return false;
    if (item.audience === "all") return true;
    if ((item.audience === "android" || item.audience === "ios") && item.audience === platform) return true;
    if (item.audience === "users") return Boolean(user && item.audience_user_ids?.includes(user.id));
    return Boolean(user && segmentUsers.get(item.audience)?.has(user.id));
  }).slice(0, 50);
  let readIds = new Set<string>();
  if (user && visible.length) {
    const { data: reads, error: readsError } = await supabase.from("mobile_notification_reads")
      .select("notification_id").eq("user_id", user.id).in("notification_id", visible.map((item) => item.id));
    if (readsError) return cors(req, NextResponse.json({ error: "Notifications indisponibles." }, { status: 503 }));
    readIds = new Set((reads ?? []).map((item) => item.notification_id));
  }
  return cors(req, NextResponse.json({
    items: visible.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      deepLink: item.deep_link,
      imageUrl: item.image_url,
      publishedAt: item.published_at,
      read: readIds.has(item.id),
    })),
    unreadCount: user ? visible.filter((item) => !readIds.has(item.id)).length : 0,
  }, { headers: { "Cache-Control": "private, no-store" } }));
}

export async function POST(req: NextRequest) {
  const blocked = enforceRateLimit(req, "mobile-notifications:write", 60, 60_000);
  if (blocked) return cors(req, blocked);
  const user = await getCustomerUser(req);
  if (!user) return cors(req, NextResponse.json({ error: "Connexion requise." }, { status: 401 }));
  const body = await req.json().catch(() => null) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids)
    ? [...new Set(body.ids.filter((id): id is string => typeof id === "string" && UUID.test(id)))].slice(0, 100)
    : [];
  if (!ids.length) return cors(req, NextResponse.json({ error: "Aucune notification valide." }, { status: 400 }));
  const { error } = await supabase.from("mobile_notification_reads").upsert(
    ids.map((notificationId) => ({ notification_id: notificationId, user_id: user.id, read_at: new Date().toISOString() })),
    { onConflict: "notification_id,user_id" },
  );
  if (error) return cors(req, NextResponse.json({ error: "Impossible de marquer les notifications." }, { status: 500 }));
  return cors(req, NextResponse.json({ ok: true }));
}
