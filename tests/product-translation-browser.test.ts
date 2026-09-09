import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(file: string, context: Record<string, unknown>) {
  const exports: any = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, URL, ...context });
  return exports;
}

test("translation preflight and responses allow app origins without allowing unrelated sites", async () => {
  class NextResponse extends Response {
    static next() { return new NextResponse(null); }
  }
  const { middleware } = load("middleware.ts", {
    process: { env: {} },
    require: (name: string) => name === "next/server" ? { NextResponse } : {},
  });
  for (const origin of ["http://localhost:8081", "https://app.lecomax.com", "https://untrusted.invalid"]) {
    for (const method of ["OPTIONS", "GET", "POST"]) {
      const response = await middleware({
        method, nextUrl: new URL("https://lecomax.com/api/product-translations"),
        headers: new Headers({ origin }),
      });
      assert.equal(response.status, method === "OPTIONS" ? 204 : 200);
      assert.equal(response.headers.get("access-control-allow-origin"), origin.includes("untrusted") ? null : origin);
    }
  }
});

test("local translation preview override never changes release or native API routing", () => {
  for (const [dev, platform, hostname, expected] of [
    [true, "web", "localhost", "http://127.0.0.1:3002"],
    [false, "web", "localhost", "https://lecomax.com"],
    [true, "android", "localhost", "https://lecomax.com"],
    [true, "web", "app.lecomax.com", "https://lecomax.com"],
  ] as const) {
    const { runtimeConfig } = load("mobile/src/lib/runtime-config.ts", {
      __DEV__: dev, location: { hostname },
      process: { env: { EXPO_PUBLIC_TRANSLATION_API_URL: "http://127.0.0.1:3002" } },
      require: (name: string) => name === "expo-constants" ? { default: { expoConfig: { extra: { apiUrl: "https://lecomax.com" } } } } : { Platform: { OS: platform } },
    });
    assert.equal(runtimeConfig.translationApiUrl, expected);
    assert.equal(runtimeConfig.apiUrl, "https://lecomax.com");
  }
});
