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

test("Android Back never exits the app", () => {
  // Home is the last screen: Back is consumed so the app stays open instead of
  // closing the activity or asking for an exit confirmation.
  assert.doesNotMatch(controller, /exitApp/);
  assert.match(controller, /if \(isHomepagePath\(pathname\)\) return true;/);
});

test("Android Back delegates history to the navigator", () => {
  // A second pathname-only history can replay pages after a normal Back, so the
  // navigator owns stack entries, route parameters and tab history.
  assert.match(controller, /router\.canGoBack\(\)/);
  assert.match(controller, /router\.back\(\)/);
  // Deep links and restored screens can have no in-memory stack.
  assert.match(controller, /safeParentPath\(pathname, params\)/);
});

test("Android Back prioritizes keyboard and transient UI before navigation", () => {
  const keyboard = controller.indexOf("Keyboard.isVisible()");
  const interceptor = controller.indexOf("focusedInterceptor?.()");
  const history = controller.indexOf("router.canGoBack()");
  const home = controller.indexOf("isHomepagePath(pathname)");
  assert.ok(keyboard >= 0);
  assert.ok(interceptor >= 0);
  assert.ok(home >= 0);
  assert.ok(keyboard < interceptor);
  assert.ok(interceptor < history);
  assert.ok(history < home);
});
