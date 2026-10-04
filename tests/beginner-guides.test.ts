import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const module = { exports: {} as any };
runInNewContext(ts.transpileModule(readFileSync(new URL("../app/admin/how-it-was-built/course/beginner-guides.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { module, exports: module.exports });
const { nextjsGuide, pythonGuide } = module.exports;

test("every beginner lesson has three translations, an exercise, a correction and valid source links", () => {
  for (const guide of [nextjsGuide, pythonGuide]) {
    for (const lesson of guide.chapters) {
      for (const field of [lesson.title, lesson.idea, lesson.task, lesson.result, ...lesson.paragraphs]) {
        assert.equal(field.length, 3);
        assert.ok(field.every((text: string) => typeof text === "string" && text.trim().length > 10));
      }
      for (const file of lesson.files ?? []) assert.ok(existsSync(new URL(`../${file}`, import.meta.url)), file);
      if (lesson.code && /\.tsx?$/.test(lesson.filename ?? "")) {
        const output = ts.transpileModule(lesson.code, { fileName: lesson.filename, reportDiagnostics: true,
          compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } });
        assert.equal(output.diagnostics.length, 0, lesson.filename);
      }
    }
  }
});

function proxy(fetcher: typeof fetch) {
  const lesson = pythonGuide.chapters.find((item: any) => item.filename === "app/api/python-demo/route.ts");
  const output = { exports: {} as any };
  runInNewContext(ts.transpileModule(lesson.code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module: output, exports: output.exports, Response, URL, AbortSignal,
    process: { env: { PYTHON_API_URL: "https://python.example.test" } }, fetch: fetcher,
  });
  return output.exports.GET;
}

test("the taught Next.js proxy requests the configured Python service and returns only its contract", async () => {
  const get = proxy(async (url, options) => {
    assert.equal(String(url), "https://python.example.test/catalog-summary");
    assert.equal(options?.cache, "no-store");
    assert.ok(options?.signal);
    return Response.json({ products: 2, in_stock: 1, ignored: "not forwarded" });
  });
  const response = await get();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { products: 2, in_stock: 1 });
});

test("the taught proxy handles downtime and invalid data without pretending success", async () => {
  const failures = [
    async () => { throw new Error("Connection refused"); },
    async () => new Response("Unavailable", { status: 503 }),
    async () => Response.json({ products: 2, in_stock: 3 }),
    async () => Response.json({ products: "2", in_stock: 1 }),
    async () => Response.json(null),
  ];
  for (const fetcher of failures) {
    const response = await proxy(fetcher)();
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "Service Python indisponible" });
  }
});
