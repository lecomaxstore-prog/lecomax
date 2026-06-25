import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ── Skip static files, API and admin routes for maintenance check ──
  const isStaticOrApi = pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/admin");

  // ── Maintenance mode check (for non-admin, non-static routes) ──
  if (!isStaticOrApi && pathname !== "/maintenance") {
    const maintenanceCookie = req.cookies.get("maintenance_bypass")?.value;
    if (maintenanceCookie !== "admin") {
      try {
        // Query Supabase REST directly — no circular middleware call
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/settings?key=eq.maintenance_mode&select=value`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
        if (res.ok) {
          const rows: { value: string }[] = await res.json();
          if (rows[0]?.value === "true") {
            return NextResponse.redirect(new URL("/maintenance", req.url));
          }
        }
      } catch {
        // If DB is unreachable, don't block visitors
      }
    }
  }

  // ── Protect /admin sub-routes (not the login page itself or accept-invite) ──
  if (pathname.startsWith("/admin") && pathname !== "/admin" && pathname !== "/admin/" && !pathname.startsWith("/admin/accept-invite")) {
    const session = req.cookies.get("admin_session")?.value;
    if (!session || session !== "authenticated") {
      const loginUrl = new URL("/admin", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Protect write operations on sensitive API routes ──
  const isAdminApiWrite =
    req.method !== "GET" &&
    /^\/api\/(products|coupons|promotions|categories|settings|announcements|shipping|size-guide|newsletter)/.test(pathname);

  if (isAdminApiWrite) {
    const session = req.cookies.get("admin_session")?.value;
    if (!session || session !== "authenticated") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path+", "/api/:path*", "/((?!_next/static|_next/image|favicon|images|manifest|sw).*)"],
};
