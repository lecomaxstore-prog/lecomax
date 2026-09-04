import { apiRequest } from "@/lib/api-client";

export type SupportStatus = "open" | "waiting" | "resolved";
export type SupportConversation = {
  id: string;
  subject: string;
  order_number: string | null;
  status: SupportStatus;
  last_message: string | null;
  last_message_at: string;
  customer_unread: number;
  created_at: string;
};
export type SupportMessage = {
  id: string;
  conversation_id: string;
  sender_type: "customer" | "support";
  body: string;
  client_message_id?: string | null;
  read_at?: string | null;
  created_at: string;
};

export const getSupportConversations = () => apiRequest<{ conversations: SupportConversation[] }>("/api/support/conversations", { authenticated: true });
export const getSupportConversation = (id: string) => apiRequest<{ conversation: SupportConversation; messages: SupportMessage[] }>(`/api/support/conversations/${encodeURIComponent(id)}`, { authenticated: true });
export const startSupportConversation = (input: { subject: string; message: string; order_number?: string }) => apiRequest<{ conversation: SupportConversation; message: SupportMessage }>("/api/support/conversations", { authenticated: true, method: "POST", body: JSON.stringify(input) });
export const sendSupportMessage = (id: string, body: string, clientMessageId: string) => apiRequest<{ message: SupportMessage }>(`/api/support/conversations/${encodeURIComponent(id)}/messages`, { authenticated: true, method: "POST", body: JSON.stringify({ body, client_message_id: clientMessageId }) });
