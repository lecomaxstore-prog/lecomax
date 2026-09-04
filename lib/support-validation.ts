export const SUPPORT_MESSAGE_MAX_LENGTH = 2_000;
export const SUPPORT_SUBJECT_MAX_LENGTH = 120;

export type SupportStatus = "open" | "waiting" | "resolved";

export function cleanSupportText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim().slice(0, maxLength);
}

export function validSupportStatus(value: unknown): value is SupportStatus {
  return value === "open" || value === "waiting" || value === "resolved";
}

export function parseSupportMessage(value: unknown) {
  const body = cleanSupportText(value, SUPPORT_MESSAGE_MAX_LENGTH);
  if (!body) return { ok: false, error: "Le message ne peut pas être vide." } as const;
  return { ok: true, body } as const;
}

export function parseSupportConversation(value: unknown) {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const subject = cleanSupportText(input.subject, SUPPORT_SUBJECT_MAX_LENGTH) || "Demande d’assistance";
  const message = parseSupportMessage(input.message);
  if (!message.ok) return message;
  const orderNumber = cleanSupportText(input.order_number, 50) || null;
  return { ok: true, subject, message: message.body, orderNumber } as const;
}
