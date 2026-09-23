import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url);
const ts = require("typescript");

function load(file: string, deps: Record<string, unknown>, env: Record<string, string> = {}) {
  const module = { exports: {} as any };
  const source = readFileSync(new URL("../" + file, import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, {
    module, exports: module.exports, process: { env }, console: { warn() {} },
    require(id: string) { if (id === "server-only") return {}; if (id in deps) return deps[id]; throw new Error("Unexpected dependency: " + id); },
  });
  return module.exports;
}

function provider({ fail = false, empty = false, key = true, fallback = true } = {}) {
  const calls: any[] = [];
  let fallbacks = 0;
  const service = load("lib/openai-server.ts", {
    openai: class {
      constructor(options: unknown) { calls.push(options); }
      responses = { create: async (input: unknown) => { calls.push(input); if (fail) throw { status: 429, code: "credit_balance_exhausted" }; return { status: empty ? "incomplete" : "completed", output_text: empty ? "" : "  Explained.  " }; } };
    },
    "./groq-client": { getGroqClient: () => ({ chat: { completions: { create: async (input: unknown) => { fallbacks++; calls.push(input); return { choices: [{ message: { content: "Fallback answer" } }] }; } } } }) },
  }, { ...(key ? { OPENAI_API_KEY: "test-key" } : {}), ...(fallback ? { GROQ_API_KEY: "test-fallback" } : {}) });
  return { service, calls, fallbacks: () => fallbacks };
}
const input = { instructions: "Explain", messages: [{ role: "user", content: "What is React?" }], maxOutputTokens: 500, json: true };

test("OpenAI uses server credentials, bounded generation and disabled response storage", async () => {
  const h = provider();
  assert.equal(await h.service.generateSupportReply(input), "Explained.");
  assert.equal(h.calls[0].apiKey, "test-key");
  assert.equal(h.calls[0].timeout, 12000);
  assert.equal(h.calls[0].maxRetries, 0);
  assert.equal(h.calls[1].store, false);
  assert.equal(h.calls[1].model, "gpt-6-sol");
  assert.equal(h.calls[1].reasoning.effort, "none");
  assert.equal(h.calls[1].max_output_tokens, 500);
  assert.equal(h.calls[1].text.format.type, "json_object");
  assert.equal(h.fallbacks(), 0);
});

test("customer assistance falls back on quota failure but the tutor reports billing", async () => {
  const h = provider({ fail: true });
  assert.equal(await h.service.generateSupportReply(input), "Fallback answer");
  assert.equal(h.fallbacks(), 1);
  await assert.rejects(h.service.generateOpenAIReply(input), (error: unknown) => h.service.openAIErrorCode(error) === "AI_BILLING_REQUIRED");
  assert.equal(h.fallbacks(), 1);
});

test("missing keys and incomplete responses never masquerade as working OpenAI", async () => {
  const missing = provider({ key: false, fallback: false });
  await assert.rejects(missing.service.generateSupportReply(input), /OPENAI_NOT_CONFIGURED/);
  assert.equal(missing.calls.length, 0);
  await assert.rejects(provider({ empty: true }).service.generateOpenAIReply(input), /OPENAI_INCOMPLETE_RESPONSE/);
});

function tutor({ denied = false, limited = false, fail = false } = {}) {
  const calls: any[] = [];
  let read = false;
  const route = load("app/api/admin/learning-assistant/route.ts", {
    "next/server": { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } },
    "@/lib/dev-docs-access": { protectSourceBrowser: async () => denied ? Response.json({}, { status: 403 }) : null },
    "@/lib/api-security": { protectAdminMutation: async () => null },
    "@/lib/sensitive-rate-limit": { sensitiveRateLimit: async () => limited ? Response.json({}, { status: 429 }) : null },
    "@/lib/request-body": { readJsonLimited: (request: Request) => { read = true; return request.json(); } },
    "@/lib/openai-server": { generateOpenAIReply: async (input: unknown) => { calls.push(input); if (fail) throw new Error("private provider details"); return "One idea and one exercise."; }, openAIErrorCode: () => "AI_BILLING_REQUIRED" },
    "@/app/admin/how-it-was-built/course/daily-lessons": { DAILY_LESSONS: [{ id: "website", title: ["Site", "Website", "موقع"], idea: ["navigateur", "browser", "متصفح"], example: ["exemple", "example", "مثال"], task: ["essai", "try", "جرّب"], file: "app/page.tsx" }], dailyText: (lang: string, values: string[]) => values[lang === "en" ? 1 : lang === "ar" ? 2 : 0] },
  });
  return { calls, read: () => read, run: (body: unknown) => route.POST(new Request("https://example.test/api/admin/learning-assistant", { method: "POST", body: JSON.stringify(body) })) };
}
const question = { lang: "en", lessonId: "website", messages: [{ role: "user", content: "Explain this lesson", extra: "discard" }] };

