import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { confirmationEmailHtml, confirmationEmailSubject, confirmationEmailText } from "@/lib/auth-confirmation-email";

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
