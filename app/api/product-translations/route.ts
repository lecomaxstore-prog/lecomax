import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit } from "@/lib/api-security";
import { generateProductTranslation, MAX_TRANSLATION_SOURCE, translationFingerprint } from "@/lib/product-translation";
import { ProductTranslationCache } from "@/lib/product-translation-cache";

const temporaryCache = new ProductTranslationCache();

export const runtime = "nodejs";
export const maxDuration = 60;

async function handle(req: NextRequest, generate: boolean) {
  const blocked = enforceRateLimit(req, "product-translations:read", 90, 60000);
  if (blocked) return blocked;
  const slug = req.nextUrl.searchParams.get("slug") || "";
  const locale = req.nextUrl.searchParams.get("locale") || "en";
  if (locale !== "en" && locale !== "fr") return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
  if (!slug || slug.length > 200 || !/^[\p{L}\p{N}_-]+$/u.test(slug)) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (!url || !key) return reply({ error: "Translation unavailable" }, 503);
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const { data: product, error } = await db.from("products").select("id,name,brand,description").eq("slug", slug).eq("active", true).maybeSingle();
    if (error) return reply({ error: "Catalogue unavailable" }, 503);
    if (!product) return reply({ error: "Product not found" }, 404);
    const source = (product.description || "").trim();
    if (!source || source.length > MAX_TRANSLATION_SOURCE) return reply({ status: "unavailable" });
    const hash = translationFingerprint(product.name, product.brand || "", source, locale);
    const match = { product_id: product.id, locale, source_hash: hash };
    const ready = (description: string) => reply({ status: "ready", locale, source_description: source, description });
    const temporary = temporaryCache.get(hash);
    if (temporary) return ready(temporary);
    const { data: cached, error: cacheError } = await db.from("product_translations").select("status,description,retry_after").match(match).maybeSingle();
    const missingTable = cacheError?.code === "PGRST205" || cacheError?.code === "42P01";
    if (cacheError && !missingTable) return reply({ error: "Translation storage unavailable" }, 503);
    if (cached?.status === "ready" && cached.description) return ready(cached.description);
    if (cached && Date.parse(cached.retry_after) > Date.now()) {
      return reply({ status: cached.status === "pending" ? "pending" : "unavailable", retry_after: cached.retry_after }, 202);
    }
    if (!generate) return reply({ status: "missing" });
    if (!process.env.GROQ_API_KEY) return reply({ error: "Translation unavailable" }, 503);
    const limited = enforceRateLimit(req, "product-translations:generate", 8, 60000);
    if (limited) return limited;
    const generateTemporary = () => temporaryCache.generate(hash, async () => {
      const result = await generateProductTranslation({ name: product.name, brand: product.brand || "", description: source, locale });
      return result.description;
    });
    if (missingTable) return ready(await generateTemporary());
    const { data: claimed, error: claimError } = await db.rpc("claim_product_translation", { p_product_id: product.id, p_source_hash: hash, p_locale: locale });
    if (claimError?.code === "PGRST202" || claimError?.code === "42883") return ready(await generateTemporary());
    if (claimError) return reply({ error: "Translation unavailable" }, 503);
    if (!claimed) return reply({ status: "pending" }, 202);
    try {
      const result = await generateProductTranslation({ name: product.name, brand: product.brand || "", description: source, locale });
      const { error: saveError } = await db.from("product_translations").update({ ...result, status: "ready", updated_at: new Date().toISOString() }).match(match);
      if (saveError) {
        console.error("Product translation persistence failed", saveError.code);
        await temporaryCache.generate(hash, async () => result.description);
      }
      return ready(result.description);
    } catch (generationError) {
      await db.from("product_translations").update({ status: "failed", retry_after: new Date(Date.now() + 30000).toISOString(), updated_at: new Date().toISOString() }).match(match);
      console.error("Product translation failed", generationError instanceof Error ? generationError.message : "Unknown error");
      return reply({ error: "Translation temporarily unavailable" }, 503);
    }
  } catch {
    return reply({ error: "Translation temporarily unavailable" }, 503);
  }
}

export const GET = (req: NextRequest) => handle(req, false);
// Only published catalogue data is translated; callers cannot submit arbitrary text.
export const POST = (req: NextRequest) => handle(req, true);
