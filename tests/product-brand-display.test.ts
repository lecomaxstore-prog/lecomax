import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { apiToCard } from "../lib/products.ts";
import * as brands from "../mobile/src/lib/product-brands.ts";

test("website cards retain the chosen brand, including custom brands and no-brand products", () => {
  const product = { slug: "shoe", name: "Shoe", category: "chaussures", price: 100 };
  for (const brand of [...brands.DEFAULT_BRANDS.map(item => item.name), "Custom Brand"]) {
    assert.equal(apiToCard({ ...product, brand }).brand, brand);
  }
  for (const brand of [null, undefined, "", "  "]) {
    assert.equal(apiToCard({ ...product, brand }).brand, undefined);
  }
  assert.equal(apiToCard({ ...product, brand: " Nike " }).brand, "Nike");
});

test("product card registry shares requests, keeps custom logos and retries failed reads", async () => {
  let calls = 0;
  let fail = true;
  const source = ts.transpileModule(fs.readFileSync("lib/product-brand-client.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const mod = { exports: {} as { loadProductBrands: () => Promise<brands.ProductBrand[]> } };
  const fetchMock = async () => {
    calls++;
    return Response.json(fail ? {} : [{ name: "Custom Brand", logo: "https://example.com/real.png" }], { status: fail ? 503 : 200 });
  };
  new Function("require", "module", "exports", "fetch", source)(() => brands, mod, mod.exports, fetchMock);
  await assert.rejects(mod.exports.loadProductBrands());
  fail = false;
  const first = mod.exports.loadProductBrands();
  const second = mod.exports.loadProductBrands();
  assert.equal(first, second);
  assert.equal((await first)[0].logo, "https://example.com/real.png");
  await mod.exports.loadProductBrands();
  assert.equal(calls, 2);
});
