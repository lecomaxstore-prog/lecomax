const { test } = require('node:test'); const assert = require('node:assert/strict'); const fs = require('node:fs'); const vm = require('node:vm');
const { load, ts } = require('../scripts/inspect.cjs'); const { reply } = require('./fixtures/tutor.cjs');
function route({ owner = 'owner', limit = null, budgetError, response, input, providerError, events } = {}) {
  const calls = []; const logs = [];
  const deps = { 'next/server': {}, 'openai': class { constructor(options) { calls.push(['client', options.maxRetries]); this.responses = { create: async (body, options) => { calls.push(['provider', body, options]); if (providerError) throw new Error(providerError); if (events) return { controller: { abort: () => calls.push(['aborted']) }, async *[Symbol.asyncIterator]() { for (const e of events) yield e; } }; return response || { status: 'completed', output_text: JSON.stringify(reply), model: 'fixture', usage: { input_tokens: 100, output_tokens: 200 } }; } }; } },
    '@/lib/request-body': { readJsonLimited: async () => input || { mode: 'zero', language: 'en', message: 'Teach fractions' } },
    '@/lib/learning-mobile-auth': { mobileOwner: async () => owner, mobileJson: (body, status = 200) => ({ body, status }) },
    '@/lib/sensitive-rate-limit': { sensitiveRateLimit: async () => limit },
    '@/lib/ai-tutor-security': { assertTutorContentSafe: () => {} },
    '@/lib/tutor-workspace': load('lib/tutor-workspace.ts'),
    '@/lib/tutor-budget': { reserveTutorBudget: async () => { calls.push(['budget']); if (budgetError) throw new Error(budgetError); return { remaining: 100, reserved: 100 }; } },
    '@/lecomax-learning-app/utils/tutor-contract': load('lecomax-learning-app/utils/tutor-contract.ts'),
    '@/lecomax-learning-app/utils/tutor-stream': load('lecomax-learning-app/utils/tutor-stream.ts'),
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../../app/api/learning-mobile/tutor/route.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, { exports, require: n => deps[n], process: { env: { OPENAI_API_KEY: 'fixture' } }, Buffer, AbortSignal, Response, ReadableStream, TextEncoder, console: { info: (...v) => logs.push(v), warn: (...v) => logs.push(v) } });
  return { post: () => exports.POST({ signal: new AbortController().signal, headers: new Headers(events ? { accept: 'application/x-ndjson' } : {}) }), calls, logs };
}
test('tutor authenticates and limits before provider work', async () => {
  for (const options of [{ owner: null }, { limit: { status: 429 } }, { budgetError: 'USAGE_LIMIT' }, { budgetError: 'BUDGET_UNAVAILABLE' }, { input: { mode: 'invalid' } }]) { const r = route(options); assert((await r.post()).status >= 400); assert(!r.calls.some(c => c[0] === 'provider')); }
});
test('provider receives strict schema, cancellation, store:false and bounded retries', async () => {
  const r = route(); const result = await r.post(); assert.equal(result.status, 200); assert.equal(result.body.reply.lesson.title, 'Equal groups');
  const [, body, options] = r.calls.find(c => c[0] === 'provider'); assert.equal(body.store, false); assert.equal(body.text.format.strict, true); assert(options.signal instanceof AbortSignal); assert.equal(r.calls.find(c => c[0] === 'client')[1], 1);
  assert(!JSON.stringify(r.logs).includes('Teach fractions'));
});
test('incomplete, refused, malformed and provider failures never become saved responses', async () => {
  for (const options of [{ response: { status: 'incomplete', output_text: JSON.stringify(reply) } }, { response: { status: 'completed', output_text: '' } }, { response: { status: 'completed', output_text: '{}' } }, { providerError: 'secret internal connection detail' }]) { const result = await route(options).post(); assert.equal(result.status, 503); assert(!result.body.reply); assert(!JSON.stringify(result).includes('secret internal')); }
});
test('text and image material are actual provider inputs and external URLs are rejected', async () => {
  for (const attachment of [{ name: 'notes.txt', mime: 'text/plain', data: 'Four apples' }, { name: 'work.png', mime: 'image/png', data: 'data:image/png;base64,iVBORw0KGgo=' }]) {
    const r = route({ input: { mode: 'homework', language: 'en', message: 'Explain', attachment } }); assert.equal((await r.post()).status, 200); const content = r.calls.find(c => c[0] === 'provider')[1].input.at(-1).content; assert(content.some(c => c.image_url === attachment.data || c.text?.includes(attachment.data)));
  }
});
test('streamed drafts require a completed valid contract before a complete event', async () => {
  const answer = { ...reply, answer: 'A useful explanation. '.repeat(10) }; const json = JSON.stringify(answer);
  const r = route({ events: [{ type: 'response.output_text.delta', delta: json }, { type: 'response.completed', response: { model: 'fixture', usage: { input_tokens: 10, output_tokens: 20 } } }] });
  const response = await r.post(); const events = (await response.text()).trim().split('\n').map(JSON.parse);
  assert.equal(events[0].type, 'partial'); assert.equal(events.at(-1).type, 'complete'); assert.equal(events.at(-1).usage.estimatedUSD, null); assert(r.calls.some(c => c[0] === 'aborted'));
  const broken = await route({ events: [{ type: 'response.output_text.delta', delta: json }, { type: 'response.incomplete' }] }).post(); const lines = (await broken.text()).trim().split('\n').map(JSON.parse); assert(!lines.some(e => e.type === 'complete')); assert.equal(lines.at(-1).type, 'error');
});
