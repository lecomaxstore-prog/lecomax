import "server-only";
import OpenAI from "openai";
import type { AIMessage } from "./openai-server";

/** Courses are consumed atomically: require a completed JSON response, not a chat stream. */
export async function generateTutorCourse(instructions: string, message: string, signal: AbortSignal, model: string) {
  if (!process.env.OPENAI_API_KEY?.trim()) throw new Error('AI_NOT_CONFIGURED');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 180_000, maxRetries: 0 });
  const response = await client.responses.create({
    model, instructions, input: [{ role: 'user', content: message }],
    stream: false, store: false, reasoning: { effort: 'low' }, max_output_tokens: 12000,
    text: { format: { type: 'json_object' } },
  }, { signal });
  if (response.status !== 'completed' || !response.output_text?.trim()) throw new Error('INCOMPLETE_COURSE');
  if (response.output_text.length > 30000) throw new Error('RESPONSE_TOO_LARGE');
  return { answer: response.output_text, model: response.model };
}

/** Uses the existing OpenAI server configuration; no provider state or tools. */
export async function streamTutorReply(instructions: string, messages: AIMessage[], signal: AbortSignal, options?: { model: string; reasoning: 'low' | 'medium'; maxOutputTokens: number }) {
  if (!process.env.OPENAI_API_KEY?.trim()) throw new Error("AI_NOT_CONFIGURED");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 70_000, maxRetries: 0 });
  return client.responses.create({
    model: options?.model || process.env.OPENAI_MODEL?.trim() || "gpt-6-sol",
    ...(options ? { reasoning: { effort: options.reasoning } } : {}),
    instructions, input: messages, stream: true, store: false, max_output_tokens: options?.maxOutputTokens ?? 4000,
  }, { signal });
}
