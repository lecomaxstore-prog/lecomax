import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lecomax.com";

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
        : `${SITE_URL}/images/email%20image/email%20image.png`,
    };
  } catch {
    return { name: "LECOMAX", email: "noreply@lecomax.com", banner: `${SITE_URL}/images/email%20image/email%20image.png` };
  }
}

export async function POST(req: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
  }

  const body = await req.json();
  const { to_email, to_name, order_number, order_items, order_total, shipping, payment_method, delivery_city } = body;

  if (!to_email || !order_number) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { name: storeName, email: storeEmail, banner: emailBannerUrl } = await getStoreSettings();

  const itemsHtml = (order_items as string)
    .split("\n")
    .map((line: string) => `<li style="padding:4px 0;color:#374151;">${line.replace("•", "").trim()}</li>`)
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
          <td style="background:linear-gradient(135deg,#111111 0%,#333333 100%);padding:0;text-align:center;">
            <img src="${emailBannerUrl}" alt="L'ecomax" width="560" style="display:block;width:100%;max-width:560px;height:auto;" />
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
