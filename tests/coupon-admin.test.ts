import assert from "node:assert/strict";
import test from "node:test";
import { cleanCouponPayload } from "../lib/coupon-admin.ts";

test("coupon admin validation normalizes safe create payloads", () => {
  const result = cleanCouponPayload({
    code: " bienvenue-10 ",
    type: "percent",
    value: 10,
    min_order: 100,
    max_uses: 50,
    expires_at: "2030-01-01",
    active: true,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.payload?.code, "BIENVENUE-10");
  assert.equal(result.payload?.value, 10);
});

test("coupon admin validation rejects arbitrary fields and invalid percentages", () => {
  assert.match(
    cleanCouponPayload({ active: true, secret: "no" }, true).error ?? "",
    /non autorisé/,
  );
  assert.match(
    cleanCouponPayload(
      { code: "BAD", type: "percent", value: 120, active: true },
      true,
    ).error ?? "",
    /invalide/,
  );
});

test("coupon partial updates only accept validated fields", () => {
  assert.deepEqual(cleanCouponPayload({ active: false }, true), {
    payload: { active: false },
  });
});
