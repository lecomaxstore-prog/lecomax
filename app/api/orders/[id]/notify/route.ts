import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";
import { buildOrderLifecycleEmail, ORDER_LIFECYCLE_SUBJECTS } from "@/lib/order-lifecycle-email";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type NotifyType = "confirmed" | "shipped" | "delivered" | "cancelled";

function buildEmailHtml(type: NotifyType, name: string, orderNumber: string, items: string, total: string | number, tracking?: string) {
  const configs: Record<NotifyType, { title: string; icon: string; color: string; bgColor: string; body: string }> = {
    confirmed: {
      title: "Commande confirmée",
      icon: "✓",
      color: "#065f46",
      bgColor: "#ecfdf5",
      body: `Merci pour votre commande. Elle a bien été enregistrée et notre équipe prépare maintenant vos articles avec soin. Vous recevrez automatiquement un nouvel email dès que le colis sera remis au transporteur.`,
    },
    shipped: {
      title: "Votre colis est en route",
      icon: "🚚",
      color: "#1e40af",
      bgColor: "#eff6ff",
      body: `Votre colis a quitté nos locaux et poursuit son chemin vers vous.${tracking ? ` Votre numéro de suivi est <strong>${tracking}</strong>.` : ""} La livraison est généralement effectuée sous 2 à 5 jours ouvrables.`,
    },
    delivered: {
      title: "Votre commande a été livrée",
      icon: "🎉",
      color: "#5b21b6",
      bgColor: "#f5f3ff",
      body: `Votre commande est maintenant indiquée comme livrée. Nous espérons que chaque article répond à vos attentes. Un email séparé vous permet de partager simplement votre avis sur les produits reçus.`,
    },
    cancelled: {
      title: "Commande annulée",
      icon: "✕",
      color: "#991b1b",
      bgColor: "#fef2f2",
      body: `Nous vous informons que votre commande a été annulée. Si vous avez des questions, contactez-nous à contact@lecomax.com.`,
    },
  };

  const c = configs[type];
  const step = type === "confirmed" ? 1 : type === "shipped" ? 2 : type === "delivered" ? 3 : 0;
  const stepColor = (value: number) => value <= step ? "#22a83a" : "#d1d5db";
  const trackingUrl = "https://lecomax.com/suivre-commande";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>@media(max-width:600px){.email-pad{padding:24px 20px!important}.email-shell{border-radius:12px!important}}</style></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
<tr><td align="center">
<table class="email-shell" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#111 0%,#333 100%);padding:28px 40px;text-align:center;">
    <p style="margin:0;font-size:20px;font-weight:900;color:#fff;letter-spacing:0.1em;">L'ECOMAX</p>
    <p style="margin:4px 0 0;font-size:10px;color:rgba(255,255,255,0.5);letter-spacing:0.2em;">SPORT · STYLE · PERFORMANCE</p>
  </td></tr>
  <tr><td style="padding:0;">
    <img src="https://lecomax.com/images/email%20image/email%20image.png" alt="L'ecomax" width="560" style="display:block;width:100%;max-width:560px;height:auto;" />
  </td></tr>
  <tr><td style="background:${c.bgColor};padding:18px 40px;text-align:center;border-bottom:1px solid rgba(0,0,0,0.06);">
    <p style="margin:0;font-size:26px;">${c.icon}</p>
    <p style="margin:6px 0 0;font-size:14px;font-weight:700;color:${c.color};">${c.title}</p>
  </td></tr>
  ${type !== "cancelled" ? `<tr><td style="padding:18px 40px 4px;background:#fff"><table width="100%" cellpadding="0" cellspacing="0"><tr>
    ${[[1,"Confirmée"],[2,"Expédiée"],[3,"Livrée"]].map(([value,label], index) => `<td style="text-align:center;width:33%;position:relative"><div style="margin:auto;width:22px;height:22px;line-height:22px;border-radius:50%;background:${stepColor(Number(value))};color:#fff;font-size:10px;font-weight:800">${Number(value) < step ? "✓" : value}</div><p style="margin:6px 0 0;font-size:9px;font-weight:700;color:${stepColor(Number(value))}">${label}</p></td>${index < 2 ? `<td style="height:2px;background:${stepColor(Number(value) + 1)};font-size:0">&nbsp;</td>` : ""}`).join("")}
  </tr></table></td></tr>` : ""}
  <tr><td class="email-pad" style="padding:28px 40px;">
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
    ${type !== "cancelled" ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px"><tr><td align="center"><a href="${trackingUrl}" style="display:inline-block;border-radius:10px;background:#111;padding:13px 22px;color:#fff;font-size:12px;font-weight:800;text-decoration:none">Suivre ma commande</a></td></tr></table>` : ""}
    <p style="margin:0;font-size:13px;color:#6b7280;">Merci pour votre confiance !</p>
    <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">L'équipe <strong style="color:#111;">L'ECOMAX</strong></p>
  </td></tr>
  <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">© 2026 L'ECOMAX · contact@lecomax.com</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function buildInvoiceEmailHtml(order: Record<string, unknown>) {
  const customer = order.customer as { name: string; phone: string; email: string; city: string; address: string };
  const items = order.items as { name: string; price: number; qty: number; image?: string; size?: string; color?: string }[];
  const total = order.total as number;
  const orderNumber = order.order_number as string;
  const invoiceNumber = `FAC-${orderNumber}`;
  const invoiceDate = new Date(order.created_at as string).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const itemsTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = parseFloat(Math.max(0, total - itemsTotal).toFixed(2));
  const year = new Date().getFullYear();

  const itemRowsHtml = items.map((i, idx) => {
    const imgSrc = i.image?.startsWith("http") ? i.image : `https://lecomax.com${i.image ?? ""}`;
    const rowBg = idx % 2 === 0 ? "#ffffff" : "#f9fafb";
    const pills = [i.size, i.color].filter(Boolean).map(p =>
      `<span style="display:inline-block;font-size:11px;color:#6b7280;background:#f3f4f6;padding:2px 8px;border-radius:4px;margin-right:4px;">${p}</span>`
    ).join("");
    return `<tr style="background:${rowBg};"><td style="padding:12px 10px;color:#d1d5db;font-weight:700;font-size:10px;border-bottom:1px solid #f3f4f6;width:24px;">${String(idx+1).padStart(2,"0")}</td><td style="padding:12px 10px;border-bottom:1px solid #f3f4f6;"><table cellpadding="0" cellspacing="0"><tr><td style="width:40px;vertical-align:top;"><img src="${imgSrc}" width="40" height="40" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #f3f4f6;display:block;" /></td><td style="padding-left:10px;vertical-align:top;"><p style="margin:0 0 3px;font-size:12px;font-weight:600;color:#111827;">${i.name}</p>${pills}</td></tr></table></td><td style="padding:12px 10px;text-align:right;font-weight:700;font-size:12px;color:#374151;border-bottom:1px solid #f3f4f6;">${i.qty}</td><td style="padding:12px 10px;text-align:right;font-size:11px;color:#9ca3af;border-bottom:1px solid #f3f4f6;">${i.price.toFixed(2)} MAD</td><td style="padding:12px 10px;text-align:right;font-weight:700;font-size:12px;color:#111827;border-bottom:1px solid #f3f4f6;">${(i.price*i.qty).toFixed(2)} MAD</td></tr>`;
  }).join("");

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f0f0ee;font-family:'Helvetica Neue',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0ee;padding:40px 16px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;"><tr><td style="height:4px;background:linear-gradient(90deg,#166534,#16a34a,#3ecf4c,#4ade80);border-radius:8px 8px 0 0;font-size:0;">&nbsp;</td></tr><tr><td style="background:#0c1a12;padding:32px 40px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td><table cellpadding="0" cellspacing="0"><tr><td style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-1px;">L&apos;eco</td><td style="font-size:26px;font-weight:900;color:#4ade80;letter-spacing:-1px;">max</td></tr></table><p style="margin:5px 0 0;font-size:9px;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;">BOUTIQUE EN LIGNE &middot; MAROC</p></td><td style="text-align:right;"><span style="display:inline-block;padding:4px 12px;border:1px solid rgba(74,222,128,0.3);border-radius:5px;font-size:9px;font-weight:700;color:#4ade80;letter-spacing:3px;background:rgba(74,222,128,0.08);">FACTURE</span><p style="margin:10px 0 0;font-size:20px;font-weight:900;color:#fff;">${invoiceNumber}</p><p style="margin:6px 0 0;font-size:10px;color:rgba(255,255,255,0.4);line-height:2;">Date : <span style="color:rgba(255,255,255,0.7);">${invoiceDate}</span></p><div style="margin-top:14px;display:inline-block;transform:rotate(-5deg);"><div style="padding:6px 18px;border:3px solid #4ade80;border-radius:50px;color:#4ade80;font-weight:900;font-size:12px;letter-spacing:4px;">&#10003; PAY&#201;E</div></div></td></tr></table></td></tr><tr><td style="background:#fff;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:20px 40px;width:50%;border-right:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;vertical-align:top;border-left:3px solid #3ecf4c;"><p style="margin:0 0 10px;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;">DE</p><table cellpadding="0" cellspacing="0"><tr><td style="font-size:14px;font-weight:900;color:#111827;">L&apos;eco</td><td style="font-size:14px;font-weight:900;color:#3ecf4c;">max</td></tr></table><p style="margin:8px 0 0;font-size:11px;color:#6b7280;line-height:1.9;">contact@lecomax.com<br>lecomax.com<br>Maroc</p></td><td style="padding:20px 40px;width:50%;border-bottom:1px solid #f3f4f6;vertical-align:top;"><p style="margin:0 0 10px;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;">FACTUR&#201; &#192;</p><p style="margin:0 0 6px;font-size:14px;font-weight:800;color:#111827;text-transform:capitalize;">${customer.name}</p><p style="margin:0;font-size:11px;color:#6b7280;line-height:1.9;">${customer.phone}<br>${customer.email}<br>${customer.address}<br>${customer.city}, Maroc</p></td></tr></table></td></tr><tr><td style="background:#fff;padding:24px 40px 0;"><p style="margin:0 0 12px;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;">ARTICLES COMMAND&#201;S</p><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:8px;overflow:hidden;"><thead><tr style="background:#f9fafb;"><th style="padding:8px 10px;text-align:left;font-size:9px;font-weight:700;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;border-bottom:1px solid #f3f4f6;width:24px;">#</th><th style="padding:8px 10px;text-align:left;font-size:9px;font-weight:700;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;border-bottom:1px solid #f3f4f6;">Produit</th><th style="padding:8px 10px;text-align:right;font-size:9px;font-weight:700;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;border-bottom:1px solid #f3f4f6;width:28px;">Qt&#233;</th><th style="padding:8px 10px;text-align:right;font-size:9px;font-weight:700;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;border-bottom:1px solid #f3f4f6;width:80px;">Prix</th><th style="padding:8px 10px;text-align:right;font-size:9px;font-weight:700;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;border-bottom:1px solid #f3f4f6;width:80px;">Total</th></tr></thead><tbody>${itemRowsHtml}</tbody></table></td></tr><tr><td style="background:#fff;padding:16px 40px 24px;"><table cellpadding="0" cellspacing="0" style="margin-left:auto;width:260px;"><tr><td style="padding:5px 0;font-size:11px;color:#9ca3af;border-bottom:1px dashed #f3f4f6;">Sous-total</td><td style="padding:5px 0;font-size:11px;font-weight:500;color:#374151;text-align:right;border-bottom:1px dashed #f3f4f6;">${itemsTotal.toFixed(2)} MAD</td></tr><tr><td style="padding:5px 0;font-size:11px;color:#9ca3af;border-bottom:1px dashed #f3f4f6;">Livraison</td><td style="padding:5px 0;font-size:11px;font-weight:500;color:${deliveryFee===0?"#16a34a":"#374151"};text-align:right;border-bottom:1px dashed #f3f4f6;">${deliveryFee===0?"Gratuit":deliveryFee.toFixed(2)+" MAD"}</td></tr><tr><td colspan="2" style="padding-top:10px;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0c1a12;border-radius:10px;border:1px solid rgba(74,222,128,0.15);"><tr><td style="padding:14px 16px;"><p style="margin:0;font-size:8px;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;font-weight:700;">TOTAL &#192; PAYER</p><p style="margin:2px 0 0;font-size:9px;color:rgba(255,255,255,0.3);">Toutes taxes comprises</p></td><td style="padding:14px 16px;text-align:right;"><p style="margin:0;font-size:20px;font-weight:900;color:#4ade80;">${total.toFixed(2)} MAD</p></td></tr></table></td></tr></table></td></tr><tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:18px 40px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td><table cellpadding="0" cellspacing="0"><tr><td style="font-size:13px;font-weight:900;color:#111827;">L&apos;eco</td><td style="font-size:13px;font-weight:900;color:#3ecf4c;">max</td></tr></table><p style="margin:2px 0 0;font-size:10px;color:#9ca3af;">contact@lecomax.com &middot; lecomax.com</p></td><td style="text-align:center;"><p style="margin:0;font-size:11px;font-weight:600;color:#6b7280;">Merci pour votre confiance !</p></td><td style="text-align:right;"><p style="margin:0;font-size:10px;color:#9ca3af;">R&#233;f : ${invoiceNumber}</p></td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-top:1px solid #e5e7eb;padding-top:12px;"><tr><td style="font-size:10px;color:#9ca3af;">&#10003; Retours 30 jours</td><td style="font-size:10px;color:#9ca3af;text-align:center;">&#10003; Livraison 40 MAD Maroc</td><td style="font-size:10px;color:#9ca3af;text-align:right;">&#10003; Paiement s&#233;curis&#233;</td></tr></table></td></tr><tr><td style="background:#0c1a12;padding:10px 40px;border-radius:0 0 8px 8px;text-align:center;"><p style="margin:0;font-size:10px;color:rgba(255,255,255,0.3);">Document g&#233;n&#233;r&#233; automatiquement &middot; L&apos;ecomax &copy; ${year}</p></td></tr></table></td></tr></table></body></html>`;
}

const SUBJECTS: Record<NotifyType, string> = {
  confirmed:  "Commande confirmée · Voici la suite — L'ecomax",
  shipped:    "Votre colis est en route — L'ecomax",
  delivered:  "Livraison confirmée et facture — L'ecomax",
  cancelled:  "Mise à jour de votre commande — L'ecomax",
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
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
      const html = buildOrderLifecycleEmail({
        type: body.type,
        customerName: name,
        orderNumber,
        items: order.items ?? [],
        total: Number(total),
        trackingNumber: tracking,
      });
      const { error: emailError } = await resend.emails.send({
        from: "L'ecomax <noreply@lecomax.com>",
        replyTo: "contact@lecomax.com",
        to: [email],
        subject: ORDER_LIFECYCLE_SUBJECTS[body.type](orderNumber),
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
