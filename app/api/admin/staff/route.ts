import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/staff — list all staff members with their role
export async function GET() {
  const { data, error } = await supabase
    .from("admin_staff")
    .select("*, admin_roles(id, name, color, slug)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/admin/staff — invite a new staff member
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.name) {
    return NextResponse.json({ error: "email and name are required" }, { status: 400 });
  }

  const email = body.email.toLowerCase().trim();
  const name = body.name.trim();
  const invite_token = randomBytes(32).toString("hex");
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lecomax.ma";

  // 1. Save staff record
  const { data, error } = await supabase
    .from("admin_staff")
    .insert({
      email,
      name,
      avatar_url: body.avatar_url ?? null,
      role_id: body.role_id ?? null,
      status: "invited",
      invite_token,
    })
    .select("*, admin_roles(id, name, color, slug)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Cet email est déjà enregistré" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. Send invite via Supabase Auth (reliable, no domain verification needed)
  const redirectTo = `${origin}/admin/accept-invite?token=${invite_token}`;
  const { error: authInviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { name, invite_token },
  });

  // 3. Fallback: send via Resend if Supabase invite failed and Resend key is set
  if (authInviteError) {
    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (RESEND_KEY) {
      const inviteLink = `${origin}/admin/accept-invite?token=${invite_token}`;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: email,
          subject: "Invitation — Panneau Admin L'ecomax",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
              <h2 style="font-size:20px;font-weight:800;margin-bottom:8px">Bienvenue, ${name} 👋</h2>
              <p style="color:#555;margin-bottom:24px">Vous avez été invité(e) à gérer le panneau administrateur de <strong>L'ecomax</strong>.</p>
              <a href="${inviteLink}" style="background:#0d0d0d;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700;display:inline-block">
                Créer mon compte &amp; me connecter
              </a>
              <p style="color:#999;font-size:12px;margin-top:24px">Ce lien est valable 7 jours.</p>
            </div>
          `,
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ...data, invite_token }, { status: 201 });
}

  const { data, error } = await supabase
    .from("admin_staff")
    .insert({
      email: body.email.toLowerCase().trim(),
      name: body.name.trim(),
      avatar_url: body.avatar_url ?? null,
      role_id: body.role_id ?? null,
      status: "invited",
      invite_token,
    })
    .select("*, admin_roles(id, name, color, slug)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Cet email est déjà enregistré" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send invite email via Resend if API key configured
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (RESEND_KEY) {
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lecomax.ma";
    const inviteLink = `${origin}/admin/accept-invite?token=${invite_token}`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "L'ecomax Admin <no-reply@lecomax.ma>",
        to: body.email,
        subject: "Invitation — Panneau Admin L'ecomax",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h2 style="font-size:20px;font-weight:800;margin-bottom:8px">Bienvenue, ${body.name} 👋</h2>
            <p style="color:#555;margin-bottom:24px">Vous avez été invité(e) à gérer le panneau administrateur de <strong>L'ecomax</strong>.</p>
            <a href="${inviteLink}" style="background:#0d0d0d;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700;display:inline-block">
              Accepter l'invitation
            </a>
            <p style="color:#999;font-size:12px;margin-top:24px">Ce lien est valable 7 jours.</p>
          </div>
        `,
      }),
    }).catch(() => {});
  }

  return NextResponse.json(data, { status: 201 });
}
