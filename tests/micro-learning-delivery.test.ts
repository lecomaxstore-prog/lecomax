import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { learningTipUrl } from "../lib/micro-learning.ts";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function scheduler(options: { failure?: number; paused?: boolean; expired?: boolean } = {}) {
  const history = { id: "history-1", tip_id: 1, title: "معلومة", content: "فكرة واحدة", created_at: new Date().toISOString(), delivery_state: "pending", sent_at: null };
  const deliveries = ["phone", "laptop"].map(endpoint => ({ history_id: history.id, endpoint, state: "pending", attempted_at: null as string | null }));
  const devices = deliveries.map(row => ({ endpoint: row.endpoint, admin_email: "owner", user_agent: "[LECOMAX_ADMIN] device", p256dh: "key", auth: "key" }));
  const rows: Record<string, any[]> = {
    learning_notification_history: [{ ...history, owner_email: "owner" }], learning_notification_deliveries: deliveries,
    learning_notification_settings: [{ owner_email: "owner", enabled: true, paused: options.paused ?? false, time_zone: "Europe/Paris", quiet_enabled: false, quiet_start: "22:00", quiet_end: "08:00" }], push_subscriptions: devices,
  };
  if (options.expired) rows.learning_notification_history[0].created_at = new Date(Date.now() - 700_000).toISOString();
  const db = {
    rpc: async () => ({ data: null, error: null }),
    from(table: string) {
      const filters: ((row: any) => boolean)[] = [];
      let update: any; let remove = false;
      const query: any = {
        select: () => query, order: () => query, limit: () => query,
        eq: (key: string, value: unknown) => { filters.push(row => row[key] === value); return query; },
        lt: (key: string, value: string) => { filters.push(row => row[key] !== null && row[key] < value); return query; },
        like: () => query,
        update: (value: any) => { update = value; return query; },
        delete: () => { remove = true; return query; },
        then(resolve: (result: unknown) => void) {
          const matched = rows[table].filter(row => filters.every(filter => filter(row)));
          if (update) matched.forEach(row => Object.assign(row, update));
          if (remove) rows[table] = rows[table].filter(row => !matched.includes(row));
          return Promise.resolve(resolve({ data: matched.map(row => ({ ...row })), error: null }));
        },
        async single() { return { data: rows[table].find(row => filters.every(filter => filter(row))), error: null }; },
        async maybeSingle() { return query.single(); },
      };
      return query;
    },
  };
  const sent: { endpoint: string; payload: any }[] = [];
  const module = { exports: {} as { dispatchMicroLearning: (owner: string) => Promise<unknown> } };
  runInNewContext(ts.transpileModule(readFileSync("lib/micro-learning-server.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module, exports: module.exports, Date, Intl,
    require(name: string) {
      if (name === "server-only") return {};
      if (name === "./supabase-server") return { createServerSupabaseClient: () => db };
      if (name === "./micro-learning") return { learningTipUrl };
      if (name === "./push-notifications") return { sendLearningPush: async (device: any, payload: unknown) => {
        sent.push({ endpoint: device.endpoint, payload });
        if (options.failure) throw Object.assign(new Error("delivery failure"), options.failure === -1 ? {} : { statusCode: options.failure });
      } };
      throw new Error(name);
    },
  });
  return { run: () => module.exports.dispatchMicroLearning("owner"), sent, rows, deliveries };
}

test("concurrent workers send each device once and record push acceptance", async () => {
  const state = scheduler();
  await Promise.all([state.run(), state.run()]);
  assert.equal(state.sent.length, 2);
  assert.equal(new Set(state.sent.map(row => row.endpoint)).size, 2);
  assert.equal(state.rows.learning_notification_history[0].delivery_state, "accepted");
  assert.equal(state.sent[0].payload.url, learningTipUrl(1));
  await state.run(); assert.equal(state.sent.length, 2);
});

test("uncertain sends are not retried and expired subscriptions are removed", async () => {
  for (const failure of [-1, 410]) {
    const state = scheduler({ failure });
    await state.run(); await state.run();
    assert.equal(state.sent.length, 2);
    assert.equal(state.rows.learning_notification_history[0].delivery_state, failure === -1 ? "unknown" : "failed");
    if (failure === 410) assert.equal(state.rows.push_subscriptions.length, 0);
  }
});

test("paused and stale pending lessons never dispatch late notifications", async () => {
  for (const options of [{ paused: true }, { expired: true }]) {
    const state = scheduler(options); await state.run();
    assert.equal(state.sent.length, 0);
    assert.equal(state.rows.learning_notification_history[0].delivery_state, "failed");
  }
});

test("an interrupted attempt becomes unknown without a second send", async () => {
  const state = scheduler();
  for (const delivery of state.deliveries) { delivery.state = "sending"; delivery.attempted_at = new Date(Date.now() - 180_000).toISOString(); }
  await state.run();
  assert.equal(state.sent.length, 0);
  assert.equal(state.rows.learning_notification_history[0].delivery_state, "unknown");
});
