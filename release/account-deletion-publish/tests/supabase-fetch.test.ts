import test from "node:test";
import assert from "node:assert/strict";
import { createSupabaseFetch } from "../lib/supabase-fetch.ts";

test("a temporary failed background read is retried once", async () => {
  let calls = 0;
  const fetcher = createSupabaseFetch(async () => {
    if (++calls === 1) throw new TypeError("Failed to fetch");
    return new Response("ok");
  });
  assert.equal(await (await fetcher("https://example.com/auth/v1/user")).text(), "ok");
  assert.equal(calls, 2);
});
test("a persistent outage remains an error after the bounded retry", async () => {
  let calls = 0;
  const fetcher = createSupabaseFetch(async () => { calls++; throw new TypeError("Failed to fetch"); });
  await assert.rejects(fetcher("https://example.com/auth/v1/user"), /Failed to fetch/);
  assert.equal(calls, 2);
});
test("signups and data mutations are never replayed", async () => {
  for (const url of ["https://example.com/auth/v1/signup", "https://example.com/rest/v1/orders"]) {
    let calls = 0;
    const fetcher = createSupabaseFetch(async () => { calls++; throw new TypeError("Failed to fetch"); });
    await assert.rejects(fetcher(url, { method: "POST", body: "{}" }));
    assert.equal(calls, 1);
  }
});
test("aborted requests and authentication errors are not retried", async () => {
  let calls = 0;
  const controller = new AbortController();
  controller.abort();
  const fetcher = createSupabaseFetch(async () => { calls++; throw new TypeError("Failed to fetch"); });
  await assert.rejects(fetcher("https://example.com/auth/v1/user", { signal: controller.signal }));
  assert.equal(calls, 1);
  const unauthorized = createSupabaseFetch(async () => new Response(null, { status: 401 }));
  assert.equal((await unauthorized("https://example.com/auth/v1/user")).status, 401);
});
