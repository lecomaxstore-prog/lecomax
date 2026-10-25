import { pathToFileURL } from 'node:url';

// A separate scheduler invokes this bounded job. Never imported by commerce routes.
export async function runSeoSync(rpc, { maxJobs = 100 } = {}) {
  const call = async (name, args = {}) => {
    const { data, error } = await rpc(name, args);
    if (error) throw new Error('SEO_RPC_FAILED'); // Never log database details/credentials.
    return data;
  };
  const reconciled = await call('reconcile_seo_queue');
  const result = { reconciled, completed: 0, superseded: 0, failed: 0 };
  for (let i = 0; i < maxJobs; i++) {
    const job = await call('claim_seo_job');
    if (!job) break;
    const args = { p_kind: job.kind, p_entity_id: job.entity_id, p_token: job.lease_token };
    try {
      const completed = await call('complete_seo_job', args);
      result[completed ? 'completed' : 'superseded']++;
    } catch {
      result.failed++;
      // If acknowledgement fails, the durable lease expires and is reclaimed.
      await call('fail_seo_job', args);
    }
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Legacy direct RPC entry point has no shared run lease or environment boundary.
  // Retain the pure exported core for tests; use the guarded HTTP worker operationally.
  console.error('LEGACY_SEO_RUNNER_DISABLED_USE_GUARDED_HTTP_WORKER');
  process.exitCode = 1;
}
