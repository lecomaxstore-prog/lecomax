import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectAdminRead } from "@/lib/api-security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

// GET /api/admin/staff/permissions?email=xxx
// Returns the permission slugs for a staff member (used at login time)
export async function GET(req: NextRequest) {
  const blocked = await protectAdminRead(req, { key: "admin:staff:permissions", limit: 120 });
  if (blocked) return blocked;

  const email = req.nextUrl.searchParams.get("email");
  if (!email) return json({ error: "Email required" }, 400);

  const normalizedEmail = email.trim().toLowerCase();
  const ownerEmail = (process.env.ADMIN_EMAIL ?? "contact@lecomax.com").trim().toLowerCase();
  if (normalizedEmail === ownerEmail) {
    return json({ isOwner: true, isStaff: false, permissions: [] });
  }

  const { data: staffRow } = await supabase
    .from("admin_staff")
    .select("id, role_id")
    .eq("email", normalizedEmail)
    .eq("status", "active")
    .maybeSingle();

  if (!staffRow) {
    return json({ error: "Admin access not found" }, 403);
  }

  if (!staffRow.role_id) {
    return json({ isOwner: false, isStaff: true, permissions: [] });
  }

  const { data: permRows } = await supabase
    .from("admin_role_permissions")
    .select("permission_slug")
    .eq("role_id", staffRow.role_id);

  const permissions = permRows?.map((r: { permission_slug: string }) => r.permission_slug) ?? [];
  return json({ isOwner: false, isStaff: true, permissions });
}
