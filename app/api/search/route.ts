import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rankProducts, recommendedProducts, type SearchableProduct } from "@/lib/product-search";
import { enforceRateLimit } from "@/lib/api-security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SEARCH_FIELDS = "id,slug,name,brand,category,price,original_price,description,images,tags,featured,stock,created_at";

export async function GET(request: NextRequest) {
  const blocked = enforceRateLimit(request, "products:search", 120, 60_000);
  if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim().slice(0, 80);
  const requestedLimit = Number(searchParams.get("limit") || 12);
  const limit = Number.isInteger(requestedLimit) ? Math.min(24, Math.max(1, requestedLimit)) : 12;

  const { data, error } = await supabase
    .from("products")
    .select(SEARCH_FIELDS)
    .eq("active", true)
    .limit(250);

  if (error) {
    return NextResponse.json({ error: "La recherche est momentanément indisponible." }, { status: 500 });
  }

  const products = (data ?? []) as SearchableProduct[];
  const ranked = query ? rankProducts(products, query) : recommendedProducts(products);
  const results = ranked.slice(0, limit);
  const suggestions = Array.from(new Set(
    results.flatMap((product) => [product.brand, product.category, ...(product.tags || [])])
      .filter((value): value is string => Boolean(value && value.trim())),
  )).slice(0, 8);

  return NextResponse.json(
    { results, suggestions, total: ranked.length, query },
    { headers: { "Cache-Control": query ? "no-store" : "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
