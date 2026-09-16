import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../mobile/src/app/(tabs)/account.tsx", import.meta.url), "utf8");
function setup(signOut: (options: unknown) => Promise<unknown>) {
  const changes: Record<string, unknown> = {};
  const pending = { current: false };
  const handler = source.match(/const performLogout = async \(\) => \{[\s\S]*?\n  \};/)?.[0];
  assert.ok(handler);
  const run = vm.runInNewContext(`${handler}; performLogout`, {
    Error, supabase: { auth: { signOut } }, logoutPending: pending,
    setLogoutLoading: (value: unknown) => { changes.loading = value; },
    setLogoutError: (value: unknown) => { changes.error = value; },
    setSession: (value: unknown) => { changes.session = value; },
    setSheet: (value: unknown) => { changes.sheet = value; },
    setLogoutConfirming: (value: unknown) => { changes.confirming = value; },
    localizedError: (error: Error) => error.message, msg: (key: string) => key,
  });
  return { run, changes, pending };
}

test("successful sign out affects only this device and closes settings", async () => {
  const state = setup(async (options: any) => {
    assert.equal(options.scope, "local");
    return { error: null };
  });
  await state.run();
  assert.equal(state.changes.session, null);
  assert.equal(state.changes.sheet, null);
  assert.equal(state.changes.loading, false);
});

for (const throws of [false, true]) test(`sign-out ${throws ? "exception" : "returned error"} stays visible and allows retry`, async () => {
  const state = setup(async () => {
    const error = new Error("Network unavailable");
    if (throws) throw error;
    return { error };
  });
  await state.run();
  assert.equal(state.changes.error, "Network unavailable");
  assert.equal(state.changes.loading, false);
  assert.equal(state.pending.current, false);
  assert.equal("session" in state.changes, false);
  assert.equal("sheet" in state.changes, false);
});

test("repeated taps do not start duplicate sign-out requests", async () => {
  let calls = 0;
  let complete!: (value: unknown) => void;
  const state = setup(() => { calls++; return new Promise(resolve => { complete = resolve; }); });
  const first = state.run();
  await state.run();
  assert.equal(calls, 1);
  complete({ error: null });
  await first;
  assert.equal(state.pending.current, false);
});
