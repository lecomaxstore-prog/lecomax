import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkChatSession } from "@/lib/chat-session-server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** POST /api/chat/join — take ownership and notify the visitor. */
export async function POST(req: Request) {
  const { session_id } = await req.json();
  if (!session_id) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", session_id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }
  const lifecycle = await checkChatSession(supabase, session);
  if (lifecycle.status === "resolved") return NextResponse.json({ error: "Conversation terminée" }, { status: 409 });

  // Joining is idempotent while a conversation is already actively handled.
  // This prevents duplicate system messages when the button is tapped twice.
  if (session.status === "escalated") {
    const { data: existingJoin } = await supabase
      .from("chat_messages")
      .select("id")
      .eq("session_id", session_id)
      .eq("body", "__AGENT_JOINED__")
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingJoin) {
      return NextResponse.json({ ok: true, alreadyJoined: true });
    }
  }

  const { data: message, error: messageError } = await supabase
    .from("chat_messages")
    .insert({
      session_id,
      direction: "out",
      body: "__AGENT_JOINED__",
      sent_by: "agent",
    })
    .select()
    .single();

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("chat_sessions")
    .update({ status: "escalated", last_at: now })
    .eq("id", session_id).neq("status", "resolved");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message });
}
