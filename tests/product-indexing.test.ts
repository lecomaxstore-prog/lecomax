import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

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
  assert.match(metadata.title, /Current product.*99 MAD/);
});
