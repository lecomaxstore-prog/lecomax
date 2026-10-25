import "server-only";
import { cache } from "react";
import { createPublicSupabaseClient } from "./supabase-server";
import { sourceChanged, type SeoSource } from "./seo-engine";
import { validEditorialDraft, type EditorialContent } from "./seo-editorial";

const readPublished = cache(async (slug: string) => {
  try {
    const {data, error} = await createPublicSupabaseClient(["storefront-seo"], 300).from("seo_documents")
      .select("source,published_source,published,editorial_published,editorial_source").eq("kind", "product").eq("slug", slug).eq("active", true).maybeSingle();
    return error ? null : data;
  } catch { return null; }
});
/** Never return drafts, stale source snapshots or an editorial body superseded by metadata approval. */
export async function getPublishedEditorial(source: SeoSource): Promise<EditorialContent | null> {
  const row = await readPublished(source.slug);
  if (!row?.source || !row.editorial_source || !row.published || !validEditorialDraft(row.editorial_published) ||
    sourceChanged(row.published_source, row.source) || sourceChanged(row.source, {...row.source, ...source}) ||
    sourceChanged(row.source, {...row.source, ...row.editorial_source}) ||
    row.published.title !== row.editorial_published.fr.title || row.published.description !== row.editorial_published.fr.description) return null;
  return row.editorial_published;
}
