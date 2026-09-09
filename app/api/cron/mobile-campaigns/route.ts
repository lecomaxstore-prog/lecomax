import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deliverMobileCampaign } from "@/lib/mobile-campaigns";
import { checkMobilePushReceipts } from "@/lib/mobile-push-receipts";

export const maxDuration = 300;

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { data, error } = await supabase.from("mobile_notification_campaigns")
    .select("id").or("status.eq.scheduled,and(status.eq.failed,attempt_count.lt.3)")
    .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`)
    .or("error_message.is.null,error_message.neq.DELIVERY_UNCERTAIN_REVIEW_DISPATCHES")
    .order("scheduled_at", { ascending: true }).limit(10);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const results = [];
  for (const campaign of data ?? []) {
    try {
      results.push({ id: campaign.id, ok: true, ...(await deliverMobileCampaign(campaign.id, "system:vercel-cron")) });
    } catch (deliveryError) {
      results.push({ id: campaign.id, ok: false, error: deliveryError instanceof Error ? deliveryError.message : "UNKNOWN" });
    }
  }
  try {
    const receipts = await checkMobilePushReceipts();
    return NextResponse.json({ processed: results.length, results, receipts });
  } catch {
    return NextResponse.json({ processed: results.length, results, error: "Receipt verification failed." }, { status: 502 });
  }
}
