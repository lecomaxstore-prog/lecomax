import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/staff/permissions?email=xxx
// Returns the permission slugs for a staff member (used at login time)
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ isStaff: false, permissions: [] });

  const { data: staffRow } = await supabase
    .from("admin_staff")
    .select("id, role_id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!staffRow) {
    return NextResponse.json({ isStaff: false, permissions: [] });
  }

  if (!staffRow.role_id) {
    return NextResponse.json({ isStaff: true, permissions: [] });
  }

  const { data: permRows } = await supabase
    .from("admin_role_permissions")
    .select("permission_slug")
    .eq("role_id", staffRow.role_id);

  const permissions = permRows?.map((r: { permission_slug: string }) => r.permission_slug) ?? [];
  return NextResponse.json({ isStaff: true, permissions });
}
