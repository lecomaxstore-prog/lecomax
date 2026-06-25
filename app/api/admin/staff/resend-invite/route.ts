import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/admin/staff/resend-invite — rotate token + resend invite email
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Fetch the staff member
  const { data: member, error: fetchError } = await supabase
    .from("admin_staff")
    .select("id, email, name, status")
    .eq("id", body.id)
    .single();

  if (fetchError || !member) {
    return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
  }
  if (member.status === "active") {
    return NextResponse.json({ error: "Ce membre est déjà actif" }, { status: 400 });
  }

  // Rotate the invite token
  const invite_token = randomBytes(32).toString("hex");
  const { error: updateError } = await supabase
    .from("admin_staff")
    .update({ invite_token, status: "invited" })
    .eq("id", body.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lecomax.com";
  const redirectTo = `${origin}/admin/accept-invite?token=${invite_token}`;

  // Try Supabase auth invite
  const { error: authError } = await supabase.auth.admin.inviteUserByEmail(member.email, {
    redirectTo,
    data: { name: member.name, invite_token },
  });

  // Fallback to Resend
  if (authError) {
    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (RESEND_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: member.email,
          subject: "Invitation — Panneau Admin L'ecomax",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
              <h2 style="font-size:20px;font-weight:800;margin-bottom:8px">Bonjour, ${member.name} 👋</h2>
              <p style="color:#555;margin-bottom:24px">Vous avez été invité(e) à gérer le panneau administrateur de <strong>L'ecomax</strong>.</p>
              <a href="${redirectTo}" style="background:#0d0d0d;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700;display:inline-block">
                Créer mon compte &amp; me connecter
              </a>
              <p style="color:#999;font-size:12px;margin-top:24px">Ce lien est valable 7 jours.</p>
            </div>
          `,
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ invite_token, invite_link: redirectTo });
}
