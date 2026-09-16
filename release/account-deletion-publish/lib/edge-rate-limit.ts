import { NextRequest, NextResponse } from "next/server";

// Defence in depth only. Vercel WAF/shared counters are needed across instances.
const counters = new Map<string, { count: number; until: number }>();
export function edgeRateLimit(req: NextRequest, path: string) {
  if (!path.startsWith("/api/") || path.includes("/webhook") || path.startsWith("/api/cron/")) return null;
  const sensitive = /\/api\/(?:auth\/signup|admin\/auth\/session|admin\/how-built-pin|account\/password-reset)$/.test(path);
  const period = sensitive ? 900_000 : 60_000;
  const limit = sensitive ? 30 : 300;
  const ip = process.env.VERCEL === "1"
    ? req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    : req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${sensitive ? path : "api"}:${ip}`;
  const now = Date.now();
  let entry = counters.get(key);
  if (!entry || entry.until <= now) {
    if (counters.size >= 10_000) counters.delete(counters.keys().next().value!);
    entry = { count: 0, until: now + period }; counters.set(key, entry);
  }
  if (++entry.count > limit) return NextResponse.json({ error: "Trop de requêtes. Veuillez patienter." }, { status: 429, headers: { "Retry-After": String(Math.ceil((entry.until - now) / 1000)) } });
  return null;
}
