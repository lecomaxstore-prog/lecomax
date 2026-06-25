import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

// POST /api/admin/staff — create a new staff member with email + password
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.name || !body?.password) {
    return NextResponse.json({ error: "email, name et password sont requis" }, { status: 400 });
  }

  const email = body.email.toLowerCase().trim();
  const name = body.name.trim();

  // 1. Create Supabase auth account directly (no invite link needed)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: body.password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (authError) {
    const msg = authError.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("email_exists") || msg.includes("unique")) {
      return NextResponse.json({ error: "Cet email est déjà enregistré" }, { status: 409 });
    }
    return NextResponse.json({ error: authError.message }, { status: 500 });
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
    // Cleanup: delete the auth user we just created
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