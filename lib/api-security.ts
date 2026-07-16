import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/request-auth";

type Bucket = { count: number; resetAt: number };
const globalBuckets = globalThis as typeof globalThis & { __lecomaxRateLimits?: Map<string, Bucket> };
const buckets = globalBuckets.__lecomaxRateLimits ??= new Map<string, Bucket>();

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function isSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  try {
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function enforceRateLimit(req: NextRequest, key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 5_000) {
    for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey);
  }
  const bucketKey = `${key}:${clientIp(req)}`;
  const current = buckets.get(bucketKey);
  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (current.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans quelques instants." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }
  current.count += 1;
  return null;
}

export async function protectAdminMutation(
  req: NextRequest,
  options: { key: string; limit?: number; windowMs?: number },
) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return enforceRateLimit(req, options.key, options.limit ?? 30, options.windowMs ?? 60_000);
}

export async function protectAdminRead(
  req: NextRequest,
  options: { key: string; limit?: number; windowMs?: number },
) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return enforceRateLimit(req, options.key, options.limit ?? 120, options.windowMs ?? 60_000);
}
