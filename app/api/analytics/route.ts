import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type SessionViewRow = {
  session_id: string;
  path: string;
  referrer: string | null;
  user_agent: string | null;
  created_at: string;
};

function groupBySessions(rows: SessionViewRow[]) {
  const map: Record<string, SessionViewRow[]> = {};
  for (const row of rows) {
    if (!map[row.session_id]) map[row.session_id] = [];
    map[row.session_id].push(row);
  }
  return Object.entries(map)
    .map(([session_id, pages]) => {
      const sorted = [...pages].sort((a, b) => a.created_at.localeCompare(b.created_at));
      return {
        session_id,
        pages: sorted.map((p) => ({ path: p.path, created_at: p.created_at })),
        user_agent: sorted[0].user_agent,
        referrer: sorted[0].referrer,
        started_at: sorted[0].created_at,
        ended_at: sorted[sorted.length - 1].created_at,
        page_count: sorted.length,
      };
    })
    .sort((a, b) => b.started_at.localeCompare(a.started_at));
}

// GET /api/analytics?days=30
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const [{ data: views }, { data: orders }, { data: todayViews }, { data: recentViews }, { data: sessionViews }] = await Promise.all([
    supabase.from("page_views").select("path, referrer, user_agent, created_at").gte("created_at", sinceISO).order("created_at"),
    supabase.from("orders").select("total, status, customer, created_at").gte("created_at", sinceISO),
    supabase.from("page_views").select("user_agent, created_at").gte("created_at", today.toISOString()),
    supabase.from("page_views").select("path, referrer, user_agent, created_at").gte("created_at", thirtyMinAgo).order("created_at", { ascending: false }).limit(30),
    // session_id column — returns [] gracefully if column doesn't exist yet
    supabase.from("page_views").select("session_id, path, referrer, user_agent, created_at").gte("created_at", sinceISO).not("session_id", "is", null).order("created_at").limit(1000),
  ]);

  return NextResponse.json({
    views: views ?? [],
    orders: orders ?? [],
    visitors_today: todayViews?.length ?? 0,
    unique_today: new Set((todayViews ?? []).map((v: { user_agent: string | null }) => v.user_agent ?? "anon")).size,
    recent_views: recentViews ?? [],
    sessions: groupBySessions((sessionViews ?? []) as SessionViewRow[]),
  });
}
