import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Only protect /admin sub-routes (not the login page itself)
  if (!pathname.startsWith("/admin") || pathname === "/admin") {
    return NextResponse.next();
  }

  // Check for the session cookie set after Supabase login
  const session = req.cookies.get("admin_session")?.value;

  if (!session) {
    const loginUrl = new URL("/admin", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path+"],
};
