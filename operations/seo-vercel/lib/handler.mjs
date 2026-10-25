import { timingSafeEqual } from 'node:crypto';
import { runSeoSync } from './seo-sync-worker.mjs';
import { runSeoAi } from './seo-ai-worker.mjs';
import { environment, supabaseCredential, disabledExternalIntegrations, seoWritesAllowed } from './environment-target.mjs';
import { supabaseHeaders } from './supabase-headers.mjs';

const allowed = new Set(['reconcile_seo_queue', 'claim_seo_job', 'complete_seo_job', 'fail_seo_job']);

// Dependencies are injectable for offline tests; request input never selects a target or RPC.
export function createHandler({ env = process.env, fetcher = fetch, now = Date.now,
  log = entry => console.log(JSON.stringify(entry)), budgetMs = 45_000 } = {}) {
  // Observability must not turn a committed run into a retry or leak an error.
  const record = entry => { try { Promise.resolve(log(entry)).catch(() => {}); } catch { /* Best effort only. */ } };
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    const reply = (status, body) => res.status(status).json(body);
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return reply(405, { error: 'METHOD_NOT_ALLOWED' });
    }
    const secret = env.CRON_SECRET;
    const authorization = req.headers.authorization;
    if (!secret || secret.length < 32) return reply(503, { error: 'WORKER_NOT_CONFIGURED' });
    const expected = Buffer.from(`Bearer ${secret}`);
    const actual = Buffer.from(typeof authorization === 'string' ? authorization : '');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      return reply(401, { error: 'UNAUTHORIZED' });
    }
    // Preview deployments must never mutate the official database, even with copied secrets.
    if (!seoWritesAllowed(env) || env.SEO_SYNC_ENABLED !== 'true') {
      return reply(503, { error: 'WORKER_DISABLED' });
    }
    let project;
    try {
      const selected = environment(env);
      if (!['staging', 'production'].includes(selected) || env.SEO_RUNTIME_ENV !== selected) throw Error('DISABLED');
      disabledExternalIntegrations(env);
      const target = await supabaseCredential(env, env.SEO_SYNC_SUPABASE_URL, env.SEO_SYNC_SERVICE_ROLE_KEY,
        env.SEO_SYNC_KEY_BINDING, 'service_role');
      project = target.origin;
    } catch {
      return reply(503, { error: 'WORKER_NOT_CONFIGURED' });
    }
    const started = now();
    const deadline = AbortSignal.timeout(budgetMs);
    let budgetExhausted = false;
    let runToken;
    let stage = 'acquire';
    let finishArgs;
    const expired = () => deadline.aborted || now() - started >= budgetMs;
    const request = async (name, args, finalizing = false) => {
      if (!finalizing && expired()) {
        budgetExhausted = true;
        throw Error('WORKER_BOUND');
      }
      const response = await fetcher(`${project}/rest/v1/rpc/${name}`, {
        method: 'POST', redirect: 'error',
        headers: { ...supabaseHeaders(env.SEO_SYNC_SERVICE_ROLE_KEY), 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
        signal: finalizing ? AbortSignal.timeout(3_000) : AbortSignal.any([deadline, AbortSignal.timeout(10_000)]),
      });
      if (!response.ok) return { data: null, error: 'RPC_FAILED' };
      return { data: await response.json(), error: null };
    };
    const rpc = async (name, args) => {
      if (!allowed.has(name)) throw Error('WORKER_BOUND');
      if (expired()) {
        budgetExhausted = true;
        throw Error('WORKER_BOUND');
      }
      // Leave time for claim, completion and failure acknowledgement. Do not claim
      // another durable lease when little time remains; next daily run resumes it.
      if (name === 'claim_seo_job' && budgetMs - (now() - started) < 30_000) {
        budgetExhausted = true;
        return { data: null, error: null };
      }
      return request('seo_run_step', { p_token: runToken, p_operation: name, p_args: args });
    };
    try {
      const acquired = await request('begin_seo_run', {});
      if (acquired.error) throw Error('RUN_CONTROL_UNAVAILABLE');
      if (!acquired.data) return reply(409, { error: 'SEO_SYNC_ALREADY_RUNNING' });
      runToken = acquired.data;
      stage = 'synchronize';
      const result = await runSeoSync(rpc, { maxJobs: 100 });
      // AI is independently disabled by default and shares this durable run lease.
      // Leave room for two bounded providers, storage and finalization.
      let ai = { processed: 0, fallback: false, budgetExhausted: false, batchLimitReached: false };
      stage = 'generate';
      for (let i = 0; i < 3 && env.SEO_AI_ENABLED === 'true'; i++) {
        if (deadline.aborted || budgetMs - (now() - started) < 35_000) {
          ai.budgetExhausted = true; budgetExhausted = true; break;
        }
        const step = await runSeoAi(request, runToken, { env, canGenerate: () => {
          const available = !deadline.aborted && budgetMs - (now() - started) >= 25_000;
          if (!available) budgetExhausted = true;
          return available;
        } });
        ai.processed += step.processed; ai.fallback ||= step.fallback;
        if (!step.processed) break;
        if (i === 2) ai.batchLimitReached = true;
      }
      const batchLimitReached = result.completed + result.superseded + result.failed >= 100 || ai.batchLimitReached;
      stage = 'finalize';
      finishArgs = { p_token: runToken, p_failed: result.failed > 0,
        p_budget: budgetExhausted, p_limit: batchLimitReached };
      const finished = await request('finish_seo_run', finishArgs, true);
      if (finished.error || finished.data !== true) throw Error('RUN_FINALIZATION_FAILED');
      runToken = null;
      const entry = { at: new Date(now()).toISOString(), durationMs: now() - started, ...result, ai,
        budgetExhausted, batchLimitReached };
      record(entry);
      return reply(result.failed ? 503 : 200, entry);
    } catch {
      // Include deadline expiry during transport/body consumption, not only
      // expiry observed before starting a request.
      if (stage !== 'finalize' && expired()) budgetExhausted = true;
      // A lost acquire response may still have created a lease. No token means
      // finalization was not attempted, not proof that acquisition rolled back.
      let finalization = 'not-attempted';
      if (runToken) {
        finalization = 'unconfirmed';
        try {
          // Retry only the original finalization intent. A lost acknowledgement
          // must not turn completed/partial work into a different failed result.
          // A false acknowledgement still leaves commitment uncertain.
          const finished = await request('finish_seo_run', finishArgs ?? { p_token: runToken, p_failed: true,
            p_budget: budgetExhausted, p_limit: false }, true);
          if (!finished.error && finished.data === true) finalization = 'confirmed';
        } catch { /* An uncertain acknowledgement must not imply committed recovery. */ }
      }
      // Never return/log provider bodies, tokens, catalogue contents or raw exceptions.
      const entry = { at: new Date(now()).toISOString(), durationMs: now() - started, error: 'SEO_SYNC_RUN_FAILED', stage, finalization, budgetExhausted };
      record(entry);
      return reply(503, entry);
    }
  };
}
