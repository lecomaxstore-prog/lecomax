import assert from "node:assert/strict";
import { STORE_SETTING_DEFAULTS } from "../mobile/src/lib/store-settings.ts";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

test("Android without Intl.PluralRules can render home counts in both languages", () => {
  const exports: {
    pluralCategory?: (language: string, count: number) => string;
    translate?: (language: string, key: string, params: { count: number }) => string;
  } = {};
  const root = new URL("../mobile/src/i18n/", import.meta.url);
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL("translate.ts", root), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, {
    exports, Intl: {},
    require: (name: string) => name === "../lib/store-settings" ? { STORE_SETTING_DEFAULTS } : JSON.parse(readFileSync(new URL(name, root), "utf8")),
  });
  for (const language of ["en", "fr"]) {
    for (const count of [0, 1, 2, 5, 1.5, 100, 1_000_000, -1, NaN]) {
      assert.equal(exports.pluralCategory!(language, count), new Intl.PluralRules(language).select(count));
      for (const key of ["notifications.unreadCount", "cart.accessibleCount"]) {
        const text = exports.translate!(language, key, { count });
        assert.ok(text.length > 0);
        assert.notEqual(text, key);
        assert.doesNotMatch(text, /\{\{/);
      }
    }
  }
});
