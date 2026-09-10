import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file: string, dependencies: Record<string, unknown>) {
  const exports: Record<string, any> = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, {
    exports, URL, process: { env: {} },
    require(name: string) { assert.ok(name in dependencies, name); return dependencies[name]; },
  });
  return exports;
}

function renewalApi(initial: Record<string, string>[]) {
  const rows = initial.map(row => ({ ...row }));
  const db = { from() {
    let filters: [string, unknown][] = [];
    let deleting = false;
    const query: any = {
      select: () => query,
      eq: (key: string, value: unknown) => { filters.push([key, value]); return query; },
      delete: () => { deleting = true; return query; },
      maybeSingle: async () => ({ data: rows.find(row => filters.every(([key, value]) => row[key] === value)) ?? null, error: null }),
      upsert: async (row: Record<string, string>) => {
        const existing = rows.findIndex(item => item.endpoint === row.endpoint);
        if (existing >= 0) rows[existing] = { ...row }; else rows.push({ ...row });
        return { error: null };
      },
      then: (resolve: (value: unknown) => void) => {
        if (deleting) for (let index = rows.length - 1; index >= 0; index--) {
          if (filters.every(([key, value]) => rows[index][key] === value)) rows.splice(index, 1);
        }
        resolve({ error: null });
      },
    };
    return query;
  } };
  const route = load('app/api/push/renew/route.ts', {
    'next/server': { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } },
    '@supabase/supabase-js': { createClient: () => db },
  });
  return { rows, request: (body: unknown) => route.POST({ json: async () => body }) as Promise<Response> };
}

const old = { endpoint: 'https://push.example/old', keys: { auth: 'private-old-auth', p256dh: 'old-key' } };
const next = { endpoint: 'https://push.example/new', keys: { auth: 'private-new-auth', p256dh: 'new-key' } };
const adminRow = { endpoint: old.endpoint, ...old.keys, user_agent: '[LECOMAX_ADMIN] Chrome' };

test('background rotation preserves admin audience without a login cookie and is idempotent', async () => {
  const api = renewalApi([adminRow]);
  assert.equal((await api.request({ oldSubscription: old, subscription: next })).status, 200);
  assert.equal(api.rows.length, 1);
  assert.equal(api.rows[0].endpoint, next.endpoint);
  assert.equal(api.rows[0].user_agent, adminRow.user_agent);
  assert.equal((await api.request({ oldSubscription: old, subscription: next })).status, 200);
});

test('knowing an endpoint alone cannot rotate an admin subscription', async () => {
  const api = renewalApi([adminRow]);
  assert.equal((await api.request({ oldSubscription: { ...old, keys: { ...old.keys, auth: 'wrong' } }, subscription: next })).status, 403);
  assert.deepEqual(api.rows, [adminRow]);
});

test('customer rotation cannot request promotion into the admin audience', async () => {
  const api = renewalApi([{ ...adminRow, user_agent: 'Customer Chrome' }]);
  assert.equal((await api.request({ oldSubscription: old, subscription: next, user_agent: '[LECOMAX_ADMIN] forged' })).status, 200);
  assert.equal(api.rows[0].user_agent, 'Customer Chrome');
  assert.equal((await api.request({ oldSubscription: old, subscription: { ...next, endpoint: 'http://insecure.example' } })).status, 400);
});

test('admin test requires a device and never silently broadcasts', async () => {
  const recipients: string[] = [];
  const route = load('app/api/admin/push-test/route.ts', {
    'next/server': { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } },
    '@/lib/request-auth': { isAdminRequest: async () => true },
    '@/lib/push-notifications': { broadcastAdminPushNotification: async (_: unknown, endpoint: string) => { recipients.push(endpoint); return { sent: 1 }; } },
  });
  assert.equal((await route.POST({ json: async () => ({}) })).status, 400);
  assert.equal((await route.POST({ json: async () => ({ endpoint: next.endpoint }) })).status, 200);
  assert.deepEqual(recipients, [next.endpoint]);
});

function worker() {
  const listeners: Record<string, (event: any) => void> = {};
  const pending = new Map<string, any>();
  const requests: any[] = [];
  let online = false;
  let focused = false;
  const indexedDB = { open() {
    const request: any = {};
    queueMicrotask(() => {
      request.result = { close() {}, transaction() {
        const transaction: any = { objectStore: () => ({
          getAll: () => ({ result: [...pending.values()] }),
          put: (item: any) => { pending.set(item.id, item); return {}; },
          delete: (id: string) => { pending.delete(id); return {}; },
        }) };
        queueMicrotask(() => transaction.oncomplete());
        return transaction;
      } };
      request.onsuccess();
    });
    return request;
  } };
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    URL, indexedDB, AbortSignal,
    fetch: async (_: string, init: RequestInit) => {
      requests.push(JSON.parse(String(init.body)));
      if (!online) throw new Error('offline');
      return { ok: true };
    },
    self: {
      location: { origin: 'https://shop.example' },
      addEventListener: (name: string, fn: any) => { listeners[name] = fn; },
      registration: {
        pushManager: { subscribe: () => assert.fail('Use the browser-provided newSubscription') },
        sync: { register: async () => undefined },
      },
      clients: {
        matchAll: async () => [{ url: 'https://shop.example/admin/orders/', focus: async () => { focused = true; } }],
        openWindow: () => assert.fail('Existing target window should be focused'),
      },
    },
  });
  return {
    pending, requests, isFocused: () => focused, connect: () => { online = true; },
    async dispatch(name: string, props: any) {
      let completion;
      listeners[name]({ ...props, waitUntil: (promise: Promise<unknown>) => { completion = promise; } });
      await completion;
    },
  };
}

test('worker stores offline renewal and replays it on reconnect without losing old credentials', async () => {
  const sw = worker();
  await sw.dispatch('pushsubscriptionchange', {
    oldSubscription: { ...old, toJSON: () => old },
    newSubscription: { toJSON: () => next },
  });
  assert.equal(sw.pending.size, 1);
  sw.connect();
  await sw.dispatch('message', { data: { type: 'RETRY_PUSH_RENEWAL' } });
  assert.equal(sw.pending.size, 0);
  assert.deepEqual(sw.requests.at(-1), { oldSubscription: old, subscription: next });
});

test('notification click resolves relative URLs before reusing an open admin page', async () => {
  const sw = worker();
  await sw.dispatch('notificationclick', { notification: { close() {}, data: { url: '/admin/orders/' } } });
  assert.equal(sw.isFocused(), true);
});
