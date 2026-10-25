const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { load, ts } = require('../scripts/inspect.cjs');
const { plan } = require('./fixtures/learning-journey.cjs');
test('course API requires authentication and rejects invalid courses before saving or returning them', async () => {
  let owner = 'owner', calls = 0, answer = JSON.stringify(plan());
  const exports = {};
  const deps = {
    '@/lib/request-body': { readJsonLimited: async () => ({ message: 'English', mode: 'study-plan', language: 'ar' }) },
    '@/lib/learning-mobile-auth': { mobileOwner: async () => owner, mobileJson: (body, status = 200) => Response.json(body, { status }) },
    '@/lib/learning-mobile-validation': load('lib/learning-mobile-validation.ts'),
    '@/lib/sensitive-rate-limit': { sensitiveRateLimit: async () => null },
    '@/lib/ai-tutor-security': { assertTutorContentSafe: () => {} },
    '@/lib/learning-source-context': { getLearningSourceContext: () => { throw Error('Unexpected source lookup'); } },
    '@/lib/mobile-teacher-prompt': load('lib/mobile-teacher-prompt.ts'),
    '@/lecomax-learning-app/utils/academy': load('lecomax-learning-app/utils/academy.ts'),
    '@/lib/ai-tutor-provider': { generateTutorCourse: async () => { calls++; return { answer, model: 'test' }; }, streamTutorReply: () => { throw Error('Unexpected chat stream'); } },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require('node:path').resolve(__dirname, '../../app/api/learning-mobile/teacher/route.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, process: { env: {} }, AbortSignal, require: name => { if (!(name in deps)) throw Error(name); return deps[name]; } });
  const request = { signal: new AbortController().signal };
  const response = await exports.POST(request);
  assert.equal(response.status, 200);
  assert.equal(JSON.parse((await response.json()).answer).lessons.length, 3);
  answer = '{"title":"Partial course"}';
  assert.equal((await exports.POST(request)).status, 503);
  const missing = plan(); delete missing.design; answer = JSON.stringify(missing);
  assert.equal((await exports.POST(request)).status, 503);
  owner = null;
  assert.equal((await exports.POST(request)).status, 401);
  assert.equal(calls, 3);
});
