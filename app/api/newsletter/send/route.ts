import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { subject, body } = await req.json();

  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Sujet et contenu requis." }, { status: 400 });
  }

  // Fetch all active subscribers
  const { data: subscribers, error } = await supabase
    .from("newsletter_subscribers")
    .select("email, name")
    .eq("active", true);

  if (error || !subscribers || subscribers.length === 0) {
    return NextResponse.json({ error: "Aucun abonné actif trouvé." }, { status: 400 });
  }

  // Build HTML email
  const htmlBody = body
    .split("\n")
    .map((line: string) => `<p style="margin:0 0 12px 0;line-height:1.6">${line || "&nbsp;"}</p>`)
    .join("");

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f6f4;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f4;padding:40px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;max-width:600px;width:100%">
        <tr>
          <td style="background:#0a0a0a;padding:24px 32px;text-align:center">
            <span style="color:#3ecf4c;font-weight:900;font-size:20px;letter-spacing:-0.5px">L'ECOMAX</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;color:#1a1a1a;font-size:15px">
            ${htmlBody}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;border-top:1px solid #f0f0f0;text-align:center">
            <a href="https://lecomax.com" style="display:inline-block;background:#3ecf4c;color:#000;font-weight:900;font-size:13px;text-decoration:none;padding:12px 28px;border-radius:999px;letter-spacing:0.5px;text-transform:uppercase">
              Visiter la boutique
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;text-align:center">
            <p style="margin:0;font-size:11px;color:#aaa">
              L'ecomax · Maroc<br>
              Vous recevez cet email car vous êtes abonné à notre newsletter.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // Send to all in batches (Resend allows up to 100 per request)
  const emails = subscribers.map((s) => ({
    from: "L'ecomax <onboarding@resend.dev>",
    to: s.email,
    subject,
    html: htmlContent,
  }));

  let sent = 0;
  const errors: string[] = [];

  // Send one by one (safe for any volume)
  for (const emailData of emails) {
    const { error: sendError } = await resend.emails.send(emailData);
    if (sendError) errors.push(`${emailData.to}: ${sendError.message}`);
    else sent++;
  }

  if (sent === 0) {
    return NextResponse.json({ error: errors[0] ?? "Échec d'envoi." }, { status: 500 });
  }

  return NextResponse.json({ sent, errors: errors.length > 0 ? errors : undefined });
}
