import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectAdminMutation, protectAdminRead } from "@/lib/api-security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/roles/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await protectAdminRead(req, { key: "admin:roles:read", limit: 60 });
  if (blocked) return blocked;

  const { id } = await params;
  const { data, error } = await supabase
    .from("admin_roles")
    .select("*, admin_role_permissions(permission_slug)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({
    ...data,
    permissions: (data.admin_role_permissions ?? []).map(
      (p: { permission_slug: string }) => p.permission_slug
    ),
    admin_role_permissions: undefined,
  });
}

// PUT /api/admin/roles/[id] — update role name/description/color/permissions
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await protectAdminMutation(req, { key: "admin:roles:update", limit: 20 });
  if (blocked) return blocked;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  // Check if system role — only allow updating permissions, not name/slug
  const { data: existing } = await supabase
    .from("admin_roles")
    .select("is_system")
    .eq("id", id)
    .single();

  const updates: Record<string, unknown> = {};
  if (!existing?.is_system) {
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
  }
  if (body.color !== undefined) updates.color = body.color;

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from("admin_roles")
      .update(updates)
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Replace permissions
  if (Array.isArray(body.permissions) && !body.permissions.includes("*")) {
    await supabase.from("admin_role_permissions").delete().eq("role_id", id);
    if (body.permissions.length > 0) {
      await supabase.from("admin_role_permissions").insert(
        body.permissions.map((s: string) => ({ role_id: id, permission_slug: s }))
      );
    }
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/roles/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await protectAdminMutation(req, { key: "admin:roles:delete", limit: 10 });
  if (blocked) return blocked;

  const { id } = await params;

  const { data: role } = await supabase
    .from("admin_roles")
    .select("is_system")
    .eq("id", id)
    .single();

  if (role?.is_system) {
    return NextResponse.json({ error: "Impossible de supprimer un rôle système" }, { status: 403 });
  }

  const { error } = await supabase.from("admin_roles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
