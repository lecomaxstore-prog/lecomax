import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const exports: any = {};
const source = readFileSync(new URL("../mobile/src/lib/format.ts", import.meta.url), "utf8");
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, {
  exports,
  require: () => ({ currentLocale: () => "fr-MA" }),
});

test("Lenovo photos resolve to the website with spaces encoded once", () => {
  for (const model of ["gm2", "lp40"]) {
    const path = `/images/products/lenovo%20${model}%20pro/1.avif`;
    assert.equal(exports.imageUrl(path), `https://lecomax.com${path}`);
    assert.equal(exports.imageUrl(decodeURI(path)), `https://lecomax.com${path}`);
  }
});

test("absolute image URLs keep their original host", () => {
  const url = "https://cdn.example.com/photo.webp";
  assert.equal(exports.imageUrl(url), url);
});
