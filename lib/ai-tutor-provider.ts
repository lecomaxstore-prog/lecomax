import "server-only";
import OpenAI from "openai";
import type { AIMessage } from "./openai-server";

/** Uses the existing OpenAI server configuration; no provider state or tools. */
export async function streamTutorReply(instructions: string, messages: AIMessage[], signal: AbortSignal) {
  if (!process.env.OPENAI_API_KEY?.trim()) throw new Error("AI_NOT_CONFIGURED");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 70_000, maxRetries: 0 });
  return client.responses.create({
    model: process.env.OPENAI_MODEL?.trim() || "gpt-6-sol",
    instructions, input: messages, stream: true, store: false, max_output_tokens: 4000,
  }, { signal });
}
