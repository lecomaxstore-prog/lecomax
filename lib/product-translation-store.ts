import type { SupabaseClient } from "@supabase/supabase-js";
import { generateProductTranslation, MAX_TRANSLATION_SOURCE, translationFingerprint, type TranslationLocale } from "./product-translation.ts";

export type TranslationProduct = { id: string; name: string; brand?: string | null; description?: string | null };
export type TranslationResult =
  | { status: "ready"; locale: TranslationLocale; source_description: string; description: string }
  | { status: "missing" | "pending" | "unavailable"; retry_after?: string };

/** Shared by the public endpoint and backfill. Never spend on AI without durable storage. */
export async function ensureProductTranslation(db: SupabaseClient, product: TranslationProduct, locale: TranslationLocale, generate = true): Promise<TranslationResult> {
  const source = (product.description ?? "").trim();
  if (!source || source.length > MAX_TRANSLATION_SOURCE) return { status: "unavailable" };
  const match = { product_id: product.id, locale, source_hash: translationFingerprint(product.name, product.brand ?? "", source, locale) };
  const ready = (description: string): TranslationResult => ({ status: "ready", locale, source_description: source, description });
  const { data: cached, error } = await db.from("product_translations").select("status,description,retry_after").match(match).maybeSingle();
  if (error) throw new Error(`Translation storage unavailable: ${error.code}`);
  if (cached?.status === "ready" && cached.description) return ready(cached.description);
  if (cached && Date.parse(cached.retry_after) > Date.now()) return { status: cached.status === "pending" ? "pending" : "unavailable", retry_after: cached.retry_after };
  if (!generate) return { status: "missing" };
  if (!process.env.OPENAI_API_KEY) throw new Error("Translation provider is not configured");
  const { data: claimed, error: claimError } = await db.rpc("claim_product_translation", { p_product_id: product.id, p_source_hash: match.source_hash, p_locale: locale });
  if (claimError) throw new Error(`Translation lease unavailable: ${claimError.code}`);
  if (!claimed) return { status: "pending" };
  let result;
  try {
    result = await generateProductTranslation({ name: product.name, brand: product.brand ?? "", description: source, locale });
  } catch (error) {
    await db.from("product_translations").update({ status: "failed", retry_after: new Date(Date.now() + 300000).toISOString(), updated_at: new Date().toISOString() }).match(match);
    throw error;
  }
  // Retry saving the SAME result, never call OpenAI again for a transient write failure.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: saved, error: saveError } = await db.from("product_translations")
      .update({ ...result, status: "ready", updated_at: new Date().toISOString() }).match(match).select("description").single();
    if (!saveError && saved?.description) return ready(saved.description);
  }
  // Keep the lease pending; do not claim that an unsaved translation is reusable.
  throw new Error("Translation persistence failed");
}
