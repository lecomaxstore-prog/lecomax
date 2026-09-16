import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "./admin-session";
import { createServerSupabaseClient } from "./supabase-server";

/** Check the current role in the database; a deleted permissions cookie cannot grant owner access. */
export async function requireSettingsPermission(request: NextRequest, permission = "settings.edit") {
  const token = request.cookies.get("admin_session")?.value;
  const email = token ? await verifySessionToken(token) : null;
  if (!email) return NextResponse.json({ error: "Non autorisé.", code: "UNAUTHORIZED" }, { status: 401 });
  if (email.toLowerCase() === (process.env.ADMIN_EMAIL ?? "contact@lecomax.com").toLowerCase()) return null;
  const db = createServerSupabaseClient();
  const { data: staff, error } = await db.from("admin_staff").select("role_id").eq("email", email.toLowerCase()).eq("status", "active").maybeSingle();
  if (error || !staff?.role_id) return NextResponse.json({ error: "Accès refusé.", code: "FORBIDDEN" }, { status: 403 });
  const permissions = await db.from("admin_role_permissions").select("permission_slug").eq("role_id", staff.role_id).eq("permission_slug", permission);
  return permissions.error || !permissions.data?.length ? NextResponse.json({ error: "Accès refusé.", code: "FORBIDDEN" }, { status: 403 }) : null;
}
