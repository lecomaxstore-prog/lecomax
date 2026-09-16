import { NextRequest, NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-access";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

/** GET /api/admin/auth/verify — returns 200 if admin_session cookie is valid, 401 otherwise */
export async function GET(req: NextRequest) {
  const value = req.cookies.get("admin_session")?.value;
  if (!value) return NextResponse.json({ error: "No session" }, { status: 401, headers: NO_STORE_HEADERS });
  const access = await getAdminAccess(req);
  const email = access?.email;
  if (!email) return NextResponse.json({ error: "Invalid session" }, { status: 401, headers: NO_STORE_HEADERS });
  return NextResponse.json({ ok: true, email }, { headers: NO_STORE_HEADERS });
}
