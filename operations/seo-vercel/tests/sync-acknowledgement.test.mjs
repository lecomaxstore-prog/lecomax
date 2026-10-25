import test from 'node:test';
import assert from 'node:assert/strict';
import { runSeoSync } from '../lib/seo-sync-worker.mjs';
import { runSeoSync as portable } from '../../../scripts/seo-sync-worker.mjs';

for (const [name, run] of [['worker', runSeoSync], ['portable', portable]]) {
  test(`${name} rejects malformed completion acknowledgements without replaying the job`, async () => {
    for (const value of [null, undefined, 0, 1, 'false', 'true', {}, []]) {
      const calls = [];
      let claimed = false;
      const result = await run(async (operation, args) => {
        calls.push({ operation, args });
        if (operation === 'claim_seo_job') {
          if (claimed) return { data: null };
          claimed = true;
          return { data: { kind: 'product', entity_id: 'one', lease_token: 'fenced-token' } };
        }
        return { data: operation === 'complete_seo_job' ? value : operation === 'reconcile_seo_queue' ? 0 : false };
      });
      assert.deepEqual(result, { reconciled: 0, completed: 0, superseded: 0, failed: 1 });
      assert.equal(calls.filter(x => x.operation === 'complete_seo_job').length, 1);
      const failure = calls.filter(x => x.operation === 'fail_seo_job');
      assert.equal(failure.length, 1);
      assert.deepEqual(failure[0].args, { p_kind: 'product', p_entity_id: 'one', p_token: 'fenced-token' });
    }
  });
}
