import { apiRequest } from "@/lib/api-client";
import { uploadFile } from "@/lib/upload-file";
import type { DocumentPickerAsset } from 'expo-document-picker';

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
  attachment?: { name: string; type: string; size: number; url: string | null };
  id: string;
  conversation_id: string;
  sender_type: "customer" | "support";
  body: string;
  client_message_id?: string | null;
  read_at?: string | null;
  created_at: string;
};

export const createSupportMessageId = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
  const value = Math.floor(Math.random() * 16);
  return (character === "x" ? value : (value & 3) | 8).toString(16);
});

export const getSupportConversations = () => apiRequest<{ conversations: SupportConversation[] }>("/api/support/conversations", { authenticated: true });
export const getSupportConversation = (id: string) => apiRequest<{ conversation: SupportConversation; messages: SupportMessage[] }>(`/api/support/conversations/${encodeURIComponent(id)}`, { authenticated: true });
export const startSupportConversation = (input: { subject: string; message: string; order_number?: string; client_message_id: string }) => apiRequest<{ conversation: SupportConversation; message: SupportMessage }>("/api/support/conversations", { authenticated: true, method: "POST", body: JSON.stringify(input) });
export const sendSupportMessage = (id: string, body: string, clientMessageId: string) => apiRequest<{ message: SupportMessage }>(`/api/support/conversations/${encodeURIComponent(id)}/messages`, { authenticated: true, method: "POST", body: JSON.stringify({ body, client_message_id: clientMessageId }) });

export function sendSupportAttachment(id: string, body: string, clientMessageId: string, asset: DocumentPickerAsset) {
  const form = new FormData();
  form.append('body', body);
  form.append('client_message_id', clientMessageId);
  form.append('file', uploadFile(asset), asset.name);
  return apiRequest<{ message: SupportMessage }>(`/api/support/conversations/${encodeURIComponent(id)}/messages`, { authenticated: true, method: 'POST', body: form, timeoutMs: 30_000 });
}
