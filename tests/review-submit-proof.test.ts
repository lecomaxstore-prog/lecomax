import { securityIo } from "./helpers/security-io.ts";
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import * as purchase from "../lib/review-purchase.ts";

function setup({
  status = "delivered",
  duplicate = false,
  disabled = false,
} = {}) {
  const inserts: any[] = [];
  const order = {
    id: "order-1",
    items: [{ slug: "shoe" }],
    status,
    customer: { email: "", phone: "0612345678", name: "Client Example" },
  };
  const db = {
    rpc: async (name: string) => ({ data: name === "find_review_orders_by_contact" ? [order] : true, error: null }),
    from(table: string) {
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        in: () => chain,
        maybeSingle: async () => ({
          data:
            table === "settings"
              ? { value: disabled ? "false" : "true" }
              : order,
          error: null,
        }),
        then: (resolve: any) =>
          Promise.resolve({ data: [], error: null }).then(resolve),
        insert: async (value: any) => {
          inserts.push(value);
          return { error: duplicate ? { code: "23505" } : null };
        },
      };
      return chain;
    },
  };
  const dependencies: Record<string, unknown> = {
    "next/cache": { revalidateTag: () => {} },
    "next/server": {
      NextResponse: {
        json: (body: unknown, options: any = {}) => ({
          body,
          status: options.status ?? 200,
        }),
      },
    },
    "@supabase/supabase-js": { createClient: () => db },
    "@/lib/review-purchase": purchase,
    "@/lib/api-security": { enforceRateLimit: () => null },
    "@/lib/request-auth": { getCustomerUser: async () => null },
    "@/lib/push-notifications": {
      broadcastAdminPushNotification: async () => {},
    },
  };
  const code = ts.transpileModule(
    readFileSync(
      new URL("../app/api/reviews/route.ts", import.meta.url),
      "utf8",
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  const exports: any = {};
  new Function("require", "exports", code)(
    (name: string) => securityIo(name) ?? dependencies[name],
    exports,
  );
  return {
    inserts,
    post: (body: any) => exports.POST({ json: async () => body }),
  };
}
const input = {
  product_slug: "shoe",
  order_number: "123456",
  contact_type: "phone",
  contact: "+212612345678",
  rating: 3,
  review_body: "A balanced and honest review of this product.",
};
test("phone-only guest publishes a real verified review with the matched order identity", async () => {
  const { post, inserts } = setup();
  assert.equal(
    (
      await post({
        ...input,
        verified_purchase: false,
        order_id: "spoofed",
        email: "spoofed@example.com",
      })
    ).status,
    201,
  );
  assert.equal(inserts[0].order_id, "order-1");
  assert.equal(inserts[0].verified_purchase, true);
  assert.equal(inserts[0].email, "");
  assert.equal(inserts[0].user_id, null);
  assert.equal(inserts[0].rating, 3);
});
test("publication independently rechecks contact, product and delivery", async () => {
  for (const body of [
    { ...input, contact: "0712345678" },
    { ...input, product_slug: "other" },
  ]) {
    const { post, inserts } = setup();
    assert.equal((await post(body)).status, 403);
    assert.equal(inserts.length, 0);
  }
  const { post, inserts } = setup({ status: "shipped" });
  assert.equal((await post(input)).body.reason, "not_delivered");
  assert.equal(inserts.length, 0);
});

test("automatic lookup publishes without an order number and rechecks the contact", async () => {
  const { post, inserts } = setup();
  assert.equal((await post({ ...input, order_number: undefined })).status, 201);
  assert.equal(inserts[0].order_id, "order-1");
  assert.equal((await setup().post({ ...input, order_number: undefined, contact: "0712345678" })).status, 403);
  assert.equal((await setup({ status: "shipped" }).post({ ...input, order_number: undefined })).status, 403);
});
test("simultaneous duplicate publication returns a useful conflict", async () => {
  const result = await setup({ duplicate: true }).post(input);
  assert.equal(result.status, 409);
  assert.equal(result.body.reason, "already_reviewed");
});
test("invalid content and disabled reviews cannot publish", async () => {
  for (const body of [
    null,
    [],
    { ...input, rating: 0 },
    { ...input, review_body: "short" },
  ])
    assert.equal((await setup().post(body)).status, 400);
  const { post, inserts } = setup({ disabled: true });
  assert.equal((await post(input)).status, 403);
  assert.equal(inserts.length, 0);
});
