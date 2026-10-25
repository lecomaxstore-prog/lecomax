import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation, protectAdminRead } from "@/lib/api-security";
import { getAdminAccess } from "@/lib/admin-access";
import { hasAdminPermission } from "@/lib/admin-policy";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { environment, credentialBinding, PROJECTS } from "@/operations/seo-vercel/lib/environment-target.mjs";

export const runtime = "nodejs";
export const maxDuration = 60;
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
async function authorized(req: NextRequest) {
  const access = await getAdminAccess(req);
  return hasAdminPermission(access, "products.view") && hasAdminPermission(access, "products.edit") && hasAdminPermission(access, "categories.edit");
}
async function workerConfig() {
  const secret = process.env.SEO_WORKER_CRON_SECRET;
  const raw = process.env.SEO_WORKER_URL;
  if (!raw || !secret || secret.length < 32 || process.env.SEO_MANUAL_SYNC_ENABLED !== "true") return null;
  try {
    const selected = environment(process.env);
    if (!["production", "staging"].includes(selected) || process.env.SEO_RUNTIME_ENV !== selected) return null;
    const url = new URL(raw);
    // A non-Vercel endpoint requires a second, exact operator-pinned origin.
    // Request parameters never select destinations; redirects remain forbidden.
    const pinnedOrigin = process.env.SEO_WORKER_ALLOWED_ORIGIN;
    const allowed = Boolean(pinnedOrigin && url.origin === pinnedOrigin);
    if (url.protocol !== "https:" || !allowed || url.username || url.password || url.port || url.pathname !== "/api/sync" || url.search || url.hash) return null;
    await credentialBinding(`${raw}\n${secret}`, process.env.SEO_WORKER_BINDING,
      selected === "production" ? PROJECTS.production : PROJECTS.staging);
    return { url: url.href, secret };
  } catch { return null; }
}
export async function GET(req: NextRequest) {
  const blocked = await protectAdminRead(req, { key: "seo:sync-status" });
  if (blocked) return blocked;
  if (!await authorized(req)) return reply({ error: "Accès refusé." }, 403);
  try {
    const { data, error } = await createServerSupabaseClient(5_000).rpc("seo_run_status");
    if (error) return reply({ error: "État du worker indisponible. Vérifiez la migration de contrôle." }, 503);
    return reply({ run: data, enabled: Boolean(await workerConfig()) });
  } catch { return reply({ error: "État du worker indisponible." }, 503); }
}
export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "seo:sync", limit: 3, windowMs: 60_000 });
  if (blocked) return blocked;
  if (!await authorized(req)) return reply({ error: "Permissions produits et catégories requises." }, 403);
  const config = await workerConfig();
  if (!config) return reply({ error: "Synchronisation manuelle désactivée ou non configurée." }, 503);
  try {
    // Invoke the exact same bounded worker as Cron. No credentials reach the browser.
    const response = await fetch(config.url, { method: "GET", redirect: "error", cache: "no-store",
      headers: { Authorization: `Bearer ${config.secret}` }, signal: AbortSignal.timeout(52_000) });
    if (response.status === 409) return reply({ error: "Une synchronisation est déjà en cours." }, 409);
    if (!response.ok) return reply({ error: "Le worker a signalé un échec. Consultez le dernier passage avant de réessayer." }, 503);
    // Result details are read from durable SQL status, never forwarded from HTTP.
    return reply({ ok: true });
  } catch { return reply({ error: "Résultat du worker inconnu. Actualisez son état avant de réessayer." }, 503); }
}
