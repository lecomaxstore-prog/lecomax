import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { createRequire } from 'node:module';
import OpenAI from 'openai';
import { PGlite } from '@electric-sql/pglite';
import { generateBundle, validBundle, estimatedCost } from '../operations/seo-vercel/lib/seo-ai-provider.mjs';
const require = createRequire(import.meta.url);

// Fixed directory is a permanent single-use interlock. Never delete to retry.
const directory = 'artifacts/seo-openai/approved-canary-one-20261019';
export async function runApprovedCanary(plan) {
  if (plan.source.slug !== 'c-baasploa-course-homme' || plan.model !== 'gpt-6-luna' || plan.maxOutputTokens !== 1200) throw Error('SCOPE_MISMATCH');
  mkdirSync(directory); // EEXIST consumes no additional request.
  const save = (name, value) => writeFileSync(`${directory}/${name}.json`, JSON.stringify(value, null, 2), { flag: 'wx' });
  const report = { startedAt: new Date().toISOString(), requestedModel: plan.model, generatingRequests: 0, success: false };
  let db;
  try {
    require('@next/env').loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || process.env.SEO_AI_ENABLED === 'true' || process.env.SEO_SYNC_ENABLED === 'true') throw Error('UNSAFE_LOCAL_CONFIGURATION');
    let generations = 0;
    const client = new OpenAI({ apiKey, baseURL: 'https://api.openai.com/v1', maxRetries: 0, timeout: 15000,
      fetch: (url, init) => {
        const parsed = new URL(String(url));
        const method = init?.method ?? 'GET';
        if (parsed.origin !== 'https://api.openai.com') throw Error('ORIGIN_REJECTED');
        if (parsed.pathname === '/v1/responses' && method === 'POST') {
          if (++generations !== 1) throw Error('SECOND_GENERATION_BLOCKED');
          const body = JSON.parse(init.body);
          if (body.model !== plan.model || body.max_output_tokens !== 1200 || body.service_tier !== 'default' || body.store !== false || body.tools || body.previous_response_id || body.conversation) throw Error('REQUEST_SCOPE_REJECTED');
          save('attempt', { at: new Date().toISOString(), ceilingUsd: 0.01, retries: 0, body });
          report.generatingRequests = 1;
        } else if (!(method === 'GET' && parsed.pathname === '/v1/models/gpt-6-luna') && !(method === 'POST' && parsed.pathname === '/v1/responses/input_tokens')) throw Error('ENDPOINT_REJECTED');
        return fetch(url, { ...init, redirect: 'error' });
      },
    });
    const model = await client.models.retrieve(plan.model);
    if (model.id !== plan.model) throw Error('MODEL_UNAVAILABLE');
    report.modelAccessVerified = true;

    // GET-only source confirmation; no Supabase client or mutating RPC is used.
    const endpoint = new URL('/rest/v1/products', process.env.NEXT_PUBLIC_SUPABASE_URL);
    if (endpoint.origin !== 'https://yddqwgdgeljkzfsmtein.supabase.co') throw Error('SOURCE_ORIGIN_REJECTED');
    endpoint.search = new URLSearchParams({ select: 'id,name,slug,category,active', slug: `eq.${plan.source.slug}`, limit: '2' }).toString();
    const sourceResponse = await fetch(endpoint, { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }, redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (!sourceResponse.ok) throw Error('SOURCE_READ_FAILED');
    const rows = await sourceResponse.json();
    if (rows.length !== 1 || rows[0].active !== true || rows[0].name !== plan.source.name || rows[0].category !== plan.source.category) throw Error('SOURCE_DRIFT');
    save('source', rows[0]);

    db = new PGlite(`${directory}/local-db`);
    await db.exec('create role anon;create role authenticated;create role service_role;create table products(id text primary key,name text,slug text,category text,active boolean,stock integer);create table categories(id text primary key,name text,slug text,active boolean);');
    await db.query('insert into products values($1,$2,$3,$4,true,0)', [String(rows[0].id), plan.source.name, plan.source.slug, plan.source.category]);
    for (const file of ['supabase/alternatives/202610180002_seo_decoupled.sql','operations/seo-vercel/supabase/migrations/20261018193508_seo_worker_run_control.sql','operations/seo-vercel/supabase/migrations/202610190001_seo_ai_budget.sql']) await db.exec(readFileSync(file, 'utf8'));
    const rpc = async (name, args = []) => (await db.query(`select ${name}(${args.map((_,i) => '$'+(i+1)).join(',')}) result`, args)).rows[0].result;
    await rpc('seo_ai_enqueue', ['product',String(rows[0].id),'routine','Single explicitly approved local canary','local-owner']);
    await rpc('seo_ai_set_budget', [true,0.01,false,'local-owner']);
    const token = await rpc('begin_seo_run');
    const job = await rpc('seo_ai_claim', [token,0]);
    if (!job || Number(job.primary_reserve) !== 0.01 || job.allow_fallback) throw Error('RESERVATION_FAILED');
    let request;
    await generateBundle(job, { env: { OPENAI_API_KEY: 'capture-only' }, makeClient: async () => ({ responses: { create: async body => { request = body; throw Error('OFFLINE_CAPTURE'); } } }) });
    if (!request) throw Error('REQUEST_NOT_CAPTURED');
    const count = await client.responses.inputTokens.count({ model: request.model, input: request.input, reasoning: request.reasoning, text: request.text });
    // Exact counted request plus additional 1,024-token margin; maximum cache-write
    // price and all 1,200 output tokens, including any reasoning. No tools or history.
    const inputLimit = count.input_tokens + 1024;
    const maximumUsd = (inputLimit * 0.125 + 1200 * 0.50) / 1e6;
    if (!Number.isSafeInteger(count.input_tokens) || count.input_tokens < 1 || inputLimit > 12000 || maximumUsd >= 0.01) throw Error('COST_CEILING_UNPROVEN');
    save('preflight', { at: new Date().toISOString(), model: model.id, countedInputTokens: count.input_tokens, inputLimit, outputLimit: 1200, maximumUsd, reservedUsd: 0.01, localOnlyBudget: true, pricing: 'https://developers.openai.com/api/docs/pricing', ratesPerMillion: { input: 0.10, cacheWrite: 0.125, cached: 0.01, output: 0.50 } });
    console.log(JSON.stringify({ preflightPassed: true, countedInputTokens: count.input_tokens, maximumUsd, outputLimit: 1200 }));
    let response;
    const start = performance.now();
    const result = await generateBundle(job, { env: { OPENAI_API_KEY: apiKey }, makeClient: async () => ({ responses: { create: async body => {
      if (JSON.stringify(body) !== JSON.stringify(request)) throw Error('REQUEST_DRIFT');
      response = await client.responses.create(body, { timeout: 6000 });
      return response;
    } } }) });
    report.latencyMs = Math.round(performance.now() - start);
    report.actualModel = response?.model ?? null;
    report.responseStatus = response?.status ?? null;
    report.usage = response?.usage ?? null;
    report.conservativeEstimatedCost = response ? estimatedCost('routine', response.usage)?.usd ?? null : null;
    report.schemaValid = result.provider === 'openai' && validBundle(result.bundle, job.payload);
    report.success = report.schemaValid && response?.model === plan.model;
    report.generatedSeo = result.provider === 'openai' ? result.bundle : null;
    report.outputText = response?.output_text ?? null;
    report.uncertainCost = result.usage.some(item => item.uncertain);
    await rpc('seo_ai_finish', [token,job.id,result.bundle,result.provider,result.usage]);
    await rpc('seo_ai_set_budget', [false,0.01,false,'local-owner']);
    save('local-budget', await rpc('seo_ai_dashboard', ['product',String(rows[0].id)]));
  } catch (error) {
    report.error = error?.status ? `HTTP_${error.status}` : /^[A-Z_]+$/.test(error?.message ?? '') ? error.message : 'LOCAL_OR_TRANSPORT_FAILURE';
  } finally {
    if (db) await db.close();
    report.finishedAt = new Date().toISOString();
    save('result', report);
    console.log(JSON.stringify(report));
  }
}
