import assert from "node:assert/strict";
import test from "node:test";
import { loadMobileModule } from './helpers/mobile-module.ts';
const { withSessionTimeout } = loadMobileModule<typeof import('../mobile/src/lib/session-timeout.ts')>('lib/session-timeout.ts');

test("session lookup preserves a successful session", async () => {
  const session = { user: { id: "customer" } };
  assert.equal(await withSessionTimeout(Promise.resolve(session), 100), session);
});

test("session lookup preserves authentication errors", async () => {
  const error = new Error("Session unavailable");
  await assert.rejects(withSessionTimeout(Promise.reject(error), 100), error);
});

test("stalled session lookup settles and a subsequent retry can succeed", async () => {
  await assert.rejects(withSessionTimeout(new Promise(() => {}), 10), /session/);
  assert.equal(await withSessionTimeout(Promise.resolve("recovered"), 100), "recovered");
});
