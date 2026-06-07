import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

  const [{ data: views }, { data: orders }, { data: todayViews }, { data: recentViews }] = await Promise.all([
    supabase.from("page_views").select("path, referrer, user_agent, created_at").gte("created_at", sinceISO).order("created_at"),
    supabase.from("orders").select("total, status, customer, created_at").gte("created_at", sinceISO),
    supabase.from("page_views").select("user_agent, created_at").gte("created_at", today.toISOString()),
    supabase.from("page_views").select("path, referrer, user_agent, created_at").gte("created_at", thirtyMinAgo).order("created_at", { ascending: false }).limit(30),
  ]);

  return NextResponse.json({
    views: views ?? [],
    orders: orders ?? [],
    visitors_today: todayViews?.length ?? 0,
    unique_today: new Set((todayViews ?? []).map((v: { user_agent: string | null }) => v.user_agent ?? "anon")).size,
    recent_views: recentViews ?? [],
  });
}
