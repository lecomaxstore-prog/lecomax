import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function loadRoute(firstError: { code: string; message: string } | null) {
  const selections: string[] = [];
  const filters: [string, unknown][] = [];
  let requests = 0;
  const query = {
    select(fields: string) { selections.push(fields); return this; },
    order() { return this; },
    eq(key: string, value: unknown) { filters.push([key, value]); return this; },
    limit(value: number) { filters.push(['limit', value]); return this; },
    then(resolve: (result: unknown) => void) {
      requests++;
      resolve(requests === 1 && firstError
        ? { data: null, error: firstError }
        : { data: [{ slug: 'running-shoe' }], error: null });
    },
  };
  const exports: Record<string, any> = {};
  const source = readFileSync(new URL('../app/api/products/route.ts', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, URL, process: { env: {} },
    require(name: string) {
      if (name === 'next/server') return { NextResponse: { json: (body: unknown, options?: { status?: number }) => ({ body, status: options?.status ?? 200 }) } };
      if (name === '@supabase/supabase-js') return { createClient: () => ({ from: () => query }) };
      return {};
    },
  });
  return { get: exports.GET, selections, filters };
}

test('legacy product schema preserves public fields, category and limit on retry', async () => {
  const route = loadRoute({ code: '42703', message: 'column products.preorder_enabled does not exist' });
  const result = await route.get({ url: 'https://store.test/api/products?active=true&category=chaussures&limit=2' });
  assert.equal(result.status, 200);
  assert.equal(route.selections.length, 2);
  assert.ok(route.selections[1].includes('stock'));
  assert.ok(!route.selections[1].includes('preorder_'));
  assert.ok(!route.selections[1].includes('*'));
  assert.ok(!route.selections[1].includes('created_by'));
  assert.deepEqual(route.filters, [['category', 'chaussures'], ['active', true], ['limit', 2]]);
});

test('migrated product schema retains preorder fields without a retry', async () => {
  const route = loadRoute(null);
  assert.equal((await route.get({ url: 'https://store.test/api/products?active=true' })).status, 200);
  assert.equal(route.selections.length, 1);
  assert.ok(route.selections[0].includes('preorder_enabled'));
});

test('public site and app catalogue also handles a missing schema-cache column', async () => {
  const route = loadRoute({ code: 'PGRST204', message: "Could not find the 'preorder_enabled' column of 'products' in the schema cache" });
  const result = await route.get({ url: 'https://store.test/api/products?active=true' });
  assert.equal(result.status, 200);
  assert.equal(route.selections.length, 2);
  for (const field of ['sizes', 'colors', 'tags', 'stock', 'color_stock']) {
    assert.ok(route.selections[1].split(',').includes(field));
  }
  assert.ok(!route.selections[1].includes('created_by'));
});

test('unrelated database errors are not hidden by a schema retry', async () => {
  const route = loadRoute({ code: '42501', message: 'permission denied' });
  assert.equal((await route.get({ url: 'https://store.test/api/products?active=true' })).status, 500);
  assert.equal(route.selections.length, 1);
});
