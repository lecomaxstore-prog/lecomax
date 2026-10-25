const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { ts, load } = require('../scripts/inspect.cjs');

function setup({ owner = 'owner@example.test', limit = null, body, rows = [], failure = false } = {}) {
  const queries = [];
  const deps = {
    'next/server': {},
    '@/lib/learning-mobile-auth': { mobileOwner: async () => owner, mobileJson: (body, status = 200) => ({ body, status }) },
    '@/lib/sensitive-rate-limit': { sensitiveRateLimit: async () => limit },
    '@/lib/request-body': { readJsonLimited: async () => body },
    '@/lib/academy-backup': load('lib/academy-backup.ts'),
    '@/lib/owner-auth-database.mjs': { ownerDatabase: () => ({ query: async (sql, values) => { queries.push({ sql, values }); if (failure) throw new Error('private connection string'); return { rows }; } }) },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../../app/api/learning-mobile/progress/route.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require: name => deps[name] });
  return { handlers: exports, queries };
}
test('every backup operation authenticates and rate limits before touching data', async () => {
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const unauth = setup({ owner: null }); assert.equal((await unauth.handlers[method]({})).status, 401); assert.equal(unauth.queries.length, 0);
    const limited = setup({ limit: { status: 429 } }); assert.equal((await limited.handlers[method]({})).status, 429); assert.equal(limited.queries.length, 0);
  }
});
test('backup writes derive ownership from authentication and reject stale revisions', async () => {
  const p = load('lecomax-learning-app/utils/progress.ts').initial;
  const test = setup({ body: { revision: 7, snapshot: p, owner: 'attacker' } });
  assert.equal((await test.handlers.PUT({})).status, 409);
  assert.equal(test.queries[0].values[0], 'owner@example.test'); assert.equal(test.queries[0].values[2], 7);
  assert.match(test.queries[0].sql, /WHERE owner_id = \$1 AND revision = \$3/);
  assert.match(test.queries[0].sql, /nextval/);
});
test('invalid backups cannot mutate storage and database failures expose no secrets', async () => {
  const invalid = setup({ body: { revision: 0, snapshot: {} } });
  assert.equal((await invalid.handlers.PUT({})).status, 400); assert.equal(invalid.queries.length, 0);
  const failed = setup({ failure: true }); const response = await failed.handlers.GET({});
  assert.equal(response.status, 503); assert.equal(response.body.error, 'PROGRESS_STORAGE_UNAVAILABLE');
});
test('delete checks the inspected revision and never deletes another owner snapshot', async () => {
  const test = setup({ body: { revision: 2 }, rows: [{ revision: 2 }] });
  assert.equal((await test.handlers.DELETE({})).status, 200);
  assert.match(test.queries[0].sql, /WHERE owner_id = \$1 AND revision = \$2/);
  assert.equal(test.queries[0].values[0], 'owner@example.test');
});
