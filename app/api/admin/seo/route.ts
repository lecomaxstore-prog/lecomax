import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { protectAdminMutation, protectAdminRead } from "@/lib/api-security";
import { getAdminAccess } from "@/lib/admin-access";
import { hasAdminPermission } from "@/lib/admin-policy";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { readJsonLimited } from "@/lib/request-body";
import { validSeoContent, sourceChanged, seoPath, type SeoDocument } from "@/lib/seo-engine";
import { suggestSeo } from "@/lib/seo-ai";

export const runtime = "nodejs";
export const maxDuration = 60;
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
const unavailable = () => reply({ error: "Stockage SEO indisponible. Vérifiez la connexion et la migration autonome 202610180002_seo_decoupled.sql. Aucun changement publié." }, 503);

export async function GET(req: NextRequest) {
  const blocked = await protectAdminRead(req, { key: "seo:read" });
  if (blocked) return blocked;
  const access = await getAdminAccess(req);
  if (!hasAdminPermission(access, "products.view")) return reply({ error: "Accès refusé." }, 403);
  try {
    const db = createServerSupabaseClient(10_000);
    const kind = req.nextUrl.searchParams.get("kind");
    const id = req.nextUrl.searchParams.get("id");
    if (id && (kind === "product" || kind === "category")) {
      if (kind === "category" && !hasAdminPermission(access, "categories.edit")) return reply({ error: "Accès refusé." }, 403);
      const before = req.nextUrl.searchParams.get("before");
      let query = db.from("seo_events").select("*").eq("kind", kind).eq("entity_id", id).order("id", { ascending: false }).limit(30);
      if (before && /^\d+$/.test(before)) query = query.lt("id", before);
      const { data, error } = await query;
      return error ? unavailable() : reply({ events: data });
    }
    // Paginate PostgREST reads so its default 1,000 row cap never silently truncates.
    const documents: SeoDocument[] = [];
    let offset = 0;
    for (;;) {
      let query = db.from("seo_documents").select("*").order("kind").order("entity_id").range(offset, offset + 499);
      if (!hasAdminPermission(access, "categories.edit")) query = query.eq("kind", "product");
      const { data, error } = await query;
      if (error) return unavailable();
      documents.push(...data as SeoDocument[]);
      if (data.length < 500) break;
      offset += 500;
      if (offset >= 50_000) return reply({ error: "Catalogue supérieur à 50 000 fiches : partitionnez le tableau de bord avant de lancer un audit complet." }, 422);
    }
    const sync = await db.rpc("seo_sync_status", { p_kind: hasAdminPermission(access, "categories.edit") ? null : "product" });
    return reply({ documents, synchronization: sync.error ? null : sync.data, canEditProducts: hasAdminPermission(access, "products.edit"), canEditCategories: hasAdminPermission(access, "categories.edit"), aiConfigured: false });
  } catch { return unavailable(); }
}

export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "seo:write", limit: 90 });
  if (blocked) return blocked;
  const input = await readJsonLimited(req, 12_000).catch(() => null);
  if (!input || !["product", "category"].includes(input.kind) || typeof input.id !== "string" || input.id.length > 100 ||
      !Number.isInteger(input.version) || input.version < 1 || !["generate", "draft", "approve", "reset"].includes(input.action) ||
      (input.action === "draft" && !validSeoContent(input.content))) return reply({ error: "Requête SEO invalide." }, 400);
  const access = await getAdminAccess(req);
  if (!hasAdminPermission(access, input.kind === "product" ? "products.edit" : "categories.edit")) return reply({ error: "Permission de modification requise." }, 403);
  try {
    const db = createServerSupabaseClient(10_000);
    let content = input.action === "draft" ? input.content : null;
    let provider = "manual";
    let warning: string | undefined;
    if (input.action === "generate") {
      const { data: current, error } = await db.from("seo_documents").select("*").eq("kind", input.kind).eq("entity_id", input.id).maybeSingle();
      if (error) return unavailable();
      if (!current) return reply({ error: "Fiche introuvable." }, 404);
      if (current.version !== input.version) return reply({ error: "Fiche modifiée ailleurs. Actualisez avant de réessayer." }, 409);
      if (input.useAI === true) {
        const queued = await db.rpc("seo_ai_enqueue", { p_kind: input.kind, p_id: input.id, p_tier: "routine", p_reason: "Routine SEO", p_actor: access!.email });
        if (queued.error) return unavailable();
        return reply({ document: current, warning: "Suggestion bilingue mise en file. Consultez le panneau IA après le prochain passage du worker." }, 202);
      }
      // Reuse the durable suggestion for this source revision, including across
      // serverless instances. Never replace a human draft with a paid request.
      if (validSeoContent(current.draft) && current.draft_source &&
          !sourceChanged(current.draft_source, current.source) &&
          (input.useAI !== true || current.provider === "ai" || current.provider === "manual")) {
        return reply({ document: current, reused: true });
      }
      const result = await suggestSeo(current.source, input.kind, input.useAI === true);
      content = result.content; provider = result.provider; warning = result.warning;
    }
    const { data, error } = await db.rpc("save_seo_document", {
      p_kind: input.kind, p_entity_id: input.id, p_version: input.version,
      p_action: input.action === "generate" ? "draft" : input.action,
      p_content: content, p_actor: access!.email, p_provider: provider, p_detail: warning ?? null,
    });
    if (error) {
      if (/SEO_EDITORIAL_WORKFLOW_REQUIRED/.test(error.message)) return reply({ error: "Cette fiche possède des révisions éditoriales. Utilisez leur relecture, publication ou retour arrière." }, 409);
      if (/SEO_CONFLICT|SEO_SOURCE_CHANGED/.test(error.message)) return reply({ error: "La fiche ou le brouillon a changé. Actualisez et vérifiez à nouveau." }, 409);
      if (/SEO_DRAFT_REQUIRED|SEO_CONTENT_INVALID/.test(error.message)) return reply({ error: "Enregistrez un brouillon valide avant approbation." }, 400);
      return unavailable();
    }
    if (input.action === "approve" || input.action === "reset") {
      // The transaction is committed; cache errors must not invite duplicate mutations.
      try {
        revalidateTag("storefront-seo");
        revalidatePath(seoPath(data.kind, data.slug));
        revalidatePath("/sitemap.xml");
      } catch { warning = "Contenu enregistré ; actualisation automatique des pages sous cinq minutes."; }
    }
    return reply({ document: data, warning });
  } catch { return unavailable(); }
}
