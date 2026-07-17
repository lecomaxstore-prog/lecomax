import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/chat/poll/[sessionId]
 * Client-side polling: returns messages for the session + current status.
 * Also resets the unread counter for the visitor's view (messages from agent).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const [{ data: session }, { data: messages }] = await Promise.all([
    supabase.from("chat_sessions").select("status, unread_count").eq("id", sessionId).single(),
    supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: true }),
  ]);

  const status = session?.status || "ai";
  const lastMessage = [...(messages || [])]
    .reverse()
    .find((message) => message.body !== "__AGENT_JOINED__" && message.body !== "__AI_RESUMED__");
  const aiTakeoverRequired =
    status === "escalated" &&
    lastMessage?.sent_by === "visitor" &&
    Date.now() - new Date(lastMessage.timestamp).getTime() >= 5 * 60 * 1000;

  return NextResponse.json({
    status,
    messages: messages || [],
    ai_takeover_required: aiTakeoverRequired,
  });
}
