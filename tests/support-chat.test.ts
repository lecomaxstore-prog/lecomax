import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  parseSupportConversation,
  parseSupportMessage,
  validSupportStatus,
  validSupportId,
} from "../lib/support-validation.ts";

test("mobile browser CORS includes support list, detail and message endpoints only", () => {
  const middleware = readFileSync(new URL("../middleware.ts", import.meta.url), "utf8");
  const literal = middleware.match(/const MOBILE_PUBLIC_API\s*=\s*\/(.+)\/;/);
  assert.ok(literal, "mobile API origin policy exists");
  const allowed = new RegExp(literal[1]);
  const id = "7330b73a-f65a-4d79-a9ea-69943699cb6d";
  for (const path of ["/api/support/conversations", `/api/support/conversations/${id}`, `/api/support/conversations/${id}/messages`]) {
    assert.equal(allowed.test(path), true, path);
  }
  for (const path of ["/api/admin/support/conversations", "/api/support", `/api/support/conversations/${id}/delete`]) {
    assert.equal(allowed.test(path), false, path);
  }
});

test("support messages are trimmed, bounded and reject empty input", () => {
  assert.deepEqual(parseSupportMessage("   "), {
    ok: false,
    error: "Le message ne peut pas être vide.",
  });
  const parsed = parseSupportMessage(`  ${"a".repeat(2_100)}  `);
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal(parsed.body.length, 2_000);
});

test("new support conversations sanitize optional order metadata", () => {
  const parsed = parseSupportConversation({
    subject: "  Livraison  ",
    message: " Besoin d’aide ",
    order_number: `CMD-${"1".repeat(80)}`,
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.subject, "Livraison");
    assert.equal(parsed.message, "Besoin d’aide");
    assert.equal(parsed.orderNumber?.length, 50);
  }
});

test("support statuses are allow-listed", () => {
  assert.equal(validSupportStatus("open"), true);
  assert.equal(validSupportStatus("waiting"), true);
  assert.equal(validSupportStatus("resolved"), true);
  assert.equal(validSupportStatus("deleted"), false);
});

test("customer support routes require authenticated ownership", () => {
  const customerRoute = readFileSync(
    new URL("../app/api/support/conversations/[id]/route.ts", import.meta.url),
    "utf8",
  );
  const messageRoute = readFileSync(
    new URL("../app/api/support/conversations/[id]/messages/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(customerRoute, /getCustomerUser\(req\)/);
  assert.match(customerRoute, /p_reader: "customer", p_user_id: user\.id/);
  assert.match(messageRoute, /p_sender: "customer", p_user_id: user\.id/);
  assert.match(messageRoute, /enforceRateLimit/);
});

test("support IDs reject malformed values before reaching the database", () => {
  assert.equal(validSupportId("7330b73a-f65a-4d79-a9ea-69943699cb6d"), true);
  assert.equal(validSupportId("-".repeat(36)), false);
  assert.equal(validSupportId("not-an-id"), false);
  assert.equal(validSupportId(null), false);
});

test("admin support mutations use signed admin authorization", () => {
  const route = readFileSync(
    new URL("../app/api/admin/support/conversations/[id]/messages/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(route, /protectAdminMutation/);
  assert.match(route, /client_message_id/);
});
