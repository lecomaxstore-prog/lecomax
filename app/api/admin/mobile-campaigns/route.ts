import { publicDatabaseError } from "@/lib/public-error";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySessionToken } from "@/lib/admin-session";
import { protectAdminMutation, protectAdminRead } from "@/lib/api-security";
import { deliverMobileCampaign, validateMobileCampaign } from "@/lib/mobile-campaigns";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function actor(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  return token ? await verifySessionToken(token) : null;
}

export async function GET(req: NextRequest) {
  const blocked = await protectAdminRead(req, { key: "mobile-campaigns:read" });
  if (blocked) return blocked;
  const [{ data: campaigns, error }, { count: activeTokens }, { count: androidTokens }, { count: iosTokens }] = await Promise.all([
    supabase.from("mobile_notification_campaigns").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("mobile_push_tokens").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("mobile_push_tokens").select("id", { count: "exact", head: true }).eq("active", true).eq("platform", "android"),
    supabase.from("mobile_push_tokens").select("id", { count: "exact", head: true }).eq("active", true).eq("platform", "ios"),
  ]);
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  const [web, receiptsOk, receiptsPending, receiptsFailed, uncertain] = await Promise.all([
    supabase.from("mobile_web_push_subscriptions").select("endpoint", { count: "exact", head: true }),
    supabase.from("mobile_push_receipts").select("ticket_id", { count: "exact", head: true }).eq("status", "ok"),
    supabase.from("mobile_push_receipts").select("ticket_id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("mobile_push_receipts").select("ticket_id", { count: "exact", head: true }).in("status", ["error", "missing"]),
    supabase.from("mobile_campaign_dispatches").select("recipient_hash", { count: "exact", head: true }).eq("status", "sending").lte("updated_at", new Date(Date.now() - 10 * 60000).toISOString()),
  ]);
  return NextResponse.json({
    campaigns: campaigns ?? [],
    subscribers: { total: (activeTokens ?? 0) + (web.count ?? 0), android: androidTokens ?? 0, ios: iosTokens ?? 0, web: web.count ?? 0 },
    deliveryHealth: { confirmed: receiptsOk.count ?? 0, pending: receiptsPending.count ?? 0, failed: receiptsFailed.count ?? 0, uncertain: uncertain.count ?? 0, available: [web, receiptsOk, receiptsPending, receiptsFailed, uncertain].every(result => !result.error && result.count !== null) },
  });
}

export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "mobile-campaigns:create", limit: 20, windowMs: 60_000 });
  if (blocked) return blocked;
  const body = await readJsonLimited(req).catch(() => null) as (Record<string, unknown> & { action?: unknown }) | null;
  const parsed = validateMobileCampaign(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const adminEmail = await actor(req);
  if (!adminEmail) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const action = body?.action === "send" ? "send" : parsed.data.scheduledAt ? "schedule" : "draft";
  const status = action === "schedule" ? "scheduled" : "draft";
  const { data, error } = await supabase.from("mobile_notification_campaigns").insert({
    title: parsed.data.title,
    body: parsed.data.body,
    deep_link: parsed.data.deepLink,
    image_url: parsed.data.imageUrl,
    audience: parsed.data.audience,
    audience_user_ids: parsed.data.audienceUserIds,
    category: parsed.data.category,
    scheduled_at: parsed.data.scheduledAt,
    status,
    created_by: adminEmail,
  }).select("*").single();
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  await supabase.from("mobile_control_audit").insert({
    actor_email: adminEmail,
    action: action === "send" ? "campaign_created_for_send" : `campaign_${status}`,
    entity_type: "mobile_notification_campaign",
    entity_id: data.id,
    details: { audience: parsed.data.audience, category: parsed.data.category, scheduledAt: parsed.data.scheduledAt },
  });
  if (action === "send") {
    try {
      const result = await deliverMobileCampaign(data.id, adminEmail);
      return NextResponse.json({ campaign: { ...data, status: "sent", ...result }, result }, { status: 201 });
    } catch (sendError) {
      return NextResponse.json({ error: sendError instanceof Error ? sendError.message : "Échec de l’envoi.", campaign: data }, { status: 502 });
    }
  }
  return NextResponse.json({ campaign: data }, { status: 201 });
}
