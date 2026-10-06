import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { broadcastAdminPushNotification } from "@/lib/push-notifications";
import { parisLearningDay } from "@/lib/learning-reminder-time";

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const day = parisLearningDay();
  if (day.hour !== 21) return NextResponse.json({ skipped: "outside-evening-hour" });
  const owner = (process.env.ADMIN_EMAIL ?? "contact@lecomax.com").trim().toLowerCase();
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: devices, error: deviceError } = await db.from("push_subscriptions").select("endpoint").eq("admin_email", owner).limit(1);
  if (deviceError) return NextResponse.json({ error: "Device lookup failed" }, { status: 503 });
  if (!devices?.length) return NextResponse.json({ skipped: "no-owner-device" });
  const { data: claimed, error } = await db.rpc("claim_learning_reminder", { p_owner: owner, p_day: day.date });
  if (error) return NextResponse.json({ error: "Reminder lookup failed" }, { status: 503 });
  if (!claimed) return NextResponse.json({ skipped: "completed-or-already-reminded" });
  try {
    const result = await broadcastAdminPushNotification({
      title: "📚 درسك ينتظرك",
      body: "لم تكمل درسًا اليوم بعد. خذ دقائق قليلة وتعلم فكرة جديدة من موقعك.",
      lang: "ar", dir: "rtl",
      url: "/admin/how-it-was-built/#academy", tag: `learning-${day.date}`, eventKey: `learning-${day.date}`,
    }, undefined, owner);
    return NextResponse.json(result, { status: result.failed ? 502 : 200 });
  } catch {
    // Preserve the claim: a delivery may have succeeded before a network failure.
    return NextResponse.json({ error: "Reminder delivery failed; inspect logs before retrying" }, { status: 502 });
  }
}
