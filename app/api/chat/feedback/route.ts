import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** POST /api/chat/feedback — client submits a rating after conversation ends */
export async function POST(req: Request) {
  const { session_id, rating, comment } = await req.json();
  if (!session_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "session_id and rating (1-5) required" }, { status: 400 });
  }

  const { error } = await supabase.from("chat_feedback").insert({
    session_id,
    rating,
    comment: comment?.trim() || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** GET /api/chat/feedback — admin fetches all feedback */
export async function GET() {
  const { data, error } = await supabase
    .from("chat_feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
