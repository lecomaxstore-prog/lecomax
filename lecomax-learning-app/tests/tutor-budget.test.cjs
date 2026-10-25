const { test } = require('node:test'); const assert = require('node:assert/strict'); const fs = require('node:fs'); const vm = require('node:vm'); const crypto = require('node:crypto'); const { ts } = require('../scripts/inspect.cjs');
function setup(env, fetch) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../../lib/tutor-budget.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require: n => n === 'node:crypto' ? crypto : {}, process: { env }, fetch, AbortSignal });
  return exports.reserveTutorBudget;
}
test('daily budget reserves before calls and isolates owners', async () => {
  const reserve = setup({ NODE_ENV: 'development', TUTOR_DAILY_TOKEN_BUDGET: '100' });
  assert.equal((await reserve('one', 60)).remaining, 40); await assert.rejects(reserve('one', 41), /USAGE_LIMIT/); assert.equal((await reserve('two', 100)).remaining, 0);
});
test('production budget fails closed and uses an atomic shared reservation', async () => {
  await assert.rejects(setup({ NODE_ENV: 'production' })('owner', 10), /BUDGET_UNAVAILABLE/);
  const requests = []; const reserve = setup({ NODE_ENV: 'production', UPSTASH_REDIS_REST_URL: 'https://redis.invalid', UPSTASH_REDIS_REST_TOKEN: 'fixture' }, async (url, options) => { requests.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ result: 10 }) }; });
  await reserve('private-owner@example.test', 10); assert.equal(requests[0][0], 'EVAL'); assert(!JSON.stringify(requests).includes('private-owner')); assert.match(requests[0][1], /INCRBY/);
  const denied = setup({ NODE_ENV: 'production', UPSTASH_REDIS_REST_URL: 'https://redis.invalid', UPSTASH_REDIS_REST_TOKEN: 'fixture' }, async () => ({ ok: true, json: async () => ({ result: -1 }) })); await assert.rejects(denied('owner', 10), /USAGE_LIMIT/);
});
