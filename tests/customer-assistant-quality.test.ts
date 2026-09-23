import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { CUSTOMER_ASSISTANT_POLICY, PUBLISHED_RETURN_POLICY } from "../lib/customer-assistant-policy.ts";

function load(file: string, dependencies: Record<string, unknown>) {
  const exports: any = {};
  runInNewContext(ts.transpileModule(readFileSync(new URL("../" + file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require(id: string) {
    if (id === "server-only") return {};
    if (id in dependencies) return dependencies[id];
    throw new Error("Unexpected dependency " + id);
  } });
  return exports;
}
function assistant(products: any[] = []) {
  const calls: any[] = [];
  let catalogReads = 0;
  const service = load("lib/assistant-tools.ts", {
    "./customer-assistant-policy": { CUSTOMER_ASSISTANT_POLICY },
    "./store-assistant-context": { getStoreAssistantContext: async () => "CURRENT VERIFIED STORE FACTS" },
    "@/lib/openai-server": { generateSupportReply: async (input: any) => { calls.push(input); return "Grounded answer"; } },
    "./assistant-retrieval": {
      getAssistantCatalog: async () => { catalogReads++; return products; },
      filterByConstraints: (items: any[]) => items,
      rankAssistantProducts: (items: any[]) => items.map(p => ({ productSlug: p.slug, productName: p.name, productPrice: p.price })),
    },
  });
  return { ...service, calls, catalogReads: () => catalogReads };
}

test("extractor free text cannot bypass store facts or invent a refund", async () => {
  const h = assistant();
  const answer = await h.processIntent({ intent: "general_chat", directResponse: "Your refund was issued", needsClarification: false }, "Help");
  assert.equal(answer.message, "Grounded answer");
  assert.match(h.calls[0].instructions, /CURRENT VERIFIED STORE FACTS/);
  assert.doesNotMatch(h.calls[0].instructions, /Your refund was issued/);
});

test("human handoff takes priority over extractor text and provides a real next step", async () => {
  const h = assistant();
  await h.processIntent({ intent: "human_handoff", directResponse: "Connected", needsClarification: true }, "Un conseiller pour la livraison");
  assert.match(h.calls[0].instructions, /cannot connect an agent/);
  assert.match(h.calls[0].instructions, /Response task: Explain how to reach a human/);
  assert.equal(h.catalogReads(), 0);
});

test("service answers preserve recent conversation for city-only follow-ups and drop extra fields", async () => {
  const h = assistant();
  const history = [{ role: "user", content: "Shipping cost?" }, { role: "assistant", content: "Which city?" }, { role: "user", content: "Rabat", extra: "not a message field" }];
  await h.processIntent({ intent: "customer_service" }, "Rabat", history);
  assert.equal(h.calls[0].messages.length, 3);
  assert.equal(h.calls[0].messages[0].content, "Shipping cost?");
  assert.equal(h.calls[0].messages[2].extra, undefined);
});

test("gift requests use catalog retrieval even if extractor returns an invented product", async () => {
  const h = assistant([{ slug: "real-speaker", name: "Verified speaker", price: 200 }]);
  const result = await h.processIntent({ intent: "gift_finder", directResponse: "Buy imaginary earbuds", constraints: { budgetMax: 250 } }, "A gift under 250 MAD");
  assert.equal(h.catalogReads(), 1);
  assert.equal(result.recommendations[0].productSlug, "real-speaker");
  assert.doesNotMatch(h.calls[0].instructions, /imaginary earbuds/);
});

test("missing comparison products do not produce a fabricated comparison", async () => {
  const h = assistant([{ slug: "one", name: "One", price: 200 }]);
  await h.processIntent({ intent: "compare", targetProductIds: ["one", "missing"] }, "Compare both");
  assert.match(h.calls[0].instructions, /Fewer than two requested products/);
});

test("store context shares active knowledge and published return conditions while excluding unavailable payments", async () => {
  let unavailable = false;
  const query: any = { select: () => query, eq: (_key: string, value: boolean) => { assert.equal(value, true); return query; }, order: () => query,
    limit: async () => ({ data: [{ question: "Question", answer: "Owner answer", language: "fr" }], error: unavailable ? { message: "failed" } : null }) };
  const module = load("lib/store-assistant-context.ts", {
    "./commerce-server": { loadCommerceConfiguration: async () => ({ settings: { shipping_cost: "39", free_shipping_enabled: "false", free_shipping_threshold: "500" }, zones: [] }) },
    "./payment-methods": { paymentMethodsFromSettings: () => [{ id: "cod", enabled: true, maintenance: false }, { id: "paypal", enabled: true, maintenance: true }] },
    "./supabase-server": { createServerSupabaseClient: () => ({ from: (name: string) => { assert.equal(name, "chat_knowledge_base"); return query; } }) },
    "./customer-assistant-policy": { PUBLISHED_RETURN_POLICY },
  });
  const context = await module.getStoreAssistantContext();
  assert.match(context, /Owner answer/);
  assert.match(context, /Unworn and unwashed/);
  assert.match(context, /"freeShippingEnabled":false/);
  assert.doesNotMatch(context, /paypal/);
  unavailable = true;
  const failed = await module.getStoreAssistantContext();
  assert.match(failed, /"knowledgeBaseAvailable":false/);
  assert.doesNotMatch(failed, /Owner answer/);
});


test("product searches mentioning delivery or warranty still retrieve products", async () => {
  for (const question of ["Find headphones with delivery to Rabat", "Find a laptop with warranty", "Find a phone with payment on delivery"]) {
    const h = assistant([{ slug: "verified-product", name: "Verified product", price: 200 }]);
    const result = await h.processIntent({ intent: "search", constraints: { budgetMax: 300 } }, question);
    assert.equal(h.catalogReads(), 1);
    assert.equal(result.recommendations[0].productSlug, "verified-product");
    assert.match(h.calls[0].instructions, /Also address any shipping or service question/);
  }
});
