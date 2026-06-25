import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT /api/admin/staff/[id] — update name, role, status
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined)       updates.name = body.name;
  if (body.email !== undefined)      updates.email = body.email.toLowerCase().trim();
  if (body.role_id !== undefined)    updates.role_id = body.role_id;
  if (body.status !== undefined)     updates.status = body.status;
  if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;

  const { data, error } = await supabase
    .from("admin_staff")
    .update(updates)
    .eq("id", id)
    .select("*, admin_roles(id, name, color, slug)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/admin/staff/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from("admin_staff").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
