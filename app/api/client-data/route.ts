import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/client-data — admin summary
export async function GET(req: NextRequest) {
  // Require admin session cookie
  const cookie = req.cookies.get("admin_session")?.value;
  if (cookie !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [consentsRes, eventsRes, topPagesRes, topProductsRes] = await Promise.all([
    // Total consented sessions (active, not revoked)
    supabase
      .from("data_collection_consents")
      .select("id, session_id, consented_at, browser, os, language, timezone, referrer, ip_address, country, city", { count: "exact" })
      .is("revoked_at", null)
      .order("consented_at", { ascending: false })
      .limit(200),

    // Recent events
    supabase
      .from("client_behavioral_events")
      .select("id, session_id, event_type, path, title, product_id, product_name, category, query, extra, created_at")
      .order("created_at", { ascending: false })
      .limit(500),

    // Top pages (page_view events, grouped by path)
    supabase
      .from("client_behavioral_events")
      .select("path")
      .eq("event_type", "page_view")
      .not("path", "is", null),

    // Top products viewed
    supabase
      .from("client_behavioral_events")
      .select("product_id, product_name, category")
      .eq("event_type", "product_view")
      .not("product_id", "is", null),
  ]);

  // Aggregate top pages
  const pageMap = new Map<string, number>();
  for (const row of topPagesRes.data ?? []) {
    const p = row.path as string;
    pageMap.set(p, (pageMap.get(p) ?? 0) + 1);
  }
  const topPages = [...pageMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, views]) => ({ path, views }));

  // Aggregate top products
  const prodMap = new Map<string, { name: string; category: string; views: number }>();
  for (const row of topProductsRes.data ?? []) {
    const id = row.product_id as string;
    if (!prodMap.has(id)) {
      prodMap.set(id, { name: row.product_name ?? id, category: row.category ?? "", views: 0 });
    }
    prodMap.get(id)!.views++;
  }
  const topProducts = [...prodMap.entries()]
    .sort((a, b) => b[1].views - a[1].views)
    .slice(0, 10)
    .map(([id, v]) => ({ id, ...v }));

  // Aggregate top countries from consents
  const countryMap = new Map<string, number>();
  for (const row of consentsRes.data ?? []) {
    const c = (row.country as string | null) ?? "XX";
    countryMap.set(c, (countryMap.get(c) ?? 0) + 1);
  }
  const topCountries = [...countryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([country, sessions]) => ({ country, sessions }));

  return NextResponse.json({
    consents: consentsRes.data ?? [],
    total_consents: consentsRes.count ?? 0,
    events: eventsRes.data ?? [],
    topPages,
    topProducts,
    topCountries,
  });
}
