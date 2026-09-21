import assert from "node:assert/strict";
import test from "node:test";
import { loadMobileModule } from "./helpers/mobile-module.ts";

const { inputScrollOffset } = loadMobileModule<typeof import("../mobile/src/lib/input-scroll-offset.ts")>("lib/input-scroll-offset.ts");

test("address hidden by keyboard scrolls above the visible bottom", () => {
  assert.equal(inputScrollOffset(0, 590, 56, 100, 400), 262);
});

test("switching back to an earlier field scrolls up without negative offsets", () => {
  assert.equal(inputScrollOffset(262, 50, 56, 100, 400), 196);
  assert.equal(inputScrollOffset(10, 50, 56, 100, 400), 0);
});

test("visible fields do not jump while typing or on repeated keyboard events", () => {
  assert.equal(inputScrollOffset(200, 200, 56, 100, 400), 200);
  assert.equal(inputScrollOffset(262, 328, 56, 100, 400), 262);
});

test("scrolling respects the footer edge even when it is above the keyboard", () => {
  assert.equal(inputScrollOffset(100, 330, 56, 100, 350), 152);
});
