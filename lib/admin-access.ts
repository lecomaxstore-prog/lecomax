import "server-only";
import { verifySessionToken } from "./admin-session";
import { supabaseHeaders } from "../operations/seo-vercel/lib/supabase-headers.mjs";

export type AdminAccess = { email: string; owner: boolean; permissions: string[] };
type SessionRequest = { cookies: { get(name: string): { value: string } | undefined } };
const requests = new WeakMap<object, Promise<AdminAccess | null>>();

/** Request-local deduplication only: revocations take effect on the next request. */
export function getAdminAccess(request: SessionRequest): Promise<AdminAccess | null> {
  const existing = requests.get(request);
  if (existing) return existing;
  const pending = load(request);
  requests.set(request, pending);
  return pending;
}

async function load(request: SessionRequest): Promise<AdminAccess | null> {
  try {
    const token = request.cookies.get("admin_session")?.value;
    const verified = token ? await verifySessionToken(token) : null;
    if (!verified) return null;
    const email = verified.trim().toLowerCase();
    if (email === process.env.ADMIN_EMAIL?.trim().toLowerCase()) return { email, owner: true, permissions: [] };
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !secret) return null;
    const read = async (table: string, query: URLSearchParams) => {
      const response = await fetch(`${url}/rest/v1/${table}?${query}`, { cache: "no-store", redirect: "error", headers: supabaseHeaders(secret), signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error("ADMIN_ACCESS_UNAVAILABLE");
      return response.json();
    };
    const staff = await read("admin_staff", new URLSearchParams({ select: "role_id", email: `eq.${email}`, status: "eq.active", limit: "1" }));
    if (!Array.isArray(staff) || !staff.length) return null;
    if (!staff[0].role_id) return { email, owner: false, permissions: [] };
    const rows = await read("admin_role_permissions", new URLSearchParams({ select: "permission_slug", role_id: `eq.${staff[0].role_id}` }));
    if (!Array.isArray(rows)) return null;
    return { email, owner: false, permissions: rows.flatMap(row => typeof row.permission_slug === "string" ? [row.permission_slug] : []) };
  } catch { return null; }
}
