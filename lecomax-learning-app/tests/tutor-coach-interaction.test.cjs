const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
const { load } = require('../scripts/inspect.cjs');
const requests = [];
let failNext = false;
let pauseNext = false;
const coach = load('lecomax-learning-app/utils/tutor-coach.ts');
const tutorMemory = load('lecomax-learning-app/utils/tutor-memory.ts');
const { reply } = require('./fixtures/tutor.cjs');
const academy = load('lecomax-learning-app/utils/academy.ts');
const progress = load('lecomax-learning-app/utils/progress.ts');

async function harness(file, initial, params, run) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const prior = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const context = React.createContext(null); let snapshot = initial;
  const navigations = [];
  const box = ({ children }) => React.createElement('div', null, children);
  const deps = {
    'react-native': { View: box, ScrollView: box, useWindowDimensions: () => ({ width: 390, height: 844 }) },
    '../components/UI': { Page: ({ children, header }) => React.createElement('main', null, header, children), Card: box, Label: box, Row: box, ProgressBar: () => null,
      Button: ({ title, onPress, disabled, selected }) => React.createElement('button', { onClick: onPress, disabled, 'aria-pressed': !!selected }, title),
      Field: ({ value, onChangeText, placeholder }) => React.createElement('textarea', { value, 'aria-label': placeholder, onInput: e => onChangeText(e.target.value) }),
    },
    '../store/School': { useSchool: () => React.useContext(context) },
    '../utils/academy': academy, '../utils/progress': progress,
    '../utils/flashcards': load('lecomax-learning-app/utils/flashcards.ts'),
    'expo-router': { router: { replace: r => navigations.push(r), push: r => navigations.push(r) }, useLocalSearchParams: () => params },
  };
  deps['../utils/tutor-memory'] = tutorMemory;
  deps['../features/world/content'] = load('lecomax-learning-app/features/world/content.ts');
  deps['../features/curiosity/catalog'] = load('lecomax-learning-app/features/curiosity/catalog.ts');
  deps['../features/curiosity/player-model'] = load('lecomax-learning-app/features/curiosity/player-model.ts');
  deps['../utils/tutor-contract'] = load('lecomax-learning-app/utils/tutor-contract.ts');
  deps['../utils/tutor-coach'] = coach;
  deps['../utils/tutor-context'] = load('lecomax-learning-app/utils/tutor-context.ts');
  deps['../components/CloudProgress'] = { CloudProgress: () => React.createElement('div', null, 'Cloud backup controls') };
  deps['../services/tutor'] = { requestTutor: async (session, message, options) => {
    requests.push({message, options});
    if (pauseNext) { pauseNext = false; await new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(Error('ABORTED')), { once: true })); }
    if (failNext) { failNext=false; throw Error('TEACHER_UNAVAILABLE'); }
    return { model: 'test fixture', reply: { ...reply, lesson: null, quiz: [], roadmap: [], answer: options.action === 'coach:recap' ? 'You practiced equal groups. Review your saved cards.' : 'Explain why halves must be equal?', evaluation: options.action === 'coach:answer' ? { concept: 'Fractions', verdict: message.includes('unequal') ? 'incorrect' : 'correct', feedback: 'A half is one of two equal parts.', misconception: 'Unequal pieces', nextExercise: 'Split six apples equally.' } : null } };
  } };
  deps['../components/TeacherMessage'] = { TeacherMessage: ({content}) => React.createElement('div',null,content) };
  deps['../components/TutorMedia'] = { TutorMedia: () => null };
  deps['../components/TutorDiagram'] = { TutorDiagram: () => null };
  deps['./UI'] = { ...deps['../components/UI'], IconButton: ({ label, onPress }) => React.createElement('button', { onClick: onPress }, label), ListItem: ({ title, onPress }) => React.createElement('button', { onClick: onPress }, title) };
  for (const [name, component] of [['./PracticeLaunchpad', 'PracticeLaunchpad'], ['../features/wellness/DailyRoutineCard', 'DailyRoutineCard'], ['../features/ConnectionStatus', 'ConnectionStatus'], ['../features/LearningReminder', 'LearningReminder'], ['./ChangeHistory', 'ChangesMade']]) deps[name] = { [component]: () => null };
  deps['../services/discovery'] = { subjects: [], recommendation: () => null };
  deps['./AcademySignature'] = { AcademyEmblem: () => null, IconTile: () => null, MetricCard: ({ value, label }) => React.createElement('div', null, value, ' ', label), ToolCard: ({ title, onPress }) => React.createElement('button', { onClick: onPress }, title) };
  deps['./LearningUI'] = { SectionHeader: ({ title, action, onPress }) => React.createElement('div', null, title, action && React.createElement('button', { onClick: onPress }, action)) };
  deps['../services/content'] = { lessons: [] };
  deps['../services/course-library'] = { library: [] };
  deps['../utils/learning-memory'] = { dueReviews: () => [] };
  const coachExports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../components/TutorCoach.tsx'),'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, { exports: coachExports, require: name => deps[name] || require(name) });
  deps['../components/TutorCoach'] = coachExports;
  const cardExports = {};
  deps['./TeacherMessage'] = deps['../components/TeacherMessage'];
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../components/TutorTeachingCard.tsx'),'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, { exports: cardExports, require: name => deps[name] || require(name) });
  deps['../components/TutorTeachingCard'] = cardExports;
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve(file), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, { exports, setInterval, clearInterval, setTimeout, clearTimeout, AbortController, require: name => deps[name] || require(name) });
  function Harness() { const [state, update] = React.useState(snapshot); snapshot = state; return React.createElement(context.Provider, { value: { state, update, ready: true, saveStatus: 'saved', t: (_fr, en) => en, colors: {}, rtl: false } }, React.createElement(exports.default || exports.AcademyDashboard)); }
  let root = createRoot(document.getElementById('root'));
  const button = text => [...document.querySelectorAll('button')].find(b => b.textContent === text);
  const click = async text => { assert(button(text), `Missing button: ${text}`); await React.act(() => button(text).click()); };
  const input = async (label, text) => { const field = [...document.querySelectorAll('textarea')].find(e => e.getAttribute('aria-label') === label); assert(field, label); await React.act(() => { field.value = text; field.dispatchEvent(new dom.window.Event('input', { bubbles: true })); }); };
  try {
    await React.act(() => root.render(React.createElement(Harness)));
    await run({ button, click, input, get: () => snapshot, navigations, remount: async () => { await React.act(() => root.unmount()); snapshot = progress.readProgress(JSON.stringify(snapshot)); root = createRoot(document.getElementById('root')); await React.act(() => root.render(React.createElement(Harness))); } });
  } finally { await React.act(() => root.unmount()); dom.window.close(); Object.assign(global, prior); }
}


