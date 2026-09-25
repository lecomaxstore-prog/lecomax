import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit } from "@/lib/api-security";
import { ensureProductTranslation } from "@/lib/product-translation-store";

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
    // Reads remain available even when the generation rate limit is reached.
    const existing = await ensureProductTranslation(db, product, locale, false);
    if (existing.status !== "missing" || !generate) return reply(existing, existing.status === "pending" ? 202 : 200);
    const limited = enforceRateLimit(req, "product-translations:generate", 8, 60000);
    if (limited) return limited;
    const result = await ensureProductTranslation(db, product, locale);
    return reply(result, result.status === "pending" ? 202 : 200);
  } catch (error) {
    console.error("Product translation failed", error instanceof Error ? error.message : "Unknown error");
    return reply({ error: "Translation temporarily unavailable" }, 503);
  }
}

export const GET = (req: NextRequest) => handle(req, false);
// Only published catalogue data is translated; callers cannot submit arbitrary text.
export const POST = (req: NextRequest) => handle(req, true);
