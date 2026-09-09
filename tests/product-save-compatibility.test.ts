import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { writeProductWithSchemaCompatibility, productWriteError } from '../lib/product-schema-compatibility.ts';

const defaults = { preorder_enabled: false, preorder_estimated_at: null, preorder_message: null };
const missing = (field: string) => ({ code: 'PGRST204', message: `Could not find the '${field}' column of 'products' in the schema cache` });

for (const method of ['POST', 'PUT']) {
  test(`${method} saves decimal sizes and zero stock on the live legacy schema`, async () => {
    const writes: Record<string, any>[] = [];
    const stored = { id: '11111111-1111-4111-8111-111111111111', tags: [], colors: [], stock: 5 };
    const db = { from() {
      let payload: Record<string, any> | undefined;
      const query: any = {
        select: () => query, eq: () => query,
        update: (value: any) => { payload = value; return query; },
        insert: (value: any) => { payload = value; return query; },
        maybeSingle: async () => ({ data: stored, error: null }),
        single: async () => {
          writes.push(payload!);
          const field = Object.keys(defaults).find(key => key in payload!);
          return field ? { data: null, error: missing(field) } : { data: { ...stored, ...payload }, error: null };
        },
      };
      return query;
    } };
    const mocks: Record<string, any> = {
      'next/server': { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } },
      '@supabase/supabase-js': { createClient: () => db },
      '@/lib/api-security': { protectAdminMutation: async () => null },
      '@/lib/admin-activity': { recordAdminActivity: async () => {} },
      '@/lib/product-discovery': { publishProductDiscovery: () => {} },
    };
    function load(path: string): any {
      const exports = {};
      vm.runInNewContext(ts.transpileModule(readFileSync(resolve(path), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      }).outputText, { exports, console, process: { env: {} }, require: (name: string) => {
        if (name in mocks) return mocks[name];
        return load(name.replace('@/', '') + '.ts');
      } });
      return exports;
    }
    const route = load(method === 'POST' ? 'app/api/products/route.ts' : 'app/api/products/[id]/route.ts');
    const response = await route[method]({ json: async () => ({
      ...defaults, name: 'Test shoe', slug: 'test-shoe', price: 100, category: 'chaussures',
      sizes: ['44', '44.5', '41'], tags: [], colors: [], color_stock: {},
      size_guide_type: 'shoes', size_stock: { '44': 0, '44.5': 1, '41': 0 },
    }) }, { params: Promise.resolve({ id: stored.id }) });
    assert.equal(response.status, method === 'POST' ? 201 : 200);
    const product = await response.json();
    assert.equal(product.stock, 1);
    assert.deepEqual(product.sizes, ['44', '44.5', '41']);
    for (const tag of ['__sstock:44:0', '__sstock:44.5:1', '__sstock:41:0']) assert.ok(product.tags.includes(tag));
    assert.equal(writes.length, 4);
  });
}

test('preorder requests are never silently discarded', async () => {
  for (const change of [{ preorder_enabled: true }, { preorder_message: 'Soon' }, { preorder_estimated_at: '2026-10-01' }]) {
    let calls = 0;
    const result = await writeProductWithSchemaCompatibility({ ...defaults, ...change }, async () => {
      calls++; return { error: missing('preorder_enabled') };
    });
    assert.equal(calls, 1);
    assert.equal(productWriteError(result.error!, 'Failed').status, 409);
  }
});

test('migrated schemas save once and unrelated errors are not retried', async () => {
  for (const error of [null, { code: '23505', message: 'duplicate' }, { code: '42501', message: 'denied' }, missing('weight')]) {
    let calls = 0;
    const payload = { ...defaults, stock: 1 };
    await writeProductWithSchemaCompatibility(payload, async value => {
      calls++; assert.deepEqual(value, payload); return { error };
    });
    assert.equal(calls, 1);
    assert.deepEqual(payload, { ...defaults, stock: 1 });
  }
});
