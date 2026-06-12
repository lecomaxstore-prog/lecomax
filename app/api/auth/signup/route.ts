import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password, prenom, nom } = body as {
    email: string;
    password: string;
    prenom: string;
    nom: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }

  // Derive the origin so the redirect works in both dev and production
  const origin =
    req.headers.get("origin") ||
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    "https://lecomax.com";

  const fullName = `${prenom} ${nom}`.trim();

  // generateLink creates the user (unconfirmed) and returns a confirmation URL
  // without triggering Supabase's built-in email — we handle sending ourselves.
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      data: { full_name: fullName, prenom, nom },
      redirectTo: `${origin}/compte`,
    },
  });

  if (error) {
    const msg =
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("already exists")
        ? "Un compte existe déjà avec cet email."
        : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const confirmUrl = data.properties.action_link;

  // ── Beautiful branded confirmation email ────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Confirmez votre email — L'ECOMAX</title>
</head>
<body style="margin:0;padding:0;background:#f2f2f2;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#f2f2f2;">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:560px;">

          <!-- ░░ HEADER ░░ -->
          <tr>
            <td style="background:#000000;padding:36px 40px 28px;text-align:center;border-radius:0;">
              <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:900;color:#ffffff;letter-spacing:-1.5px;line-height:1;">L&rsquo;eco<span style="color:#3ecf4c;">max</span></span>
              <p style="margin:10px 0 0;font-size:10px;font-weight:700;color:#555555;text-transform:uppercase;letter-spacing:3px;">Sport · Style · Performance</p>
            </td>
          </tr>

          <!-- ░░ GREEN ACCENT BAR ░░ -->
          <tr>
            <td style="background:#3ecf4c;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- ░░ BODY ░░ -->
          <tr>
            <td style="background:#ffffff;padding:44px 40px 36px;">

              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#3ecf4c;text-transform:uppercase;letter-spacing:3px;">Bienvenue</p>
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:900;color:#000000;letter-spacing:-0.5px;text-transform:uppercase;line-height:1.2;">
                Confirmez votre<br>adresse email
              </h1>
              <p style="margin:0 0 28px;font-size:14px;color:#555555;line-height:1.7;">
                Bonjour <strong style="color:#000;">${fullName || prenom}</strong>,<br><br>
                Merci de rejoindre <strong>L&rsquo;ECOMAX</strong> ! Votre compte est presque prêt.
                Il vous reste une dernière étape — confirmez votre adresse email en cliquant
                sur le bouton ci-dessous.
              </p>

              <!-- CTA BUTTON -->
              <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#000000;">
                    <a href="${confirmUrl}"
                       style="display:inline-block;padding:18px 44px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:2.5px;">
                      Confirmer mon email &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- DIVIDER -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 0 24px;">
                <tr>
                  <td style="height:1px;background:#eeeeee;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <p style="margin:0 0 6px;font-size:12px;color:#999999;line-height:1.6;">
                Ce lien est valable <strong>24 heures</strong>. Si vous n&rsquo;avez pas créé ce compte, ignorez simplement cet email.
              </p>
              <p style="margin:16px 0 0;font-size:11px;color:#bbbbbb;line-height:1.6;">
                Lien de confirmation :<br>
                <a href="${confirmUrl}" style="color:#3ecf4c;word-break:break-all;font-size:10px;">${confirmUrl}</a>
              </p>

            </td>
          </tr>

          <!-- ░░ FOOTER ░░ -->
          <tr>
            <td style="background:#000000;padding:22px 40px;text-align:center;">
              <p style="margin:0;font-size:10px;font-weight:700;color:#444444;text-transform:uppercase;letter-spacing:2px;">L&rsquo;ECOMAX</p>
              <p style="margin:4px 0 0;font-size:10px;color:#333333;letter-spacing:1px;">Maroc &middot; lecomax.com</p>
              <p style="margin:12px 0 0;font-size:9px;color:#2a2a2a;">
                Vous recevez cet email car vous venez de créer un compte sur lecomax.com.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: "L'ECOMAX <noreply@lecomax.com>",
      replyTo: "contact@lecomax.com",
      to: [email],
      subject: "Confirmez votre email — L'ECOMAX",
      html,
    });
  } catch (emailErr) {
    // Log but don't block — user can request a new confirmation later
    console.error("Failed to send confirmation email:", emailErr);
  }

  return NextResponse.json({ success: true });
}
