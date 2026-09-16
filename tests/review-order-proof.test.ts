import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeReviewContact,
  normalizeReviewOrder,
  resolveReviewPurchase,
} from "../lib/review-purchase.ts";
import { redirectSystemPath } from "../mobile/src/app/+native-intent.ts";

function database(
  options: {
    status?: string;
    phone?: string;
    email?: string;
    slug?: string;
    duplicate?: boolean;
    failure?: boolean;
    allowed?: boolean;
  } = {},
) {
  const order = {
    id: "order-1",
    status: options.status ?? "delivered",
    customer: {
      phone: options.phone ?? "0612345678",
      email: options.email ?? "Buyer@Example.com",
    },
    items: [{ slug: options.slug ?? "shoe" }],
  };
  const calls: string[] = [];
  return {
    calls,
    client: {
      rpc: async (name: string) => name === "find_review_orders_by_contact"
        ? { data: [order], error: options.failure ? {} : null }
        : { data: options.allowed ?? true, error: null },
      from(table: string) {
        calls.push(table);
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          ilike: () => chain,
          in: () => chain,
          limit: () => chain,
          maybeSingle: async () => ({
            data: order,
            error: options.failure ? {} : null,
          }),
          then: (resolve: any, reject: any) =>
            Promise.resolve({
              data:
                table === "orders"
                  ? [order]
                  : options.duplicate
                    ? [{ order_id: order.id }]
                    : [],
              error: options.failure ? {} : null,
            }).then(resolve, reject),
        };
        return chain;
      },
    } as any,
  };
}
const proof = {
  order_number: "ECO-123456",
  contact_type: "phone",
  contact: "+212 612 345 678",
};
test("delivery invitations preserve the order reference when opening the installed app", () => {
  assert.equal(
    redirectSystemPath({
      path: "https://lecomax.com/produit/shoe?review=1&order=ECO-123456#avis",
      initial: true,
    }),
    "/product/shoe?review=1&order=ECO-123456",
  );
});
test("Moroccan phone formats match; other numbers and extensions do not", () => {
  for (const value of [
    "0612345678",
    "+212 612 345 678",
    "00212 612345678",
    "212612345678",
  ])
    assert.equal(normalizeReviewContact(value, "phone"), "212612345678");
  assert.equal(normalizeReviewContact("0612345678 ext 2", "phone"), "");
  assert.notEqual(
    normalizeReviewContact("0712345678", "phone"),
    "212612345678",
  );
});
test("email normalization preserves valid aliases and matches case insensitively", () => {
  assert.equal(
    normalizeReviewContact(" Buyer_Name+shop@Example.com ", "email"),
    "buyer_name+shop@example.com",
  );
  assert.equal(normalizeReviewContact("not-an-email", "email"), "");
});
test("order number accepts printed, compact and numeric forms", () => {
  for (const value of ["#ECO-123456", "eco123456", "123456"])
    assert.equal(normalizeReviewOrder(value), "ECO-123456");
});
test("guest can verify a delivered purchase by phone, including orders without email", async () => {
  const { client } = database({ email: "" });
  const result = await resolveReviewPurchase(client, "shoe", null, proof);
  assert.equal(result.reason, "verified_purchase");
  assert.equal(result.order?.id, "order-1");
  assert.equal(result.guest, true);
});
test("guest can verify the same delivered purchase by email", async () => {
  const result = await resolveReviewPurchase(database().client, "shoe", null, {
    ...proof,
    contact_type: "email",
    contact: "buyer@example.com",
  });
  assert.equal(result.reason, "verified_purchase");
});
test("wrong contacts never disclose delivery status or query reviews", async () => {
  const { client, calls } = database({ status: "shipped" });
  const result = await resolveReviewPurchase(client, "shoe", null, {
    ...proof,
    contact: "0712345678",
  });
  assert.equal(result.reason, "not_ordered");
  assert.equal(result.order, undefined);
  assert.deepEqual(calls, ["orders"]);
});
test("invalid order number or contact type cannot authorize a guest", async () => {
  for (const invalid of [
    { ...proof, order_number: "invalid" },
    { ...proof, contact_type: "name" },
  ]) {
    const { client, calls } = database();
    assert.equal(
      (await resolveReviewPurchase(client, "shoe", null, invalid)).reason,
      "not_ordered",
    );
    assert.equal(calls.length, 0);
  }
});

test("contact-only lookup finds a delivered purchase and rejects mismatches", async () => {
  const contactOnly = { contact_type: "phone", contact: "0612345678" };
  assert.equal((await resolveReviewPurchase(database().client, "shoe", null, contactOnly)).reason, "verified_purchase");
  assert.equal((await resolveReviewPurchase(database().client, "shoe", null, { contact_type: "email", contact: "buyer@example.com" })).reason, "verified_purchase");
  assert.equal((await resolveReviewPurchase(database().client, "shoe", null, { ...contactOnly, contact: "0712345678" })).reason, "not_ordered");
  assert.equal((await resolveReviewPurchase(database({ status: "shipped" }).client, "shoe", null, contactOnly)).reason, "not_delivered");
  assert.equal((await resolveReviewPurchase(database({ duplicate: true }).client, "shoe", null, contactOnly)).reason, "already_reviewed");
  assert.equal((await resolveReviewPurchase(database({ slug: "other" }).client, "shoe", null, contactOnly)).reason, "not_ordered");
  await assert.rejects(resolveReviewPurchase(database({ failure: true }).client, "shoe", null, contactOnly));
});
test("unbought products and undelivered orders are rejected", async () => {
  assert.equal(
    (
      await resolveReviewPurchase(
        database({ slug: "other" }).client,
        "shoe",
        null,
        proof,
      )
    ).reason,
    "not_ordered",
  );
  for (const status of ["pending", "shipped", "cancelled"])
    assert.equal(
      (
        await resolveReviewPurchase(
          database({ status }).client,
          "shoe",
          null,
          proof,
        )
      ).reason,
      "not_delivered",
    );
});
test("switching from phone to email cannot review the same order twice", async () => {
  for (const credentials of [
    proof,
    { ...proof, contact_type: "email", contact: "buyer@example.com" },
  ]) {
    assert.equal(
      (
        await resolveReviewPurchase(
          database({ duplicate: true }).client,
          "shoe",
          null,
          credentials,
        )
      ).reason,
      "already_reviewed",
    );
  }
});
test("database failures and exhausted persistent limits fail closed", async () => {
  await assert.rejects(
    resolveReviewPurchase(
      database({ failure: true }).client,
      "shoe",
      null,
      proof,
    ),
  );
  await assert.rejects(
    resolveReviewPurchase(
      database({ allowed: false }).client,
      "shoe",
      null,
      proof,
    ),
  );
});
test("existing account flow remains available; signed-out callers need proof", async () => {
  assert.equal(
    (
      await resolveReviewPurchase(database().client, "shoe", {
        id: "user-1",
        email: "buyer@example.com",
      } as any)
    ).reason,
    "verified_purchase",
  );
  assert.equal(
    (await resolveReviewPurchase(database().client, "shoe", null)).reason,
    "signed_out",
  );
});
