import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, createStaffPermissionsToken } from "@/lib/admin-session";
import { createClient } from "@supabase/supabase-js";

// ── In-memory rate limiter ──────────────────────────────────────────────────
// NOTE: on Vercel serverless this resets per cold-start, but still provides
// meaningful protection against rapid brute-force within a single warm instance.
// For production-grade rate limiting, replace with Upstash Redis or similar.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const MAX_ATTEMPTS = 10;

  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

// ── POST /api/admin/auth/session — exchange Supabase token for HttpOnly cookie ──
export async function POST(req: NextRequest) {
  // Reject requests that come from a different origin (extra CSRF protection)
  const origin = req.headers.get("origin");
  const host = req.headers.get("host") ?? "";
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    }
  }

  // Rate limit first
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans 15 minutes." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.access_token || !body?.email) {
    return NextResponse.json({ error: "Token et email requis" }, { status: 400 });
  }

  // Verify the Supabase access_token is genuine
  const verifyRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
    {
      headers: {
        Authorization: `Bearer ${body.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    }
  );

  if (!verifyRes.ok) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  const user = await verifyRes.json();
  if (
    !user?.email ||
    user.email.toLowerCase() !== String(body.email).toLowerCase()
  ) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  // ── Access control: only owner or active staff may receive a session ──────
  const ownerEmail = (process.env.ADMIN_EMAIL ?? "contact@lecomax.com").toLowerCase();
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
    return NextResponse.json(
      { error: "Votre accès à l'administration a été révoqué.", code: "STAFF_REMOVED" },
      { status: 403 }
    );
  }

  // Create a signed session token and set it as an HttpOnly cookie
  const maxAge = body.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30d or 24h
  const sessionToken = await createSessionToken(user.email);
  const isProd = process.env.NODE_ENV === "production";

  const response = NextResponse.json({ ok: true });
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

  return response;
}

// ── DELETE /api/admin/auth/session — clear the session cookie (logout) ──
export async function DELETE() {
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
