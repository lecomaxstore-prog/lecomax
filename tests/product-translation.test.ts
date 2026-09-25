import assert from "node:assert/strict";
import test from "node:test";
import { generateProductTranslation, translationFingerprint, validateProductTranslation } from "../lib/product-translation.ts";
import { ProductTranslationCache } from "../lib/product-translation-cache.ts";

test("fingerprints isolate language, edits, name and brand", () => {
  const base = translationFingerprint("Hoodie", "Jordan", "Gris", "en");
  assert.equal(base, translationFingerprint("Hoodie", "Jordan", " Gris ", "en"));
  for (const changed of [translationFingerprint("Hoodie", "Jordan", "Gris", "fr"), translationFingerprint("Hoodie", "Jordan", "Noir"), translationFingerprint("Sweat", "Jordan", "Gris"), translationFingerprint("Hoodie", "Nike", "Gris")]) assert.notEqual(base, changed);
});

test("validation preserves numeric facts and brands, accepts localized decimals", () => {
  assert.equal(validateProductTranslation("Jordan : 2 poches, 1,5 kg", "Jordan: 2 pockets, 1.5 kg", "Jordan"), "Jordan: 2 pockets, 1.5 kg");
  assert.throws(() => validateProductTranslation("Jordan : 2 poches", "Jordan: 3 pockets", "Jordan"), /numeric/);
  assert.throws(() => validateProductTranslation("Jordan : deux poches", "Hoodie with two pockets", "Jordan"), /brand/);
  assert.throws(() => validateProductTranslation("Une poche", "<p>A pocket</p>"), /plain text/);
  assert.throws(() => validateProductTranslation("Une longue description avec plusieurs détails", "Yes"), /incomplete/);
});

test("OpenAI translates both directions with strict output and one attempt", async (t) => {
  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key";
  t.after(() => { if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey; });
  const requests: any[] = [];
  t.mock.method(globalThis, "fetch", async (url: unknown, options: RequestInit) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    const body = JSON.parse(String(options.body));
    requests.push(body);
    assert.equal(body.store, false);
    assert.equal(body.text.format.strict, true);
    const description = body.instructions.includes("Target language: French") ? "Jordan : 2 poches" : "Jordan: 2 pockets";
    return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ description }) }] }] });
  });
  assert.equal((await generateProductTranslation({ name: "Hoodie", brand: "Jordan", description: "Jordan : 2 poches", locale: "en" })).description, "Jordan: 2 pockets");
  assert.equal((await generateProductTranslation({ name: "Hoodie", brand: "Jordan", description: "Jordan: 2 pockets", locale: "fr" })).description, "Jordan : 2 poches");
  assert.equal(requests.length, 2);
});

test("temporary cache shares concurrent work, stores successes and retries failures", async () => {
  const cache = new ProductTranslationCache();
  let calls = 0;
  const generate = async () => { calls++; return "Translated"; };
  assert.deepEqual(await Promise.all([cache.generate("en", generate), cache.generate("en", generate)]), ["Translated", "Translated"]);
  assert.equal(calls, 1);
  assert.equal(cache.get("en"), "Translated");
  assert.equal(cache.get("fr"), undefined);
  await assert.rejects(cache.generate("failed", async () => { throw new Error("Provider unavailable"); }));
  assert.equal(await cache.generate("failed", generate), "Translated");
});