test('verification opens executable tools without awarding evidence or changing the pending question', async () => {
  const teaching = { ...require('./fixtures/tutor.cjs').teaching, kind: 'code-challenge' };
  const s = { ...tutorMemory.newTutorSession('Async/await', 'socratic', 1000), coach: { ...coach.newCoach(), awaiting: true, prompt: teaching.question } };
  s.reply = { ...reply, teaching, lesson: null, quiz: [] };
  await harness('../app/tutor.tsx', { ...progress.initial, tutor: { ...tutorMemory.emptyTutor(), active: s.id, sessions: [s] } }, {}, async h => {
    const before = JSON.stringify(h.get());
    await h.click('Open the studio to run code');
    assert.equal(h.navigations.at(-1), '/interactive-studio');
    await h.click('How to check this answer');
    assert(document.body.textContent.includes('tool results are not automatically sent to the tutor'));
    for (const [label, tool] of [['JavaScript', 'javascript'], ['Python', 'python'], ['Math tools', 'math']]) {
      await h.click(label);
      assert.equal(h.navigations.at(-1).pathname, '/interactive-studio');
      assert.equal(h.navigations.at(-1).params.tool, tool);
    }
    assert.equal(JSON.stringify(h.get()), before);
    await h.remount();
    assert.equal(h.get().tutor.sessions[0].coach.prompt, teaching.question);
    assert.equal(h.get().tutor.concepts.length, 0);
  });
});

