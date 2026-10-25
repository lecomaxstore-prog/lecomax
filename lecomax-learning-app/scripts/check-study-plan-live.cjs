// Explicit opt-in live provider check; never prints credentials or saves a learner plan.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { load, ts, root } = require('./inspect.cjs');
const academy = load('lecomax-learning-app/utils/academy.ts');
const { validateMobileTeacher } = load('lib/learning-mobile-validation.ts');
const { mobileTeacherInstructions } = load('lib/mobile-teacher-prompt.ts');
function moduleFrom(file, dependencies) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, process, require: name => name in dependencies ? dependencies[name] : require(name) });
  return exports;
}
const { generateTutorCourse } = moduleFrom('lib/ai-tutor-provider.ts', { 'server-only': {} });
const service = moduleFrom('lecomax-learning-app/services/study-plan.ts', {
  '../utils/academy': academy,
  './teacher': { askTeacherReply: async (message, language, mode, file, history, options) => {
    const input = validateMobileTeacher({ message, language, mode, history, profile: options.profile, level: options.level });
    if (!input) throw new Error('INVALID_INPUT');
    return generateTutorCourse(mobileTeacherInstructions(input, ''), message, options.signal, process.env.OPENAI_TEACHER_MODEL?.trim() || 'gpt-6-astra');
  } },
});
(async () => {
  const language = process.argv[2] || 'ar';
  if (!['ar', 'en', 'fr'].includes(language)) throw new Error('INVALID_LANGUAGE');
  const started = Date.now();
  const result = await service.generateStudyPlan('English', { ...academy.freshAcademy().profile, teacherLanguage: language }, AbortSignal.timeout(185000));
  console.log(JSON.stringify({ language, title: result.title, lessons: result.lessons.length, quizQuestions: result.lessons.reduce((sum, l) => sum + l.quiz.length, 0), diagnostic: result.design.diagnostic.length, seconds: Math.round((Date.now() - started) / 1000), sample: result.lessons[0].example }));
})().catch(error => { console.error(JSON.stringify({ error: error.code || error.name, status: error.status, message: error.status ? 'Provider request failed' : error.message })); process.exitCode = 1; });
