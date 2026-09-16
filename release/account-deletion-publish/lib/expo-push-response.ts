export type ExpoTicket = { status: "ok"; id: string } | { status: "error"; details?: { error?: string } };

/** Never count a missing/malformed Expo response as successful delivery. */
export function parseExpoTickets(payload: unknown, expected: number): ExpoTicket[] {
  const data = (payload as { data?: unknown } | null)?.data;
  if (!Array.isArray(data) || data.length !== expected || data.some(ticket =>
    !ticket || (ticket.status !== "ok" && ticket.status !== "error") ||
    (ticket.status === "ok" && (typeof ticket.id !== "string" || !ticket.id))
  )) throw new Error("EXPO_INVALID_TICKETS");
  return data;
}
