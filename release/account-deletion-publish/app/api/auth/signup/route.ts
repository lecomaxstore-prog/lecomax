import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { sensitiveRateLimit } from "@/lib/sensitive-rate-limit";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { confirmationEmailHtml, confirmationEmailSubject, confirmationEmailText } from "@/lib/auth-confirmation-email";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const body = await readJsonLimited(req, 16 * 1024).catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  const { email, password, prenom, nom } = body as {
    email: string;
    password: string;
    prenom: string;
    nom: string;
  };

  if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" || password.length < 8 || password.length > 128 ||
      (prenom !== undefined && (typeof prenom !== "string" || prenom.length > 80)) ||
      (nom !== undefined && (typeof nom !== "string" || nom.length > 80))) {
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }

  // Derive the origin so the redirect works in both dev and production
  const blocked = await sensitiveRateLimit(req, "signup", email);
  if (blocked) return blocked;
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://lecomax.com";

  const fullName = `${prenom || ""} ${nom || ""}`.trim();

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
        : "Impossible de créer le compte. Vérifiez les informations saisies.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const confirmUrl = data.properties.action_link;

  const html = confirmationEmailHtml(confirmUrl);

  try {
    await resend.emails.send({
      from: "L'ECOMAX <noreply@lecomax.com>",
      replyTo: "contact@lecomax.com",
      to: [email],
      subject: confirmationEmailSubject,
      html,
      text: confirmationEmailText(confirmUrl),
    });
  } catch (emailErr) {
    // Log but don't block — user can request a new confirmation later
    console.error("Failed to send confirmation email:", emailErr);
  }

  return NextResponse.json({ success: true });
}
