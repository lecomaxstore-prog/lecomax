import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, verifyStaffPermissionsToken } from "@/lib/admin-session";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ── Paths that hacking tools routinely probe — return 404 immediately ──────
const BLOCKED_PATH_FRAGMENTS = [
  "/.git", "/.env", "/.htaccess", "/.htpasswd",
  "/wp-admin", "/wp-login", "/wp-config",
  "/phpmyadmin", "/pma", "/myadmin",
  "/admin.php", "/config.php", "/xmlrpc.php",
  "/shell", "/cmd", "/eval", "/exec",
  "/cgi-bin", "/etc/passwd", "/proc/self",
  "/../", "/%2e%2e", "/%252e",
];

/** Returns true when the admin_session cookie contains a valid signed token. */
async function isValidAdminSession(req: NextRequest): Promise<boolean> {
  const value = req.cookies.get("admin_session")?.value;
  if (!value) return false;
  const email = await verifySessionToken(value);
  return !!email;
}

// Route slug → required permission slug.
// null      = always visible to all authenticated users (e.g. dashboard)
// undefined = owner-only (hidden from all staff)
// "slug"    = staff must have this permission
const ROUTE_PERMISSIONS: Record<string, string | null | undefined> = {
  "dashboard":       null,
  "analytics":       "analytics.view",
  "recordings":      "recordings.view",
  "products":        "products.view",
  "orders":          "orders.view",
  "customers":       "customers.view",
  "client-data":     "customers.view",
  "stock":           "stock.edit",
  "abandoned-carts": "carts.view",
  "loyalty":         "loyalty.edit",
  "broadcast":       "broadcast.send",
  "push":            "push.send",
  "trustpilot":      "reviews.edit",
  "reviews":         "reviews.edit",
  "categories":      "categories.edit",
  "pages":           "pages.edit",
  "banners":         "banners.edit",
  "media":           "media.manage",
  "studio":          "studio.access",
  "shipping":        "shipping.edit",
  "size-guide":      "size-guide.edit",
  "announcement":    "announcement.edit",
  "promotions":      "promotions.edit",
  "ads":             "ads.edit",
  "newsletter":      "newsletter.edit",
  "coupons":         "promotions.edit",
  "messages":        "messages.view",
  "returns":         "returns.edit",
  "settings":        "settings.edit",
  "roles":           "roles.manage",
  "staff":           "staff.manage",
  "approvals":       undefined,
  "how-it-was-built": undefined,
};

/**
 * Verify that write requests to admin API routes come from the same origin.
 * Prevents CSRF from third-party sites — the SameSite=Strict cookie already
 * blocks most vectors, but an explicit Origin check is defence in depth.
 */
function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // server-to-server or same-origin form posts have no Origin
  const host = req.headers.get("host") ?? "";
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const lowerPath = pathname.toLowerCase();

  // ── Block well-known scanner / attack paths immediately ────────────────────
  if (BLOCKED_PATH_FRAGMENTS.some((frag) => lowerPath.includes(frag))) {
    return new NextResponse(null, { status: 404 });
  }

  // ── Skip static files, API and admin routes for maintenance check ──
  const isStaticOrApi = pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/admin");

  // ── Maintenance mode check (for non-admin, non-static routes) ──
  if (!isStaticOrApi && !pathname.startsWith("/maintenance")) {
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
  if (
    pathname.startsWith("/admin") &&
    pathname !== "/admin" &&
    pathname !== "/admin/" &&
    !pathname.startsWith("/admin/accept-invite")
  ) {
    const valid = await isValidAdminSession(req);
    if (!valid) {
      const loginUrl = new URL("/admin", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ── Staff permission enforcement ──────────────────────────────────────
    // If a signed staff_permissions cookie exists, this is a restricted staff
    // member. Verify the token and block any route they don't have access to.
    const staffToken = req.cookies.get("staff_permissions")?.value;
    if (staffToken) {
      const staffPerms = await verifyStaffPermissionsToken(staffToken);
      if (staffPerms !== null) {
        // Valid staff token — enforce route permission
        const pageKey = pathname.split("/admin/")[1]?.split("/")[0] ?? "dashboard";
        const required = ROUTE_PERMISSIONS[pageKey];
        const allowed =
          required === null ||                          // always allowed
          (required !== undefined && staffPerms.includes(required)); // has perm
        if (!allowed) {
          return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        }
      } else {
        // Tampered / malformed staff cookie — force re-login
        const loginUrl = new URL("/admin", req.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // ── Protect write operations on sensitive API routes ──
  // NOTE: /api/admin/auth/* is intentionally excluded — it is the login/logout
  // endpoint and must be reachable without a pre-existing session.
  const isAdminApiWrite =
    req.method !== "GET" &&
    !pathname.startsWith("/api/admin/auth/") &&
    /^\/api\/(products|coupons|promotions|categories|settings|announcements|shipping|size-guide|newsletter|admin\/)/.test(
      pathname
    );

  if (isAdminApiWrite) {
    // Reject cross-origin write requests (CSRF defence in depth)
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
    }
    const valid = await isValidAdminSession(req);
    if (!valid) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path+", "/api/:path*", "/((?!_next/static|_next/image|favicon|images|manifest|sw).*)"],
};
