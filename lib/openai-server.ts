import "server-only";
import OpenAI from "openai";
import { getGroqClient } from "./groq-client";

export type AIMessage = { role: "user" | "assistant"; content: string };
type Generation = {
  instructions: string;
  messages: AIMessage[];
  maxOutputTokens?: number;
  json?: boolean;
  timeoutMs?: number;
};

/** The key and all provider calls stay on the server, including for Expo. */
export async function generateOpenAIReply(input: Generation): Promise<string> {
  if (!process.env.OPENAI_API_KEY?.trim()) throw new Error("OPENAI_NOT_CONFIGURED");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: input.timeoutMs ?? 20_000, maxRetries: 0 });
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-6-sol";
  const response = await client.responses.create({
    model,
    // Preserve the previous non-reasoning chat behavior and response-time budget.
    ...(model === "gpt-6-sol" ? { reasoning: { effort: "none" as const } } : {}),
    instructions: input.instructions,
    input: input.messages,
    max_output_tokens: Math.min(input.maxOutputTokens ?? 800, 1600),
    store: false,
    ...(input.json ? { text: { format: { type: "json_object" as const } } } : {}),
  });
  if (response.status !== "completed" || !response.output_text?.trim()) throw new Error("OPENAI_INCOMPLETE_RESPONSE");
  return response.output_text.trim();
}

/** Keep existing customer assistance available during an OpenAI outage/quota issue. */
export async function generateSupportReply(input: Generation): Promise<string> {
  try {
    return await generateOpenAIReply({ ...input, timeoutMs: 12_000 });
  } catch (error) {
    if (!process.env.GROQ_API_KEY?.trim()) throw error;
    console.warn("OpenAI customer assistance unavailable; using configured fallback.");
    const completion = await getGroqClient().chat.completions.create({
      model: "openai/gpt-oss-20b",
      reasoning_effort: "low",
      messages: [{ role: "system", content: input.instructions }, ...input.messages],
      max_tokens: Math.min(input.maxOutputTokens ?? 800, 1600),
      temperature: 0.3,
      ...(input.json ? { response_format: { type: "json_object" as const } } : {}),
    }, { timeout: 10_000, maxRetries: 0 });
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) throw new Error("AI_EMPTY_RESPONSE");
    return text;
  }
}

export function openAIErrorCode(error: unknown) {
  const value = error as { code?: string; status?: number; message?: string } | null;
  if (["credit_balance_exhausted", "insufficient_quota"].includes(value?.code ?? "")) return "AI_BILLING_REQUIRED";
  if (value?.message === "OPENAI_NOT_CONFIGURED" || value?.status === 401) return "AI_CONFIGURATION_REQUIRED";
  return "AI_UNAVAILABLE";
}
