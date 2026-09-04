import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  parseSupportConversation,
  parseSupportMessage,
  validSupportStatus,
} from "../lib/support-validation.ts";

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
  assert.match(customerRoute, /\.eq\("user_id", user\.id\)/);
  assert.match(messageRoute, /\.eq\("user_id", user\.id\)/);
  assert.match(messageRoute, /enforceRateLimit/);
});

test("admin support mutations use signed admin authorization", () => {
  const route = readFileSync(
    new URL("../app/api/admin/support/conversations/[id]/messages/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(route, /protectAdminMutation/);
  assert.match(route, /client_message_id/);
});
