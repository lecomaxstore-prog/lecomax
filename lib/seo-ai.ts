import "server-only";
import { fallbackSeo, type SeoSource, type SeoContent } from "./seo-engine";

/** Synchronous suggestions are deterministic. Paid generation is queued. */
export async function suggestSeo(source: SeoSource, kind: "product" | "category", useAI: boolean): Promise<{ content: SeoContent; provider: string; warning?: string }> {
  return { content: fallbackSeo(source, kind), provider: "deterministic",
    ...(useAI ? { warning: "La generation IA utilise la file bilingue du tableau de bord." } : {}) };
}
