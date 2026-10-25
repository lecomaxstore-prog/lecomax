import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { protectAdminMutation, protectAdminRead } from "@/lib/api-security";
import { getAdminAccess } from "@/lib/admin-access";
import { hasAdminPermission } from "@/lib/admin-policy";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { readJsonLimited } from "@/lib/request-body";
import { seoPath } from "@/lib/seo-engine";
import { assessEditorial } from "@/operations/seo-vercel/lib/seo-editorial-quality.mjs";

export const runtime = "nodejs";
const reply = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
const permitted = (access: Awaited<ReturnType<typeof getAdminAccess>>) => ["products.view", "products.edit", "categories.edit"].every(p => hasAdminPermission(access, p));
export async function GET(req: NextRequest) {
  const blocked = await protectAdminRead(req, { key: "seo:ai-read" });
  if (blocked) return blocked;
  const access = await getAdminAccess(req);
  if (!permitted(access)) return reply({ error: "Permissions catalogue requises." }, 403);
  const kind = req.nextUrl.searchParams.get("kind"), id = req.nextUrl.searchParams.get("id");
  if (kind && !["product", "category"].includes(kind) || id && id.length > 100) return reply({ error: "Sélection invalide." }, 400);
  try {
    const { data, error } = await createServerSupabaseClient(5000).rpc("seo_ai_dashboard_v3", { p_kind: kind, p_id: id });
    return error ? reply({ error: "Suivi IA indisponible. Migration IA requise." }, 503) : reply({ ...data, canManageBudget: access!.owner });
  } catch { return reply({ error: "Suivi IA indisponible." }, 503); }
}
export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "seo:ai-write", limit: 20 });
  if (blocked) return blocked;
  const access = await getAdminAccess(req);
  if (!permitted(access)) return reply({ error: "Permissions catalogue requises." }, 403);
  const input = await readJsonLimited(req, 4000).catch(() => null);
  if (!input || !["enqueue", "approve", "review", "budget", "authorize"].includes(input.action)) return reply({ error: "Requête invalide." }, 400);
  try {
    const db = createServerSupabaseClient(5000);
    if (input.action === "budget") {
      if (!access!.owner) return reply({ error: "Budget réservé au propriétaire." }, 403);
      if (typeof input.enabled !== "boolean" || input.mirai !== false || typeof input.limit !== "number" || !Number.isFinite(input.limit) || input.limit < 0 || input.limit > 5) return reply({ error: "Budget invalide (0 à 5 USD, secours désactivé)." }, 400);
      const { error } = await db.rpc("seo_ai_set_budget", { p_enabled: input.enabled, p_limit: input.limit, p_mirai: input.mirai, p_actor: access!.email });
      return error ? reply({ error: "Budget non enregistré." }, 503) : reply({ ok: true });
    }
    if (input.action === "authorize") {
      if (!access!.owner) return reply({ error: "Autorisation payante réservée au propriétaire." }, 403);
      if (typeof input.job !== "string" || !/^[0-9a-f-]{36}$/i.test(input.job) || ![0.01, 0.05, 0.10, 0.20].includes(input.ceiling) || input.confirmed !== true) return reply({ error: "Confirmez une seule requête et son plafond." }, 400);
      const { data, error } = await db.rpc("seo_ai_authorize", { p_job: input.job, p_ceiling: input.ceiling, p_actor: access!.email });
      return error || data !== true ? reply({ error: "Autorisation refusée ou déjà enregistrée." }, 409) : reply({ ok: true });
    }
    if (!["product", "category"].includes(input.kind) || typeof input.id !== "string" || !input.id || input.id.length > 100) return reply({ error: "Fiche invalide." }, 400);
    if (input.action === "enqueue") {
      if (!["routine", "advanced", "editorial-luna", "editorial-sol", "premium"].includes(input.tier) || typeof input.reason !== "string" || input.reason.length > 500 || input.tier !== "routine" && input.reason.trim().length < 20 || ["editorial-luna", "editorial-sol", "premium"].includes(input.tier) && input.kind !== "product") return reply({ error: "Précisez le besoin éditorial (20 caractères minimum), sur une fiche produit." }, 400);
      const { data, error } = await db.rpc(["routine","advanced"].includes(input.tier)?"seo_ai_enqueue":"seo_ai_enqueue_v3", { p_kind: input.kind, p_id: input.id, p_tier: input.tier, p_reason: input.reason, p_actor: access!.email });
      return error ? reply({ error: "Mise en file indisponible. Vérifiez la fiche et la migration IA." }, 503) : reply(data, data.reused ? 200 : 202);
    }
    if (typeof input.job !== "string" || !/^[0-9a-f-]{36}$/i.test(input.job) || !Number.isInteger(input.version)) return reply({ error: "Approbation invalide." }, 400);
    const lookup = await db.rpc("seo_ai_dashboard_v3", { p_kind: input.kind, p_id: input.id });
    if (lookup.error) return reply({ error: "Lecture indisponible." }, 503);
    const job = lookup.data.jobs.find((item: { id: string }) => item.id === input.job);
    if (!job) return reply({ error: "Suggestion introuvable." }, 404);
    if (input.action === "review") {
      if (!job.result?.editorialVersion || job.state !== "completed" || !job.payload || job.source_current !== true) return reply({error:"Brouillon ou source modifié. Actualisez avant relecture."},409);
      if (!["approved_for_publication","changes_requested"].includes(input.decision) || typeof input.notes !== "string" || input.notes.trim().length<10 || input.notes.length>2000) return reply({error:"Décision et notes de relecture requises."},400);
      const checklist = Object.fromEntries(["facts","french","arabic","duplicates"].map(k=>[k,input.checklist?.[k]===true]));
      if (input.decision === "approved_for_publication") {
        const quality=assessEditorial({fr:job.result.fr,ar:job.result.ar,evidence:job.result.evidence},job.payload);
        if (!Object.values(checklist).every(Boolean)||!quality.valid) return reply({error:"Relecture incomplète ou contrôles qualité bloquants."},409);
      }
      const {data,error}=await db.rpc("seo_ai_review",{p_job:job.id,p_kind:input.kind,p_id:input.id,p_version:input.version,p_result:job.result,p_decision:input.decision,p_checklist:checklist,p_notes:input.notes.trim(),p_actor:access!.email});
      return error||data!==true?reply({error:"Relecture non enregistrée : vérifiez la version et la préparation du stockage."},409):reply({ok:true,published:false});
    }
    if (job.result?.editorialVersion || ["editorial-luna","editorial-sol","premium"].includes(job.tier)) return reply({error:"Publication éditoriale bloquée. La relecture ne publie pas le brouillon."},409);
    const { data, error } = await db.rpc("seo_ai_approve", { p_job: input.job, p_version: input.version, p_actor: access!.email });
    if (error) return reply({ error: "Fiche modifiée ou résultat indisponible. Actualisez avant approbation." }, 409);
    let warning: string | undefined;
    try { revalidateTag("storefront-seo"); revalidatePath(seoPath(data.kind, data.slug)); }
    catch { warning = "Approbation enregistrée ; cache actualisé sous cinq minutes."; }
    return reply({ document: data, warning });
  } catch { return reply({ error: "Stockage IA indisponible. Actualisez avant de réessayer." }, 503); }
}
