import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkChatSession } from "@/lib/chat-session-server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** POST /api/chat/start — create or resume a session for a visitor */
export async function POST(req: Request) {
  const { visitor_id, name, fresh } = await req.json();
  if (typeof visitor_id !== "string" || visitor_id.length < 8 || visitor_id.length > 100) return NextResponse.json({ error: "visitor_id required" }, { status: 400 });

  if (fresh === true) {
    const { error } = await supabase.from("chat_sessions").update({ status: "resolved", unread_count: 0 })
      .eq("visitor_id", visitor_id).neq("status", "resolved");
    if (error) return NextResponse.json({ error: "Unable to close previous conversation" }, { status: 503 });
  }

  // Resume existing open session
  const { data: existing } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("visitor_id", visitor_id)
    .neq("status", "resolved")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    const lifecycle = await checkChatSession(supabase, existing);
    if (lifecycle.status !== "resolved") return NextResponse.json(existing);
  }

  // Create new session
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ visitor_id, name: name || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
