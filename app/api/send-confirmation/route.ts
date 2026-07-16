import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { protectAdminMutation } from "@/lib/api-security";

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lecomax.com";
const DEFAULT_EMAIL_LOGO_URL = `${SITE_URL}/images/email%20image/email%20image.png`;
const EMAIL_LOGO_CONTENT_ID = "lecomax-store-logo";

async function getStoreSettings(): Promise<{ name: string; email: string; banner: string }> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["store_name", "store_email", "email_banner_image"]);
    const map: Record<string, string> = {};
    for (const row of data ?? []) if (row.value) map[row.key] = row.value;
    return {
      name: map.store_name || "LECOMAX",
      email: map.store_email || "noreply@lecomax.com",
      banner: map.email_banner_image
        ? (map.email_banner_image.startsWith("http") ? map.email_banner_image : `${SITE_URL}${map.email_banner_image}`)
        : DEFAULT_EMAIL_LOGO_URL,
    };
  } catch {
    return { name: "LECOMAX", email: "noreply@lecomax.com", banner: DEFAULT_EMAIL_LOGO_URL };
  }
}

function safeText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "email:confirmation", limit: 10 });
  if (blocked) return blocked;
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json() as Record<string, unknown>; } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const to_email = safeText(body.to_email, 254).toLowerCase();
  const to_name = escapeHtml(safeText(body.to_name, 120));
  const order_number = escapeHtml(safeText(body.order_number, 40));
  const order_items = safeText(body.order_items, 5_000);
  const order_total = escapeHtml(safeText(String(body.order_total ?? ""), 40));
  const shipping = escapeHtml(safeText(String(body.shipping ?? ""), 40));
  const payment_method = escapeHtml(safeText(body.payment_method, 80));
  const delivery_city = escapeHtml(safeText(body.delivery_city, 100));

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to_email) || !/^ECO-\d{6}$/.test(order_number) || !order_items) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { name: storeName, email: storeEmail, banner: emailBannerUrl } = await getStoreSettings();

  const itemsHtml = order_items
    .split("\n")
    .slice(0, 50)
    .map((line: string) => `<li style="padding:4px 0;color:#374151;">${escapeHtml(line.replace("•", "").trim())}</li>`)
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0c1a12 0%,#17271d 100%);padding:28px 40px;text-align:center;">
            <a href="${SITE_URL}" style="display:inline-block;text-decoration:none;">
              <img src="cid:${EMAIL_LOGO_CONTENT_ID}" alt="L'ecomax" width="104" height="104" style="display:block;width:104px;height:104px;border:0;border-radius:24px;object-fit:cover;" />
            </a>
            <p style="margin:12px 0 0;font-size:20px;font-weight:900;color:#ffffff;letter-spacing:-0.4px;">L&apos;eco<span style="color:#4ade80;">max</span></p>
            <p style="margin:5px 0 0;font-size:9px;font-weight:700;color:rgba(255,255,255,0.45);letter-spacing:2px;text-transform:uppercase;">Boutique en ligne · Maroc</p>
          </td>
        </tr>

        <!-- Green success banner -->
        <tr>
          <td style="background:#ecfdf5;border-bottom:1px solid #d1fae5;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:28px;">&#10003;</p>
            <p style="margin:6px 0 0;font-size:15px;font-weight:700;color:#065f46;">Commande confirmée !</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 16px;font-size:15px;color:#111;">Bonjour <strong>${to_name}</strong>,</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
              Merci pour votre commande ! Nous l'avons bien reçue et nous la préparons avec soin.<br>
              Vous recevrez une mise à jour dès l'expédition de votre colis.
            </p>

            <!-- Order number box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Numéro de commande</p>
                  <p style="margin:4px 0 0;font-size:22px;font-weight:900;color:#111;letter-spacing:0.05em;">${order_number}</p>
                </td>
                <td style="padding:16px 20px;text-align:right;">
                  <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Total</p>
                  <p style="margin:4px 0 0;font-size:22px;font-weight:900;color:#111;">${order_total}</p>
                </td>
              </tr>
            </table>

            <!-- Items -->
            <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Articles commandés</p>
            <ul style="margin:0 0 24px;padding:0 0 0 4px;list-style:none;border:1px solid #e5e7eb;border-radius:10px;padding:12px 16px;">
              ${itemsHtml}
            </ul>

            <!-- Details grid -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td width="50%" style="padding-right:8px;">
                  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;">
                    <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Livraison</p>
                    <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#111;">${shipping === "Gratuite" ? "Gratuite" : shipping}</p>
                    <p style="margin:2px 0 0;font-size:11px;color:#6b7280;text-transform:capitalize;">${delivery_city}, Maroc</p>
                  </div>
                </td>
                <td width="50%" style="padding-left:8px;">
                  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;">
                    <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Paiement</p>
                    <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#111;">${payment_method}</p>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Delivery estimate -->
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 16px;margin-bottom:28px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#1d4ed8;font-weight:600;">Livraison estimée : 2 – 5 jours ouvrables</p>
            </div>

            <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
              Des questions ? Contactez-nous sur WhatsApp au <strong>+212 699 289 568</strong> en mentionnant votre numéro de commande <strong>${order_number}</strong>.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">L'ECOMAX · Maroc · Sport, Style &amp; Performance</p>
            <p style="margin:4px 0 0;font-size:10px;color:#d1d5db;">Cet email a été envoyé automatiquement suite à votre commande.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({
      from: `${storeName} <noreply@lecomax.com>`,
      replyTo: storeEmail,
      to: [to_email],
      subject: `Votre commande ${order_number} est confirmee - LECOMAX`,
      html,
      attachments: [
        {
          path: emailBannerUrl,
          filename: "lecomax-store-logo.png",
          contentId: EMAIL_LOGO_CONTENT_ID,
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error }, { status: 400 });
    }
    console.log("Email sent successfully:", data);
    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("Resend exception:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
