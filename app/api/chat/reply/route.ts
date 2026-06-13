import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** POST /api/chat/reply — admin sends a reply to a session */
export async function POST(req: Request) {
  const { session_id, body } = await req.json();
  if (!session_id || !body?.trim()) {
    return NextResponse.json({ error: "session_id and body required" }, { status: 400 });
  }

  const { error } = await supabase.from("chat_messages").insert({
    session_id,
    direction: "out",
    body: body.trim(),
    sent_by: "agent",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("chat_sessions").update({
    last_message: body.trim(),
    last_at: new Date().toISOString(),
  }).eq("id", session_id);

  return NextResponse.json({ ok: true });
}
