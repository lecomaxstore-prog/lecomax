import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type NotifyType = "confirmed" | "shipped" | "delivered" | "cancelled";

function buildEmailHtml(type: NotifyType, name: string, orderNumber: string, items: string, total: string | number, tracking?: string) {
  const configs: Record<NotifyType, { title: string; icon: string; color: string; bgColor: string; body: string }> = {
    confirmed: {
      title: "Commande confirmée !",
      icon: "✓",
      color: "#065f46",
      bgColor: "#ecfdf5",
      body: `Merci pour votre commande ! Nous l'avons bien reçue et nous la préparons avec soin. Vous recevrez un email dès l'expédition de votre colis.`,
    },
    shipped: {
      title: "Votre commande est en route !",
      icon: "🚚",
      color: "#1e40af",
      bgColor: "#eff6ff",
      body: `Bonne nouvelle ! Votre commande vient d'être expédiée.${tracking ? ` Votre numéro de suivi est <strong>${tracking}</strong>.` : ""} Elle sera livrée dans les 2 à 5 jours ouvrables.`,
    },
    delivered: {
      title: "Commande livrée !",
      icon: "🎉",
      color: "#5b21b6",
      bgColor: "#f5f3ff",
      body: `Nous espérons que vous avez bien reçu votre commande et qu'elle vous satisfait pleinement. N'hésitez pas à laisser un avis sur notre site !`,
    },
    cancelled: {
      title: "Commande annulée",
      icon: "✕",
      color: "#991b1b",
      bgColor: "#fef2f2",
      body: `Nous vous informons que votre commande a été annulée. Si vous avez des questions, contactez-nous à contact@lecomax.ma.`,
    },
  };

  const c = configs[type];

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#111 0%,#333 100%);padding:28px 40px;text-align:center;">
    <p style="margin:0;font-size:20px;font-weight:900;color:#fff;letter-spacing:0.1em;">L'ECOMAX</p>
    <p style="margin:4px 0 0;font-size:10px;color:rgba(255,255,255,0.5);letter-spacing:0.2em;">SPORT · STYLE · PERFORMANCE</p>
  </td></tr>
  <tr><td style="background:${c.bgColor};padding:18px 40px;text-align:center;border-bottom:1px solid rgba(0,0,0,0.06);">
    <p style="margin:0;font-size:26px;">${c.icon}</p>
    <p style="margin:6px 0 0;font-size:14px;font-weight:700;color:${c.color};">${c.title}</p>
  </td></tr>
  <tr><td style="padding:28px 40px;">
    <p style="margin:0 0 14px;font-size:14px;color:#111;">Bonjour <strong>${name}</strong>,</p>
    <p style="margin:0 0 22px;font-size:14px;color:#6b7280;line-height:1.6;">${c.body}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:20px;">
      <tr><td style="padding:14px 18px;">
        <p style="margin:0 0 4px;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Commande</p>
        <p style="margin:0;font-size:18px;font-weight:900;color:#111;letter-spacing:0.05em;">#${orderNumber}</p>
      </td></tr>
    </table>
    ${items ? `<p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.08em;">Articles</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:10px;overflow:hidden;margin-bottom:20px;">
      ${items.split("\n").map((line, i, arr) => `<tr style="background:${i % 2 === 0 ? "#fff" : "#f9fafb"};${i === arr.length - 1 ? "" : "border-bottom:1px solid #f3f4f6;"}">
        <td style="padding:10px 14px;font-size:13px;color:#374151;">${line.replace("•", "").trim()}</td>
      </tr>`).join("")}
    </table>` : ""}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #f3f4f6;margin-bottom:24px;"><tr>
      <td style="padding:14px 0 0;font-size:13px;color:#6b7280;">Total</td>
      <td style="padding:14px 0 0;font-size:18px;font-weight:900;color:#111;text-align:right;">${total} MAD</td>
    </tr></table>
    <p style="margin:0;font-size:13px;color:#6b7280;">Merci pour votre confiance !</p>
    <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">L'équipe <strong style="color:#111;">L'ECOMAX</strong></p>
  </td></tr>
  <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">© 2026 L'ECOMAX · contact@lecomax.ma</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

const SUBJECTS: Record<NotifyType, string> = {
  confirmed:  "✓ Votre commande est confirmée — L'ECOMAX",
  shipped:    "🚚 Votre commande est en route — L'ECOMAX",
  delivered:  "🎉 Votre commande a été livrée — L'ECOMAX",
  cancelled:  "Votre commande a été annulée — L'ECOMAX",
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as {
    type: NotifyType;
    channel: "email" | "both";
  };

  // Fetch order from DB
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const name = order.customer?.name ?? "Client";
  const email = order.customer?.email ?? "";
  const orderNumber = order.order_number ?? id;
  const items = (order.items ?? [])
    .map((i: { name: string; qty: number; size?: string; color?: string }) =>
      `• ${i.name} x${i.qty}${i.size ? ` (${i.size})` : ""}${i.color ? ` — ${i.color}` : ""}`)
    .join("\n");
  const total = order.total ?? 0;
  const tracking = order.tracking_number ?? "";

  const results: { email?: string; error?: string } = {};

  if (body.channel === "email" || body.channel === "both") {
    if (!email) {
      results.email = "no_email";
    } else if (!process.env.RESEND_API_KEY) {
      results.email = "not_configured";
    } else {
      const html = buildEmailHtml(body.type, name, orderNumber, items, total, tracking);
      const { error: emailError } = await resend.emails.send({
        from: "LECOMAX <noreply@lecomax.com>",
        to: [email],
        subject: SUBJECTS[body.type],
        html,
      });
      results.email = emailError ? `error: ${emailError.message}` : "sent";
    }
  }

  // Auto-update order status if appropriate
  const STATUS_MAP: Partial<Record<NotifyType, string>> = {
    confirmed: "confirmed",
    shipped: "shipped",
    delivered: "delivered",
    cancelled: "cancelled",
  };
  const newStatus = STATUS_MAP[body.type];
  if (newStatus && order.status !== newStatus) {
    await supabase.from("orders").update({ status: newStatus }).eq("id", id);
  }

  return NextResponse.json({ ok: true, results, newStatus });
}