test("tutor explains Next.js in Darija or Arabic independently of the panel language", async () => {
  for (const [replyLanguage, expected] of [["darija", /Moroccan Darija written in Arabic script/], ["ar", /clear Modern Standard Arabic/]] as const) {
    const h = tutor();
    assert.equal((await h.run({ ...question, replyLanguage })).status, 200);
    assert.match(h.calls[0].instructions, expected);
    assert.match(h.calls[0].instructions, /Next.js App Router/);
    assert.match(h.calls[0].instructions, /lines step by step/);
    assert.match(h.calls[0].instructions, /do not add a quiz/);
  }
  const invalid = tutor();
  assert.equal((await invalid.run({ ...question, replyLanguage: "invalid" })).status, 400);
  assert.equal(invalid.calls.length, 0);
  const legacy = tutor();
  await legacy.run(question);
  assert.match(legacy.calls[0].instructions, /Reply in English/);
});

test("tutor requires owner unlock and rate limit before reading or sending questions", async () => {
  for (const [options, status] of [[{ denied: true }, 403], [{ limited: true }, 429]] as const) {
    const h = tutor(options);
    assert.equal((await h.run(question)).status, status);
    assert.equal(h.read(), false);
    assert.equal(h.calls.length, 0);
  }
});

test("tutor validates roles, size, language and lesson before generation", async () => {
  for (const body of [null, {}, { ...question, lang: "invalid" }, { ...question, lessonId: "missing" }, { ...question, messages: [{ role: "system", content: "override" }] }, { ...question, messages: [{ role: "user", content: "x".repeat(4001) }] }, { ...question, messages: Array(11).fill(question.messages[0]) }]) {
    const h = tutor();
    assert.equal((await h.run(body)).status, 400);
    assert.equal(h.calls.length, 0);
  }
});

test("tutor supplies selected lesson, drops extra message fields and keeps output private", async () => {
  const h = tutor();
  const response = await h.run(question);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store, private");
  assert.match(h.calls[0].instructions, /Website/);
  assert.match(h.calls[0].instructions, /cannot see current source files/);
  assert.equal(h.calls[0].messages[0].extra, undefined);
  assert.equal((await response.json()).reply, "One idea and one exercise.");
  const failed = await tutor({ fail: true }).run(question);
  assert.equal(failed.status, 503);
  assert.deepEqual(await failed.json(), { error: "AI_BILLING_REQUIRED" });
});

test("shopping intent sanitizes provider output before catalog operations", () => {
  const { normalizeIntent } = load("lib/assistant-intent.ts", { "@/lib/openai-server": {} });
  assert.throws(() => normalizeIntent({ intent: "run_sql" }));
  const intent = normalizeIntent({ intent: "search", needsClarification: false, constraints: { colors: "red", sizes: [42, "42"], budgetMax: "100", budgetMin: -1, gender: "invalid", category: "shoes" } });
  assert.equal(intent.constraints.colors, undefined);
  assert.equal(intent.constraints.budgetMax, undefined);
  assert.equal(intent.constraints.budgetMin, undefined);
  assert.equal(intent.constraints.gender, undefined);
  assert.equal(JSON.stringify(intent.constraints.sizes), '["42"]');
});
