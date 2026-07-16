import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function clean(value: unknown, max = 250): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim().slice(0, max);
  return result || null;
}

function requestIp(req: NextRequest) {
  return clean(req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip"), 64);
}

function maskIp(ip: string | null) {
  if (!ip) return null;
  if (ip === "::1" || ip === "127.0.0.1") return "Localhost";
  if (ip.includes(".")) {
    const parts = ip.split(".");
    return parts.length === 4 ? `${parts[0]}.${parts[1]}.xxx.xxx` : null;
  }
  const parts = ip.split(":").filter(Boolean);
  return parts.length ? `${parts.slice(0, 3).join(":")}:…` : null;
}

function parseAgent(ua: string) {
  const device_type = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua) ? "Tablet" : /Android|iPhone|iPod|Mobile/i.test(ua) ? "Mobile" : "Desktop";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Other";
  const operating_system = /Windows NT/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Other";
  return { device_type, browser, operating_system };
}

function decodeHeader(value: string | null) {
  if (!value) return null;
  try { return decodeURIComponent(value).slice(0, 120); } catch { return value.slice(0, 120); }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const path = clean(body.path, 500);
  if (!path || !path.startsWith("/") || path.startsWith("/admin")) return NextResponse.json({ error: "Invalid path" }, { status: 400 });

  const ip = requestIp(req);
  const ua = clean(req.headers.get("user-agent"), 500) || "Unknown";
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "local-analytics-key";
  const width = Number(body.screen_width);
  const height = Number(body.screen_height);
  const latitude = Number(req.headers.get("x-vercel-ip-latitude"));
  const longitude = Number(req.headers.get("x-vercel-ip-longitude"));
  const isLocal = ip === "127.0.0.1" || ip === "::1";
  const payload = {
    path,
    referrer: clean(body.referrer, 1000),
    user_agent: ua,
    session_id: clean(body.session_id, 100),
    visitor_id: clean(body.visitor_id, 100),
    ip_hash: ip ? createHmac("sha256", secret).update(ip).digest("hex") : null,
    ip_masked: maskIp(ip),
    country_code: clean(req.headers.get("x-vercel-ip-country"), 2) || (isLocal ? "LO" : null),
    region: decodeHeader(req.headers.get("x-vercel-ip-country-region")),
    city: decodeHeader(req.headers.get("x-vercel-ip-city")) || (isLocal ? "Local" : null),
    latitude: Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 ? Number(latitude.toFixed(4)) : null,
    longitude: Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 ? Number(longitude.toFixed(4)) : null,
    ...parseAgent(ua),
    screen_width: Number.isFinite(width) && width > 0 && width < 20000 ? Math.round(width) : null,
    screen_height: Number.isFinite(height) && height > 0 && height < 20000 ? Math.round(height) : null,
    language: clean(body.language, 30),
    timezone: clean(body.timezone, 100),
  };

  const { error } = await supabase.from("page_views").insert(payload);
  if (error) return NextResponse.json({ error: "Tracking unavailable" }, { status: 500 });
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
