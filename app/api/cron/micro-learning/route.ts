import { NextRequest, NextResponse } from "next/server";
import { dispatchMicroLearning } from "@/lib/micro-learning-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.LEARNING_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (![process.env.VAPID_SUBJECT, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY].every(Boolean)) {
    return NextResponse.json({ error: "Push configuration missing" }, { status: 503 });
  }
  try {
    const owner = (process.env.ADMIN_EMAIL ?? "contact@lecomax.com").trim().toLowerCase();
    return NextResponse.json(await dispatchMicroLearning(owner), { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("[micro-learning] Scheduler failed; inspect delivery states before retrying.");
    return NextResponse.json({ error: "Learning scheduler unavailable" }, { status: 503 });
  }
}
