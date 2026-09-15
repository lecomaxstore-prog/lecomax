import { publicDatabaseError } from "@/lib/public-error";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectAdminMutation, protectAdminRead } from "@/lib/api-security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/roles — list all roles with their permissions + staff count
export async function GET(req: NextRequest) {
  const blocked = await protectAdminRead(req, { key: "admin:roles:list", limit: 60 });
  if (blocked) return blocked;

  const { data: roles, error } = await supabase
    .from("admin_roles")
    .select("*, admin_role_permissions(permission_slug)")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });

  // Count staff per role
  const { data: staffCounts } = await supabase
    .from("admin_staff")
    .select("role_id");

  const countMap: Record<string, number> = {};
  (staffCounts ?? []).forEach((s: { role_id: string | null }) => {
    if (s.role_id) countMap[s.role_id] = (countMap[s.role_id] ?? 0) + 1;
  });

  const result = (roles ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    color: r.color,
    is_system: r.is_system,
    created_at: r.created_at,
    permissions: (r.admin_role_permissions ?? []).map(
      (p: { permission_slug: string }) => p.permission_slug
    ),
    staff_count: countMap[r.id] ?? 0,
  }));

  return NextResponse.json(result);
}

// POST /api/admin/roles — create a new role
export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "admin:roles:create", limit: 10 });
  if (blocked) return blocked;

  const body = await readJsonLimited(req).catch(() => null);
  if (!body?.name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const slug = body.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const { data: role, error } = await supabase
    .from("admin_roles")
    .insert({
      name: body.name,
      slug,
      description: body.description ?? null,
      color: body.color ?? "#6366f1",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });

  if (Array.isArray(body.permissions) && body.permissions.length > 0) {
    await supabase.from("admin_role_permissions").insert(
      body.permissions.map((s: string) => ({ role_id: role.id, permission_slug: s }))
    );
  }

  return NextResponse.json({ ...role, permissions: body.permissions ?? [] }, { status: 201 });
}
