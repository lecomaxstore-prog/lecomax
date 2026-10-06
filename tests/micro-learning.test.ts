import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { runInNewContext } from "node:vm";
import { DEFAULT_LEARNING_SETTINGS, validateLearningSettings, learningProgress, learningTipUrl } from "../lib/micro-learning.ts";
import { MICRO_LEARNING_TIPS } from "../lib/micro-learning-curriculum.ts";

test("curriculum is stable, Arabic, ordered and small enough for Web Push", () => {
  assert.equal(MICRO_LEARNING_TIPS.length, 102);
  const sources = new Set<string>();
  for (const [index, tip] of MICRO_LEARNING_TIPS.entries()) {
    assert.equal(tip.id, index + 1);
    assert.equal(tip.level, Math.floor(index / 3) + 1);
    assert.match(tip.title, /[\u0600-\u06ff]/);
    assert.match(tip.content, /[\u0600-\u06ff]/);
    assert.ok(Buffer.byteLength(JSON.stringify({ title: tip.title, body: tip.content, url: learningTipUrl(tip.id) }), "utf8") < 3000);
    assert.ok(!sources.has(tip.content)); sources.add(tip.content);
    assert.doesNotThrow(() => readFileSync(tip.source_path));
  }
  assert.ok(MICRO_LEARNING_TIPS.filter(tip => tip.title.startsWith("❓")).length < 15);
});

test("settings validate frequency, quiet times, timezone, and strip client identity", () => {
  assert.equal(DEFAULT_LEARNING_SETTINGS.interval_minutes, 10);
  for (const interval_minutes of [10,20,30,60]) assert.ok(validateLearningSettings({ ...DEFAULT_LEARNING_SETTINGS, interval_minutes }));
  for (const value of [{ interval_minutes: 1 }, { enabled: "true" }, { time_zone: "not-a-zone" }, { quiet_start: "24:00" }, { quiet_end: "22:00" }]) {
    assert.equal(validateLearningSettings({ ...DEFAULT_LEARNING_SETTINGS, ...value }), null);
  }
  assert.equal((validateLearningSettings({ ...DEFAULT_LEARNING_SETTINGS, owner_email: "attacker" }) as unknown as Record<string, unknown>).owner_email, undefined);
});

test("learning progress counts understanding separately from sending", () => {
  const history = MICRO_LEARNING_TIPS.slice(0, 4).map(tip => ({ id: String(tip.id), tip_id: tip.id, title: tip.title, content: tip.content, topic: tip.topic, level: tip.level, created_at: "2026-10-06", sent_at: "2026-10-06", read_at: null, learned_at: tip.id <= 3 ? "2026-10-06" : null, favorite: false, delivery_state: "accepted" }));
  assert.deepEqual(learningProgress(MICRO_LEARNING_TIPS, history), { learned: 3, received: 4, topics: 1, total: 102, level: 2, percent: 3 });
});

