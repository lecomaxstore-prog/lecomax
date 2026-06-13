import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** POST /api/chat/start — create or resume a session for a visitor */
export async function POST(req: Request) {
  const { visitor_id, name } = await req.json();
  if (!visitor_id) return NextResponse.json({ error: "visitor_id required" }, { status: 400 });

  // Resume existing open session
  const { data: existing } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("visitor_id", visitor_id)
    .neq("status", "resolved")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) return NextResponse.json(existing);

  // Create new session
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ visitor_id, name: name || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
