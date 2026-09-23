import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function service(request: (...args: any[]) => Promise<unknown>) {
  const exports: any = {};
  const source = readFileSync(new URL("../mobile/src/services/assistant.ts", import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports,
    require: (name: string) => {
      assert.equal(name, "@/lib/api-client");
      return { apiRequest: request };
    },
  });
  return exports;
}

test("Expo assistance keeps long chats within the API limit and preserves recent product context", async () => {
  const messages = Array.from({ length: 65 }, (_, index) => ({
    role: index % 2 ? "assistant" : "user",
    content: `Message ${index}`,
    ...(index === 63 ? { recommendations: [{ productSlug: "speaker", reason: "Within budget" }] } : {}),
  }));
  const result = { sessionId: "session", message: "Answer" };
  const api = service(async (path, options) => {
    assert.equal(path, "/api/assistant");
    assert.equal(options.method, "POST");
    assert.equal(options.timeoutMs, 60_000);
    const body = JSON.parse(options.body);
    assert.equal(body.platform, "mobile_app");
    assert.equal(body.sessionId, "session");
    assert.equal(body.messages.length, 29);
    assert.equal(body.messages[0].role, "user");
    assert.equal(body.messages.at(-1).content, "Message 64");
    assert.equal(body.messages.at(-2).recommendations[0].productSlug, "speaker");
    return result;
  });
  assert.equal(await api.askAssistant(messages, "session"), result);
  assert.equal(messages.length, 65);
});

test("Expo assistance forwards first messages and surfaces server errors", async () => {
  const failure = new Error("Service unavailable");
  const api = service(async (_path, options) => {
    const body = JSON.parse(options.body);
    assert.deepEqual(body.messages, [{ role: "user", content: "Bonjour" }]);
    assert.equal(body.sessionId, undefined);
    throw failure;
  });
  await assert.rejects(api.askAssistant([{ role: "user", content: "Bonjour" }]), error => error === failure);
});
