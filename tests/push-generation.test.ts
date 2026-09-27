import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
function load(file: string, overrides: Record<string, unknown>): any {
  const filename = path.resolve(file);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  const require = (id: string): any => {
    if (id in overrides) return overrides[id];
    if (id === "server-only") return {};
    if (id.startsWith(".")) return load(path.resolve(path.dirname(filename), id + ".ts"), overrides);
    return nativeRequire(id);
  };
  new Function("require", "module", "exports", compiled)(require, module, module.exports);
  return module.exports;
}
function route(reply: string, denied = false, fail = false, live = false) {
  const service = live ? load("lib/openai-server.ts", {}) : {
    generateSupportReply: async () => { if (fail) throw new Error("private provider details"); return reply; },
    openAIErrorCode: () => "AI_UNAVAILABLE",
  };
  return load("app/api/push/generate/route.ts", {
    "@/lib/openai-server": service,
    "@/lib/api-security": { protectAdminMutation: async () => denied ? Response.json({}, { status: 403 }) : null },
    "@/lib/request-body": { readJsonLimited: (req: Request) => req.json() },
  });
}
const request = (body: unknown) => new Request("http://localhost/api/push/generate", { method: "POST", body: JSON.stringify(body) });
test("push draft validates output and rejects external destinations", async () => {
  const result = await route(JSON.stringify({ title: "Nouveautés", body: "Découvrez la boutique.", url: "https://evil.example", icon: "https://evil.example/icon" })).POST(request({}));
  assert.equal(result.status, 200);
  const body = await result.json();
  assert.equal(body.url, "/boutique");
  assert.equal(body.icon, "/icons/premium-v12-192.png");
});
test("push generation preserves admin authorization and validates inputs", async () => {
  assert.equal((await route("", true).POST(request({}))).status, 403);
  for (const body of [null, { prompt: 3 }, { prompt: "a".repeat(2001) }, { lang: "invalid" }, { type: "invalid" }]) {
    assert.equal((await route("").POST(request(body))).status, 400);
  }
});
test("provider failures and malformed output never leak internal errors", async () => {
  for (const handler of [route("", false, true), route('{"title":3,"body":"x"}')]) {
    const result = await handler.POST(request({}));
    assert.equal(result.status, 503);
    assert.doesNotMatch(await result.text(), /private provider/);
  }
});
test("live AI generates a draft without sending notifications", { skip: process.env.LIVE_PUSH_AI !== "1" }, async () => {
  const result = await route("", false, false, true).POST(request({ type: "nouveau", lang: "fr", prompt: "Inviter à découvrir la boutique, sans réduction ni date limite." }));
  const body = await result.json();
  assert.equal(result.status, 200, JSON.stringify(body));
  assert.equal(typeof body.title, "string");
  assert.ok(body.title.length > 0 && body.title.length <= 60);
  assert.ok(body.body.length > 0 && body.body.length <= 200);
  assert.ok(body.url.startsWith("/"));
  console.log("Verified AI draft:", JSON.stringify(body));
});
