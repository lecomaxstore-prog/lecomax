import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/reviews/stats  →  { [productSlug]: { rating: number; count: number } }
const getStats = unstable_cache(async () => {
  const { data, error } = await supabase.from("reviews").select("product_slug,rating");
  if (error) throw error;

  const acc: Record<string, { sum: number; count: number }> = {};
  for (const r of (data ?? []) as { product_slug: string; rating: number }[]) {
    if (!acc[r.product_slug]) acc[r.product_slug] = { sum: 0, count: 0 };
    acc[r.product_slug].sum += r.rating;
    acc[r.product_slug].count++;
  }

  const stats = Object.fromEntries(
    Object.entries(acc).map(([slug, { sum, count }]) => [
      slug,
      { rating: Math.round((sum / count) * 10) / 10, count },
    ])
  );

  return stats;
}, ["public-review-stats-v1"], { revalidate: 60, tags: ["storefront-reviews"] });

export async function GET() {
  let stats;
  try { stats = await getStats(); }
  catch { return NextResponse.json({}, { status: 500 }); }
  return NextResponse.json(stats, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
