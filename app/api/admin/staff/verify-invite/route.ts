import { publicDatabaseError } from "@/lib/public-error";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit, isSameOrigin } from "@/lib/api-security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/staff/verify-invite?token=XXX — look up staff by invite token
export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "admin:invite:verify", 20, 600_000);
  if (limited) return limited;

  const token = req.nextUrl.searchParams.get("token");
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

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
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
  const limited = enforceRateLimit(req, "admin:invite:activate", 10, 600_000);
  if (limited) return limited;

  const body = await readJsonLimited(req).catch(() => null);
  if (!body?.token || !/^[a-f0-9]{64}$/i.test(body.token)) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  const { error } = await supabase
    .from("admin_staff")
    .update({ status: "active", invite_token: null })
    .eq("invite_token", body.token)
    .eq("status", "invited");

  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json({ ok: true });
}
