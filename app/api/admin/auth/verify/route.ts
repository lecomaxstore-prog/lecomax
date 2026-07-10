import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/admin-session";

/** GET /api/admin/auth/verify — returns 200 if admin_session cookie is valid, 401 otherwise */
export async function GET(req: NextRequest) {
  const value = req.cookies.get("admin_session")?.value;
  if (!value) return NextResponse.json({ error: "No session" }, { status: 401 });
  const email = await verifySessionToken(value);
  if (!email) return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  return NextResponse.json({ ok: true, email });
}
