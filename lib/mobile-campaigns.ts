import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  MOBILE_AUDIENCES,
  MOBILE_NOTIFICATION_CATEGORIES,
  preferenceAllowsCategory,
  type MobileAudience,
  type MobileNotificationCategory,
  type MobileNotificationPreferences,
} from "@/lib/mobile-campaign-policy";

export { MOBILE_AUDIENCES, MOBILE_NOTIFICATION_CATEGORIES } from "@/lib/mobile-campaign-policy";
export type { MobileAudience, MobileNotificationCategory } from "@/lib/mobile-campaign-policy";

export type MobileCampaignInput = {
  title: string;
  body: string;
  deepLink: string;
  imageUrl: string | null;
  audience: MobileAudience;
  audienceUserIds: string[];
  category: MobileNotificationCategory;
  scheduledAt: string | null;
};

type MobileCampaignRow = {
  id: string;
  title: string;
  body: string;
  deep_link: string;
  image_url: string | null;
  audience: MobileAudience;
  audience_user_ids: string[];
  category: MobileNotificationCategory;
  status: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_LINKS = [
  "/",
  "/catalog",
  "/search",
  "/wishlist",
  "/cart",
  "/account",
  "/orders",
  "/notifications",
  "/product/",
  "/info/",
];

function boundedText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export function safeMobileDeepLink(value: unknown) {
  const link = boundedText(value, 500) || "/";
  if (link.includes("://") || link.includes("\\") || link.includes("..")) return null;
  const pathname = link.split("?", 1)[0];
  return ALLOWED_LINKS.some((allowed) =>
    allowed.endsWith("/") ? pathname.startsWith(allowed) : pathname === allowed,
  ) ? link : null;
}

export function validateMobileCampaign(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: "Campagne invalide." } as const;
  }
  const source = value as Record<string, unknown>;
  const title = boundedText(source.title, 80);
  const body = boundedText(source.body, 240);
  const deepLink = safeMobileDeepLink(source.deepLink);
  const imageUrl = boundedText(source.imageUrl, 1000) || null;
  const audience = String(source.audience ?? "all") as MobileAudience;
  const category = String(source.category ?? "general") as MobileNotificationCategory;
  const audienceUserIds = Array.isArray(source.audienceUserIds)
    ? [...new Set(source.audienceUserIds.filter((id): id is string => typeof id === "string" && UUID.test(id)))].slice(0, 5000)
    : [];
  const scheduledAt = source.scheduledAt ? new Date(String(source.scheduledAt)) : null;

  if (!title) return { error: "Le titre est requis (80 caractères maximum)." } as const;
  if (!body) return { error: "Le message est requis (240 caractères maximum)." } as const;
  if (!deepLink) return { error: "Choisissez un lien interne autorisé." } as const;
  if (!MOBILE_AUDIENCES.includes(audience)) return { error: "Audience invalide." } as const;
  if (!MOBILE_NOTIFICATION_CATEGORIES.includes(category)) return { error: "Catégorie invalide." } as const;
  if (audience === "users" && audienceUserIds.length === 0) {
    return { error: "Ajoutez au moins un identifiant client pour cette audience." } as const;
  }
  if (imageUrl) {
    try {
      if (new URL(imageUrl).protocol !== "https:") throw new Error();
    } catch {
      return { error: "L’image doit utiliser une URL HTTPS valide." } as const;
    }
  }
  if (scheduledAt && (!Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now() + 60_000)) {
    return { error: "La programmation doit être au moins une minute dans le futur." } as const;
  }
  return {
    data: {
      title,
      body,
      deepLink,
      imageUrl,
      audience,
      audienceUserIds,
      category,
      scheduledAt: scheduledAt?.toISOString() ?? null,
    } satisfies MobileCampaignInput,
  } as const;
}

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function chunks<T>(values: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

type AudienceToken = { token: string; platform: string; user_id: string | null };

function normalizedEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function allRows(client: ReturnType<typeof supabaseAdmin>, table: string, columns: string) {
  const rows: Record<string, unknown>[] = [];
  for (let start = 0; start < 50_000; start += 1000) {
    const { data, error } = await client.from(table).select(columns).range(start, start + 999);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as unknown as Record<string, unknown>[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function audienceUserIds(client: ReturnType<typeof supabaseAdmin>, audience: MobileAudience, explicitIds: string[]) {
  if (audience === "users") return new Set(explicitIds);
  if (["all", "android", "ios"].includes(audience)) return null;

  const authUsers: Array<{ id: string; email?: string; created_at: string }> = [];
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    authUsers.push(...data.users);
    if (data.users.length < 1000) break;
  }
  const [orders, points] = await Promise.all([
    allRows(client, "orders", "customer,total,created_at"),
    allRows(client, "user_points", "email,points"),
  ]);
  const ordersByEmail = new Map<string, { spend: number; last: number }>();
  for (const row of orders) {
    const customer = row.customer && typeof row.customer === "object" ? row.customer as Record<string, unknown> : {};
    const email = normalizedEmail(customer.email);
    if (!email) continue;
    const current = ordersByEmail.get(email) ?? { spend: 0, last: 0 };
    current.spend += Number(row.total) || 0;
    current.last = Math.max(current.last, Date.parse(String(row.created_at ?? "")) || 0);
    ordersByEmail.set(email, current);
  }
  const pointsByEmail = new Map(points.map((row) => [normalizedEmail(row.email), Number(row.points) || 0]));
  const now = Date.now();
  const thirtyDays = 30 * 86_400_000;
  const ninetyDays = 90 * 86_400_000;
  return new Set(authUsers.filter((user) => {
    const email = normalizedEmail(user.email);
    const order = ordersByEmail.get(email);
    if (audience === "new_customers") return (Date.parse(user.created_at) || 0) >= now - thirtyDays;
    if (audience === "active_buyers") return Boolean(order && order.last >= now - ninetyDays);
    if (audience === "vip") return Boolean((order?.spend ?? 0) >= 2000 || (pointsByEmail.get(email) ?? 0) >= 1000);
    if (audience === "lapsed") return Boolean(order && order.last < now - ninetyDays);
    return !order;
  }).map((user) => user.id));
}

export async function resolveMobileAudienceUserIds(audience: MobileAudience, explicitIds: string[] = []) {
  return audienceUserIds(supabaseAdmin(), audience, explicitIds);
}

export async function resolveMobileAudience(
  audience: MobileAudience,
  explicitIds: string[] = [],
  category: MobileNotificationCategory = "general",
) {
  const client = supabaseAdmin();
  const selectedUsers = await audienceUserIds(client, audience, explicitIds);
  let query = client.from("mobile_push_tokens").select("token,platform,user_id").eq("active", true);
  if (audience === "android" || audience === "ios") query = query.eq("platform", audience);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  let tokens = (data ?? []) as AudienceToken[];
  if (selectedUsers) tokens = tokens.filter((row) => Boolean(row.user_id && selectedUsers.has(row.user_id)));
  const userIds = [...new Set(tokens.map((row) => row.user_id).filter((id): id is string => Boolean(id)))];
  if (category !== "service" && userIds.length) {
    const preferences = new Map<string, MobileNotificationPreferences>();
    for (const batch of chunks(userIds, 500)) {
      const { data: rows, error: preferenceError } = await client.from("mobile_notification_preferences").select("*").in("user_id", batch);
      if (preferenceError) throw new Error(preferenceError.message);
      for (const row of rows ?? []) preferences.set(row.user_id, row as MobileNotificationPreferences);
    }
    tokens = tokens.filter((row) => !row.user_id || preferenceAllowsCategory(category, preferences.get(row.user_id)));
  }
  const unique = [...new Map(tokens.map((row) => [row.token, row])).values()];
  return {
    tokens: unique,
    count: unique.length,
    android: unique.filter((row) => row.platform === "android").length,
    ios: unique.filter((row) => row.platform === "ios").length,
    userIds: selectedUsers,
  };
}

export async function deliverMobileCampaign(campaignId: string, actor = "system:mobile-campaign") {
  const client = supabaseAdmin();
  const { data: notificationSetting } = await client
    .from("settings")
    .select("value")
    .eq("key", "app_notifications_enabled")
    .maybeSingle();
  if (notificationSetting?.value === "false") throw new Error("MOBILE_NOTIFICATIONS_DISABLED");
  const { data: claimed, error: claimError } = await client
    .from("mobile_notification_campaigns")
    .update({ status: "sending", error_message: null, updated_at: new Date().toISOString() })
    .eq("id", campaignId)
    .in("status", ["draft", "scheduled", "failed"])
    .select("*")
    .maybeSingle();
  if (claimError) throw new Error(claimError.message);
  if (!claimed) throw new Error("CAMPAIGN_NOT_SENDABLE");
  const campaign = claimed as MobileCampaignRow;

  try {
    const resolved = await resolveMobileAudience(campaign.audience, campaign.audience_user_ids, campaign.category);
    const uniqueTokens = resolved.tokens;
    let delivered = 0;
    let failed = 0;
    const invalidTokens: string[] = [];

    for (const batch of chunks(uniqueTokens, 100)) {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(batch.map((row) => ({
          to: row.token,
          title: campaign.title,
          body: campaign.body,
          sound: "default",
          priority: "high",
          channelId: campaign.category === "service" ? "orders" : "marketing",
          ...(campaign.image_url ? { richContent: { image: campaign.image_url } } : {}),
          data: { url: campaign.deep_link, campaignId: campaign.id },
        }))),
      });
      if (!response.ok) throw new Error(`EXPO_PUSH_${response.status}`);
      const payload = await response.json() as { data?: Array<{ status?: string; details?: { error?: string } }> };
      (payload.data ?? []).forEach((ticket, index) => {
        if (ticket.status === "ok") delivered += 1;
        else {
          failed += 1;
          if (ticket.details?.error === "DeviceNotRegistered" && batch[index]?.token) {
            invalidTokens.push(batch[index].token);
          }
        }
      });
    }

    if (invalidTokens.length) {
      await client.from("mobile_push_tokens").update({ active: false, updated_at: new Date().toISOString() }).in("token", invalidTokens);
    }
    const sentAt = new Date().toISOString();
    await client.from("mobile_notifications").insert({
      campaign_id: campaign.id,
      title: campaign.title,
      body: campaign.body,
      deep_link: campaign.deep_link,
      image_url: campaign.image_url,
      audience: campaign.audience,
      audience_user_ids: campaign.audience_user_ids,
      category: campaign.category,
      published_at: sentAt,
      expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    });
    const { error: finishError } = await client
      .from("mobile_notification_campaigns")
      .update({
        status: "sent",
        sent_at: sentAt,
        target_count: uniqueTokens.length,
        delivered_count: delivered,
        failed_count: failed,
        updated_at: sentAt,
      })
      .eq("id", campaign.id);
    if (finishError) throw new Error(finishError.message);
    await client.from("mobile_control_audit").insert({
      actor_email: actor,
      action: "campaign_sent",
      entity_type: "mobile_notification_campaign",
      entity_id: campaign.id,
      details: { targetCount: uniqueTokens.length, delivered, failed, audience: campaign.audience, category: campaign.category },
    });
    return { target: uniqueTokens.length, delivered, failed };
  } catch (error) {
    await client.from("mobile_notification_campaigns").update({
      status: "failed",
      error_message: error instanceof Error ? error.message.slice(0, 500) : "UNKNOWN_DELIVERY_ERROR",
      updated_at: new Date().toISOString(),
    }).eq("id", campaign.id);
    throw error;
  }
}
