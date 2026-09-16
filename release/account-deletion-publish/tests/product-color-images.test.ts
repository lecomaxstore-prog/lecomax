import assert from "node:assert/strict";
import test from "node:test";
import {
  cleanColorImageMap,
  colorImageMapFromTags,
  legacyColorImageMap,
  primaryColorImages,
  syncColorImageTags,
} from "../lib/product-color-images.ts";

test("round-trips an ordered multi-image gallery for every color", () => {
  const map = { Jaune: ["/yellow-main.webp", "/yellow-side.webp"], Bleu: ["https://cdn.example.com/blue.webp"] };
  const tags = syncColorImageTags(["promo", "__cimages:old"], map);
  assert.deepEqual(colorImageMapFromTags(tags), map);
  assert.deepEqual(primaryColorImages(map), { Jaune: "/yellow-main.webp", Bleu: "https://cdn.example.com/blue.webp" });
  assert.equal(tags.includes("promo"), true);
});

test("rejects unsafe URLs and ignores malformed metadata", () => {
  assert.equal(cleanColorImageMap({ Noir: ["javascript:alert(1)"] }), null);
  assert.deepEqual(colorImageMapFromTags(["__cimages:not-json"]), {});
});

test("keeps legacy one-image-per-color products compatible", () => {
  assert.deepEqual(legacyColorImageMap(["Jaune", "Bleu"], ["/yellow.webp", "/blue.webp"]), {
    Jaune: ["/yellow.webp"],
    Bleu: ["/blue.webp"],
  });
});
