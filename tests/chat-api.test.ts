import { securityIo } from "./helpers/security-io.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Run the actual route handlers against an isolated in-memory PostgREST adapter.
// No test customer messages, AI requests, or notifications reach production.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nativeRequire = createRequire(import.meta.url);
type Row = Record<string, any>;
function harness(seed: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = { chat_sessions: [], chat_messages: [], ...structuredClone(seed) };
  let failUpdates = false;
  let aiReply: string | undefined;
  const aiCalls: any[] = [];
  const db = {
    from(table: string) {
      tables[table] ||= [];
      let filters: ((row: Row) => boolean)[] = [];
      let patch: Row | undefined;
      let additions: Row[] | undefined;
      let single = false;
      let optional = false;
      let limit = Infinity;
      let order: { key: string; ascending: boolean } | undefined;
      const query = {
        select(..._args: any[]) { return query; },
        eq(key: string, value: any) { filters.push(row => row[key] === value); return query; },
        neq(key: string, value: any) { filters.push(row => row[key] !== value); return query; },
        gte(key: string, value: any) { filters.push(row => row[key] >= value); return query; },
        in(key: string, values: any[]) { filters.push(row => values.includes(row[key])); return query; },
        order(key: string, options: { ascending: boolean }) { order = { key, ...options }; return query; },
        limit(value: number) { limit = value; return query; },
        single() { single = true; return query; },
        maybeSingle() { single = true; optional = true; return query; },
        update(value: Row) { patch = value; return query; },
        insert(value: Row | Row[]) { additions = Array.isArray(value) ? value : [value]; return query; },
        then(resolve: (value: any) => any, reject?: (reason: any) => any) {
          if (patch && failUpdates) return Promise.resolve({ data: null, error: { message: "database unavailable" } }).then(resolve, reject);
          let rows = tables[table].filter(row => filters.every(filter => filter(row)));
          if (additions) {
            rows = additions.map(row => ({ id: crypto.randomUUID(), status: "ai", unread_count: 0, created_at: new Date().toISOString(), last_at: new Date().toISOString(), timestamp: new Date().toISOString(), ...row }));
            tables[table].push(...rows);
          }
          if (patch) rows.forEach(row => Object.assign(row, patch));
          if (order) { const { key, ascending } = order; rows.sort((a, b) => String(a[key]).localeCompare(String(b[key])) * (ascending ? 1 : -1)); }
          rows = rows.slice(0, limit);
          const data = structuredClone(single ? rows[0] ?? null : rows);
          return Promise.resolve({ data, error: single && !rows.length && !optional ? { code: "PGRST116" } : null, count: rows.length }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  const cache = new Map<string, any>();
  function load(relative: string): any {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename);
    const compiled = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const module = { exports: {} };
    cache.set(filename, module.exports);
    const require = (id: string) => {
      const securityModule = securityIo(id); if (securityModule) return securityModule;
      if (id === "@/lib/api-security") return { protectAdminRead: async () => null, protectAdminMutation: async () => null };
      if (id === "@/lib/chat-ownership") return { chatVisitor: async () => visitor, chatVisitorToken: async () => "test-cookie", CHAT_VISITOR_COOKIE: "chat_visitor", ownsChat: async () => true };
      if (id === "@supabase/supabase-js") return { createClient: () => db };
      if (id === "@/lib/push-notifications") return { broadcastAdminPushNotification: async () => { throw new Error("Unexpected notification"); } };
      if (id === "@/lib/openai-server") return { generateSupportReply: async (input: unknown) => { aiCalls.push(input); if (aiReply === undefined) throw new Error("Unexpected AI request"); return aiReply; } };
      if (id === "@/lib/store-assistant-context") return { getStoreAssistantContext: async () => "Test store" };
      if (id.startsWith("@/")) return load(id.slice(2) + ".ts");
      if (id.startsWith(".")) return load(path.relative(root, path.resolve(path.dirname(filename), id + ".ts")));
      return nativeRequire(id);
    };
    new Function("require", "module", "exports", compiled)(require, module, module.exports);
    return module.exports;
  }
  return { tables, load, aiCalls, answerWith: (text: string) => { aiReply = text; }, failUpdates: () => { failUpdates = true; } };
}
const visitor = "test-visitor-isolated";
function session(age = 0, status = "ai") {
  const time = new Date(Date.now() - age).toISOString();
  return { id: crypto.randomUUID(), visitor_id: visitor, status, created_at: time, last_at: time, unread_count: 0 };
}
function post(data: unknown) { return new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify(data) }); }

test("website customer chat uses the shared AI connection and keeps the latest question after long conversations", async () => {
  const current = session();
  const messages = Array.from({ length: 24 }, (_, index) => ({ session_id: current.id, direction: index % 2 ? "out" : "in", body: "Earlier message " + index, sent_by: index % 2 ? "ai" : "visitor", timestamp: new Date(Date.now() - (30 - index) * 20000).toISOString() }));
  const h = harness({ chat_sessions: [current], chat_messages: messages });
  h.answerWith("Here is help with your question.");
  const response = await h.load("app/api/chat/message/route.ts").POST(post({ session_id: current.id, body: "What can you help me with today?" }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).reply, "Here is help with your question.");
  assert.equal(h.aiCalls.length, 1);
  assert.equal(h.aiCalls[0].messages.at(-1).content, "What can you help me with today?");
  assert.equal(h.aiCalls[0].messages.length, 16);
  assert.match(h.aiCalls[0].instructions, /Test store/);
});

test("start resumes an active session but fresh start closes it and creates an empty one", async () => {
  const previous = session();
  const h = harness({ chat_sessions: [previous], chat_messages: [{ session_id: previous.id, body: "Old conversation", sent_by: "visitor", timestamp: previous.created_at }] });
  const route = h.load("app/api/chat/start/route.ts");
  assert.equal((await (await route.POST(post({ visitor_id: visitor }))).json()).id, previous.id);
  const fresh = await (await route.POST(post({ visitor_id: visitor, fresh: true }))).json();
  assert.notEqual(fresh.id, previous.id);
  assert.equal(h.tables.chat_sessions.find(row => row.id === previous.id)?.status, "resolved");
  assert.equal(h.tables.chat_messages.filter(row => row.session_id === fresh.id).length, 0);
});

test("reopening after three minutes creates a new session even without client polling", async () => {
  const old = session(181_000);
  const h = harness({ chat_sessions: [old] });
  const result = await h.load("app/api/chat/start/route.ts").POST(post({ visitor_id: visitor }));
  assert.notEqual((await result.json()).id, old.id);
  assert.equal(h.tables.chat_sessions[0].status, "resolved");
});

test("poll enforces expiry and returns a closed state with no deadline", async () => {
  const old = session(181_000);
  const h = harness({ chat_sessions: [old] });
  const result = await h.load("app/api/chat/poll/[sessionId]/route.ts").GET(new Request("http://localhost"), { params: Promise.resolve({ sessionId: old.id }) });
  const data = await result.json();
  assert.equal(data.status, "resolved");
  assert.equal(data.expired, true);
  assert.equal(data.expires_at, null);
});

test("closed conversations reject visitor messages, agent replies and agent joins", async () => {
  const old = session(0, "resolved");
  const h = harness({ chat_sessions: [old] });
  for (const route of ["message", "reply", "join"]) {
    const response = await h.load("app/api/chat/" + route + "/route.ts").POST(post({ session_id: old.id, body: "Should not be sent" }));
    assert.equal(response.status, 409, route);
  }
  assert.equal(h.tables.chat_messages.length, 0);
  assert.equal(h.tables.chat_sessions[0].status, "resolved");
});

test("an expired session rejects a send made before the next client poll", async () => {
  const old = session(181_000);
  const h = harness({ chat_sessions: [old] });
  const response = await h.load("app/api/chat/message/route.ts").POST(post({ session_id: old.id, body: "Too late" }));
  assert.equal(response.status, 409);
  assert.equal(h.tables.chat_messages.length, 0);
});

test("failed cancellation never silently creates another active conversation", async () => {
  const h = harness({ chat_sessions: [session()] });
  h.failUpdates();
  const response = await h.load("app/api/chat/start/route.ts").POST(post({ visitor_id: visitor, fresh: true }));
  assert.equal(response.status, 503);
  assert.equal(h.tables.chat_sessions.length, 1);
});

test("a missing session returns 404 instead of masquerading as an empty active chat", async () => {
  const h = harness();
  const response = await h.load("app/api/chat/poll/[sessionId]/route.ts").GET(new Request("http://localhost"), { params: Promise.resolve({ sessionId: "missing" }) });
  assert.equal(response.status, 404);
});

test("an explicit request to cancel the conversation closes it and the next start is fresh", async () => {
  const current = session();
  const h = harness({ chat_sessions: [current] });
  const response = await h.load("app/api/chat/message/route.ts").POST(post({ session_id: current.id, body: "Je veux annuler la conversation" }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, "resolved");
  const next = await h.load("app/api/chat/start/route.ts").POST(post({ visitor_id: visitor }));
  assert.notEqual((await next.json()).id, current.id);
});

test("a concurrent reply prevents stale expiry from closing the client's conversation", async () => {
  const stale = session(181_000);
  const current = { ...stale, last_at: new Date().toISOString() };
  const h = harness({ chat_sessions: [current] });
  // Use the route's real Supabase adapter through a tiny loaded module.
  const route = h.load("app/api/chat/poll/[sessionId]/route.ts");
  assert.ok(route.GET);
  const helper = h.load("lib/chat-session-server.ts");
  let updated = false;
  const db = { from: () => {
    const query: any = {
      update: () => { updated = true; return query; },
      eq: () => query, select: () => query,
      maybeSingle: async () => ({ data: null, error: null }),
      single: async () => ({ data: current, error: null }),
    };
    return query;
  } };
  const result = await helper.checkChatSession(db, stale, []);
  assert.equal(updated, true);
  assert.equal(result.status, "ai");
  assert.equal(result.expires_at, null);
  assert.equal(result.expired, false);
});
