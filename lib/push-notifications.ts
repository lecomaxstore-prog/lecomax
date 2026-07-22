import "server-only";

import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export type PushPayload = {
  title: string;
  body?: string;
  icon?: string;
  image?: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  eventKey?: string;
};

export type PushResult = { sent: number; failed: number; total: number };

export const ADMIN_PUSH_USER_AGENT_PREFIX = "[LECOMAX_ADMIN] ";
const DEFAULT_PUSH_ICON = "/favicon.png?v=4";

function pushIcon(icon?: string) {
  return !icon || icon === "/favicon.png" ? DEFAULT_PUSH_ICON : icon;
}

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

function configureWebPush() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) throw new Error("Configuration VAPID manquante");
  webpush.setVapidDetails(subject, publicKey.replace(/\s+/g, ""), privateKey.replace(/\s+/g, ""));
}

/** Broadcasts to every customer who explicitly enabled browser notifications. */
export async function broadcastPushNotification(payload: PushPayload): Promise<PushResult> {
  configureWebPush();
  const supabase = getSupabase();
  const { data, error } = await supabase.from("push_subscriptions").select("endpoint, p256dh, auth");
  if (error) throw new Error(error.message);
  const subscriptions = data ?? [];
  if (subscriptions.length === 0) return { sent: 0, failed: 0, total: 0 };

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    icon: pushIcon(payload.icon),
    badge: "/icons/icon-192.png?v=4",
    image: payload.image,
    url: payload.url ?? "/ecomedia/",
    tag: payload.tag ?? "ecomedia-new-post",
    requireInteraction: payload.requireInteraction ?? false,
  });

  let sent = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];
  await Promise.allSettled(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        message,
      );
      sent += 1;
    } catch (error: unknown) {
      failed += 1;
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) expiredEndpoints.push(subscription.endpoint);
    }
  }));

  if (expiredEndpoints.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
  }
  await supabase.from("push_notifications_log").insert({
    event_key: payload.eventKey ?? null,
    title: payload.title,
    body: payload.body ?? null,
    icon: payload.icon ?? null,
    image: payload.image ?? null,
    click_url: payload.url ?? null,
    sent_count: sent,
    failed_count: failed,
  });
  return { sent, failed, total: subscriptions.length };
}

/** Sends operational alerts only to authenticated admin devices. */
export async function broadcastAdminPushNotification(payload: PushPayload): Promise<PushResult> {
  configureWebPush();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .like("user_agent", `${ADMIN_PUSH_USER_AGENT_PREFIX}%`);
  if (error) throw new Error(error.message);

  const subscriptions = data ?? [];
  if (subscriptions.length === 0) return { sent: 0, failed: 0, total: 0 };

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    icon: pushIcon(payload.icon),
    badge: "/icons/icon-192.png?v=4",
    image: payload.image,
    url: payload.url ?? "/admin/dashboard/",
    tag: payload.tag ?? "lecomax-admin-alert",
    requireInteraction: payload.requireInteraction ?? false,
  });

  let sent = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];
  await Promise.allSettled(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        message,
      );
      sent += 1;
    } catch (error: unknown) {
      failed += 1;
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) expiredEndpoints.push(subscription.endpoint);
    }
  }));

  if (expiredEndpoints.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
  }
  await supabase.from("push_notifications_log").insert({
    event_key: payload.eventKey ?? null,
    title: payload.title,
    body: payload.body ?? null,
    icon: payload.icon ?? null,
    image: payload.image ?? null,
    click_url: payload.url ?? null,
    sent_count: sent,
    failed_count: failed,
  });
  return { sent, failed, total: subscriptions.length };
}

type EcomediaPostNotification = {
  id: string;
  slug: string;
  title: string;
  content?: string | null;
  media_url?: string | null;
  thumbnail_url?: string | null;
};

export async function notifyPublishedEcomediaPost(post: EcomediaPostNotification) {
  const summary = (post.content || "Découvrez notre nouvelle publication sur Ecomedia.")
    .replace(/\s+/g, " ").trim().slice(0, 140);
  return broadcastPushNotification({
    eventKey: `ecomedia-post:${post.id}`,
    title: `Nouveau sur Ecomedia · ${post.title}`.slice(0, 100),
    body: summary,
    image: post.media_url || post.thumbnail_url || undefined,
    url: `/ecomedia/${post.slug}/`,
    tag: `ecomedia-post-${post.id}`,
  });
}
