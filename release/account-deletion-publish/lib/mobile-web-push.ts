import "server-only";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { preferenceAllowsCategory, type MobileAudience, type MobileNotificationCategory } from "@/lib/mobile-campaign-policy";
import { claimDispatch, finishDispatch } from "@/lib/mobile-dispatch";

export async function deliverMobileWebPush(campaign: {
  id: string; title: string; body: string; deep_link: string; audience: MobileAudience; category: MobileNotificationCategory;
}, selectedUsers: Set<string> | null) {
  if (campaign.audience === "android" || campaign.audience === "ios") return { target: 0, accepted: 0, failed: 0, uncertain: 0 };
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  let target = 0, accepted = 0, failed = 0;
  let uncertain = 0;
  const expired: string[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from("mobile_web_push_subscriptions").select("endpoint,p256dh,auth,user_id").order("endpoint").range(offset, offset + 499);
    if (error) throw new Error(`WEB_PUSH_SUBSCRIPTIONS_${error.code}`);
    if (!data?.length) break;
    const ids = [...new Set(data.flatMap(row => row.user_id ? [row.user_id] : []))];
    const preferences = ids.length ? await db.from("mobile_notification_preferences").select("*").in("user_id", ids) : { data: [], error: null };
    if (preferences.error) throw new Error("WEB_PUSH_PREFERENCES_UNAVAILABLE");
    const byUser = new Map(preferences.data?.map(row => [row.user_id, row]));
    const recipients = data.filter(row => (!selectedUsers || selectedUsers.has(row.user_id)) && preferenceAllowsCategory(campaign.category, byUser.get(row.user_id)));
    if (!recipients.length) continue;
    if (!process.env.VAPID_SUBJECT || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) throw new Error("WEB_PUSH_NOT_CONFIGURED");
    webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.trim(), process.env.VAPID_PRIVATE_KEY.trim());
    target += recipients.length;
    for (let start = 0; start < recipients.length; start += 6) {
      await Promise.all(recipients.slice(start, start + 6).map(async row => {
        const claim = await claimDispatch(campaign.id, row.endpoint);
        if (claim === "accepted") { accepted++; return; }
        if (claim === "uncertain") { failed++; uncertain++; return; }
        try {
          await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, JSON.stringify({ title: campaign.title, body: campaign.body, url: campaign.deep_link, campaignId: campaign.id }), { timeout: 10000, TTL: 86400 });
        } catch (error) {
          failed++;
          const status = (error as { statusCode?: number }).statusCode;
          if (status) await finishDispatch(campaign.id, row.endpoint, "failed");
          else uncertain++;
          if (status === 404 || status === 410) {
            // Retain the row until after pagination to avoid skipping recipients.
            expired.push(row.endpoint);
          }
          return;
        }
        await finishDispatch(campaign.id, row.endpoint, "accepted");
        accepted++;
      }));
    }
    if (data.length < 500) break;
  }
  for (let start = 0; start < expired.length; start += 100) {
    const { error } = await db.from("mobile_web_push_subscriptions").delete().in("endpoint", expired.slice(start, start + 100));
    if (error) throw new Error("WEB_PUSH_CLEANUP_FAILED");
  }
  return { target, accepted, failed, uncertain };
}