test('full guided tutor journey waits, adapts, retries, preserves privacy and resumes', async () => {
  requests.length=0;
  const s=tutorMemory.newTutorSession('Fractions','zero',1000);
  await harness('../app/tutor.tsx',{ ...progress.initial, language:'en', tutor:{...tutorMemory.emptyTutor(),active:s.id,sessions:[s]} },{},async h => {
    await h.click('Start guided teaching');
    await h.click('Expert depth');
    await h.click('Share learning context: on');
    await h.click('Continue guided teaching');
    assert.equal(requests.at(-1).options.profile,undefined);
    assert.equal(h.get().tutor.sessions[0].coach.awaiting,true);
    assert(!h.button('Continue guided teaching'));
    const respond=async text=> { await h.input('Your question, answer, or attempt\u2026',text); await h.click('Send'); };
    await respond('I think unequal pieces work');
    assert.equal(h.get().tutor.sessions[0].coach.phase,'concept');
    await h.click('Continue guided teaching');
    await h.click('Teach through a story');
    assert.equal(h.get().tutor.sessions[0].coach.awaiting,true);
    failNext=true; await respond('Two equal parts');
    assert.equal(h.get().tutor.sessions[0].draft,'Two equal parts');
    await h.click('Retry');
    assert.equal(h.get().tutor.sessions[0].coach.phase,'teachback');
    await h.remount();
    assert.equal(h.get().tutor.sessions[0].coach.depth,'expert');
    for(let i=0;i<3;i++) { await h.click('Continue guided teaching'); await respond('Two equal parts'); }
    assert.equal(h.get().tutor.sessions[0].coach.phase,'recap');
    await h.click('Continue guided teaching');
    assert(document.body.textContent.includes('Review your saved cards'));
    assert.equal(h.get().tutor.sessions[0].coach.outcomes.length,5);
    assert.equal(h.get().flashcards.cards.length,5);
    assert.equal(h.get().tutor.concepts[0].independent,0);
  });
});

test('quiz hint ladder reveals one step and assessment creates a persisted review card', async () => {
 const s=tutorMemory.newTutorSession('Fractions','zero',1000);
 const q={...require('./fixtures/tutor.cjs').quiz,hints:['First small hint','Second hint','Third hint']};
 s.reply={...reply,lesson:null,quiz:[q]};
 await harness('../app/tutor.tsx',{...progress.initial,tutor:{...tutorMemory.emptyTutor(),active:s.id,sessions:[s]}},{},async h=>{
   await h.click('Hint'); assert(document.body.textContent.includes('First small hint')); assert(!document.body.textContent.includes('Second hint'));
   await h.click('Next hint'); assert(document.body.textContent.includes('Second hint')); assert(!document.body.textContent.includes('Third hint'));
   await h.click('Two'); assert.equal(h.get().tutor.concepts[0].independent,0); assert.equal(h.get().flashcards.cards.length,1);
   await h.remount(); assert.equal(h.get().flashcards.cards.length,1);
 });
});

test('teaching cards, reflection, mode switching and interrupted requests preserve learning evidence', async () => {
  const teaching = require('./fixtures/tutor.cjs').teaching;
  const s = { ...tutorMemory.newTutorSession('Async/await', 'socratic', 1000), coach: { ...coach.newCoach(), awaiting: true, prompt: teaching.question } };
  s.reply = { ...reply, teaching, lesson: null, quiz: [] };
  await harness('../app/tutor.tsx', { ...progress.initial, tutor: { ...tutorMemory.emptyTutor(), active: s.id, sessions: [s] } }, {}, async h => {
    assert(document.body.textContent.includes(teaching.question));
    assert(!document.body.textContent.includes(teaching.hints[0]));
    await h.click('Next teaching hint'); assert(document.body.textContent.includes(teaching.hints[0]));
    assert(!document.body.textContent.includes(teaching.hints[1]));
    await h.remount(); assert.equal(h.get().tutor.sessions[0].coach.hintsUsed, 1);
    await h.input('What felt easy?', 'Syntax'); await h.input('What felt difficult?', 'Promise resolution');
    await h.remount(); assert.equal(h.get().tutor.sessions[0].coach.reflection.difficult, 'Promise resolution');
    await h.click('Reflect on my evidence'); assert.equal(requests.at(-1).options.action, 'coach:reflection');
    assert.equal(h.get().tutor.sessions[0].coach.outcomes.length, 0); assert.equal(h.get().tutor.sessions[0].coach.awaiting, true);
    await h.click('Change teaching mode'); await h.click('Expert mode'); assert.equal(h.get().tutor.sessions[0].mode, 'expert');
    await h.input('Your question, answer, or attempt\u2026', "I don't understand"); await h.click('Send');
    assert.equal(requests.at(-1).options.action, 'different'); assert.equal(h.get().tutor.sessions[0].coach.outcomes.length, 0);
    await h.input('Your question, answer, or attempt\u2026', 'My unfinished answer'); pauseNext = true;
    await h.click('Send'); await h.click('Cancel');
    assert.equal(h.get().tutor.sessions[0].draft, 'My unfinished answer'); assert.equal(h.get().tutor.sessions[0].coach.awaiting, true);
    await h.click('Tutor cloud backup'); assert(document.body.textContent.includes('Cloud backup controls'));
  });
});
