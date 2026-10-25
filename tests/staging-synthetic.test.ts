import test from "node:test";
import assert from "node:assert/strict";
import { syntheticOrder, syntheticQuote, syntheticSideEffect } from "../lib/staging-synthetic.ts";

test("synthetic staging services cover quote, COD, PayPal and side effects without external calls", () => {
  process.env.APP_ENV = "staging";
  process.env.NEXT_PUBLIC_APP_ENV = "staging";
  process.env.STAGING_SYNTHETIC_ENABLED = "true";
  assert.equal(syntheticQuote("free").amount, 0);
  assert.equal(syntheticQuote("paid").amount, 40);
  assert.equal(syntheticQuote("failed").ok, false);
  assert.equal(syntheticQuote("timeout").ok, false);
  assert.match(syntheticOrder("cod").id, /synthetic-order/);
  assert.match(syntheticOrder("paypal").id, /synthetic-order/);
  for (const kind of ["email", "sms", "inventory"] as const) assert.match(syntheticSideEffect(kind).id, /no-send/);
});

test("synthetic services fail closed outside explicitly enabled staging", () => {
  process.env.APP_ENV = "production";
  assert.throws(() => syntheticOrder("paypal"), /SYNTHETIC_STAGING_REQUIRED/);
  process.env.APP_ENV = "staging";
  process.env.STAGING_SYNTHETIC_ENABLED = "false";
  assert.throws(() => syntheticQuote("free"), /SYNTHETIC_STAGING_DISABLED/);
});
