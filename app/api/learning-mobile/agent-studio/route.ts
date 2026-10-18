import { NextRequest } from "next/server";
import { mobileOwner, mobileJson } from "@/lib/learning-mobile-auth";
import { readJsonLimited } from "@/lib/request-body";
import { sensitiveRateLimit } from "@/lib/sensitive-rate-limit";
import { assertTutorContentSafe } from "@/lib/ai-tutor-security";
import {
  runStudioModel,
  type ProviderResponse,
} from "@/lib/agent-studio-runtime";
import { validateConfig } from "@/lecomax-learning-app/features/agent-studio/core";
export const maxDuration = 30;
export async function POST(req: NextRequest) {
  let owner: string | null;
  try {
    owner = await mobileOwner(req);
  } catch {
    return mobileJson({ error: "Authentication service unavailable." }, 503);
  }
  if (!owner)
    return mobileJson(
      { error: "Sign in as the learning owner to run live AI." },
      401,
    );
  const limited = await sensitiveRateLimit(req, "agent-studio", owner, true);
  if (limited) return limited;
  let config, input: string, document: string;
  try {
    const body = (await readJsonLimited(req, 60000)) as {
      config: unknown;
      input: string;
      document: string;
      consent: boolean;
    };
    if (
      !body ||
      body.consent !== true ||
      typeof body.input !== "string" ||
      !body.input.trim() ||
      body.input.length > 1000 ||
      typeof body.document !== "string" ||
      body.document.length > 12000
    )
      throw Error("INVALID_INPUT");
    config = validateConfig(body.config);
    input = body.input;
    document = body.document;
    assertTutorContentSafe(JSON.stringify(body));
  } catch {
    return mobileJson(
      {
        error:
          "Check the configuration, content limits and explicit sharing consent. Do not include secrets.",
      },
      400,
    );
  }
  if (process.env.AGENT_STUDIO_LIVE_ENABLED !== "true")
    return mobileJson(
      {
        error:
          "Live Studio is disabled on this server. Local testing remains available.",
      },
      503,
    );
  const key = process.env.OPENAI_API_KEY?.trim(),
    model = process.env.OPENAI_MODEL?.trim();
  if (!key || !model)
    return mobileJson(
      { error: "Configure OPENAI_API_KEY and OPENAI_MODEL on the server." },
      503,
    );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 22000);
  const cancel = () => controller.abort();
  req.signal.addEventListener("abort", cancel, { once: true });
  try {
    const run = await runStudioModel(
      config,
      input,
      document,
      model,
      async (body) => {
        let response: Response;
        try {
          response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            signal: controller.signal,
            cache: "no-store",
          });
        } catch {
          throw Error(
            controller.signal.aborted ? "TIMEOUT" : "PROVIDER_NETWORK",
          );
        }
        if (!response.ok)
          throw Error(
            response.status === 401
              ? "PROVIDER_AUTH"
              : response.status === 429
                ? "PROVIDER_RATE_LIMIT"
                : "PROVIDER_ERROR",
          );
        return (await response.json()) as ProviderResponse;
      },
    );
    assertTutorContentSafe(JSON.stringify(run));
    const inRate = Number(process.env.AGENT_STUDIO_INPUT_USD_PER_MILLION),
      outRate = Number(process.env.AGENT_STUDIO_OUTPUT_USD_PER_MILLION);
    if (
      run.status === "complete" &&
      run.inputTokens !== undefined &&
      run.outputTokens !== undefined &&
      process.env.AGENT_STUDIO_INPUT_USD_PER_MILLION &&
      process.env.AGENT_STUDIO_OUTPUT_USD_PER_MILLION &&
      Number.isFinite(inRate) &&
      Number.isFinite(outRate) &&
      inRate >= 0 &&
      outRate >= 0
    )
      run.costUSD =
        (run.inputTokens * inRate + run.outputTokens * outRate) / 1000000;
    return mobileJson({ run });
  } catch {
    return mobileJson(
      {
        error:
          "The result could not be returned safely. No successful run is claimed.",
      },
      503,
    );
  } finally {
    clearTimeout(timer);
    req.signal.removeEventListener("abort", cancel);
  }
}
