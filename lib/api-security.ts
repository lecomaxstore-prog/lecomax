import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/request-auth";
import { sameRequestOrigin } from "./request-origin";
import { seoWritesAllowed } from "@/operations/seo-vercel/lib/environment-target.mjs";

type Bucket = { count: number; resetAt: number };
const globalBuckets = globalThis as typeof globalThis & { __lecomaxRateLimits?: Map<string, Bucket> };
const buckets = globalBuckets.__lecomaxRateLimits ??= new Map<string, Bucket>();

export function clientIp(req: NextRequest) {
  if (process.env.VERCEL === "1") return req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function isSameOrigin(req: NextRequest) {
  return sameRequestOrigin(req);
}

export function enforceRateLimit(req: NextRequest, key: string, limit: number, windowMs: number, identity = clientIp(req)) {
  const now = Date.now();
  if (buckets.size > 5_000) {
    for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey);
  }
  const bucketKey = `${key}:${identity}`;
  const current = buckets.get(bucketKey);
  if (!current || current.resetAt <= now) {
    if (buckets.size >= 10_000) buckets.delete(buckets.keys().next().value!);
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
  // AI flags do not gate manual SEO saves or publication. Keep hosted test
  // environments read-only until a separately reviewed test boundary exists.
  if (options.key.startsWith("seo:") && !seoWritesAllowed(process.env)) {
    return NextResponse.json({ error: "SEO mutations are disabled in this environment." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
  return enforceRateLimit(req, options.key, options.limit ?? 30, options.windowMs ?? 60_000);
}

export async function protectAdminRead(
  req: NextRequest,
  options: { key: string; limit?: number; windowMs?: number },
) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return enforceRateLimit(req, options.key, options.limit ?? 120, options.windowMs ?? 60_000);
}
