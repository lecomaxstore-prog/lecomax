import { sameRequestOrigin } from "./lib/request-origin";
import { edgeRateLimit } from "./lib/edge-rate-limit";
import { getAdminAccess } from "@/lib/admin-access";
import { adminApiPermission, hasAdminPermission } from "@/lib/admin-policy";
import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/admin-session";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let maintenanceCache: { enabled: boolean; expiresAt: number } | null = null;
let maintenanceRequest: Promise<boolean> | null = null;

async function isMaintenanceEnabled(): Promise<boolean> {
  if (maintenanceCache && maintenanceCache.expiresAt > Date.now()) return maintenanceCache.enabled;
  if (!maintenanceRequest) {
    maintenanceRequest = loadMaintenanceMode().finally(() => { maintenanceRequest = null; });
  }
  return maintenanceRequest;
}

async function loadMaintenanceMode(): Promise<boolean> {
  const now = Date.now();
  if (maintenanceCache && maintenanceCache.expiresAt > now) return maintenanceCache.enabled;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/settings?key=eq.maintenance_mode&select=value`,
      {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        signal: AbortSignal.timeout(1500),
      }
    );
    const rows: { value: string }[] = response.ok ? await response.json() : [];
    const enabled = rows[0]?.value === "true";
    maintenanceCache = { enabled, expiresAt: now + 30_000 };
    return enabled;
  } catch {
    maintenanceCache = { enabled: false, expiresAt: now + 10_000 };
    return false;
  }
}

const PRIVATE_INDEX_PREFIXES = [
  "/admin", "/api", "/checkout", "/panier", "/compte", "/wishlist",
  "/merci", "/connexion", "/inscription", "/facture", "/maintenance",
  "/suivre-commande",
];

function applyRobotsHeader(response: NextResponse, pathname: string): NextResponse {
  // These API routes serve public images referenced by storefront metadata.
  // Let image crawlers index them while keeping other API responses private.
  if (pathname.startsWith("/api/og/product/") || pathname.startsWith("/api/ecomedia/social-image/")) {
    return response;
  }
  if (PRIVATE_INDEX_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, noimageindex");
  }
  return response;
}

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

async function hasHowBuiltPin(req: NextRequest): Promise<boolean> {
  const value = req.cookies.get("how_built_access")?.value;
  if (!value) return false;
  return (await verifySessionToken(value, 8 * 60 * 60 * 1000)) === "how-built-pin@lecomax.local";
}

// Route slug → required permission slug.
// null      = always visible to all authenticated users (e.g. dashboard)
// undefined = owner-only (hidden from all staff)
// "slug"    = staff must have this permission
const ROUTE_PERMISSIONS: Record<string, string | null | undefined> = {
  "dashboard":       null,
  "mobile-app":      "settings.edit",
  "app-releases": "settings.edit",
  "checkout": "settings.edit",
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
function isSameOrigin(req: NextRequest): boolean { return sameRequestOrigin(req); }

const MOBILE_PUBLIC_API =
  /^\/api\/(?:products|product-translations|search|categories|promotions|settings|banners|recommendations|reviews(?:\/(?:stats|check))?|shipping\/quote|checkout\/quote|payment-methods|paypal\/mobile\/(?:create|capture)|orders|wishlist|points|coupons\/validate|newsletter|size-guide|account\/(?:profile|avatar|delete-request)|mobile\/push-subscribe|app-releases\/android\/latest|support\/conversations(?:\/[0-9a-f-]+(?:\/messages)?)?)$/;
const MOBILE_WEB_ORIGINS = new Set([
  "https://app.lecomax.com",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
]);

function isAllowedMobileOrigin(origin: string) {
  if (origin === "https://app.lecomax.com") return true;
  if (process.env.NODE_ENV === "production") return false;
  if (MOBILE_WEB_ORIGINS.has(origin)) return true;
  return /^http:\/\/(?:localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)(?::\d+)?$/i.test(origin);
}

function mobileCorsHeaders(req: NextRequest, response: NextResponse, pathname: string) {
  if (!MOBILE_PUBLIC_API.test(pathname) && !/^\/api\/mobile\/(notifications|notification-preferences|web-push)$/.test(pathname)) return response;
  const origin = req.headers.get("origin");
  if (!origin || !isAllowedMobileOrigin(origin)) return response;
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Idempotency-Key, X-Lecomax-Client",
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  response.headers.set("Vary", "Origin");
  return response;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname.replace(/\/+$/, "") || "/";
  const limited = edgeRateLimit(req, pathname);
  if (limited) return limited;
  if (pathname.startsWith("/api/") && !req.headers.get("content-type")?.includes("multipart/form-data") && Number(req.headers.get("content-length") || 0) > 1024 * 1024) return NextResponse.json({ error: "Request too large" }, { status: 413 });
  const lowerPath = pathname.toLowerCase();

  // ── Block well-known scanner / attack paths immediately ────────────────────
  if (BLOCKED_PATH_FRAGMENTS.some((frag) => lowerPath.includes(frag))) {
    return new NextResponse(null, { status: 404 });
  }

  if (req.method === "OPTIONS" && (MOBILE_PUBLIC_API.test(pathname) || /^\/api\/mobile\/(notifications|notification-preferences|web-push)$/.test(pathname))) {
    return mobileCorsHeaders(req, new NextResponse(null, { status: 204 }), pathname);
  }

  // ── Skip static files, API and admin routes for maintenance check ──
  const isStaticOrApi = pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/admin");

  // ── Maintenance mode check (for non-admin, non-static routes) ──
  if (!isStaticOrApi && !pathname.startsWith("/maintenance") && await isMaintenanceEnabled()) {
    return NextResponse.redirect(new URL("/maintenance", req.url));
  }

  // ── Auto-redirect authenticated users away from login page ──────────────
  if (pathname === "/admin" || pathname === "/admin/") {
    const valid = await isValidAdminSession(req);
    if (valid) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
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
    const access = await getAdminAccess(req);
    const pageKey = pathname.split("/admin/")[1]?.split("/")[0] ?? "dashboard";
    if (!access) return NextResponse.redirect(new URL("/admin", req.url));
    if (!hasAdminPermission(access, ROUTE_PERMISSIONS[pageKey])) return NextResponse.redirect(new URL("/admin/dashboard", req.url));

    // The owner-only learning/code area requires a second PIN unlock. Keep the
    // unlock screen reachable, but never serve the real course bundle first.
    if (
      pathname.startsWith("/admin/how-it-was-built") &&
      !pathname.startsWith("/admin/how-it-was-built/unlock") &&
      !(await hasHowBuiltPin(req))
    ) {
      const unlockUrl = new URL("/admin/how-it-was-built/unlock", req.url);
      unlockUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(unlockUrl);
    }
  }

  // ── Protect write operations on sensitive API routes ──
  // NOTE: /api/admin/auth/* is intentionally excluded — it is the login/logout
  // endpoint and must be reachable without a pre-existing session.
  const isPublicNewsletterSignup = pathname === "/api/newsletter" && req.method === "POST";
  const isNewsletterAdminApi = pathname.startsWith("/api/newsletter") && !isPublicNewsletterSignup;
  const isAdminApiWrite =
    req.method !== "GET" &&
    !pathname.startsWith("/api/admin/auth/") &&
    pathname !== "/api/admin/staff/verify-invite" &&
    !pathname.startsWith("/api/coupons/validate") &&
    !isPublicNewsletterSignup &&
    /^\/api\/(products|coupons|promotions|categories|settings|announcements|shipping|size-guide|newsletter|admin\/|ads|ai-(?:broadcast|product|reply|review)|send-confirmation|upload(?:-media)?|media|trustpilot-featured)/.test(
      pathname
    );
  const isCouponManagementApi =
    pathname.startsWith("/api/coupons") &&
    !pathname.startsWith("/api/coupons/validate");

  const requestOrigin = req.headers.get("origin");
  if (
    isPublicNewsletterSignup
    && !isSameOrigin(req)
    && (!requestOrigin || !isAllowedMobileOrigin(requestOrigin))
  ) {
    return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
  }

  if (isAdminApiWrite || isCouponManagementApi || isNewsletterAdminApi || (pathname.startsWith("/api/admin/") && !pathname.startsWith("/api/admin/auth/") && pathname !== "/api/admin/staff/verify-invite")) {
    // Reject cross-origin write requests (CSRF defence in depth)
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
    }
    const access = await getAdminAccess(req);
    if (!access) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    if (!hasAdminPermission(access, adminApiPermission(pathname, req.method))) return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  const response = applyRobotsHeader(NextResponse.next(), pathname);
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/") && (req.headers.has("authorization") || req.cookies.has("admin_session") || /^\/api\/(?:orders|tracking|inbox|messages|client-data|chat|account|support)(?:\/|$)/.test(pathname))) response.headers.set("Cache-Control", "private, no-store");
  return mobileCorsHeaders(req, response, pathname);
}

export const config = {
  matcher: ["/admin/:path+", "/api/:path*", "/((?!_next/static|_next/image|favicon|images|brand/|icons/|fonts/|manifest|sw).*)"],
};
