import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { OFFICIAL_SOCIAL_IMAGE, SOCIAL_IMAGE_METADATA, resolveSocialImage } from "../lib/social-image.ts";

test("built-in legacy images upgrade without replacing custom artwork", () => {
  for (const value of [undefined, null, "", "  ", "/images/social/lecomax-premium-v1.jpg", "https://lecomax.com/images/social/lecomax-premium-v1.jpg?v=1", "/images/lecomax logo.png", "/ecomax-hero-banner.jpg.png"]) {
    assert.equal(resolveSocialImage(value), OFFICIAL_SOCIAL_IMAGE);
  }
  assert.equal(resolveSocialImage(" https://cdn.example.com/custom.jpg "), "https://cdn.example.com/custom.jpg");
  assert.equal(resolveSocialImage("/images/custom-share.jpg"), "/images/custom-share.jpg");
  assert.equal(resolveSocialImage("https://lecomax.com/images/social/lecomax-share-v2.jpg"), OFFICIAL_SOCIAL_IMAGE);
});

test("share metadata matches the published, lightweight JPEG asset", async () => {
  const bytes = await readFile(new URL(`../public${OFFICIAL_SOCIAL_IMAGE}`, import.meta.url));
  const image = await sharp(bytes).metadata();
  assert.equal(image.format, "jpeg");
  assert.equal(image.width, SOCIAL_IMAGE_METADATA.width);
  assert.equal(image.height, SOCIAL_IMAGE_METADATA.height);
  assert.equal(image.space, "srgb");
  assert.ok(bytes.length < 350_000, "Share image should remain under 350 KB");
});
