import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const exports: any = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../mobile/src/app/+native-intent.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports, URL });
const redirect = (path: string, initial = false) => exports.redirectSystemPath({ path, initial });

test("Google sign-up callbacks reach auth on both cold and warm app opens", () => {
  for (const initial of [true, false]) {
    assert.equal(redirect("lecomax://auth?returnTo=account&code=one-time-code", initial), "/auth?returnTo=account&code=one-time-code");
    assert.equal(redirect("lecomax://auth?error=access_denied&error_description=Cancelled", initial), "/auth?error=access_denied&error_description=Cancelled");
  }
});

test("relative and triple-slash auth callbacks keep their parameters", () => {
  assert.equal(redirect("/auth?code=sample"), "/auth?code=sample");
  assert.equal(redirect("lecomax:///auth?code=sample"), "/auth?code=sample");
});

test("product and website deep links retain their existing destinations", () => {
  assert.equal(redirect("lecomax://product/example?color=green"), "/product/example?color=green");
  assert.equal(redirect("https://lecomax.com/produit/example?color=green"), "/product/example?color=green");
  assert.equal(redirect("https://lecomax.com/suivre-commande"), "/orders");
  assert.equal(redirect("https://lecomax.com/promotions/"), "/catalog?promotion=true&sort=low");
  assert.equal(redirect("https://lecomax.com/nouveautes/"), "/catalog?sort=new");
});
