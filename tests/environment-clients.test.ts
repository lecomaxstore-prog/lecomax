import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import * as policy from '../operations/seo-vercel/lib/environment-target.mjs';

const project = policy.PROJECTS.staging;
const binding = (key: string) => project + ':' + createHash('sha256').update(key).digest('hex');
const fixture = () => ({
  APP_ENV: 'staging', NEXT_PUBLIC_APP_ENV: 'staging',
  NEXT_PUBLIC_SUPABASE_URL: `https://${project}.supabase.co`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_fixture',
  NEXT_PUBLIC_SUPABASE_KEY_BINDING: binding('sb_publishable_fixture'),
  SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_fixture',
  SUPABASE_SERVICE_KEY_BINDING: binding('sb_secret_fixture'),
});

function load(file: string, env: Record<string, string>, createClient: (...args: any[]) => any, fetcher: typeof fetch) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports: any = {};
  const mocks: Record<string, unknown> = {
    'server-only': {},
    '@supabase/supabase-js': { createClient },
    './supabase-fetch': { createSupabaseFetch: (fn: unknown) => fn },
    '../operations/seo-vercel/lib/environment-target.mjs': policy,
  };
  new Function('exports', 'require', 'process', 'fetch', code)(exports, (name: string) => {
    assert.ok(Object.hasOwn(mocks, name), name);
    return mocks[name];
  }, { env }, fetcher);
  return exports;
}

test('browser module denies unsafe configuration before constructing the SDK', () => {
  for (const patch of [
    { NEXT_PUBLIC_SUPABASE_URL: `https://${policy.PROJECTS.production}.supabase.co` },
    { NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_secret_privileged' },
    { NEXT_PUBLIC_SUPABASE_KEY_BINDING: '' },
    { NEXT_PUBLIC_APP_ENV: 'unknown' },
  ]) {
    let constructors = 0;
    assert.throws(() => load('lib/supabase.ts', { ...fixture(), ...patch }, () => {
      constructors++; return {};
    }, async () => { throw Error('NETWORK_MUST_NOT_RUN'); }), /ISOLATION/);
    assert.equal(constructors, 0);
  }
});

test('browser transport checks full fingerprint and exact origin without following redirects', async () => {
  for (const valid of [true, false]) {
    const env = fixture();
    if (!valid) env.NEXT_PUBLIC_SUPABASE_KEY_BINDING = project + ':' + '0'.repeat(64);
    let calls = 0;
    let transport!: typeof fetch;
    load('lib/supabase.ts', env, (_url, _key, options) => {
      transport = options.global.fetch; return {};
    }, async (_url, options) => {
      calls++; assert.equal(options?.redirect, 'error'); return Response.json([]);
    });
    const request = () => transport(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/products');
    if (valid) await request(); else await assert.rejects(request(), /ISOLATION/);
    await assert.rejects(transport(`https://${policy.PROJECTS.production}.supabase.co/rest/v1/products`), /ISOLATION/);
    assert.equal(calls, valid ? 1 : 0);
  }
});

test('server transport preserves deadlines and rejects key changes, bad bindings and other destinations', async () => {
  const env = fixture();
  let transport!: typeof fetch, calls = 0;
  const serverModule = load('lib/supabase-server.ts', env, (_url, _key, options) => {
    transport = options.global.fetch; return {};
  }, async (_url, options) => {
    calls++; assert.equal(options?.redirect, 'error'); assert.equal(options?.cache, 'no-store');
    assert.ok(options?.signal instanceof AbortSignal); return Response.json([]);
  });
  serverModule.createServerSupabaseClient();
  await transport(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/products');
  await assert.rejects(transport('https://untrusted.invalid/rest/v1/products'), /ISOLATION/);
  env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_changed';
  await assert.rejects(transport(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/products'), /ISOLATION/);
  assert.equal(calls, 1);
});

test('staging browser blocks Auth email/SMS flows while allowing existing fixture session reads', async () => {
  const env = fixture();
  let transport!: typeof fetch, calls = 0;
  load('lib/supabase.ts', env, (_url, _key, options) => {
    transport = options.global.fetch; return {};
  }, async () => { calls++; return Response.json({}); });
  for (const path of ['recover', 'otp', 'signup', 'resend', 'invite', 'magiclink', 'user']) {
    await assert.rejects(transport(env.NEXT_PUBLIC_SUPABASE_URL + '/auth/v1/' + path,
      { method: 'POST' }), /AUTH_DELIVERY_DISABLED/);
  }
  assert.equal(calls, 0);
  await transport(env.NEXT_PUBLIC_SUPABASE_URL + '/auth/v1/user');
  await transport(env.NEXT_PUBLIC_SUPABASE_URL + '/auth/v1/token', { method: 'POST' });
  assert.equal(calls, 2);
});
