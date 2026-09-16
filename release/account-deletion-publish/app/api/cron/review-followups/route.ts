import { publicDatabaseError } from "@/lib/public-error";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  REVIEW_AUTOMATION_KEY_PREFIX,
  buildProductReviewFollowupEmailHtml,
  parseReviewAutomationState,
} from "@/lib/order-review-automation";
import { sendReviewWhatsAppTemplate } from "@/lib/whatsapp-review";

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && req.headers.get("authorization") === `Bearer ${secret}`);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const staleClaimBefore = now.getTime() - 30 * 60 * 1000;
  const { data: rows, error } = await supabase
    .from("settings")
    .select("key,value")
    .like("key", `${REVIEW_AUTOMATION_KEY_PREFIX}%`)
    .limit(100);
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });

  const due = (rows ?? []).flatMap((row) => {
    const state = parseReviewAutomationState(row.value);
    if (!state || (state.followupSentAt && state.followupWhatsAppSentAt) || Date.parse(state.followupDueAt) > now.getTime()) return [];
    if (state.processingAt && Date.parse(state.processingAt) > staleClaimBefore) return [];
    return [{ key: row.key as string, rawValue: row.value as string, state }];
  });

  const results: Array<{ orderId: string; status: string }> = [];
  for (const job of due) {
    job.state.processingAt = now.toISOString();
    job.state.lastError = null;
    const claimedValue = JSON.stringify(job.state);
    const { data: claim } = await supabase.from("settings").update({
      value: claimedValue,
      updated_at: now.toISOString(),
    }).eq("key", job.key).eq("value", job.rawValue).select("key").maybeSingle();
    if (!claim) {
      results.push({ orderId: job.state.orderId, status: "claimed_elsewhere" });
      continue;
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("order_number,status,customer,items")
      .eq("id", job.state.orderId)
      .maybeSingle();

    if (orderError || !order) {
      job.state.processingAt = null;
      job.state.lastError = orderError?.message ?? "order_not_found";
      results.push({ orderId: job.state.orderId, status: "order_not_found" });
    } else if (order.status !== "delivered") {
      // Cancel the follow-up if the order was rolled back or cancelled.
      job.state.processingAt = null;
      job.state.followupSentAt = now.toISOString();
      job.state.lastError = `skipped_status_${order.status}`;
      results.push({ orderId: job.state.orderId, status: "skipped" });
    } else {
      const customer = order.customer as { email?: string; phone?: string; name?: string; first_name?: string } | null;
      const email = customer?.email;
      if (!job.state.followupSentAt && email && resend) {
        const name = customer?.name || customer?.first_name || "Client";
        const orderNumber = order.order_number || job.state.orderId;
        const sent = await resend.emails.send({
          from: "L'ecomax <noreply@lecomax.com>",
          replyTo: "contact@lecomax.com",
          to: email,
          subject: `Votre avis sur les produits de la commande #${orderNumber}`,
          html: buildProductReviewFollowupEmailHtml({
            customerName: name,
            customerEmail: email,
            orderNumber,
            items: (order.items ?? []) as Array<{ slug?: string; name: string; image?: string; qty?: number }>,
          }),
        });
        job.state.processingAt = null;
        if (sent.error) {
          job.state.lastError = sent.error.message;
          results.push({ orderId: job.state.orderId, status: "send_failed" });
        } else {
          job.state.followupSentAt = new Date().toISOString();
          job.state.lastError = null;
          results.push({ orderId: job.state.orderId, status: "email_sent" });
        }
      } else {
        job.state.processingAt = null;
        job.state.lastError = email ? "resend_not_configured" : "no_customer_email";
      }

      const whatsapp = job.state.followupWhatsAppSentAt
        ? { status: "sent" as const }
        : await sendReviewWhatsAppTemplate({
            kind: "followup",
            phone: customer?.phone,
            customerName: customer?.name || customer?.first_name || "Client",
            orderNumber: order.order_number || job.state.orderId,
          });
      if (whatsapp.status === "sent") job.state.followupWhatsAppSentAt = new Date().toISOString();
      results.push({ orderId: job.state.orderId, status: `whatsapp_${whatsapp.status}` });
      if ((!email || !resend) && whatsapp.status === "sent") {
        job.state.followupSentAt = new Date().toISOString();
        job.state.lastError = null;
      }
    }

    await supabase.from("settings").update({
      value: JSON.stringify(job.state),
      updated_at: new Date().toISOString(),
    }).eq("key", job.key);
  }

  return NextResponse.json({ ok: true, due: due.length, results });
}
