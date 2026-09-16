import { publicDatabaseError } from "@/lib/public-error";
import type { NextRequest } from "next/server";
import { protectAdminRead, protectAdminMutation } from "@/lib/api-security";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CHAT_IDLE_MS } from "@/lib/chat-lifecycle";
import { checkChatSession } from "@/lib/chat-session-server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** GET /api/chat/sessions — admin: all chat sessions */
export async function GET(req: NextRequest) {
  const securityDenied = await protectAdminRead(req, { key: "chat/sessions/route.ts:GET" });
  if (securityDenied) return securityDenied;
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .order("last_at", { ascending: false });

  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });

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

  const cutoff = new Date(Date.now() - CHAT_IDLE_MS).toISOString();
  const candidates = (data || []).filter(
    (session) => session.status !== "resolved" && session.last_at <= cutoff
  );
  if (candidates.length > 0) {
    const candidateIds = candidates.map((session) => session.id);
    const { data: recentMessages, error: activityError } = await supabase
      .from("chat_messages")
      .select("session_id, body, sent_by, timestamp")
      .in("session_id", candidateIds)
      .order("timestamp", { ascending: false });

    if (activityError) return NextResponse.json({ error: "Activity unavailable" }, { status: 503 });
    for (const session of candidates) {
      const activity = (recentMessages || []).filter(message => message.session_id === session.id);
      const lifecycle = await checkChatSession(supabase, session, activity);
      session.status = lifecycle.status;
    }
  }
  return NextResponse.json((data || []).map((session) => ({
    ...session,
    agent_joined: joinedSessionIds.has(session.id),
  })));
}
