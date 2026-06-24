import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// POST /api/push/send — broadcast push notification to all subscribers
export async function POST(req: NextRequest) {
  let body: {
    title: string;
    body?: string;
    icon?: string;
    image?: string;
    url?: string;
    tag?: string;
    requireInteraction?: boolean;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  // Fetch all subscriptions
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, message: "No subscribers" });
  }

  const payload = JSON.stringify({
    title: body.title,
    body: body.body ?? "",
    icon: body.icon ?? "/favicon.png",
    badge: "/favicon.png",
    image: body.image,
    url: body.url ?? "/",
    tag: body.tag ?? "lecomax-push",
    requireInteraction: body.requireInteraction ?? false,
  });

  let sent = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        // Remove expired/invalid subscriptions (410 Gone)
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    })
  );

  // Clean up expired subscriptions
  if (expiredEndpoints.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expiredEndpoints);
  }

  // Log the notification (non-blocking — ignore if table not ready)
  try {
    await supabase.from("push_notifications_log").insert({
      title: body.title,
      body: body.body ?? null,
      icon: body.icon ?? null,
      image: body.image ?? null,
      click_url: body.url ?? null,
      sent_count: sent,
      failed_count: failed,
    });
  } catch {
    // Schema cache not ready yet — log skipped, send still succeeded
  }

  return NextResponse.json({ sent, failed, total: subs.length });
}

// GET /api/push/send — get notification history
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("push_notifications_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return NextResponse.json([]);   // table not in schema cache yet
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
