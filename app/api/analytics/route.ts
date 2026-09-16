import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

type ViewRow = {
  session_id: string | null; visitor_id: string | null; path: string; referrer: string | null;
  user_agent: string | null; created_at: string; ip_hash: string | null; ip_masked: string | null;
  country_code: string | null; region: string | null; city: string | null; device_type: string | null;
  browser: string | null; operating_system: string | null; screen_width: number | null; screen_height: number | null;
  language: string | null; timezone: string | null; latitude: number | null; longitude: number | null;
};

function groupBySessions(rows: ViewRow[]) {
  const map = new Map<string, ViewRow[]>();
  for (const row of rows) {
    const key = row.session_id || `legacy-${row.created_at}-${row.path}`;
    map.set(key, [...(map.get(key) || []), row]);
  }
  return [...map.entries()].map(([session_id, pages]) => {
    const sorted = [...pages].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const first = sorted[0];
    return {
      session_id,
      visitor_id: first.visitor_id,
      pages: sorted.map((page) => ({ path: page.path, created_at: page.created_at })),
      user_agent: first.user_agent,
      referrer: first.referrer,
      started_at: first.created_at,
      ended_at: sorted[sorted.length - 1].created_at,
      page_count: sorted.length,
      ip_masked: first.ip_masked,
      country_code: first.country_code,
      region: first.region,
      city: first.city,
      device_type: first.device_type,
      browser: first.browser,
      operating_system: first.operating_system,
      screen_width: first.screen_width,
      screen_height: first.screen_height,
      latitude: first.latitude,
      longitude: first.longitude,
      language: first.language,
      timezone: first.timezone,
    };
  }).sort((a, b) => b.started_at.localeCompare(a.started_at));
}

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const requestedDays = Number.parseInt(new URL(req.url).searchParams.get("days") || "30", 10);
  const days = [7, 14, 30, 60, 90, 180].includes(requestedDays) ? requestedDays : 30;
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const recentSince = new Date(Date.now() - 30 * 60_000).toISOString();
  const activeSince = new Date(Date.now() - 5 * 60_000).toISOString();
  const columns = "session_id,visitor_id,path,referrer,user_agent,created_at,ip_hash,ip_masked,country_code,region,city,device_type,browser,operating_system,screen_width,screen_height,language,timezone,latitude,longitude";

  const [{ data: views, error: viewsError }, { data: orders, error: ordersError }] = await Promise.all([
    supabase.from("page_views").select(columns).gte("created_at", since).order("created_at", { ascending: false }).limit(5000),
    supabase.from("orders").select("total,status,customer,created_at").gte("created_at", since).limit(5000),
  ]);
  if (viewsError || ordersError) return NextResponse.json({ error: viewsError?.message || ordersError?.message }, { status: 500 });

  const rows = (views || []) as unknown as ViewRow[];
  const visitorKey = (row: ViewRow) => row.visitor_id || row.ip_hash || row.session_id || row.user_agent || "anonymous";
  const todayRows = rows.filter((row) => row.created_at >= today.toISOString());
  const recentRows = rows.filter((row) => row.created_at >= recentSince).slice(0, 100);
  const countries = new Map<string, number>();
  for (const row of rows) if (row.country_code) countries.set(row.country_code, (countries.get(row.country_code) || 0) + 1);

  return NextResponse.json({
    views: rows,
    orders: orders || [],
    visitors_today: new Set(todayRows.map(visitorKey)).size,
    unique_today: new Set(todayRows.map(visitorKey)).size,
    active_now: new Set(recentRows.filter((row) => row.created_at >= activeSince).map(visitorKey)).size,
    recent_views: recentRows,
    sessions: groupBySessions(rows).slice(0, 1000),
    countries: [...countries.entries()].map(([country_code, count]) => ({ country_code, count })).sort((a, b) => b.count - a.count),
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
