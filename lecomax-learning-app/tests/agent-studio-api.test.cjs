const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { load } = require('../scripts/inspect.cjs');
test('Studio endpoint gates auth, consent, credentials and live switch before any provider call', async () => {
  const base = 'lecomax-learning-app/features/agent-studio/';
  const core = load(base + 'core.ts');
  const { templates } = load(base + 'curriculum.ts');
  let owner = null,
    limited = null,
    body = {
      config: templates[0].config,
      input: 'retrieval',
      document: 'Retrieval is practice.',
      consent: true,
    },
    calls = 0,
    safe = true;
  const env = {},
    deps = {
      '@/lib/learning-mobile-auth': {
        mobileOwner: async () => owner,
        mobileJson: (data, status = 200) => ({ data, status }),
      },
      '@/lib/request-body': {
        readJsonLimited: async (_req, limit) => {
          assert.equal(limit, 60000);
          return body;
        },
      },
      '@/lib/sensitive-rate-limit': {
        sensitiveRateLimit: async (_req, _scope, _owner, shared) => {
          assert.equal(shared, true);
          return limited;
        },
      },
      '@/lib/ai-tutor-security': {
        assertTutorContentSafe: () => {
          if (!safe) throw Error('SENSITIVE_CONTENT');
        },
      },
      '@/lecomax-learning-app/features/agent-studio/core': core,
      '@/lib/agent-studio-runtime': {
        runStudioModel: async (_c, _i, _d, _m, transport) => {
          calls++;
          await transport({ model: 'mock' });
          return {
            mode: 'live',
            status: 'complete',
            output: 'Answer',
            events: [],
            inputTokens: 100,
            outputTokens: 10,
          };
        },
      },
    };
  const exp = {};
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync('../app/api/learning-mobile/agent-studio/route.ts', 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
    ).outputText,
    {
      exports: exp,
      require: (n) => deps[n],
      process: { env },
      AbortController,
      setTimeout,
      clearTimeout,
      fetch: async (url, options) => {
        assert.equal(url, 'https://api.openai.com/v1/responses');
        assert.equal(options.headers.Authorization, 'Bearer fake-test-only');
        return { ok: true, json: async () => ({ status: 'completed', output: [] }) };
      },
    },
  );
  const req = { signal: new AbortController().signal };
  assert.equal((await exp.POST(req)).status, 401);
  assert.equal(calls, 0);
  owner = 'owner';
  limited = { status: 429 };
  assert.equal((await exp.POST(req)).status, 429);
  assert.equal(calls, 0);
  limited = null;
  body.consent = false;
  assert.equal((await exp.POST(req)).status, 400);
  body.consent = true;
  assert.equal((await exp.POST(req)).status, 503);
  assert.equal(calls, 0);
  env.AGENT_STUDIO_LIVE_ENABLED = 'true';
  assert.equal((await exp.POST(req)).status, 503);
  assert.equal(calls, 0);
  env.OPENAI_API_KEY = 'fake-test-only';
  env.OPENAI_MODEL = 'mock';
  safe = false;
  assert.equal((await exp.POST(req)).status, 400);
  assert.equal(calls, 0);
  safe = true;
  env.AGENT_STUDIO_INPUT_USD_PER_MILLION = '1';
  env.AGENT_STUDIO_OUTPUT_USD_PER_MILLION = '2';
  const result = await exp.POST(req);
  assert.equal(result.status, 200);
  assert.equal(calls, 1);
  assert.equal(result.data.run.costUSD, 0.00012);
});
