import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fallbackSeo } from "../lib/seo-engine.ts";
import { productShareCopy } from "../lib/product-share-copy.ts";

function loadPage(product: unknown, shareProduct: unknown = null) {
  const exports: Record<string, any> = {};
  const source = readFileSync(new URL("../app/produit/[slug]/page.tsx", import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports,
    require(name: string) {
      if (name === "next/navigation") return { notFound() { throw new Error("NEXT_NOT_FOUND"); } };
      if (name === "@/lib/db-server") return { getDbProductRaw: async () => product };
      if (name === "@/lib/product-share") return { getProductShareData: async () => shareProduct };
      if (name === "@/lib/product-share-copy") return { productShareCopy };
      if (name === "@/lib/seo-store") return { getSeoContent: async (_kind: string, source: any) => fallbackSeo(source) };
      if (name === "@/lib/seo-editorial-store") return { getPublishedEditorial: async () => null };
      if (name === "@/lib/shipping-config-server") return { getServerShippingConfig: async () => ({}) };
      if (name === "@/lib/shipping-config") return { shippingSummary: () => "Livraison Maroc." };
      if (name === "@/lib/products") return {
        products: [], formatMAD: (price: number) => `${price} MAD`,
        getProduct() { throw new Error("Removed product was revived from the bundled catalogue"); },
      };
      return {};
    },
  });
  return exports;
}

for (const slug of ["a-lenovo-gm2-pro-ecouteurs", "a-lenovo-lp40-pro-ecouteurs"]) {
  test(`${slug}: missing live product stops both page and metadata rendering`, async () => {
    const page = loadPage(null);
    const props = { params: Promise.resolve({ slug }) };
    await assert.rejects(page.default(props), /NEXT_NOT_FOUND/);
    await assert.rejects(page.generateMetadata(props), /NEXT_NOT_FOUND/);
  });
}

test("inactive live products cannot render a product page", async () => {
  const page = loadPage({ active: false });
  await assert.rejects(page.default({ params: Promise.resolve({ slug: "inactive" }) }), /NEXT_NOT_FOUND/);
});

test("active product metadata retains its own canonical and current price", async () => {
  const product = { slug: "current", name: "Current product", price: 99, stock: 2, category: "accessoires", description: "Description" };
  const page = loadPage(product, product);
  const metadata = await page.generateMetadata({ params: Promise.resolve({ slug: product.slug }) });
  assert.equal(metadata.alternates.canonical, "https://lecomax.com/produit/current/");
  assert.match(metadata.title.absolute, /Current product.*Maroc/);
  assert.equal(metadata.other["product:price:amount"], "99");
  assert.equal(metadata.other["product:availability"], "in stock");
});

test("unknown stock does not assert availability", async () => {
  const product = { slug: "current", name: "Current product", price: 99, category: "accessoires", description: "Description" };
  const metadata = await loadPage(product, product).generateMetadata({ params: Promise.resolve({ slug: product.slug }) });
  assert.equal(metadata.other["product:availability"], undefined);
});

test("SEO metadata preserves the deployed preorder behavior without claiming unknown stock is available", async () => {
  for (const [stock, preorderEnabled, expected] of [
    [0, true, "preorder"], [undefined, true, "preorder"],
    [2, true, "in stock"], [0, false, "out of stock"], [undefined, false, undefined],
  ] as const) {
    const product = { slug: "preorder", name: "Preorder product", price: 99, stock, preorderEnabled };
    const metadata = await loadPage(product, product).generateMetadata({ params: Promise.resolve({ slug: product.slug }) });
    assert.equal(metadata.other["product:availability"], expected);
    if (expected === "preorder") assert.equal(metadata.other["twitter:data2"], "Précommande");
  }
});
