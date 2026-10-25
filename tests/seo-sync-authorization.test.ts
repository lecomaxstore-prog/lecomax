import {seoWritesAllowed} from '../operations/seo-vercel/lib/environment-target.mjs';
import { createHash } from 'node:crypto';
import { environment as targetEnvironment, credentialBinding, PROJECTS } from '../operations/seo-vercel/lib/environment-target.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Execute the actual route -> API guard -> request authorization -> policy chain.
// Only session lookup, database reads and outbound worker transport are fixtures.
function fixture(access: { owner: boolean; permissions: string[] } | null) {
  const modules: Record<string, any> = {};
  let workerCalls = 0, reads = 0;
  const environment = {APP_ENV: "production", SEO_RUNTIME_ENV: "production", SEO_WORKER_ALLOWED_ORIGIN: "https://dedicated-worker.vercel.app", SEO_WORKER_BINDING: "yddqwgdgeljkzfsmtein:" + createHash("sha256").update("https://dedicated-worker.vercel.app/api/sync\nfixture-secret-at-least-thirty-two-characters").digest("hex"), VERCEL_ENV: 'production', SEO_MANUAL_SYNC_ENABLED: 'true',
    SEO_WORKER_URL: 'https://dedicated-worker.vercel.app/api/sync',
    SEO_WORKER_CRON_SECRET: 'fixture-secret-at-least-thirty-two-characters' };
  const isolatedGlobal = {};
  function load(file: string): any {
    if (modules[file]) return modules[file];
    const exports: any = {}; modules[file] = exports;
    const mocks: Record<string, unknown> = {
      '@/operations/seo-vercel/lib/environment-target.mjs': { environment: targetEnvironment, credentialBinding, PROJECTS, seoWritesAllowed },
      'server-only': {}, 'next/server': { NextResponse: Response },
      '@/lib/admin-access': { getAdminAccess: async () => access },
      './admin-access': { getAdminAccess: async () => access },
      '@/lib/ecomedia-auth': { getEcomediaUser: async () => null },
      './admin-session': { verifySessionToken: async () => null },
      './security-log': { securityLog() {} },
      '@/lib/supabase-server': { createServerSupabaseClient: () => ({ rpc: async (name: string) => {
        assert.equal(name, 'seo_run_status'); reads++; return { data: { state: 'idle' }, error: null };
      } }) },
    };
    const links: Record<string, string> = {
      '@/lib/api-security': 'lib/api-security.ts', '@/lib/request-auth': 'lib/request-auth.ts',
      '@/lib/admin-policy': 'lib/admin-policy.ts', './admin-policy': 'lib/admin-policy.ts',
      './request-origin': 'lib/request-origin.ts',
    };
    const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: {
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    } }).outputText;
    new Function('exports', 'require', 'process', 'fetch', 'globalThis', code)(exports, (name: string) => {
      if (name in mocks) return mocks[name];
      assert.ok(links[name], 'Unexpected dependency: ' + name); return load(links[name]);
    }, { env: environment }, async () => { workerCalls++; return Response.json({ ok: true }); }, isolatedGlobal);
    return exports;
  }
  const route = load('app/api/admin/seo/sync/route.ts');
  const request = (method: string, origin = 'https://lecomax.com') => ({ method,
    url: 'https://lecomax.com/api/admin/seo/sync',
    headers: new Headers({ origin, host: 'lecomax.com' }), cookies: { get: () => access ? { value: 'fixture' } : undefined } });
  return { route, request, counts: () => ({ workerCalls, reads }) };
}

test('real shared guard chain admits owner and fully authorized staff', async () => {
  for (const access of [{ owner: true, permissions: [] },
    { owner: false, permissions: ['products.view', 'products.edit', 'categories.edit'] }]) {
    const f = fixture(access);
    assert.equal((await f.route.GET(f.request('GET'))).status, 200);
    assert.equal((await f.route.POST(f.request('POST'))).status, 200);
    assert.deepEqual(f.counts(), { workerCalls: 1, reads: 1 });
  }
});
test('real shared guard chain denies absent sessions and incomplete catalogue permissions', async () => {
  for (const access of [null, { owner: false, permissions: [] },
    { owner: false, permissions: ['products.view'] },
    { owner: false, permissions: ['products.view', 'products.edit'] }]) {
    const f = fixture(access);
    for (const method of ['GET', 'POST']) assert.equal((await f.route[method](f.request(method))).status, access ? 403 : 401);
    assert.deepEqual(f.counts(), { workerCalls: 0, reads: 0 });
  }
});
test('real mutation guard rejects foreign origins and rate-limits repeated authorized runs', async () => {
  const f = fixture({ owner: false, permissions: ['products.view', 'products.edit', 'categories.edit'] });
  assert.equal((await f.route.POST(f.request('POST', 'https://untrusted.invalid'))).status, 403);
  for (let i = 0; i < 3; i++) assert.equal((await f.route.POST(f.request('POST'))).status, 200);
  assert.equal((await f.route.POST(f.request('POST'))).status, 429);
  assert.equal(f.counts().workerCalls, 3);
});
