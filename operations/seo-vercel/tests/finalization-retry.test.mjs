import { workerEnv } from './environment-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../lib/handler.mjs';

const env = workerEnv({ CRON_SECRET: 'offline-secret-at-least-32-characters', SEO_RUNTIME_ENV: 'production',
  SEO_SYNC_ENABLED: 'true', SEO_SYNC_SUPABASE_URL: 'https://yddqwgdgeljkzfsmtein.supabase.co',
  SEO_SYNC_SERVICE_ROLE_KEY: 'synthetic-only' });
const response = () => ({ setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; } });
const req = { method: 'GET', headers: { authorization: `Bearer ${env.CRON_SECRET}` } };

test('lost finalization response retries the same completion or partial intent without replaying work', async () => {
  for (const partial of [false, true]) for (const committed of [false, true]) {
    let time = 0, claims = 0;
    const finishes = [];
    const handler = createHandler({ env, now: () => time, log: () => {}, fetcher: async (url, init) => {
      const args = JSON.parse(init.body);
      if (url.endsWith('begin_seo_run')) return Response.json('synthetic-token');
      if (url.endsWith('finish_seo_run')) {
        finishes.push(args);
        if (finishes.length === 1) throw Error('lost acknowledgement');
        return Response.json(!committed);
      }
      if (args.p_operation === 'reconcile_seo_queue') {
        if (partial) time = 20_000;
        return Response.json(0);
      }
      claims++;
      return Response.json(null);
    } });
    const res = response();
    await handler(req, res);
    assert.equal(res.code, 503);
    assert.equal(finishes.length, 2);
    assert.deepEqual(finishes[1], finishes[0]);
    assert.equal(finishes[0].p_failed, false);
    assert.equal(finishes[0].p_budget, partial);
    assert.equal(res.body.finalization, committed ? 'unconfirmed' : 'confirmed');
    assert.equal(claims, partial ? 0 : 1);
  }
});

test('deadline expiry before next RPC or during transport persists the budget flag', async () => {
  for (const transportFailure of [false, true]) {
    let time = 0;
    const finishes = [];
    const handler = createHandler({ env, now: () => time, log: () => {}, fetcher: async (url, init) => {
      if (url.endsWith('begin_seo_run')) return Response.json('synthetic-token');
      if (url.endsWith('finish_seo_run')) { finishes.push(JSON.parse(init.body)); return Response.json(true); }
      time = 45_001;
      if (transportFailure) throw Error('private transport error');
      return Response.json(0);
    } });
    const res = response();
    await handler(req, res);
    assert.equal(res.code, 503);
    assert.equal(res.body.budgetExhausted, true);
    assert.equal(finishes.length, 1);
    assert.equal(finishes[0].p_budget, true);
    assert.equal(finishes[0].p_failed, true);
    assert.doesNotMatch(JSON.stringify(res.body), /private|synthetic/);
  }
});
