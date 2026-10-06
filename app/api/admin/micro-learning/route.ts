import { NextRequest, NextResponse } from "next/server";
import { protectSourceBrowser } from "@/lib/dev-docs-access";
import { protectAdminMutation } from "@/lib/api-security";
import { getAdminAccess } from "@/lib/admin-access";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { DEFAULT_LEARNING_SETTINGS, validateLearningSettings } from "@/lib/micro-learning";
import { readJsonLimited } from "@/lib/request-body";

export const dynamic = "force-dynamic";
function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: NextRequest) {
  const denied = await protectSourceBrowser(request);
  if (denied) return denied;
  const access = (await getAdminAccess(request))!;
  const db = createServerSupabaseClient(10_000);
  const [settings, history, tips, devices] = await Promise.all([
    db.from("learning_notification_settings").select("*").eq("owner_email", access.email).maybeSingle(),
    db.from("learning_notification_history").select("id,tip_id,title,content,topic,level,sent_at,created_at,read_at,learned_at,favorite,delivery_state").eq("owner_email", access.email).order("created_at", { ascending: false }).limit(1000),
    db.from("learning_tips").select("*").order("id").limit(1000),
    db.from("push_subscriptions").select("endpoint", { count: "exact", head: true }).eq("admin_email", access.email).like("user_agent", "[LECOMAX_ADMIN] %"),
  ]);
  if ([settings, history, tips, devices].some(result => result.error)) return json({ error: "تعذر تحميل التعلم. حاول مرة أخرى. إذا استمر الخطأ، تحقق من إعداد قاعدة البيانات." }, 503);
  return json({
    settings: settings.data ? { ...settings.data, quiet_start: settings.data.quiet_start.slice(0,5), quiet_end: settings.data.quiet_end.slice(0,5) } : DEFAULT_LEARNING_SETTINGS,
    history: history.data, tips: tips.data, deviceCount: devices.count ?? 0,
    configured: Boolean(process.env.VAPID_SUBJECT && process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    schedulerConfigured: Boolean(process.env.LEARNING_CRON_SECRET || process.env.CRON_SECRET),
  });
}

export async function PATCH(request: NextRequest) {
  const denied = await protectAdminMutation(request, { key: "micro-learning", limit: 90 }) || await protectSourceBrowser(request);
  if (denied) return denied;
  const access = (await getAdminAccess(request))!;
  const body = await readJsonLimited(request, 4096).catch(() => null);
  const db = createServerSupabaseClient(10_000);
  if (body?.action === "settings") {
    const settings = validateLearningSettings(body.settings);
    if (!settings) return json({ error: "تحقق من وقت الهدوء والمنطقة الزمنية والإعدادات." }, 400);
    if (settings.enabled) {
      if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_SUBJECT) return json({ error: "إعداد Push غير مكتمل على Server." }, 503);
      const devices = await db.from("push_subscriptions").select("endpoint").eq("admin_email", access.email).like("user_agent", "[LECOMAX_ADMIN] %").limit(1);
      if (devices.error) return json({ error: "تعذر التحقق من الجهاز." }, 503);
      if (!devices.data?.length) return json({ error: "فعّل الإشعارات على جهاز واحد على الأقل أولًا." }, 409);
    }
    const result = await db.rpc("save_micro_learning_settings", { p_owner: access.email, p_settings: settings });
    return result.error ? json({ error: "تعذر حفظ الإعدادات." }, 503) : json({ ok: true });
  }
  if (body?.action === "history" && Number.isInteger(body.tipId) && ["read", "learned", "favorite"].includes(body.field) && typeof body.value === "boolean") {
    const update = body.field === "favorite" ? { favorite: body.value }
      : body.field === "learned" ? { learned_at: body.value ? new Date().toISOString() : null }
      : { read_at: new Date().toISOString() };
    let query = db.from("learning_notification_history").update(update).eq("owner_email", access.email).eq("tip_id", body.tipId);
    if (body.field === "read") query = query.is("read_at", null);
    const result = await query.select("id");
    if (result.error) return json({ error: "تعذر حفظ تقدمك." }, 503);
    if (body.field !== "read" && !result.data?.length) return json({ error: "هذه المعلومة غير موجودة في سجلك بعد." }, 404);
    return json({ ok: true });
  }
  return json({ error: "Invalid learning request" }, 400);
}
