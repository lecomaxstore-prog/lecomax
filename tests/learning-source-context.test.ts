import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { isLibraryPath, containsEmbeddedSecret } from "../scripts/source-library.mjs";
function fixture(content = Array.from({ length: 300 }, (_, i) => "const line" + (i + 1) + " = true;").join("\n")) {
  let reads = 0;
  const exports: any = {};
  const source = readFileSync(new URL("../lib/learning-source-context.ts", import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require(id: string) {
    if (id === "./source-library") return { getSourceLibrary: async () => { reads++; return { generatedAt: "2026-09-23", files: [{ path: "app/page.tsx", content }] }; } };
    if (id === "../scripts/source-library.mjs") return { isLibraryPath, containsEmbeddedSecret };
    throw new Error(id);
  } });
  return { get: exports.getLearningSourceContext, reads: () => reads };
}
test("selected source returns bounded numbered lines and snapshot metadata", async () => {
  const result = await fixture().get("app/page.tsx", 200);
  assert.equal(result.sources[0].startLine, 185);
  assert.equal(result.sources[0].endLine, 300);
  assert.match(result.text, /200: const line200/);
  assert.match(result.text, /Partial deployment source snapshot/);
});
test("missing or private paths never disclose source", async () => {
  const h = fixture();
  assert.equal((await h.get()).sources.length, 0);
  for (const path of [".env.local", "../app/page.tsx", "app/../page.tsx"]) await assert.rejects(h.get(path), /INVALID_SOURCE/);
  assert.equal(h.reads(), 0);
  await assert.rejects(h.get("app/missing.tsx"), /SOURCE_UNAVAILABLE/);
  await assert.rejects(fixture('const api_key = "' + 'x'.repeat(32) + '";').get("app/page.tsx"), /SOURCE_UNAVAILABLE/);
});
test("oversized source lines are bounded", async () => {
  const result = await fixture("x".repeat(20000)).get("app/page.tsx");
  assert.ok(result.text.length < 2000);
});

test("lesson anchors follow moved code and reject missing anchors instead of inventing an excerpt", async () => {
  const content = Array.from({ length: 180 }, (_, i) => i === 149 ? "export function ActualLesson() {" : "// context").join("\n");
  const result = await fixture(content).get("app/page.tsx", 1, "export function ActualLesson");
  assert.equal(result.sources[0].startLine, 135);
  assert.match(JSON.parse(result.text).excerpt, /150: export function ActualLesson/);
  await assert.rejects(fixture(content).get("app/page.tsx", 1, "missing function"), /SOURCE_UNAVAILABLE/);
});
