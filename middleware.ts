import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ── Protect /admin sub-routes (not the login page itself) ──
  if (pathname.startsWith("/admin") && pathname !== "/admin") {
    const session = req.cookies.get("admin_session")?.value;
    if (!session || session !== "authenticated") {
      const loginUrl = new URL("/admin", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Protect write operations on sensitive API routes ──
  // Only admin-level mutations (POST/PUT/DELETE on products, coupons, promotions, categories, settings, announcements, newsletter, shipping, size-guide)
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
  matcher: ["/admin/:path+", "/api/:path*"],
};
