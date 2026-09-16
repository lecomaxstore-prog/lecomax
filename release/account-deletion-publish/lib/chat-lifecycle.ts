export const CHAT_IDLE_MS = 3 * 60 * 1000;

export type ChatActivity = { body: string; sent_by: string; timestamp: string };
export type ChatSession = { id: string; status: string; created_at: string; last_at: string };

/** Only count time while waiting for the customer, never while they await support. */
export function chatDeadline(session: ChatSession, messages: ChatActivity[]): number | null {
  if (session.status === "resolved") return null;
  const latest = messages.filter(m => !["__AGENT_JOINED__", "__AI_RESUMED__"].includes(m.body))
    .reduce<ChatActivity | undefined>((last, message) => !last || Date.parse(message.timestamp) >= Date.parse(last.timestamp) ? message : last, undefined);
  if (latest?.sent_by === "visitor") return null;
  if (session.status === "escalated" && latest?.sent_by !== "agent") return null;
  const timestamp = Date.parse(latest?.timestamp ?? session.created_at);
  return Number.isFinite(timestamp) ? timestamp + CHAT_IDLE_MS : null;
}

export function chatExpired(session: ChatSession, messages: ChatActivity[], now = Date.now()): boolean {
  const deadline = chatDeadline(session, messages);
  return deadline !== null && now >= deadline;
}

/** An escalation acknowledgement is not a human answer to the visitor's question. */
export function pendingChatQuestion(messages: ChatActivity[]): ChatActivity | undefined {
  const latest = messages.filter(message => message.sent_by !== "ai" && message.body !== "__AGENT_JOINED__")
    .reduce<ChatActivity | undefined>((last, message) => !last || Date.parse(message.timestamp) >= Date.parse(last.timestamp) ? message : last, undefined);
  return latest?.sent_by === "visitor" ? latest : undefined;
}
