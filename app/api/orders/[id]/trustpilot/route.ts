import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { isAdminRequest } from "@/lib/request-auth";
import {
  REVIEW_AUTOMATION_KEY_PREFIX,
  buildTrustpilotFollowupEmailHtml,
  initialReviewAutomationState,
  parseReviewAutomationState,
} from "@/lib/order-review-automation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function buildTrustpilotInviteHtml(customerName: string, orderNumber: string): string {
  const reviewUrl = "https://www.trustpilot.com/evaluate/lecomax.com";
  const firstName = customerName.split(" ")[0] || customerName;
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0c1a12;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0c1a12;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0c1a12;border-radius:20px;overflow:hidden;">
  <tr>
    <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #1a2e1f;">
      <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">L'eco<span style="color:#4ade80;">max</span></span>
    </td>
  </tr>
  <tr>
    <td style="padding:36px 40px 28px;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">⭐</div>
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;">
        Votre avis compte, ${firstName} !
      </h1>
      <p style="margin:0 0 8px;font-size:15px;color:#9ca3af;line-height:1.6;">
        Votre commande <strong style="color:#ffffff;">${orderNumber}</strong> a bien été livrée.
      </p>
      <p style="margin:0 0 32px;font-size:15px;color:#9ca3af;line-height:1.6;">
        Nous espérons qu'elle vous a plu ! Partagez votre expérience sur Trustpilot — cela prend 2 minutes et aide d'autres clients à nous faire confiance.
      </p>
      <a href="${reviewUrl}" style="display:inline-block;background:#4ade80;color:#0c1a12;font-size:16px;font-weight:800;padding:16px 40px;border-radius:50px;text-decoration:none;letter-spacing:0.3px;">
        Laisser un avis ⭐
      </a>
    </td>
  </tr>
  <tr>
    <td style="padding:0 40px 28px;text-align:center;">
      <div style="display:inline-flex;gap:4px;font-size:28px;">⭐⭐⭐⭐⭐</div>
      <p style="margin:8px 0 0;font-size:12px;color:#4ade80;font-weight:600;">Trustpilot — Avis vérifiés</p>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 40px 32px;border-top:1px solid #1a2e1f;text-align:center;">
      <p style="margin:0;font-size:11px;color:#4b5563;line-height:1.6;">
        Vous recevez cet email car vous avez commandé sur lecomax.com<br>
        <a href="https://lecomax.com" style="color:#4ade80;text-decoration:none;">lecomax.com</a>
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// POST /api/orders/[id]/trustpilot — manually send review invite
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const { id } = await params;

  if (!resend) {
    return NextResponse.json({ error: "Resend not configured" }, { status: 503 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("order_number, customer")
    .eq("id", id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const customer = order.customer as { email?: string; name?: string; first_name?: string } | undefined;
  const email = customer?.email;
  const name = customer?.name || customer?.first_name || "Client";
  const orderNumber = order.order_number || id;

  if (!email) {
    return NextResponse.json({ error: "No customer email" }, { status: 400 });
  }

  const { error: emailError } = await resend.emails.send({
    from: "L'ecomax <noreply@lecomax.com>",
    replyTo: "contact@lecomax.com",
    to: email,
    subject: `⭐ Partagez votre avis sur votre commande ${orderNumber}`,
    html: buildTrustpilotFollowupEmailHtml(name, orderNumber),
  });

  if (emailError) {
    return NextResponse.json({ error: emailError.message }, { status: 500 });
  }

  const key = `${REVIEW_AUTOMATION_KEY_PREFIX}${id}`;
  const { data: saved } = await supabase.from("settings").select("value").eq("key", key).maybeSingle();
  const automation = parseReviewAutomationState(saved?.value) ?? initialReviewAutomationState(id);
  automation.followupSentAt = new Date().toISOString();
  automation.processingAt = null;
  automation.lastError = null;
  await supabase.from("settings").upsert({
    key,
    value: JSON.stringify(automation),
    updated_at: new Date().toISOString(),
  }, { onConflict: "key" });

  return NextResponse.json({ success: true, to: email });
}
