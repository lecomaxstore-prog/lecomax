import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const controller = readFileSync(
  new URL("../mobile/src/components/android-back-controller.tsx", import.meta.url),
  "utf8",
);

test("Android Back has exactly one root native listener", () => {
  assert.equal(
    controller.match(/BackHandler\.addEventListener/g)?.length,
    1,
  );
  assert.match(controller, /return \(\) => subscription\.remove\(\)/);
});

test("Android Back exits only behind the Home confirmation", () => {
  assert.match(controller, /isHomepagePath\(currentPath\)/);
  assert.match(controller, /Are you sure you want to exit L'ecomax\?/);
  assert.match(controller, /text: "Cancel"/);
  assert.match(controller, /text: "Exit"/);
  assert.equal(controller.match(/BackHandler\.exitApp\(\)/g)?.length, 1);
});

test("Android Back prioritizes keyboard and transient UI before navigation", () => {
  const interceptor = controller.indexOf("focusedInterceptor?.()");
  const keyboard = controller.indexOf("Keyboard.isVisible()");
  const history = controller.indexOf("router.canGoBack()");
  const home = controller.indexOf("isHomepagePath(currentPath)");
  assert.ok(interceptor >= 0);
  assert.ok(keyboard < interceptor);
  assert.ok(interceptor < history);
  assert.ok(history < home);
});