test("database scheduling is idempotent, preserves timers, scopes devices and obeys quiet hours", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated; create role service_role; create table push_subscriptions(endpoint text primary key, admin_email text, user_agent text);");
    await db.exec(readFileSync("supabase/migrations/20261006120000_micro_learning.sql", "utf8"));
    await db.exec(readFileSync("supabase/migrations/20261006121000_micro_learning_content.sql", "utf8"));
    const settings = { ...DEFAULT_LEARNING_SETTINGS, enabled: true, quiet_enabled: false };
    const save = async (value = settings) => db.query("select save_micro_learning_settings('owner', $1::jsonb)", [JSON.stringify(value)]);
    const claim = async () => (await db.query<{ id: string | null }>("select claim_micro_learning('owner') as id")).rows[0].id;
    const due = async () => db.exec("update learning_notification_settings set next_due_at=now()-interval '1 minute' where owner_email='owner';");
    await save();
    assert.equal(await claim(), null);
    await due();
    assert.equal(await claim(), null, "no device must not consume a lesson");
    await db.exec("insert into push_subscriptions values ('device-a','owner','[LECOMAX_ADMIN] phone'),('device-b','owner','[LECOMAX_ADMIN] laptop'),('other','someone-else','[LECOMAX_ADMIN] other'),('customer','owner','customer');");
    const results = await Promise.all([claim(), claim(), claim()]);
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal((await db.query<{ count: number }>("select count(*)::integer as count from learning_notification_deliveries")).rows[0].count, 2);
    const timer = (await db.query("select next_due_at from learning_notification_settings")).rows[0];
    await save();
    assert.deepEqual((await db.query("select next_due_at from learning_notification_settings")).rows[0], timer, "saving unchanged settings cannot reset the timer");
    await due(); await save({ ...settings, paused: true }); assert.equal(await claim(), null);
    await save(); assert.equal(await claim(), null, "resume waits the configured interval");
    await due(); await save({ ...settings, enabled: false }); assert.equal(await claim(), null);
    await save(); await due();
    assert.ok(await claim());
    assert.deepEqual((await db.query("select tip_id from learning_notification_history order by tip_id")).rows, [{ tip_id: 1 }, { tip_id: 2 }]);
    // A whole-day window around the current instant, tested in a real PostgreSQL timezone.
    await db.exec("update learning_notification_settings set quiet_enabled=true, time_zone='Europe/Paris', quiet_start=((now() at time zone 'Europe/Paris')-interval '1 hour')::time, quiet_end=((now() at time zone 'Europe/Paris')+interval '1 hour')::time, next_due_at=now()-interval '1 minute';");
    assert.equal(await claim(), null);
    await assert.rejects(db.query("select save_micro_learning_settings('owner', $1::jsonb)", [JSON.stringify({ ...settings, time_zone: "invalid" })]), /Invalid time zone/);
    for (const hour of [23, 7, 8]) {
      const zone = (await db.query<{ name: string }>("select name from pg_timezone_names where name like 'Etc/%' and extract(hour from now() at time zone name)=$1 limit 1", [hour])).rows[0].name;
      await db.query("update learning_notification_settings set quiet_start='22:00', quiet_end='08:00', time_zone=$1, next_due_at=now()-interval '1 minute'", [zone]);
      if (hour < 8 || hour >= 22) assert.equal(await claim(), null, "overnight quiet hours must suppress sends");
      else assert.ok(await claim(), "quiet hours end at 08:00");
    }
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role};`);
      await assert.rejects(db.query("select * from learning_notification_history"), /permission denied/);
      await assert.rejects(db.query("select claim_micro_learning('owner')"), /permission denied/);
      await db.exec("reset role;");
    }
  } finally { await db.close(); }
});

test("service worker preserves Arabic, RTL and the exact lesson destination", async () => {
  const handlers: Record<string, (event: any) => void> = {};
  let shown: any;
  let opened: string | undefined;
  const self = {
    addEventListener: (name: string, handler: (event: any) => void) => { handlers[name] = handler; },
    location: { origin: "https://lecomax.test" },
    registration: { showNotification: async (title: string, options: unknown) => { shown = { title, options }; } },
    clients: { matchAll: async () => [], openWindow: async (url: string) => { opened = url; } },
  };
  runInNewContext(readFileSync("public/sw.js", "utf8"), { self, URL, Promise, indexedDB: { open: () => { throw new Error("offline"); } } });
  let work: Promise<unknown> = Promise.resolve();
  const url = learningTipUrl(42);
  handlers.push({ data: { json: () => ({ title: "معلومة", body: "تعلم فكرة واحدة", lang: "ar", dir: "rtl", tag: "learning-tip-42", url }) }, waitUntil: (promise: Promise<unknown>) => { work = promise; } });
  await work;
  assert.equal(shown.options.dir, "rtl"); assert.equal(shown.options.lang, "ar"); assert.equal(shown.options.renotify, false);
  handlers.notificationclick({ notification: { close() {}, data: { url } }, waitUntil: (promise: Promise<unknown>) => { work = promise; } });
  await work; assert.equal(opened, `https://lecomax.test${url}`);
});
