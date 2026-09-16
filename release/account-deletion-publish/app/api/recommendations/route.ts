import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { enforceRateLimit } from "@/lib/api-security";

type ProductRow = {
  slug: string;
  category: string | null;
  stock: number | null;
  featured: boolean | null;
  created_at: string | null;
};

type MetricRow = {
  day: string;
  product_id: string;
  category: string | null;
  product_views: number;
  cart_adds: number;
  checkout_starts: number;
  purchases: number;
};

type EventRow = {
  event_type: string;
  product_id: string | null;
  category: string | null;
  extra: unknown;
  created_at: string;
};

const SESSION_PATTERN = /^[a-zA-Z0-9_-]{8,100}$/;

function ageInDays(value: string | null) {
  if (!value) return 365;
  return Math.max(0, (Date.now() - new Date(value).getTime()) / 86_400_000);
}

function productIdsFromEvent(event: EventRow) {
  const ids = new Set<string>();
  if (event.product_id) ids.add(event.product_id);
  if (event.extra && typeof event.extra === "object" && "items" in event.extra) {
    const items = Array.isArray((event.extra as { items?: unknown }).items)
      ? (event.extra as { items: unknown[] }).items.slice(0, 30)
      : [];
    for (const item of items) {
      if (item && typeof item === "object" && typeof (item as { product_id?: unknown }).product_id === "string") {
        ids.add((item as { product_id: string }).product_id);
      }
    }
  }
  return [...ids];
}

function selectDiverse(ranked: Array<{ product: ProductRow; score: number }>, limit: number) {
  const selected: ProductRow[] = [];
  const selectedSlugs = new Set<string>();
  const categoryCounts = new Map<string, number>();
  const categoryQuota = Math.max(2, Math.ceil(limit / 3));

  for (const entry of ranked) {
    const category = entry.product.category || "autres";
    if ((categoryCounts.get(category) || 0) >= categoryQuota) continue;
    selected.push(entry.product);
    selectedSlugs.add(entry.product.slug);
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    if (selected.length >= limit) return selected;
  }
  for (const entry of ranked) {
    if (selectedSlugs.has(entry.product.slug)) continue;
    selected.push(entry.product);
    if (selected.length >= limit) break;
  }
  return selected;
}

export async function GET(request: NextRequest) {
  const blocked = enforceRateLimit(request, "products:recommendations", 120, 60_000);
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get("limit") || 40);
  const limit = Number.isInteger(requestedLimit) ? Math.min(80, Math.max(4, requestedLimit)) : 40;
  const requestedSession = searchParams.get("mode") === "personalized"
    ? request.headers.get("x-lecomax-session") || ""
    : "";
  const sessionId = SESSION_PATTERN.test(requestedSession) ? requestedSession : null;
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const supabase = createServerSupabaseClient(2500);

  const [productsResult, metricsResult] = await Promise.all([
    supabase
      .from("products")
      .select("slug,category,stock,featured,created_at")
      .eq("active", true)
      .limit(300),
    supabase
      .from("product_intelligence_daily")
      .select("day,product_id,category,product_views,cart_adds,checkout_starts,purchases")
      .gte("day", since)
      .limit(5000),
  ]);

  if (productsResult.error) {
    return NextResponse.json({ error: "Recommendations unavailable" }, { status: 503 });
  }

  const products = (productsResult.data || []) as ProductRow[];
  const metrics = metricsResult.error ? [] : (metricsResult.data || []) as MetricRow[];
  const trendScores = new Map<string, number>();
  for (const metric of metrics) {
    const recency = Math.pow(0.94, ageInDays(metric.day));
    const views = Number(metric.product_views) || 0;
    const carts = Number(metric.cart_adds) || 0;
    const starts = Number(metric.checkout_starts) || 0;
    const purchases = Number(metric.purchases) || 0;
    const conversionQuality = ((purchases * 3 + carts) / (views + 12)) * 10;
    const score = (views * 0.5 + carts * 5 + starts * 2 + purchases * 18 + conversionQuality) * recency;
    trendScores.set(metric.product_id, (trendScores.get(metric.product_id) || 0) + score);
  }

  let personalEvents: EventRow[] = [];
  if (sessionId) {
    const { data: consent } = await supabase
      .from("data_collection_consents")
      .select("id")
      .eq("session_id", sessionId)
      .is("revoked_at", null)
      .maybeSingle();
    if (consent) {
      const eventSince = new Date(Date.now() - 90 * 86_400_000).toISOString();
      const { data } = await supabase
        .from("client_behavioral_events")
        .select("event_type,product_id,category,extra,created_at")
        .eq("session_id", sessionId)
        .gte("created_at", eventSince)
        .order("created_at", { ascending: false })
        .limit(250);
      personalEvents = (data || []) as EventRow[];
    }
  }

  const personalProducts = new Map<string, number>();
  const personalCategories = new Map<string, number>();
  const eventWeights: Record<string, number> = {
    product_view: 3,
    cart_add: 12,
    checkout_start: 16,
    checkout_complete: 35,
  };
  for (const event of personalEvents) {
    const weight = eventWeights[event.event_type] || 0;
    if (!weight) continue;
    const recency = Math.pow(0.97, ageInDays(event.created_at));
    for (const productId of productIdsFromEvent(event)) {
      personalProducts.set(productId, (personalProducts.get(productId) || 0) + weight * recency);
    }
    if (event.category) {
      personalCategories.set(event.category, (personalCategories.get(event.category) || 0) + weight * 0.45 * recency);
    }
  }

  const ranked = products
    .filter((product) => product.stock === null || product.stock > 0)
    .map((product) => {
      const trend = Math.log1p(trendScores.get(product.slug) || 0) * 8;
      const personal = (personalProducts.get(product.slug) || 0) * 1.25
        + (personalCategories.get(product.category || "") || 0);
      const freshness = Math.max(0, 8 - ageInDays(product.created_at) / 5);
      const quality = product.featured ? 4 : 0;
      return { product, score: trend + personal + freshness + quality };
    })
    .sort((a, b) => b.score - a.score || a.product.slug.localeCompare(b.product.slug));

  const recommendations = selectDiverse(ranked, limit);
  const personalized = personalEvents.length > 0;
  return NextResponse.json(
    {
      slugs: recommendations.map((product) => product.slug),
      strategy: personalized ? "personalized" : metrics.length > 0 ? "trending" : "catalogue",
      generated_at: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": personalized ? "private, no-store" : "public, s-maxage=300, stale-while-revalidate=900",
      },
    },
  );
}
