import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/staff/verify-invite?token=XXX — look up staff by invite token
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const { data, error } = await supabase
    .from("admin_staff")
    .select("id, name, email, status, admin_roles(name, color)")
    .eq("invite_token", token)
    .single();

  if (error || !data) return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  if (data.status === "suspended") return NextResponse.json({ error: "Account suspended" }, { status: 403 });

  return NextResponse.json({ name: data.name, email: data.email });
}

// POST /api/admin/staff/verify-invite — mark staff as active after account creation
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const { error } = await supabase
    .from("admin_staff")
    .update({ status: "active", invite_token: null })
    .eq("invite_token", body.token);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
