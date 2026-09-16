import { ownsChat } from "@/lib/chat-ownership";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkChatSession } from "@/lib/chat-session-server";
import { pendingChatQuestion } from "@/lib/chat-lifecycle";

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
  if (!(await ownsChat(_req, supabase, sessionId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [{ data: session, error: sessionError }, { data: messages, error: messageError }] = await Promise.all([
    supabase.from("chat_sessions").select("id, status, created_at, last_at").eq("id", sessionId).single(),
    supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: true }),
  ]);

  if (sessionError || !session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (messageError) return NextResponse.json({ error: "Messages unavailable" }, { status: 503 });
  const lifecycle = await checkChatSession(supabase, session, messages || []);
  const status = lifecycle.status;
  const lastMessage = pendingChatQuestion(messages || []);
  const aiTakeoverRequired =
    status === "escalated" &&
    lastMessage?.sent_by === "visitor" &&
    Date.now() - new Date(lastMessage.timestamp).getTime() >= 5 * 60 * 1000;

  return NextResponse.json({
    status,
    expired: lifecycle.expired,
    expires_at: lifecycle.expires_at,
    messages: messages || [],
    ai_takeover_required: aiTakeoverRequired,
  }, { headers: { "Cache-Control": "no-store" } });
}
