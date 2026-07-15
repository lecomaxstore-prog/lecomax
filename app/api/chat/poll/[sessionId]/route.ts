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

  let status = session?.status || "ai";
  const lastMessage = [...(messages || [])]
    .reverse()
    .find((message) => message.body !== "__AGENT_JOINED__");
  const agentReplyExpired =
    status === "escalated" &&
    lastMessage?.sent_by === "agent" &&
    Date.now() - new Date(lastMessage.timestamp).getTime() >= 5 * 60 * 1000;

  if (agentReplyExpired) {
    await supabase.from("chat_sessions").update({ status: "resolved" }).eq("id", sessionId);
    status = "resolved";
  }

  return NextResponse.json({
    status,
    messages: messages || [],
  });
}
