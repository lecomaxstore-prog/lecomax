import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/page-views  — track a page view (anon-friendly)
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only insert known safe columns
  const { path, referrer, user_agent, session_id } = body as Record<string, string | null>;
  const payload: Record<string, string | null> = { path, referrer, user_agent, session_id };

  const { error } = await supabase.from("page_views").insert(payload);

  if (error?.code === "42703") {
    // session_id column does not exist yet — insert without it
    // Run: ALTER TABLE page_views ADD COLUMN IF NOT EXISTS session_id text;
    const { path: p, referrer: r, user_agent: ua } = payload;
    await supabase.from("page_views").insert({ path: p, referrer: r, user_agent: ua });
  }

  return NextResponse.json({ ok: true });
}
