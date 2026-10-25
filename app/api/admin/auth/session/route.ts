import { sameRequestOrigin } from "@/lib/request-origin";
import { sensitiveRateLimit } from "@/lib/sensitive-rate-limit";
import { securityLog } from "@/lib/security-log";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, createStaffPermissionsToken } from "@/lib/admin-session";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  if (!sameRequestOrigin(req)) return NextResponse.json({ error: "Origine non autoris?e" }, { status: 403 });
  const body = await readJsonLimited(req, 16 * 1024).catch(() => null);
  if (typeof body?.access_token !== "string" || body.access_token.length > 12000 || typeof body?.email !== "string" || body.email.length > 254) {
    return NextResponse.json({ error: "Token et email requis" }, { status: 400 });
  }

  const limited = await sensitiveRateLimit(req, "admin-session", body.email);
  if (limited) return limited;

  // Verify the Supabase access_token is genuine
  const verifyRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
    {
      headers: {
        Authorization: `Bearer ${body.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    }
  ).catch(() => null);

  if (!verifyRes) return NextResponse.json({ error: "Service momentanément indisponible." }, { status: 503 });

  if (!verifyRes.ok) {
    securityLog("login_failed", "/api/admin/auth/session");
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  const user = await verifyRes.json();
  if (
    !user?.email || !user.email_confirmed_at ||
    user.email.toLowerCase() !== String(body.email).toLowerCase()
  ) {
    securityLog("login_failed", "/api/admin/auth/session");
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  // ── Access control: only owner or active staff may receive a session ──────
  const ownerEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const normalizedEmail = user.email.toLowerCase();
  const isOwner = normalizedEmail === ownerEmail;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: staffRow } = await sb
    .from("admin_staff")
    .select("id, role_id")
    .eq("email", normalizedEmail)
    .eq("status", "active")
    .maybeSingle();

  // Reject accounts that are neither the owner nor an active staff member.
  // This fires when a staff member has been removed from the admin_staff table.
  if (!isOwner && !staffRow) {
    securityLog("authorization_denied", "/api/admin/auth/session");
    return NextResponse.json(
      { error: "Votre accès à l'administration a été révoqué.", code: "STAFF_REMOVED" },
      { status: 403 }
    );
  }

  // Create a signed session token and set it as an HttpOnly cookie
  const maxAge = body.rememberMe === true ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30d or 24h
  const sessionToken = await createSessionToken(user.email, maxAge * 1000);
  const isProd = process.env.NODE_ENV === "production";

  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  response.cookies.set("admin_session", sessionToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge,
    path: "/",
  });

  // Embed a signed permissions cookie for staff so the middleware can enforce
  // route-level access without a DB round-trip on every request.
  if (staffRow) {
    let permissions: string[] = [];
    if (staffRow.role_id) {
      const { data: permRows } = await sb
        .from("admin_role_permissions")
        .select("permission_slug")
        .eq("role_id", staffRow.role_id);
      permissions = permRows?.map((r: { permission_slug: string }) => r.permission_slug) ?? [];
    }
    const staffToken = await createStaffPermissionsToken(permissions);
    response.cookies.set("staff_permissions", staffToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      maxAge,
      path: "/",
    });
  } else {
    // Owner — clear any stale staff cookie
    response.cookies.set("staff_permissions", "", { httpOnly: true, secure: isProd, sameSite: "strict", maxAge: 0, path: "/" });
  }

  securityLog("admin_session_created", "/api/admin/auth/session");
  return response;
}

// ── DELETE /api/admin/auth/session — clear the session cookie (logout) ──
export async function DELETE(req: NextRequest) {
  if (!sameRequestOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const isProd = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_session", "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  response.cookies.set("staff_permissions", "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  return response;
}
