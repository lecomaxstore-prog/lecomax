import assert from "node:assert/strict";
import test from "node:test";
import { resolveProductGalleryImages } from "../lib/product-gallery-images.ts";

test("keeps every product photo visible after selecting an option", () => {
  assert.deepEqual(resolveProductGalleryImages({
    images: ["/black.webp", "/white.webp", "/detail.webp"],
    selectedColor: "Blanc",
    colors: ["Noir", "Blanc"],
    colorImageGalleries: { Noir: ["/black.webp"], Blanc: ["/white.webp", "/white-side.webp"] },
  }), ["/white.webp", "/white-side.webp", "/black.webp", "/detail.webp"]);
});

test("promotes a legacy option image without duplicating it", () => {
  assert.deepEqual(resolveProductGalleryImages({
    images: ["/black.webp", "/white.webp", "/detail.webp"],
    selectedColor: "Blanc",
    colors: ["Noir", "Blanc"],
    colorImages: { Blanc: "/white.webp" },
  }), ["/white.webp", "/black.webp", "/detail.webp"]);
});

test("uses a placeholder only when no image is available", () => {
  assert.deepEqual(resolveProductGalleryImages({ images: [] }), ["/images/no-image.svg"]);
});
