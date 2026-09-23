import { apiRequest } from "@/lib/api-client";

export type Recommendation = {
  productSlug: string;
  productName?: string;
  productPrice?: number;
  reason: string;
};
export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
  recommendations?: Recommendation[];
};
export type AssistantResponse = {
  sessionId?: string;
  message?: string;
  recommendations?: Recommendation[];
};

/** GPT-6 runs on our server; no provider credentials belong in the app. */
export function askAssistant(messages: AssistantMessage[], sessionId?: string) {
  return apiRequest<AssistantResponse>("/api/assistant", {
    method: "POST",
    timeoutMs: 60_000,
    // Keep complete recent turns within the API's 30-message limit.
    body: JSON.stringify({ sessionId, messages: messages.slice(-29), platform: "mobile_app" }),
  });
}
