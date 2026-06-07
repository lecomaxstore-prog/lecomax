import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const unread = searchParams.get("unread");
  let query = supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
  if (unread === "true") query = query.eq("read", false);
  const { data, error } = await query;
  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, subject, message } = body;

  // Try DB insert — if table doesn't exist yet, continue anyway (email still sent)
  const { error: dbError } = await supabase
    .from("contact_messages")
    .insert({ name, email, subject, message, read: false });

  // Send email notification to admin
  const adminEmail = process.env.ADMIN_EMAIL || "contact@lecomax.com";
  if (resend) {
    try {
      await resend.emails.send({
        from: "LECOMAX Contact <noreply@lecomax.com>",
        to: [adminEmail],
        replyTo: email,
        subject: `[Contact] ${subject} — ${name}`,
        html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0a0a0a;padding:24px 32px;border-bottom:3px solid #3ecf4c;">
            <p style="margin:0;font-size:11px;font-weight:900;color:#3ecf4c;letter-spacing:0.2em;text-transform:uppercase;">L'ECOMAX — Nouveau message</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:20px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">De</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#111;">${name}</p>
                  <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${email}</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:20px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Sujet</p>
                  <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#111;">${subject}</p>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Message</p>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            </div>
            <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}"
              style="display:inline-block;background:#3ecf4c;color:#000;font-weight:900;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;padding:12px 24px;border-radius:50px;text-decoration:none;">
              Répondre par e-mail →
            </a>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:10px;color:#9ca3af;">Panneau admin → <a href="https://lecomax.com/admin/messages" style="color:#3ecf4c;text-decoration:none;font-weight:700;">lecomax.com/admin/messages</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });
    } catch (emailErr) {
      console.error("Email notification failed:", emailErr);
      // Non-blocking — message is saved, email is best-effort
    }
  }

  // If DB failed AND email also not configured, return error
  if (dbError && !resend) {
    return NextResponse.json({ error: dbError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
