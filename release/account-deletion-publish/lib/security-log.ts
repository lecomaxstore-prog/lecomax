import "server-only";

/** Deliberately excludes identities, request bodies, headers, URLs and errors. */
export function securityLog(event: "authorization_denied" | "origin_denied" | "rate_limited" | "admin_session_created" | "login_failed" | "webhook_rejected", route: string) {
  const safeRoute = route.split("?")[0].replace(/[^a-zA-Z0-9/_-]/g, "").slice(0, 160);
  console.warn(JSON.stringify({ type: "security", event, route: safeRoute, at: new Date().toISOString() }));
}
