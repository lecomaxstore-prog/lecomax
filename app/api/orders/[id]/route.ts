import { publicDatabaseError } from "@/lib/public-error";
import { revalidateTag } from "next/cache";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { isAdminRequest } from "@/lib/request-auth";
import {
  REVIEW_AUTOMATION_KEY_PREFIX,
  buildProductReviewEmailHtml,
  initialReviewAutomationState,
  type ReviewOrderItem,
} from "@/lib/order-review-automation";
import { sendReviewWhatsAppTemplate } from "@/lib/whatsapp-review";

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
  <!-- Header -->
  <tr>
    <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #1a2e1f;">
      <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">L'eco<span style="color:#4ade80;">max</span></span>
    </td>
  </tr>
  <!-- Body -->
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
  <!-- Stars visual -->
  <tr>
    <td style="padding:0 40px 28px;text-align:center;">
      <div style="display:inline-flex;gap:4px;font-size:28px;">⭐⭐⭐⭐⭐</div>
      <p style="margin:8px 0 0;font-size:12px;color:#4ade80;font-weight:600;">Trustpilot — Avis vérifiés</p>
    </td>
  </tr>
  <!-- Footer -->
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

// GET /api/orders/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 404 });
  return NextResponse.json(data);
}

// PUT /api/orders/[id]  — update status, tracking_number, etc.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  let body: Record<string, unknown>;
  try { body = await readJsonLimited(req); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const update: { status?: string; tracking_number?: string | null; notes?: string | null; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };
  if ("status" in body) {
    const status = typeof body.status === "string" ? body.status.trim().toLowerCase() : "";
    if (!["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Statut de commande invalide." }, { status: 400 });
    }
    update.status = status;
  }
  if ("tracking_number" in body) {
    update.tracking_number = typeof body.tracking_number === "string"
      ? body.tracking_number.trim().slice(0, 120) || null
      : null;
  }
  if ("notes" in body) {
    update.notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) || null : null;
  }
  if (Object.keys(update).length === 1) {
    return NextResponse.json({ error: "Aucune modification valide." }, { status: 400 });
  }

  // Previous status is only used for one-time customer communications. Loyalty
  // uses idempotent database functions and is safe to retry on every update.
  const { data: prev } = await supabase
    .from("orders")
    .select("status, customer")
    .eq("id", id)
    .single();

  const { data, error } = await supabase.rpc("update_order_with_inventory", { p_id: id, p_patch: update });
  if (error) return NextResponse.json({ error: /STOCK/.test(error.message) ? "Pr?commande en attente de stock. R?approvisionnez les variantes avant de pr?parer la commande." : error.message }, { status: 409 });

  let loyalty: unknown = null;
  revalidateTag("storefront-products");
  if (update.status === "delivered") {
    const result = await supabase.rpc("award_order_loyalty_points", { p_order_id: id });
    loyalty = result.data;
    if (result.error) console.error("EcoClub award failed:", result.error.message);
  } else if (update.status === "cancelled") {
    const result = await supabase.rpc("reverse_order_loyalty_points", { p_order_id: id });
    loyalty = result.data;
    if (result.error) console.error("EcoClub reversal failed:", result.error.message);

  }

  let reviewAutomation: {
    productReview: "sent" | "missing_email" | "not_configured" | "failed";
    followupScheduled: boolean;
    followupDueAt: string;
    error?: string;
    productWhatsApp?: "sent" | "missing_phone" | "not_configured" | "failed";
  } | null = null;

  // First delivery transition: send one product-review request immediately and
  // persist the two-day Trustpilot follow-up schedule. The persisted state
  // makes the workflow idempotent across retries and deployments.
  if (update.status === "delivered" && prev?.status !== "delivered") {
    const customer = prev?.customer as { email?: string; name?: string; first_name?: string } | undefined;
    const email = customer?.email;
    const name = customer?.name || customer?.first_name || "Client";
    const orderNumber = (data as { order_number?: string }).order_number || id;
    const items = ((data as { items?: ReviewOrderItem[] }).items ?? []);
    const automation = initialReviewAutomationState(id);
    const whatsapp = await sendReviewWhatsAppTemplate({
      kind: "product",
      phone: (customer as { phone?: string } | undefined)?.phone,
      customerName: name,
      orderNumber,
    });
    if (whatsapp.status === "sent") automation.productWhatsAppSentAt = new Date().toISOString();
    let productReview: "sent" | "missing_email" | "not_configured" | "failed" = "sent";

    if (!email) {
      automation.lastError = "no_customer_email";
      productReview = "missing_email";
    } else if (!resend) {
      automation.lastError = "resend_not_configured";
      productReview = "not_configured";
    } else {
      const result = await resend.emails.send({
        from: "L'ecomax <noreply@lecomax.com>",
        replyTo: "contact@lecomax.com",
        to: email,
        subject: `Votre commande #${orderNumber} est livrée — donnez votre avis`,
        html: buildProductReviewEmailHtml({
          customerName: name,
          customerEmail: email,
          orderNumber,
          items,
        }),
      });
      if (result.error) {
        automation.lastError = result.error.message;
        productReview = "failed";
      }
      else automation.productReviewSentAt = new Date().toISOString();
    }

    const { error: automationError } = await supabase.from("settings").upsert({
      key: `${REVIEW_AUTOMATION_KEY_PREFIX}${id}`,
      value: JSON.stringify(automation),
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    if (automationError) console.error("Review automation schedule failed:", automationError.message);
    reviewAutomation = {
      productReview,
      followupScheduled: !automationError,
      followupDueAt: automation.followupDueAt,
      productWhatsApp: whatsapp.status,
      ...(automationError ? { error: automationError.message } : {}),
    };
  }

  return NextResponse.json({ ...data, loyalty, reviewAutomation });
}

// DELETE /api/orders/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  const { data, error } = await supabase.from("orders").delete().eq("id", id).select("id");
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "Commande introuvable ou déjà supprimée." }, { status: 404 });
  return NextResponse.json({ success: true });
}
