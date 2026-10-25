import { generateBundle } from './seo-ai-provider.mjs';

// One paid job at most per bounded run; callers already hold the shared run lease.
export async function runSeoAi(request, token, { env = process.env, generate = generateBundle, canGenerate = () => true } = {}) {
  // New editorial claims are independently disabled; do not consume/cache them
  // as deterministic results merely because the editorial runtime is off.
  const operation = env.SEO_EDITORIAL_ENABLED === 'true' ? 'seo_ai_claim_editorial_v3' : 'seo_ai_claim';
  const claimed = await request(operation, { p_run: token, p_fallback: 0 });
  if (claimed.error) throw Error('SEO_AI_STORAGE');
  if (!claimed.data) return { processed: 0, fallback: false };
  const job = claimed.data;
  // A slow claim can consume the provider/persistence reserve. Do not start a
  // paid request then; leave the fenced lease for durable expiry/recovery.
  if (!canGenerate()) throw Error('SEO_AI_TIME_BOUND');
  const result = await generate(job, { env });
  const saved = await request('seo_ai_finish', { p_run: token, p_job: job.id, p_result: result.bundle, p_provider: result.provider, p_usage: result.usage });
  if (saved.error || saved.data !== true) throw Error('SEO_AI_PERSISTENCE');
  return { processed: 1, fallback: result.provider === 'deterministic' };
}
