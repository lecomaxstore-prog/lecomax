// Explicit live check. Credentials stay in memory; no user conversation is sent.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { root, ts } = require('./inspect.cjs');
require('../../node_modules/@next/env').loadEnvConfig(root, false, { info() {}, error() {} });
function load(relative) {
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(js, { exports, process, require: name => name === 'server-only' ? {} : require(path.join(root, 'node_modules', name)) });
  return exports;
}
async function main() {
  const { streamTutorReply } = load('lib/ai-tutor-provider.ts');
  const { mobileTeacherInstructions } = load('lib/mobile-teacher-prompt.ts');
  const input = { language: 'ar', topic: 'nextjs', mode: 'teach', level: 'beginner', history: [], message: 'علّمني أول خطوة في Next.js من الصفر. اشرح الفرق بين المتصفح والخادم بمثال بسيط وسؤال واحد. لا تتجاوز 150 كلمة.' };
  const model = process.env.OPENAI_TEACHER_MODEL || 'gpt-6-astra';
  const stream = await streamTutorReply(mobileTeacherInstructions(input, ''), [{ role: 'user', content: input.message }], AbortSignal.timeout(75000), { model, reasoning: 'medium', maxOutputTokens: 8000 });
  let answer = '', completed = false, actualModel;
  for await (const event of stream) {
    if (event.type === 'response.output_text.delta') answer += event.delta;
    if (event.type === 'response.completed') { completed = true; actualModel = event.response.model; }
    if (['response.failed', 'response.incomplete', 'error'].includes(event.type)) throw new Error('INCOMPLETE_RESPONSE');
  }
  if (!completed || !/[\u0600-\u06ff]/.test(answer)) throw new Error('MISSING_ARABIC_REPLY');
  fs.writeFileSync(path.join(root, 'lecomax-learning-app/artifacts/teacher-live-check.json'), JSON.stringify({ model: actualModel, completed, answer }, null, 2));
  console.log(JSON.stringify({ connection: 'PASS', model: actualModel, arabic: true, characters: answer.length }));
}
main().catch(error => { console.error(JSON.stringify({ connection: 'FAILED', status: error?.status || null, code: error?.code || error?.name || 'UNAVAILABLE', configuration: !!process.env.OPENAI_API_KEY, frames: error?.stack?.split('\n').slice(1, 4) })); process.exitCode = 1; });
