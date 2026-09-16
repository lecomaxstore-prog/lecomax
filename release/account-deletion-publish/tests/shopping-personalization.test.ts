import assert from "node:assert/strict";
import test from "node:test";
import { personalizeProducts, recordProductSignal, SHOPPING_PROFILE_EVENT } from "../lib/personalization.ts";

const shoes = { slug: "running", category: "chaussures" };
const boots = { slug: "boots", category: "chaussures" };
const bag = { slug: "bag", category: "accessoires" };

function browser(consent = true) {
  const values = new Map<string, string>();
  values.set("lecomax_cookie_consent", JSON.stringify({ preferences: consent }));
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "window", { configurable: true, value: new EventTarget() });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  } });
  return { values, restore() {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
    else Reflect.deleteProperty(globalThis, "localStorage");
  } };
}

test("repeated shoe browsing lifts shoes and related footwear above other categories", () => {
  const env = browser();
  try {
    recordProductSignal(bag, 2);
    for (let i = 0; i < 4; i++) recordProductSignal(shoes, 3);
    assert.deepEqual(personalizeProducts([bag, boots, shoes]), [shoes, boots, bag]);
  } finally { env.restore(); }
});

test("new catalogue entries matching interests are not buried by catalogue position", () => {
  const env = browser();
  try {
    recordProductSignal(shoes, 3);
    const manyBags = Array.from({ length: 100 }, (_, index) => ({ slug: `bag-${index}`, category: "accessoires" }));
    assert.equal(personalizeProducts([...manyBags, boots])[0].slug, boots.slug);
  } finally { env.restore(); }
});

test("favorites influence the selection without accumulating weight on each refresh", () => {
  const env = browser();
  try {
    const favorites = new Set([shoes.slug]);
    assert.deepEqual(personalizeProducts([bag, boots, shoes], favorites), [shoes, boots, bag]);
    assert.deepEqual(personalizeProducts([bag, boots, shoes], favorites), [shoes, boots, bag]);
    assert.equal(env.values.has("lecomax_shop_profile_v1"), false);
  } finally { env.restore(); }
});

test("declined or revoked preferences preserve the fallback order and stop recording", () => {
  const env = browser();
  try {
    recordProductSignal(shoes, 10);
    env.values.set("lecomax_cookie_consent", JSON.stringify({ preferences: false }));
    const previous = env.values.get("lecomax_shop_profile_v1");
    recordProductSignal(bag, 8);
    assert.deepEqual(personalizeProducts([bag, shoes], new Set([shoes.slug])), [bag, shoes]);
    assert.equal(env.values.get("lecomax_shop_profile_v1"), previous);
  } finally { env.restore(); }
});

test("recent interests outweigh stale preferences and refresh listeners are notified", () => {
  const env = browser();
  try {
    env.values.set("lecomax_shop_profile_v1", JSON.stringify({ version: 1, updatedAt: Date.now() - 90 * 86400000, products: { bag: 40 }, categories: { accessoires: 30 } }));
    let updates = 0;
    window.addEventListener(SHOPPING_PROFILE_EVENT, () => updates++);
    recordProductSignal(shoes, 3);
    assert.equal(personalizeProducts([bag, shoes])[0].slug, shoes.slug);
    assert.equal(updates, 1);
  } finally { env.restore(); }
});

test("malformed or unavailable local storage does not break recommendations", () => {
  const env = browser();
  try {
    env.values.set("lecomax_shop_profile_v1", "invalid json");
    assert.deepEqual(personalizeProducts([bag, shoes]), [bag, shoes]);
    Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new Error("Storage blocked"); } });
    assert.deepEqual(personalizeProducts([bag, shoes]), [bag, shoes]);
    assert.doesNotThrow(() => recordProductSignal(shoes));
  } finally { env.restore(); }
});
