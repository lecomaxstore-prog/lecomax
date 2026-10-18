import { NextRequest } from "next/server";
import OpenAI from "openai";
import { readJsonLimited } from "@/lib/request-body";
import { mobileJson, mobileOwner } from "@/lib/learning-mobile-auth";
import { sensitiveRateLimit } from "@/lib/sensitive-rate-limit";
import { assertTutorContentSafe } from "@/lib/ai-tutor-security";
import { readTutorInput, tutorInstructions } from "@/lib/tutor-workspace";
import { reserveTutorBudget } from "@/lib/tutor-budget";
import {
  readTutorReply,
  tutorReplySchema,
} from "@/lecomax-learning-app/utils/tutor-contract";
import { partialTutorAnswer } from "@/lecomax-learning-app/utils/tutor-stream";
export const maxDuration = 90;
function estimatedCost(inputTokens: number, outputTokens: number) {
  const input = process.env.TUTOR_INPUT_USD_PER_MILLION?.trim();
  const output = process.env.TUTOR_OUTPUT_USD_PER_MILLION?.trim();
  if (!input || !output) return null;
  const a = Number(input),
    b = Number(output);
  return Number.isFinite(a) && Number.isFinite(b) && a >= 0 && b >= 0
    ? (inputTokens * a + outputTokens * b) / 1000000
    : null;
}
export async function POST(req: NextRequest) {
  let owner: string | null;
  try {
    owner = await mobileOwner(req);
  } catch {
    return mobileJson({ error: "UNAVAILABLE" }, 503);
  }
  if (!owner) return mobileJson({ error: "OWNER_LOGIN_REQUIRED" }, 401);
  const limited = await sensitiveRateLimit(
    req,
    "learning-mobile-tutor",
    owner,
    true,
  );
  if (limited) return limited;
  let input;
  try {
    input = readTutorInput(await readJsonLimited(req, 3_100_000));
  } catch {
    return mobileJson({ error: "INVALID_INPUT" }, 400);
  }
  try {
    if (!process.env.OPENAI_API_KEY?.trim())
      throw new Error("AI_NOT_CONFIGURED");
    const { attachment, ...textInput } = input;
    assertTutorContentSafe(JSON.stringify(textInput));
    if (attachment?.mime === "text/plain")
      assertTutorContentSafe(attachment.data);
    if (attachment && attachment.mime !== "text/plain") {
      const bytes = Buffer.from(attachment.data.split(",")[1], "base64");
      const signature =
        attachment.mime === "application/pdf"
          ? Buffer.from("%PDF-")
          : attachment.mime === "image/png"
            ? Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
            : Buffer.from([255, 216, 255]);
      if (
        bytes.length > 2_000_000 ||
        !bytes.subarray(0, signature.length).equals(signature)
      )
        throw new Error("INVALID_ATTACHMENT");
    }
    // Reserve input characters (an intentionally conservative token bound), output, and attachment allowance.
    const units =
      JSON.stringify(textInput).length + 24000 + (attachment ? 40000 : 0);
    const budget = await reserveTutorBudget(owner, units * 2); // one transient retry included
    const content: OpenAI.Responses.ResponseInputContent[] = [
      { type: "input_text", text: input.message },
    ];
    if (attachment) {
      content.push({
        type: "input_text",
        text: `Uploaded material: ${attachment.name}. Distinguish material from general knowledge.`,
      });
      if (attachment.mime.startsWith("image/"))
        content.push({
          type: "input_image",
          image_url: attachment.data,
          detail: "auto",
        });
      else if (attachment.mime === "application/pdf") {
        if (
          !Buffer.from(attachment.data.split(",")[1], "base64")
            .subarray(0, 5)
            .equals(Buffer.from("%PDF-"))
        )
          throw new Error("INVALID_ATTACHMENT");
        content.push({
          type: "input_file",
          filename: attachment.name.endsWith(".pdf")
            ? attachment.name
            : attachment.name + ".pdf",
          file_data: attachment.data,
        });
      } else
        content.push({
          type: "input_text",
          text: `UNTRUSTED DOCUMENT EXCERPT:\n${attachment.data}`,
        });
    }
    const model =
      (attachment
        ? process.env.OPENAI_TUTOR_VISION_MODEL
        : input.mode === "explain" || input.mode === "conversation"
          ? process.env.OPENAI_TUTOR_FAST_MODEL
          : process.env.OPENAI_TUTOR_REASONING_MODEL
      )?.trim() ||
      process.env.OPENAI_TEACHER_MODEL?.trim() ||
      "gpt-6-astra";
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 1,
      timeout: 70000,
    });
    const parameters = {
      model,
      store: false,
      instructions: tutorInstructions(input),
      input: [...input.history, { role: "user" as const, content }],
      max_output_tokens: 8000,
      text: {
        format: {
          type: "json_schema" as const,
          name: "academy_tutor",
          strict: true,
          schema: tutorReplySchema as Record<string, unknown>,
        },
      },
    };
    const signal = AbortSignal.any([req.signal, AbortSignal.timeout(75000)]);
    if (req.headers?.get("accept") === "application/x-ndjson") {
      const provider = await client.responses.create(
        { ...parameters, stream: true },
        { signal },
      );
      const encoder = new TextEncoder();
      let cancelled = false;
      return new Response(
        new ReadableStream({
          async start(controller) {
            const emit = (value: unknown) =>
              controller.enqueue(encoder.encode(JSON.stringify(value) + "\n"));
            let json = "",
              lastAnswer = "",
              completed = false;
            try {
              for await (const event of provider) {
                if (event.type === "response.output_text.delta") {
                  json += event.delta;
                  if (json.length > 60000)
                    throw new Error("INVALID_AI_RESPONSE");
                  const answer = partialTutorAnswer(json);
                  if (!cancelled && answer.length - lastAnswer.length >= 120) {
                    assertTutorContentSafe(answer);
                    emit({ type: "partial", answer });
                    lastAnswer = answer;
                  }
                }
                if (event.type === "response.completed") {
                  const reply = readTutorReply(JSON.parse(json));
                  assertTutorContentSafe(json);
                  const usage = event.response.usage;
                  if (!cancelled)
                    emit({
                      type: "complete",
                      reply,
                      model: event.response.model,
                      usage: {
                        inputTokens: usage?.input_tokens ?? 0,
                        outputTokens: usage?.output_tokens ?? 0,
                        estimatedUSD: usage
                          ? estimatedCost(
                              usage.input_tokens,
                              usage.output_tokens,
                            )
                          : null,
                        ...budget,
                      },
                    });
                  console.info("tutor_usage", {
                    model: event.response.model,
                    inputTokens: usage?.input_tokens,
                    outputTokens: usage?.output_tokens,
                  });
                  completed = true;
                }
                if (
                  event.type === "response.failed" ||
                  event.type === "response.incomplete" ||
                  event.type === "error"
                )
                  throw new Error("PROVIDER_UNAVAILABLE");
              }
              if (!completed) throw new Error("INVALID_AI_RESPONSE");
            } catch {
              if (!signal.aborted && !cancelled)
                emit({ type: "error", error: "TEACHER_UNAVAILABLE" });
            } finally {
              provider.controller.abort();
              if (!cancelled) controller.close();
            }
          },
          cancel() {
            cancelled = true;
            provider.controller.abort();
          },
        }),
        {
          headers: {
            "Content-Type": "application/x-ndjson",
            "Cache-Control": "private, no-store",
            "X-Accel-Buffering": "no",
          },
        },
      );
    }
    const response = await client.responses.create(parameters, { signal });
    if (response.status !== "completed" || !response.output_text)
      throw new Error("INVALID_AI_RESPONSE");
    const reply = readTutorReply(JSON.parse(response.output_text));
    assertTutorContentSafe(response.output_text);
    const usage = response.usage;
    const estimatedUSD = usage
      ? estimatedCost(usage.input_tokens, usage.output_tokens)
      : null;
    // No prompts, uploaded material, names, or conversation text in logs.
    console.info("tutor_usage", {
      model: response.model,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
      estimatedUSD,
    });
    return mobileJson({
      reply,
      model: response.model,
      usage: {
        inputTokens: usage?.input_tokens ?? 0,
        outputTokens: usage?.output_tokens ?? 0,
        estimatedUSD,
        ...budget,
      },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const allowed = [
      "USAGE_LIMIT",
      "BUDGET_UNAVAILABLE",
      "AI_NOT_CONFIGURED",
      "INVALID_AI_RESPONSE",
      "INVALID_ATTACHMENT",
      "SENSITIVE_CONTENT",
    ];
    console.warn("tutor_failure", {
      code: allowed.includes(code) ? code : "PROVIDER_UNAVAILABLE",
    });
    return mobileJson(
      { error: allowed.includes(code) ? code : "TEACHER_UNAVAILABLE" },
      code === "USAGE_LIMIT"
        ? 429
        : ["INVALID_ATTACHMENT", "SENSITIVE_CONTENT"].includes(code)
          ? 400
          : 503,
    );
  }
}
