import test from "node:test";
import assert from "node:assert/strict";
import { requestDashboard } from "../lib/dashboard-request.ts";

test("temporary server errors recover with bounded backoff", async () => {
  let calls = 0;
  const delays: number[] = [];
  const fetcher: typeof fetch = async () => new Response(null, { status: ++calls < 3 ? 500 : 200 });
  const response = await requestDashboard("/dashboard", new AbortController().signal, fetcher, async delay => { delays.push(delay); });
  assert.equal(response.status, 200);
  assert.equal(calls, 3);
  assert.deepEqual(delays, [1000, 2000]);
});

test("authentication and permission failures are not automatically retried", async () => {
  for (const status of [401, 403]) {
    let calls = 0;
    const fetcher: typeof fetch = async () => { calls++; return new Response(null, { status }); };
    const response = await requestDashboard("/dashboard", new AbortController().signal, fetcher, async () => { assert.fail("Unexpected retry"); });
    assert.equal(response.status, status);
    assert.equal(calls, 1);
  }
});

test("persistent network failures stop after three attempts", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; throw new TypeError("Failed to fetch"); };
  await assert.rejects(requestDashboard("/dashboard", new AbortController().signal, fetcher, async () => {}), /Failed to fetch/);
  assert.equal(calls, 3);
});

test("changing pages or periods cancels outstanding retries", async () => {
  let calls = 0;
  const controller = new AbortController();
  const fetcher: typeof fetch = async () => { calls++; return new Response(null, { status: 503 }); };
  await assert.rejects(requestDashboard("/dashboard", controller.signal, fetcher, async () => { controller.abort(); }), { name: "AbortError" });
  assert.equal(calls, 1);
});
