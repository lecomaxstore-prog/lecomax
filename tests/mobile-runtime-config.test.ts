import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function config({ dev = true, platform = "web", apiUrl = "http://127.0.0.1:3000", translation = "" } = {}) {
  const exports: any = {};
  const source = readFileSync(new URL("../mobile/src/lib/runtime-config.ts", import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, URL, __DEV__: dev,
    location: { hostname: "localhost", origin: "http://localhost:8081" },
    process: { env: { EXPO_PUBLIC_TRANSLATION_API_URL: translation } },
    require: (name: string) => name === "expo-constants"
      ? { default: { expoConfig: { extra: { apiUrl } } } }
      : { Platform: { OS: platform } },
  });
  return exports.runtimeConfig;
}

test("local Expo preview uses the Metro proxy despite inherited API overrides", () => {
  for (const apiUrl of ["http://127.0.0.1:3000", "https://lecomax.com"]) {
    assert.equal(config({ apiUrl }).apiUrl, "http://localhost:8081");
  }
});

test("explicit translation preview remains independent", () => {
  const result = config({ translation: "http://127.0.0.1:3002" });
  assert.equal(result.apiUrl, "http://localhost:8081");
  assert.equal(result.translationApiUrl, "http://127.0.0.1:3002");
});

test("native and production API destinations are preserved", () => {
  assert.equal(config({ platform: "android" }).apiUrl, "http://127.0.0.1:3000");
  assert.equal(config({ dev: false, apiUrl: "https://lecomax.com" }).apiUrl, "https://lecomax.com");
});
