import test from "node:test";
import assert from "node:assert/strict";
import { CHAT_IDLE_MS, chatDeadline, chatExpired, pendingChatQuestion, type ChatActivity, type ChatSession } from "../lib/chat-lifecycle.ts";

const timestamp = "2026-09-09T12:00:00.000Z";
const base = Date.parse(timestamp);
const session: ChatSession = { id: "test", status: "ai", created_at: timestamp, last_at: timestamp };
const message = (sent_by: string, offset = 0, body = "Hello"): ChatActivity => ({ sent_by, body, timestamp: new Date(base + offset).toISOString() });

test("a fresh conversation expires at exactly three minutes", () => {
  assert.equal(CHAT_IDLE_MS, 180_000);
  assert.equal(chatExpired(session, [], base + 179_999), false);
  assert.equal(chatExpired(session, [], base + 180_000), true);
});
test("the customer's reply stops the idle countdown while waiting for AI", () => {
  const messages = [message("ai"), message("visitor", 170_000)];
  assert.equal(chatDeadline(session, messages), null);
  assert.equal(chatExpired(session, messages, base + 900_000), false);
});
test("a new assistant reply starts a full three-minute reply window", () => {
  const messages = [message("ai"), message("visitor", 170_000), message("ai", 190_000)];
  assert.equal(chatDeadline(session, messages), base + 370_000);
  assert.equal(chatExpired(session, messages, base + 370_000), true);
});
test("waiting for a human does not penalize the customer for support delays", () => {
  const escalated = { ...session, status: "escalated" };
  assert.equal(chatDeadline(escalated, [message("visitor"), message("ai", 1000)]), null);
  assert.equal(chatDeadline(escalated, [message("visitor"), message("agent", 1000, "__AGENT_JOINED__")]), null);
  assert.equal(chatDeadline(escalated, [message("agent", 1000)]), base + 181_000);
});
test("system events do not extend the customer's timeout", () => {
  assert.equal(chatDeadline(session, [message("ai"), message("ai", 60_000, "__AI_RESUMED__")]), base + 180_000);
});
test("resolved conversations never receive a new deadline", () => {
  assert.equal(chatDeadline({ ...session, status: "resolved" }, [message("ai")]), null);
});
test("message order and malformed dates do not cause premature expiry", () => {
  assert.equal(chatDeadline(session, [message("visitor", 1000), message("ai")]), null);
  assert.equal(chatDeadline({ ...session, created_at: "invalid" }, []), null);
});

test("an AI handoff acknowledgement does not hide an unanswered customer request", () => {
  const question = message("visitor");
  assert.deepEqual(pendingChatQuestion([question, message("ai", 1000), message("agent", 2000, "__AGENT_JOINED__")]), question);
  assert.equal(pendingChatQuestion([question, message("agent", 3000)]), undefined);
});
