import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { indexNowPayload, sendIndexNow } from '../lib/indexnow.mjs';

const production = {
  APP_ENV: 'production', NEXT_PUBLIC_APP_ENV: 'production', NODE_ENV: 'production',
  VERCEL_ENV: 'production', VERCEL_TARGET_ENV: 'production',
  NEXT_PUBLIC_SITE_URL: 'https://lecomax.com', INDEXNOW_ENABLED: 'true',
  INDEXNOW_KEY: 'synthetic-verification-key',
};
const urls = ['https://lecomax.com/produit/synthetic/'];

test('IndexNow never fetches for nonproduction, absent, disabled or contradictory configuration', async () => {
  const patches = [
    ...['staging', 'preview', 'development', 'test', '', undefined].map(APP_ENV => ({ APP_ENV })),
    ...['staging', 'preview', '', undefined].map(NEXT_PUBLIC_APP_ENV => ({ NEXT_PUBLIC_APP_ENV })),
    { VERCEL_ENV: 'preview' }, { VERCEL_TARGET_ENV: 'staging' },
    { NODE_ENV: 'test' }, { NODE_ENV: 'development' }, { NODE_ENV: undefined },
    { INDEXNOW_ENABLED: undefined }, { INDEXNOW_ENABLED: 'false' },
    { INDEXNOW_KEY: undefined }, { INDEXNOW_KEY: '../bad-key' },
    { NEXT_PUBLIC_SITE_URL: undefined }, { NEXT_PUBLIC_SITE_URL: 'https://staging.example.test' },
    { NEXT_PUBLIC_SITE_URL: 'https://lecomax.com.evil.test' },
  ];
  for (const patch of patches) {
    const result = await sendIndexNow(urls, { env: { ...production, ...patch },
      fetcher: async () => { throw Error('UNEXPECTED_NETWORK'); } });
    assert.equal(result.ok, false, JSON.stringify(patch));
  }
});

test('IndexNow rejects the entire batch for unsafe host, scheme, credentials, port or malformed input', async () => {
  for (const url of ['http://lecomax.com/a', 'https://www.lecomax.com/a',
    'https://lecomax.com.evil.test/a', 'https://user:secret@lecomax.com/a',
    'https://lecomax.com:444/a', '//lecomax.com/a', '/relative',
    'https://lecomax.com/a#fragment', ' https://lecomax.com/a', 'not-a-url']) {
    assert.equal(indexNowPayload(production, [...urls, url]), null, url);
  }
  assert.equal(indexNowPayload(production, []), null);
  assert.equal(indexNowPayload(production, Array(10001).fill(urls[0])), null);
});

test('explicit production uses the fixed endpoint, bounded request and deduplicated canonical URLs', async () => {
  let calls = 0;
  const result = await sendIndexNow([...urls, ...urls], { env: production, fetcher: async (url, init) => {
    calls++;
    assert.equal(url, 'https://api.indexnow.org/indexnow');
    assert.equal(init.redirect, 'error');
    assert.equal(init.cache, 'no-store');
    assert.ok(init.signal instanceof AbortSignal);
    assert.deepEqual(JSON.parse(init.body), {
      host: 'lecomax.com', key: production.INDEXNOW_KEY,
      keyLocation: `https://lecomax.com/${production.INDEXNOW_KEY}.txt`, urlList: urls,
    });
    return new Response(null, { status: 202 });
  } });
  assert.deepEqual(result, { ok: true, status: 202 });
  assert.equal(calls, 1);
});

test('actual product-publication callback cannot submit production URLs from staging', async () => {
  const callbacks: Array<() => Promise<void>> = [];
  let requests = 0, refreshes = 0;
  const exports: any = {};
  const mocks: Record<string, unknown> = {
    'server-only': {}, 'next/cache': { revalidatePath: () => refreshes++, revalidateTag: () => refreshes++ },
    'next/server': { after: (fn: () => Promise<void>) => callbacks.push(fn) },
    '@/lib/seo': { SITE_URL: 'https://lecomax.com' },
    '@/lib/product-notification': { deliverProductNotification: async () => {} },
    '@/lib/offer-notification': { publishOfferNotification: () => {} },
    './indexnow.mjs': { sendIndexNow: (values: string[]) => sendIndexNow(values, {
      env: { ...production, APP_ENV: 'staging', NEXT_PUBLIC_APP_ENV: 'staging' },
      fetcher: async () => { requests++; throw Error('UNEXPECTED_NETWORK'); },
    }) },
  };
  const code = ts.transpileModule(readFileSync('lib/product-discovery.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('exports', 'require', 'console', code)(exports, (name: string) => {
    assert.ok(Object.hasOwn(mocks, name), name); return mocks[name];
  }, { error() {} });
  exports.publishProductDiscovery({ current: { id: 'fixture', slug: 'fixture', active: true } });
  for (const callback of callbacks) await callback();
  assert.ok(refreshes > 0);
  assert.ok(callbacks.length > 0);
  assert.equal(requests, 0);
  assert.equal((await exports.submitIndexNow(urls)).ok, false);
});

test('release CLI rejects staging submission mode before any fetch', () => {
  const script = pathToFileURL(resolve('scripts/verify-storefront-release.mjs')).href;
  const child = spawnSync(process.execPath, ['--input-type=module', '--eval',
    `globalThis.fetch=()=>{throw Error('NETWORK_MUST_NOT_RUN')};
     process.argv.push('--submit-indexnow');
     await import(${JSON.stringify(script)});`], {
    env: { ...process.env, ...production, APP_ENV: 'staging', NEXT_PUBLIC_APP_ENV: 'staging' },
    encoding: 'utf8', windowsHide: true,
  });
  assert.equal(child.status, 1);
  assert.match(child.stderr, /INDEXNOW_PRODUCTION_CONFIGURATION_REQUIRED/);
  assert.doesNotMatch(child.stderr, /NETWORK_MUST_NOT_RUN/);
});

test('admin IndexNow API preserves authorization and reports disabled submissions as 503', async () => {
  for (const authorized of [false, true]) {
    let submits = 0;
    const exports: any = {};
    const mocks: Record<string, unknown> = {
      'next/server': { NextResponse: Response },
      '@/lib/request-body': { readJsonLimited: async () => ({ urls }) },
      '@/lib/api-security': { protectAdminMutation: async () => authorized ? null : new Response(null, { status: 401 }) },
      '@/lib/product-discovery': { submitIndexNow: async () => { submits++; return { ok: false, status: 503 }; } },
    };
    const code = ts.transpileModule(readFileSync('app/api/indexnow/route.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    new Function('exports', 'require', code)(exports, (name: string) => mocks[name]);
    assert.equal((await exports.POST({})).status, authorized ? 503 : 401);
    assert.equal(submits, authorized ? 1 : 0);
  }
});
