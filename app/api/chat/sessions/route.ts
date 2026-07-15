import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** GET /api/chat/sessions — admin: all chat sessions */
export async function GET() {
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .order("last_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sessionIds = (data || []).map((session) => session.id);
  const joinedSessionIds = new Set<string>();
  if (sessionIds.length > 0) {
    const { data: joinedMessages } = await supabase
      .from("chat_messages")
      .select("session_id")
      .in("session_id", sessionIds)
      .eq("body", "__AGENT_JOINED__");
    for (const message of joinedMessages || []) joinedSessionIds.add(message.session_id);
  }

  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const candidates = (data || []).filter(
    (session) => session.status === "escalated" && session.last_at <= cutoff
  );
  if (candidates.length > 0) {
    const candidateIds = candidates.map((session) => session.id);
    const { data: recentMessages } = await supabase
      .from("chat_messages")
      .select("session_id, body, sent_by, timestamp")
      .in("session_id", candidateIds)
      .order("timestamp", { ascending: false });

    const latestBySession = new Map<string, { body: string; sent_by: string }>();
    for (const message of recentMessages || []) {
      if (message.body !== "__AGENT_JOINED__" && !latestBySession.has(message.session_id)) {
        latestBySession.set(message.session_id, message);
      }
    }
    const expiredIds = candidateIds.filter(
      (id) => latestBySession.get(id)?.sent_by === "agent"
    );
    if (expiredIds.length > 0) {
      await supabase.from("chat_sessions").update({ status: "resolved" }).in("id", expiredIds);
      const expiredSet = new Set(expiredIds);
      for (const session of data || []) {
        if (expiredSet.has(session.id)) session.status = "resolved";
      }
    }
  }
  return NextResponse.json((data || []).map((session) => ({
    ...session,
    agent_joined: joinedSessionIds.has(session.id),
  })));
}
