import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function evaluate(source: string, globals: Record<string, unknown>) {
  const exports: any = {};
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, AbortController, Date, ...globals });
  return exports;
}

function reader(fetch: any, timeoutMs = 50) {
  return evaluate(readFileSync('lib/analytics-fetch.ts', 'utf8'), {
    fetch, setTimeout: (callback: () => void) => setTimeout(callback, timeoutMs), clearTimeout,
  }).fetchAnalytics;
}

test('analytics reader requests a compact comparison and rejects HTTP and JSON errors', async () => {
  const calls: any[] = [];
  const read = reader(async (url: string, options: any) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ views: [] }) };
  });
  await read(30);
  await read(60, { previous: true });
  assert.equal(calls[0].url, '/api/analytics?days=30');
  assert.equal(calls[1].url, '/api/analytics?days=60&summary=previous');
  assert.equal(calls[0].options.cache, 'no-store');
  await assert.rejects(reader(async () => ({ ok: false, status: 401 }))(30), /401/);
  await assert.rejects(reader(async () => ({ ok: true, json: async () => { throw new Error('bad JSON'); } }))(30), /bad JSON/);
});

test('deadline cancels stalled response bodies and external cancellation reaches fetch', async () => {
  const read = reader(async (_url: string, { signal }: { signal: AbortSignal }) => ({
    ok: true,
    json: () => new Promise((_resolve, reject) => {
      if (signal.aborted) { reject(new Error('cancelled')); return; }
      signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
    }),
  }), 5);
  await assert.rejects(read(30), /cancelled/);
  const controller = new AbortController();
  const pending = read(30, { signal: controller.signal });
  await Promise.resolve();
  controller.abort();
  await assert.rejects(pending, /cancelled/);
});

function pageLoader(fetchAnalytics: any) {
  const source = ts.createSourceFile('page.tsx', readFileSync('app/admin/analytics/page.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let arrow: ts.Node | undefined;
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'load' && node.initializer && ts.isCallExpression(node.initializer)) arrow = node.initializer.arguments[0];
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(arrow);
  const state: any = {};
  const setters = Object.fromEntries(['Loading', 'LoadError', 'PrevTotals', 'Views', 'Orders', 'RecentViews', 'VisitorsToday', 'UniqueToday', 'ActiveNow', 'Sessions'].map(name => [`set${name}`, (value: unknown) => { state[name] = value; }]));
  const { load } = evaluate(`export const load = ${arrow.getText(source)};`, {
    period: 30, activeRequest: { current: null }, fetchAnalytics, ...setters,
  });
  return { load, state };
}

test('current report finishes while comparison is pending, and failed comparison keeps trends unknown', async () => {
  let failComparison!: (error: Error) => void;
  const { load, state } = pageLoader(async (_days: number, options: any) => {
    if (options.previous) return new Promise((_resolve, reject) => { failComparison = reject; });
    return { views: [{ path: '/current' }], visitors_today: 4 };
  });
  await load();
  assert.equal(state.Loading, false);
  assert.equal(state.Views[0].path, '/current');
  assert.equal(state.VisitorsToday, 4);
  assert.equal(state.PrevTotals, null);
  failComparison(new Error('comparison unavailable'));
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(state.LoadError, false);
  assert.equal(state.PrevTotals, null);
});

test('primary failure releases skeleton and retry succeeds; obsolete response cannot replace newer data', async () => {
  let attempt = 0;
  const retry = pageLoader(async () => {
    if (++attempt === 1) throw new Error('offline');
    return { views: [{ path: '/recovered' }], previous_totals: { views: 1, orders: 0, revenue: 0 } };
  });
  await retry.load();
  assert.equal(retry.state.Loading, false);
  assert.equal(retry.state.LoadError, true);
  await retry.load();
  assert.equal(retry.state.LoadError, false);
  assert.equal(retry.state.Views[0].path, '/recovered');

  let oldResolve!: (value: unknown) => void;
  let current = 0;
  const race = pageLoader(async (_days: number, options: any) => {
    if (options.previous) return { previous_totals: { views: 0, orders: 0, revenue: 0 } };
    if (++current === 1) return new Promise(resolve => { oldResolve = resolve; });
    return { views: [{ path: '/newer' }] };
  });
  const older = race.load();
  await race.load();
  oldResolve({ views: [{ path: '/obsolete' }] });
  await older;
  assert.equal(race.state.Views[0].path, '/newer');
  assert.equal(race.state.Loading, false);
});

test('summary API returns only previous totals, uses narrow projections, and retains authorization', async () => {
  const queries: any[] = [];
  let authorized = true;
  const old = new Date(Date.now() - 45 * 86_400_000).toISOString();
  const recent = new Date().toISOString();
  const fixtures: Record<string, unknown[]> = {
    page_views: [{ created_at: old }, { created_at: recent }],
    orders: [{ created_at: old, total: 15, status: 'paid' }, { created_at: old, total: 20, status: 'cancelled' }, { created_at: recent, total: 50, status: 'paid' }],
  };
  const supabase = { from: (table: string) => {
    const query: any = { table };
    const builder: any = {};
    for (const name of ['select', 'gte', 'order', 'limit', 'abortSignal']) builder[name] = (value: unknown) => { query[name] = value; return builder; };
    builder.then = (resolve: any) => { queries.push(query); return Promise.resolve({ data: fixtures[table], error: null }).then(resolve); };
    return builder;
  } };
  const { GET } = evaluate(readFileSync('app/api/analytics/route.ts', 'utf8'), {
    process: { env: {} }, AbortSignal,
    require: (name: string) => ({
      'next/server': { NextResponse: { json: (body: unknown, options?: any) => ({ body, ...options }) } },
      '@supabase/supabase-js': { createClient: () => supabase },
      '@/lib/request-auth': { isAdminRequest: async () => authorized },
    })[name as 'next/server'], URL,
  });
  const request = { url: 'https://example.test/api/analytics?days=60&summary=previous' };
  const response = await GET(request);
  assert.equal(JSON.stringify(response.body), JSON.stringify({ previous_totals: { views: 1, orders: 2, revenue: 15 } }));
  assert.equal(queries[0].select, 'created_at');
  assert.equal(queries[1].select, 'total,status,created_at');
  assert.match(response.headers['Cache-Control'], /private, no-store/);
  authorized = false;
  assert.equal((await GET(request)).status, 401);
  assert.equal(queries.length, 2);
});
