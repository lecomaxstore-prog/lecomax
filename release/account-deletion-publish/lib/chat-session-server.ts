import type { SupabaseClient } from "@supabase/supabase-js";
import { chatDeadline, chatExpired, type ChatActivity, type ChatSession } from "./chat-lifecycle";

export async function checkChatSession(db: SupabaseClient, session: ChatSession, knownMessages?: ChatActivity[]) {
  let messages = knownMessages;
  if (!messages) {
    const result = await db.from("chat_messages").select("body, sent_by, timestamp")
      .eq("session_id", session.id).order("timestamp", { ascending: false }).limit(20);
    if (result.error) throw result.error;
    messages = result.data || [];
  }
  if (chatExpired(session, messages)) {
    // Compare the activity version so a concurrent reply cannot be overwritten.
    const { data, error } = await db.from("chat_sessions")
      .update({ status: "resolved", unread_count: 0 })
      .eq("id", session.id).eq("status", session.status).eq("last_at", session.last_at)
      .select("id").maybeSingle();
    if (error) throw error;
    if (data) return { status: "resolved", expired: true, expires_at: null };
    // Another request changed the session while expiry was being checked.
    // Never send the old elapsed deadline back to the client in that case.
    const { data: current, error: refreshError } = await db.from("chat_sessions")
      .select("status").eq("id", session.id).single();
    if (refreshError) throw refreshError;
    return { status: current.status, expired: false, expires_at: null };
  }
  const deadline = chatDeadline(session, messages);
  return { status: session.status, expired: false, expires_at: deadline === null ? null : new Date(deadline).toISOString() };
}
