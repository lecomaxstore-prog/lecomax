// Local-only comparison. Never remove attempt markers to repeat a request.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import OpenAI from 'openai';
import { validateEditorial } from '../operations/seo-vercel/lib/seo-editorial.mjs';
const require = createRequire(import.meta.url);
const base = 'artifacts/seo-premium/comparison-1792401710535';
const dir = 'artifacts/seo-premium/approved-sol61-astra-20261019';
const read = p => JSON.parse(readFileSync(p, 'utf8'));
const hash = v => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const save = (name, value) => writeFileSync(`${dir}/${name}.json`, JSON.stringify(value, null, 2), { flag: 'wx' });
const mode = process.argv[2];
if (!['--preflight', '--execute'].includes(mode)) throw Error('MODE_REQUIRED');
const plan = read(`${base}/plan.json`), source = read(`${base}/source.json`);
const requests = ['editorial-sol', 'premium'].map((tier, i) => {
  const r = read(`${base}/${tier}-request.json`);
  if (hash(r) !== plan.models[i].requestHash) throw Error('SAVED_REQUEST_DRIFT');
  return { ...r, model: i === 0 ? 'gpt-6.1-sol' : 'gpt-6-astra' };
});
if (hash(source.source) !== plan.sourceHash || source.sha256 !== plan.sourceHash || source.slug !== 'c-baasploa-course-homme') throw Error('SOURCE_DRIFT');
if (JSON.stringify({ ...requests[0], model: null }) !== JSON.stringify({ ...requests[1], model: null })) throw Error('PROMPT_MISMATCH');
const rates = [{ input: 2, cached: 0.1, write: 2.5, output: 10 }, { input: 10, cached: 1, write: 12.5, output: 50 }];
require('@next/env').loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
if (!process.env.OPENAI_API_KEY || ['SEO_AI_ENABLED', 'SEO_SYNC_ENABLED', 'SEO_EDITORIAL_ENABLED'].some(k => process.env[k] === 'true')) throw Error('UNSAFE_KEY_OR_FLAGS');
let active = -1;
const sent = new Set();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: 'https://api.openai.com/v1', maxRetries: 0, timeout: 60000,
  fetch: (url, init) => {
    const u = new URL(String(url)), method = init?.method ?? 'GET';
    if (u.origin !== 'https://api.openai.com') throw Error('ORIGIN_REJECTED');
    if (method === 'POST' && u.pathname === '/v1/responses') {
      if (mode !== '--execute' || active < 0 || sent.has(active)) throw Error('GENERATION_REJECTED');
      const body = JSON.parse(init.body);
      if (JSON.stringify(body) !== JSON.stringify(requests[active])) throw Error('REQUEST_DRIFT');
      save(`attempt-${active}`, { at: new Date().toISOString(), model: body.model, requestHash: hash(body), retries: 0, body });
      sent.add(active);
    } else if (!(method === 'GET' && requests.some(r => u.pathname === `/v1/models/${r.model}`)) && !(method === 'POST' && u.pathname === '/v1/responses/input_tokens')) throw Error('ENDPOINT_REJECTED');
    return fetch(url, { ...init, redirect: 'error' });
  }
});
async function preflight() {
  const models = [];
  for (const [i, r] of requests.entries()) {
    if (r.max_output_tokens !== 2000 || r.store !== false || r.service_tier !== 'default' || r.reasoning.effort !== 'low' || r.text.format.strict !== true || r.tools || r.previous_response_id || r.conversation) throw Error('SCOPE_REJECTED');
    const access = await client.models.retrieve(r.model);
    if (access.id !== r.model) throw Error('MODEL_UNVERIFIED');
    const count = await client.responses.inputTokens.count({ model: r.model, input: r.input, reasoning: r.reasoning, text: r.text });
    if (!Number.isSafeInteger(count.input_tokens) || count.input_tokens < 1 || count.input_tokens + 256 > 4000) throw Error('INPUT_BOUND');
    const maximumUsd = ((count.input_tokens + 256) * rates[i].write + 2000 * rates[i].output) / 1e6;
    models.push({ model: r.model, requestHash: hash(r), countedInputTokens: count.input_tokens, inputAllowance: count.input_tokens + 256, maxOutputTokens: 2000, maximumUsd, rates: rates[i] });
  }
  const maximumTotalUsd = models.reduce((s, x) => s + x.maximumUsd, 0);
  if (maximumTotalUsd > 0.15) throw Error('AUTHORIZATION_CEILING');
  return { at: new Date().toISOString(), sourceHash: source.sha256, models, maximumTotalUsd, authorizationUsd: 0.15, sdk: read('node_modules/openai/package.json').version, pricing: 'https://developers.openai.com/api/docs/pricing', paidRequests: 0 };
}
try {
  if (mode === '--preflight') {
    const report = await preflight();
    writeFileSync(`artifacts/seo-premium/sol61-preflight-${Date.now()}.json`, JSON.stringify(report, null, 2), { flag: 'wx' });
    console.log(JSON.stringify(report));
  } else {
    if (existsSync(dir)) throw Error('SINGLE_USE_DIRECTORY_EXISTS');
    const check = await preflight();
    const priorUsd = read('artifacts/seo-openai/approved-canary-one-20261019/assessment.json').estimatedCostUsd;
    if (priorUsd + check.maximumTotalUsd > 5 || priorUsd + check.maximumTotalUsd > 50) throw Error('LOCAL_BUDGET_EXHAUSTED');
    mkdirSync(dir); // Atomic cross-process single-use lock; retained forever.
    save('reservation', { ...check, knownPriorUsd: priorUsd, reservedUsd: check.maximumTotalUsd, monthlyCap: 5, lifetimeCap: 50, sharedAccountBalanceVerified: false });
    save('source', source);
    const results = [];
    for (const [i, request] of requests.entries()) {
      active = i;
      const started = performance.now();
      const result = { model: request.model, at: new Date().toISOString(), maximumUsd: check.models[i].maximumUsd };
      try {
        const response = await client.responses.create(request);
        save(`response-${i}`, response); // Save complete provider response before assessment.
        result.latencyMs = Math.round(performance.now() - started);
        result.actualModel = response.model;
        result.status = response.status;
        result.usage = response.usage;
        result.outputText = response.output_text;
        const u = response.usage, cached = u?.input_tokens_details?.cached_tokens ?? 0;
        if ([u?.input_tokens, u?.output_tokens, cached].every(n => Number.isSafeInteger(n) && n >= 0) && cached <= u.input_tokens) {
          result.conservativeEstimatedUsd = ((u.input_tokens - cached) * rates[i].write + cached * rates[i].cached + u.output_tokens * rates[i].output) / 1e6;
          const written = u.input_tokens_details?.cache_write_tokens ?? u.input_tokens_details?.cache_creation_tokens;
          if (Number.isSafeInteger(written) && written >= 0 && written + cached <= u.input_tokens) result.estimatedUsd = ((u.input_tokens - cached - written) * rates[i].input + written * rates[i].write + cached * rates[i].cached + u.output_tokens * rates[i].output) / 1e6;
        }
        try { result.content = JSON.parse(response.output_text); result.validation = validateEditorial(result.content, source.source); } catch { result.validation = { valid: false, errors: ['OUTPUT_NOT_JSON'] }; }
      } catch (error) { result.error = error?.status ? `HTTP_${error.status}` : 'LOCAL_OR_TRANSPORT_FAILURE'; result.latencyMs = Math.round(performance.now() - started); }
      result.attempted = sent.has(i);
      result.retainedCommitmentUsd = result.conservativeEstimatedUsd ?? result.maximumUsd;
      save(`result-${i}`, result);
      results.push(result);
      console.log(JSON.stringify({ model: result.model, attempted: result.attempted, status: result.status, error: result.error, latencyMs: result.latencyMs, validation: result.validation, cost: result.conservativeEstimatedUsd }));
      if (result.retainedCommitmentUsd > result.maximumUsd) break;
    }
    save('settlement', { at: new Date().toISOString(), requestsAttempted: sent.size, knownPriorUsd: priorUsd, comparisonCommitmentUsd: results.reduce((s, r) => s + r.retainedCommitmentUsd, 0), results: results.map(r => ({ model: r.model, commitmentUsd: r.retainedCommitmentUsd })), invoiceVerified: false });
  }
} catch (error) {
  console.error(JSON.stringify({ error: error?.status ? `HTTP_${error.status}` : /^[A-Z_]+$/.test(error?.message ?? '') ? error.message : 'PREFLIGHT_OR_LOCAL_FAILURE', errorType: error?.constructor?.name, causeCode: error?.cause?.code ?? error?.cause?.cause?.code, paidRequestsThisProcess: sent.size }));
  process.exitCode = 1;
}
