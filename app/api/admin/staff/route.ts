import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServiceHeaders } from "@/lib/supabase-service-headers";
import { protectAdminMutation, protectAdminRead } from "@/lib/api-security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/staff — list all staff members with their role
export async function GET(req: NextRequest) {
  const blocked = await protectAdminRead(req, { key: "admin:staff:list", limit: 60 });
  if (blocked) return blocked;

  const { data, error } = await supabase
    .from("admin_staff")
    .select("id, email, name, avatar_url, role_id, status, last_login, created_at, admin_roles(id, name, color, slug)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/admin/staff — create a new staff member with email + password
export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "admin:staff:create", limit: 10 });
  if (blocked) return blocked;

  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.name || !body?.password) {
    return NextResponse.json({ error: "email, name et password sont requis" }, { status: 400 });
  }

  const email = body.email.toLowerCase().trim();
  const name = body.name.trim();
  const password: string = body.password;

  // Server-side password strength check
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 8 caractères." },
      { status: 400 }
    );
  }

  // 1. Create Supabase auth account (or reuse if it already exists from a previous deletion)
  let authUserId: string;
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (authError) {
    const msg = authError.message.toLowerCase();
    const alreadyExists =
      msg.includes("already registered") ||
      msg.includes("already been registered") ||
      msg.includes("already exists") ||
      msg.includes("email_exists") ||
      msg.includes("unique");

    if (alreadyExists) {
      // Auth user exists (leftover from a previous deletion) — find them via REST, update password, reuse
      const listRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?per_page=50`,
        {
          headers: supabaseServiceHeaders(),
        }
      );
      const listData = await listRes.json();
      const existing = (listData.users ?? []).find(
        (u: { email: string; id: string }) => u.email === email
      );
      if (!existing) {
        return NextResponse.json({ error: "Cet email est déjà enregistré" }, { status: 409 });
      }
      // Update the password so the new credentials work
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${existing.id}`,
        {
          method: "PUT",
          headers: supabaseServiceHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ password: body.password, user_metadata: { name }, email_confirm: true }),
        }
      );
      authUserId = existing.id;
    } else {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }
  } else {
    authUserId = authData.user!.id;
  }

  // 2. Save staff record in admin_staff table
  const { data, error } = await supabase
    .from("admin_staff")
    .insert({
      email,
      name,
      avatar_url: body.avatar_url ?? null,
      role_id: body.role_id ?? null,
      status: "active",
    })
    .select("*, admin_roles(id, name, color, slug)")
    .single();

  if (error) {
    // Cleanup: delete the auth user only if we just created it (not if we reused it)
    if (authData?.user?.id) {
      await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
    }
    if (error.code === "23505") {
      return NextResponse.json({ error: "Cet email est déjà enregistré" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
