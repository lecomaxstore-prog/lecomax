import "server-only";
import { cache } from "react";
import { createPublicSupabaseClient } from "./supabase-server";
import { fallbackSeo, validSeoContent, sourceChanged, type SeoSource, type SeoContent } from "./seo-engine";

const readSeo = cache(async (kind: "product" | "category", slug: string): Promise<{ content: SeoContent; source: SeoSource } | null> => {
  try {
    const db = createPublicSupabaseClient(["storefront-seo"], 300);
    const { data, error } = await db.from("seo_documents").select("published,fallback,source,published_source").eq("kind", kind).eq("slug", slug).eq("active", true).maybeSingle();
    if (error) return null;
    const publishedIsCurrent = data?.published && data.source && !sourceChanged(data.published_source, data.source);
    const content = publishedIsCurrent ? data.published : data?.fallback;
    return validSeoContent(content) && data?.source ? { content, source: data.source } : null;
  } catch { return null; }
});

export async function getSeoContent(kind: "product" | "category", source: SeoSource): Promise<SeoContent> {
  const stored = await readSeo(kind, source.slug);
  // A paused worker or old cache must not serve metadata for outdated product facts.
  return stored && !sourceChanged(stored.source, { ...stored.source, ...source }) ? stored.content : fallbackSeo(source, kind);
}
