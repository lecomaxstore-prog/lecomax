import "server-only";
import { createServerSupabaseClient } from "./supabase-server";
import { sendLearningPush } from "./push-notifications";
import { learningTipUrl } from "./micro-learning";

export async function dispatchMicroLearning(owner: string) {
  const db = createServerSupabaseClient(10_000);
  // Recover pending work only. An interrupted send is ambiguous and must not be resent.
  const cutoff = new Date(Date.now() - 120_000).toISOString();
  const stale = await db.from("learning_notification_deliveries").update({ state: "unknown" }).eq("state", "sending").lt("attempted_at", cutoff);
  if (stale.error) throw stale.error;
  const claim = await db.rpc("claim_micro_learning", { p_owner: owner });
  if (claim.error) throw claim.error;
  const pending = await db.from("learning_notification_history").select("id,tip_id,title,content,created_at")
    .eq("owner_email", owner).eq("delivery_state", "pending").order("created_at").limit(10);
  if (pending.error) throw pending.error;
  let accepted = 0;
  for (const history of pending.data ?? []) {
    const deliveries = await db.from("learning_notification_deliveries").select("endpoint,state").eq("history_id", history.id);
    if (deliveries.error) throw deliveries.error;
    await Promise.all((deliveries.data ?? []).filter(delivery => delivery.state === "pending").map(async delivery => {
      const lock = await db.from("learning_notification_deliveries").update({ state: "sending", attempted_at: new Date().toISOString() })
        .eq("history_id", history.id).eq("endpoint", delivery.endpoint).eq("state", "pending").select("endpoint");
      if (lock.error) throw lock.error;
      if (!lock.data?.length) return;
      let state = "failed";
      // Re-check preferences immediately before dispatch, including quiet hours.
      const preference = await db.from("learning_notification_settings").select("*").eq("owner_email", owner).single();
      if (preference.error) throw preference.error;
      const settings = preference.data;
      const local = new Intl.DateTimeFormat("en-GB", { timeZone: settings.time_zone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format();
      const start = settings.quiet_start.slice(0, 5), end = settings.quiet_end.slice(0, 5);
      const quiet = settings.quiet_enabled && (start < end ? local >= start && local < end : local >= start || local < end);
      const expired = Date.now() - Date.parse(history.created_at) > 600_000;
      if (settings.enabled && !settings.paused && !quiet && !expired) {
        const device = await db.from("push_subscriptions").select("endpoint,p256dh,auth")
          .eq("admin_email", owner).eq("endpoint", delivery.endpoint).like("user_agent", "[LECOMAX_ADMIN] %").maybeSingle();
        if (device.error) throw device.error;
        if (device.data) {
          try {
            await sendLearningPush(device.data, {
              title: history.title, body: history.content, url: learningTipUrl(history.tip_id), tag: `learning-tip-${history.id}`,
            });
            state = "accepted";
            accepted++;
          } catch (error) {
            const status = (error as { statusCode?: number }).statusCode;
            state = status && status >= 400 && status < 500 ? "failed" : "unknown";
            if (status === 404 || status === 410) {
              const removed = await db.from("push_subscriptions").delete().eq("endpoint", delivery.endpoint).eq("admin_email", owner);
              if (removed.error) throw removed.error;
            }
          }
        }
      }
      const saved = await db.from("learning_notification_deliveries").update({ state }).eq("history_id", history.id).eq("endpoint", delivery.endpoint);
      if (saved.error) throw saved.error;
    }));
    const result = await db.from("learning_notification_deliveries").select("state,attempted_at").eq("history_id", history.id);
    if (result.error) throw result.error;
    const states = result.data ?? [];
    if (states.some(item => item.state === "sending" || item.state === "pending")) continue;
    const successful = states.filter(item => item.state === "accepted");
    const deliveryState = successful.length ? (successful.length === states.length ? "accepted" : "partial")
      : states.some(item => item.state === "unknown") ? "unknown" : "failed";
    const saved = await db.from("learning_notification_history").update({ delivery_state: deliveryState, sent_at: successful[0]?.attempted_at ?? null }).eq("id", history.id);
    if (saved.error) throw saved.error;
  }
  return { claimed: Boolean(claim.data), accepted };
}
