import "server-only";
import { createHash } from "node:crypto";
const local = new Map<string, { day: string; used: number }>();
// Reserve conservatively before provider work. Failed/cancelled calls retain reservation.
export async function reserveTutorBudget(owner: string, units: number) {
  const limit = Number(process.env.TUTOR_DAILY_TOKEN_BUDGET || 200000);
  if (!Number.isSafeInteger(limit) || limit < 1)
    throw new Error("BUDGET_UNAVAILABLE");
  const day = new Date().toISOString().slice(0, 10);
  const identity = createHash("sha256").update(owner).digest("hex");
  const explicit =
    process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_TOKEN;
  const url = explicit
    ? process.env.UPSTASH_REDIS_REST_URL
    : process.env.KV_REST_API_URL;
  const token = explicit
    ? process.env.UPSTASH_REDIS_REST_TOKEN
    : process.env.KV_REST_API_TOKEN;
  if (!url && !token && process.env.NODE_ENV !== "production") {
    const old = local.get(identity);
    const used = old?.day === day ? old.used : 0;
    if (used + units > limit) throw new Error("USAGE_LIMIT");
    local.set(identity, { day, used: used + units });
    return { reserved: units, remaining: limit - used - units };
  }
  if (!url?.startsWith("https://") || !token)
    throw new Error("BUDGET_UNAVAILABLE");
  const script =
    "local n=tonumber(redis.call('GET',KEYS[1]) or '0'); if n+tonumber(ARGV[1])>tonumber(ARGV[2]) then return -1 end; local v=redis.call('INCRBY',KEYS[1],ARGV[1]); redis.call('EXPIRE',KEYS[1],172800); return v";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      "EVAL",
      script,
      "1",
      `tutor:budget:${identity}:${day}`,
      String(units),
      String(limit),
    ]),
    signal: AbortSignal.timeout(3000),
    cache: "no-store",
  });
  const body = await response.json();
  if (!response.ok || !Number.isInteger(body.result))
    throw new Error("BUDGET_UNAVAILABLE");
  if (body.result < 0) throw new Error("USAGE_LIMIT");
  return { reserved: units, remaining: Math.max(0, limit - body.result) };
}
