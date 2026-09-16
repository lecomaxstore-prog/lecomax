import assert from "node:assert/strict";
import test from "node:test";
import { parseExpoTickets } from "../lib/expo-push-response.ts";

test("Expo acceptance requires a receipt ID and one ticket per device", () => {
  assert.deepEqual(parseExpoTickets({ data: [{ status: "ok", id: "receipt-1" }, { status: "error", details: { error: "DeviceNotRegistered" } }] }, 2), [
    { status: "ok", id: "receipt-1" }, { status: "error", details: { error: "DeviceNotRegistered" } },
  ]);
});
test("missing, truncated and invalid Expo results cannot report success", () => {
  for (const payload of [null, {}, { data: [] }, { data: [{ status: "ok" }] }, { data: [{ status: "unknown" }] }, { data: [null] }]) {
    assert.throws(() => parseExpoTickets(payload, 1), /EXPO_INVALID_TICKETS/);
  }
});
