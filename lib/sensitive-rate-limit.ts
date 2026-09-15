import "server-only";
import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { clientIp, enforceRateLimit } from "./api-security";

const SCRIPT = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]) end; return {n,redis.call('PTTL',KEYS[1])}";

/** Shared atomic counters when Redis is configured; bounded local defence otherwise. */
export async function sensitiveRateLimit(req: NextRequest, scope: string, account?: string) {
  const period = 15 * 60_000;
  const counters: [string, number][] = [[`ip:${clientIp(req)}`, 30]];
  if (account) counters.push([`account:${account.trim().toLowerCase()}`, 10]);
  // Keep credential pairs together: an incomplete explicit configuration must
  // fail closed rather than borrowing a token from a different Redis resource.
  const explicitRedis = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_TOKEN;
  const url = explicitRedis ? process.env.UPSTASH_REDIS_REST_URL : process.env.KV_REST_API_URL;
  const token = explicitRedis ? process.env.UPSTASH_REDIS_REST_TOKEN : process.env.KV_REST_API_TOKEN;
  for (const [identity, limit] of counters) {
    const digest = createHash("sha256").update(identity).digest("hex");
    if (!url && !token) {
      const denied = enforceRateLimit(req, scope, limit, period, digest);
      if (denied) return denied;
      continue;
    }
    try {
      if (!url?.startsWith("https://") || !token) throw new Error("RATE_LIMIT_UNAVAILABLE");
      const response = await fetch(url, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(["EVAL", SCRIPT, "1", `security:${scope}:${digest}`, String(period)]),
        cache: "no-store", signal: AbortSignal.timeout(3000),
      });
      const body = await response.json();
      if (!response.ok || !Array.isArray(body.result) || body.result.length !== 2) throw new Error("RATE_LIMIT_UNAVAILABLE");
      const [count, ttl] = body.result;
      if (!Number.isFinite(count) || !Number.isFinite(ttl)) throw new Error("RATE_LIMIT_UNAVAILABLE");
      if (count > limit) return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil(ttl / 1000))) } });
    } catch {
      // A configured shared limiter must never silently fail open.
      return NextResponse.json({ error: "Service momentanément indisponible." }, { status: 503 });
    }
  }
  return null;
}
