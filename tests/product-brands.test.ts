import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import * as brandsModule from "../mobile/src/lib/product-brands.ts";
import { DEFAULT_BRANDS, brandId, mergeBrands, validateBrand } from "../mobile/src/lib/product-brands.ts";

test("brands normalize identity and reuse legacy product names", () => {
  assert.equal(brandId("  ASICS  "), "asics");
  const list = mergeBrands([], ["asics", "ASICS", "Nike", " Nike ", null]);
  assert.equal(list.length, DEFAULT_BRANDS.length);
  assert.equal(list.find(b => b.id === "asics")?.logo, "/images/brands/asics.png");
});

test("brand API protects writes, persists by normalized name and isolates registry reads", async () => {
  const rows = new Map<string, string>();
  let denied = true;
  let databaseError = false;
  const db = { from: (table: string) => {
    assert.equal(table, "settings");
    return {
      select: () => ({ like: async (key: string, prefix: string) => {
        assert.equal(key, "key"); assert.equal(prefix, "product_brand:%");
        return { data: [...rows.values()].map(value => ({ value })), error: null };
      } }),
      upsert: async (row: { key: string; value: string }) => {
        if (databaseError) return { error: new Error("offline") };
        rows.set(row.key, row.value); return { error: null };
      },
    };
  } };
  const mocks: Record<string, unknown> = {
    "@supabase/supabase-js": { createClient: () => db },
    "@/lib/api-security": { protectAdminMutation: async () => denied ? Response.json({ error: "Unauthorized" }, { status: 401 }) : null },
    "@/lib/request-body": { readJsonLimited: (req: Request) => req.json() },
    "@/mobile/src/lib/product-brands": brandsModule,
  };
  const nativeRequire = createRequire(import.meta.url);
  const code = ts.transpileModule(fs.readFileSync("app/api/products/brands/route.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const mod = { exports: {} as any };
  new Function("require", "module", "exports", code)((id: string) => mocks[id] ?? nativeRequire(id), mod, mod.exports);
  const send = (name: string, logo = "") => mod.exports.POST(new Request("http://localhost/api/products/brands", { method: "POST", body: JSON.stringify({ name, logo }) }));
  assert.equal((await send("Nike")).status, 401);
  assert.equal(rows.size, 0);
  denied = false;
  assert.equal((await send(" Nike ", "https://example.com/nike.png")).status, 200);
  await send("NIKE", "https://example.com/new.png");
  await send("Sony");
  assert.equal(rows.size, 2);
  assert.equal((await send("Bad", "javascript:alert(1)")).status, 400);
  const list = await (await mod.exports.GET()).json();
  assert.equal(list.length, DEFAULT_BRANDS.length);
  assert.equal(list.find((b: any) => b.id === "nike").logo, "https://example.com/new.png");
  databaseError = true;
  assert.equal((await send("Other")).status, 503);
  assert.equal(rows.size, 2);
});

test("saved logos override defaults and unrelated brands survive merging", () => {
  const brand = validateBrand({ name: " Nike ", logo: "https://example.com/nike.png" });
  assert.ok(brand);
  const list = mergeBrands([brand], ["NIKE", "Sony"]);
  assert.equal(list.length, DEFAULT_BRANDS.length);
  assert.equal(list.find(b => b.id === "nike")?.logo, brand.logo);
});

test("brand input rejects unsafe URLs and invalid names", () => {
  for (const logo of ["javascript:alert(1)", "data:image/svg+xml,test", "http://example.com/a.png", "//example.com/logo.png", "https://user:password@example.com/logo.png"]) {
    assert.equal(validateBrand({ name: "Brand", logo }), null);
  }
  for (const name of ["", " ", "a".repeat(81), "bad\u0000name"]) {
    assert.equal(validateBrand({ name, logo: "" }), null);
  }
  assert.equal(validateBrand({ name: "Brand", logo: "" })?.name, "Brand");
});

test("shared catalogue has exactly the Expo logos with identical web artwork", () => {
  const source = fs.readFileSync("mobile/src/components/product-brand-mark.tsx", "utf8");
  const assets = [...source.matchAll(/require\("..\/..\/assets\/images\/brands\/([^" ]+)"\)/g)].map(match => match[1]).sort();
  assert.equal(DEFAULT_BRANDS.length, 30);
  assert.deepEqual(DEFAULT_BRANDS.map(brand => brand.logo.split("/").pop()).sort(), assets);
  for (const brand of DEFAULT_BRANDS) {
    assert.equal(brand.id, brandId(brand.name));
    assert.deepEqual(fs.readFileSync("public" + brand.logo), fs.readFileSync("mobile/assets/images/brands/" + brand.logo.split("/").pop()));
  }
});
