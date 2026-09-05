// Run: npm install --prefix out/support-db-qa --no-save --package-lock=false @electric-sql/pglite
// Then: node scripts/test-support-db.mjs
// Uses an isolated in-memory database; never connects to Supabase.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(new URL("../out/support-db-qa/package.json", import.meta.url));
const { PGlite } = require("@electric-sql/pglite");
const db = new PGlite();
try {
  await db.exec(`create schema auth; create table auth.users(id uuid primary key);
    create role anon; create role authenticated; create role service_role bypassrls;
    grant usage on schema public to anon, authenticated, service_role;`);
  const sql = await readFile(new URL("../supabase/migrations/20260905160000_support_delivery.sql", import.meta.url), "utf8");
  await db.exec(sql);
  await db.exec(sql);
  const user = randomUUID(), other = randomUUID(), firstId = randomUUID();
  await db.query("insert into auth.users values($1),($2)", [user, other]);
  const rpc = async (name, values) => (await db.query(
    `select public.${name}(${values.map((_, i) => `$${i + 1}`).join(",")}) as result`, values,
  )).rows[0].result;
  const input = [user, "Test Customer", "support-test@example.invalid", "Delivery", null, "Where is my order?", firstId];
  const initial = await rpc("support_start_conversation", input);
  const id = initial.conversation.id;
  assert.equal(initial.conversation.admin_unread, 1);
  assert.equal((await rpc("support_start_conversation", input)).conversation.id, id);
  assert.equal((await db.query("select count(*)::int as n from support_conversations")).rows[0].n, 1);
  await assert.rejects(() => rpc("support_start_conversation", [...input.slice(0, 5), "", randomUUID()]));
  assert.equal((await db.query("select count(*)::int as n from support_conversations")).rows[0].n, 1, "failed first message rolls back its conversation");
  await assert.rejects(() => rpc("support_read_conversation", [id, "customer", other]));
  await assert.rejects(() => rpc("support_send_message", [id, "customer", other, "Unauthorized", randomUUID()]));
  const replyId = randomUUID();
  const reply = await rpc("support_send_message", [id, "support", null, "I am checking your delivery.", replyId]);
  assert.equal((await rpc("support_send_message", [id, "support", null, "I am checking your delivery.", replyId])).message.id, reply.message.id);
  await assert.rejects(() => rpc("support_send_message", [id, "support", null, "Changed retry", replyId]));
  const adminRead = await rpc("support_read_conversation", [id, "support", null]);
  assert.equal(adminRead.messages.length, 2);
  assert.equal(adminRead.conversation.status, "waiting");
  assert.equal(adminRead.conversation.customer_unread, 1);
  assert.equal(adminRead.conversation.admin_unread, 0);
  const customerRead = await rpc("support_read_conversation", [id, "customer", user]);
  assert.equal(customerRead.conversation.customer_unread, 0);
  assert.ok(customerRead.messages.every(message => message.read_at));
  await db.query("update support_conversations set status='resolved' where id=$1", [id]);
  assert.equal((await rpc("support_read_conversation", [id, "customer", user])).messages.length, 2);
  await rpc("support_send_message", [id, "customer", user, "One more question", randomUUID()]);
  assert.equal((await rpc("support_read_conversation", [id, "support", null])).conversation.status, "open");
  await db.query(`insert into support_messages(conversation_id,sender_type,body)
    select $1,'customer','Historical message '||n from generate_series(1,505) n`, [id]);
  assert.equal((await rpc("support_read_conversation", [id, "support", null])).messages.length, 508, "history is not silently cut off at 500 messages");
  const privileges = await db.query(`select
    has_table_privilege('authenticated','public.support_messages','SELECT') as direct_read,
    has_function_privilege('anon','public.support_read_conversation(uuid,text,uuid)','EXECUTE') as anonymous_rpc,
    has_function_privilege('authenticated','public.support_send_message(uuid,text,uuid,text,uuid)','EXECUTE') as customer_rpc,
    has_function_privilege('service_role','public.support_send_message(uuid,text,uuid,text,uuid)','EXECUTE') as server_rpc`);
  assert.deepEqual(privileges.rows[0], { direct_read: false, anonymous_rpc: false, customer_rpc: false, server_rpc: true });
  console.log("PASS: migration, atomic creation, idempotent retries, ownership, replies, read receipts, resolution/reopening, full history, server-only access.");
} finally { await db.close(); }
