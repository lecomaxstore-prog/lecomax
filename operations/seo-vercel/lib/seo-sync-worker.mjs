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
      // Only an explicit boolean is a durable acknowledgement. Malformed/null
      // replies are uncertain, never evidence of completion or supersession.
      if (typeof completed !== 'boolean') throw new Error('SEO_ACK_INVALID');
      result[completed ? 'completed' : 'superseded']++;
    } catch {
      result.failed++;
      // If acknowledgement fails, the durable lease expires and is reclaimed.
      await call('fail_seo_job', args);
    }
  }
  return result;
}

