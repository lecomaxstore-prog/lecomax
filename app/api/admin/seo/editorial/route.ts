import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { protectAdminRead, protectAdminMutation } from "@/lib/api-security";
import { getAdminAccess } from "@/lib/admin-access";
import { hasAdminPermission } from "@/lib/admin-policy";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { readJsonLimited } from "@/lib/request-body";
import { validEditorialDraft, type EditorialContent, type EditorialState } from "@/lib/seo-editorial";
import { seoPath } from "@/lib/seo-engine";
import { assessEditorial } from "@/operations/seo-vercel/lib/seo-editorial-quality.mjs";

export const runtime = "nodejs";
const reply = (data: unknown, status = 200) => NextResponse.json(data, {status, headers: {"Cache-Control": "private, no-store"}});
const canRead = (access: Awaited<ReturnType<typeof getAdminAccess>>) => hasAdminPermission(access, "products.view");
const validId = (id: unknown) => typeof id === "string" && id.trim().length > 0 && id.length <= 100;
const unavailable = () => reply({error: "Stockage éditorial indisponible. Migration locale 004 requise ; aucun résultat supposé."}, 503);
export async function GET(req: NextRequest) {
  const blocked = await protectAdminRead(req, {key: "seo:editorial-read"});
  if (blocked) return blocked;
  const access = await getAdminAccess(req);
  if (!canRead(access)) return reply({error: "Accès refusé."}, 403);
  const id = req.nextUrl.searchParams.get("id");
  const before = req.nextUrl.searchParams.get("before"), eventBefore = req.nextUrl.searchParams.get("eventBefore");
  if (!validId(id) || before !== null && (!/^[1-9]\d{0,8}$/.test(before)) || eventBefore !== null && !/^[1-9]\d{0,17}$/.test(eventBefore)) return reply({error: "Sélection invalide."}, 400);
  try {
    const db = createServerSupabaseClient(7000);
    const {data, error} = await db.rpc("seo_editorial_read", {p_id: id, p_before: before ? Number(before) : null, p_event_before: eventBefore});
    if (error) return unavailable();
    if (!data) return reply({error: "Fiche introuvable."}, 404);
    const canEdit = hasAdminPermission(access, "products.edit");
    let suggestions: {id: string; tier: string; content: EditorialContent}[] | undefined;
    let suggestionsUnavailable = false;
    // Product editors need no unrelated category/budget permission to import
    // a saved suggestion. Return only this product's completed/current content.
    if (canEdit && before === null && eventBefore === null) {
      try {
        const lookup = await db.rpc("seo_ai_dashboard_v3", {p_kind: "product", p_id: id});
        if (lookup.error || !Array.isArray(lookup.data?.jobs)) throw Error("SUGGESTIONS_UNAVAILABLE");
        suggestions = lookup.data.jobs.flatMap((job: {id: string; tier: string; state: string; source_current: boolean; result?: EditorialContent & {editorialVersion?: number}}) => {
          if (job.state !== "completed" || job.source_current !== true || !job.result?.editorialVersion) return [];
          const content = {fr:job.result.fr, ar:job.result.ar, evidence:job.result.evidence};
          return validEditorialDraft(content) ? [{id:job.id, tier:job.tier, content}] : [];
        });
      } catch { suggestionsUnavailable = true; }
    }
    return reply({...data, draftScope: access!.email, canPublish: access!.owner, canEdit, suggestions, suggestionsUnavailable});
  } catch { return unavailable(); }
}
export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, {key: "seo:editorial-write", limit: 40});
  if (blocked) return blocked;
  const access = await getAdminAccess(req);
  if (!canRead(access) || !hasAdminPermission(access, "products.edit")) return reply({error: "Permission de modification requise."}, 403);
  const input = await readJsonLimited(req, 48_000).catch(() => null);
  if (!input || !validId(input.id) || !["save", "approved", "changes_requested", "publish", "rollback"].includes(input.action) ||
    !Number.isSafeInteger(input.version) || input.version < 1 || !Number.isSafeInteger(input.revision) || input.revision < 0 ||
    !input.source || typeof input.source !== "object" || Array.isArray(input.source) ||
    typeof input.notes !== "string" || input.notes.trim().length < 10 || input.notes.length > 2000) return reply({error: "Requête éditoriale invalide."}, 400);
  const publishing = ["publish", "rollback"].includes(input.action);
  if (publishing && !access!.owner) return reply({error: "Publication et retour arrière réservés au propriétaire."}, 403);
  if (publishing && input.confirmed !== true) return reply({error: "Confirmation explicite requise."}, 400);
  if (input.action === "rollback" && (typeof input.event !== "string" || !/^[1-9]\d{0,17}$/.test(input.event))) return reply({error: "Publication à annuler invalide."}, 400);
  if (input.job !== undefined && (input.action !== "save" || typeof input.job !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(input.job))) return reply({error: "Suggestion invalide."}, 400);
  try {
    const db = createServerSupabaseClient(7000);
    let content = input.content ?? null;
    if (input.job) {
      const lookup = await db.rpc("seo_ai_dashboard_v3", {p_kind: "product", p_id: input.id});
      if (lookup.error) return unavailable();
      const job = lookup.data?.jobs?.find((j: {id: string}) => j.id === input.job);
      if (!job || job.state !== "completed" || !job.result?.editorialVersion || job.source_current !== true) return reply({error: "Suggestion absente ou source modifiée."}, 409);
      content = {fr: job.result.fr, ar: job.result.ar, evidence: job.result.evidence};
    }
    if (input.action === "save" && !validEditorialDraft(content)) return reply({error: "Brouillon invalide ou trop volumineux."}, 400);
    const checklist = Object.fromEntries(["facts", "french", "arabic", "duplicates"].map(key => [key, input.checklist?.[key] === true]));
    if (["approved", "publish"].includes(input.action)) {
      const lookup = await db.rpc("seo_editorial_read", {p_id: input.id});
      if (lookup.error) return unavailable();
      const state = lookup.data as EditorialState | null;
      if (!state?.head || state.version !== input.version || state.revision !== input.revision) return reply({error: "Révision modifiée. Rechargez et relisez."}, 409);
      if (!validEditorialDraft(state.head.content) || !assessEditorial(state.head.content, state.source).valid ||
        input.action === "approved" && !Object.values(checklist).every(Boolean)) return reply({error: "Contrôles factuels, linguistiques ou relecture incomplets."}, 409);
    }
    const {data, error} = await db.rpc("seo_editorial_mutate", {p_id: input.id, p_version: input.version, p_revision: input.revision, p_source: input.source,
      p_action: input.action, p_content: input.action === "save" ? content : null, p_job: input.job ?? null, p_event: input.action === "rollback" ? input.event : null,
      p_checklist: checklist, p_notes: input.notes.trim(), p_actor: access!.email});
    if (error) return /SEO_EDITORIAL_/.test(error.message) ? reply({error: "Conflit, source modifiée ou relecture requise. Votre texte reste disponible ; rechargez pour comparer."}, 409) : unavailable();
    let warning: string | undefined;
    if (publishing) {
      try { revalidateTag("storefront-seo"); revalidatePath(seoPath("product", data.source.slug)); }
      catch { warning = "Publication enregistrée ; cache actualisé sous cinq minutes."; }
    }
    return reply({...data, draftScope: access!.email, canPublish: access!.owner, canEdit: true, warning});
  } catch { return unavailable(); }
}
