const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
const { load } = require('../scripts/inspect.cjs');
const academy = load('lecomax-learning-app/utils/academy.ts');
const progress = load('lecomax-learning-app/utils/progress.ts');
const roadmap = load('lecomax-learning-app/services/learning-roadmap.ts');

async function harness(file, initial, params, run) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const prior = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const context = React.createContext(null); let snapshot = initial;
  const navigations = [];
  const box = ({ children }) => React.createElement('div', null, children);
  const deps = {
    './AcademyDestinations': { AcademyDestinations: () => null },
    '../features/curiosity/CuriosityScreen': { CuriosityEntry: () => null },
    '../utils/agent-studio': load('lecomax-learning-app/utils/agent-studio.ts'),
    '../features/universe/Overview': { UniverseOverview: () => null },
    '../features/universe/Motion': { GentleReveal: box },
    'react-native': { View: box, ScrollView: box, useWindowDimensions: () => ({ width: 390, height: 844 }) },
    '../components/UI': { Page: ({ children, header }) => React.createElement('main', null, header, children), Card: box, Label: box, Row: box, ProgressBar: () => null,
      Button: ({ title, onPress, disabled, selected }) => React.createElement('button', { onClick: onPress, disabled, 'aria-pressed': !!selected }, title),
      Field: ({ value, onChangeText, placeholder }) => React.createElement('textarea', { value, 'aria-label': placeholder, onInput: e => onChangeText(e.target.value) }),
    },
    '../store/School': { useSchool: () => React.useContext(context) },
    '../utils/academy': academy, '../utils/progress': progress,
    '../utils/learning-journey': load('lecomax-learning-app/utils/learning-journey.ts'),
    '../utils/flashcards': load('lecomax-learning-app/utils/flashcards.ts'),
    'expo-router': { router: { replace: r => navigations.push(r), push: r => navigations.push(r) }, useLocalSearchParams: () => params },
  };
  deps['./UI'] = { ...deps['../components/UI'], IconButton: ({ label, onPress }) => React.createElement('button', { onClick: onPress }, label), ListItem: ({ title, onPress }) => React.createElement('button', { onClick: onPress }, title) };
  for (const [name, component] of [['./PracticeLaunchpad', 'PracticeLaunchpad'], ['../features/wellness/DailyRoutineCard', 'DailyRoutineCard'], ['../features/ConnectionStatus', 'ConnectionStatus'], ['../features/LearningReminder', 'LearningReminder'], ['./ChangeHistory', 'ChangesMade']]) deps[name] = { [component]: () => null };
  deps['../services/discovery'] = { subjects: [], recommendation: () => null };
  deps['./AcademySignature'] = { AcademyEmblem: () => null, IconTile: () => null, MetricCard: ({ value, label }) => React.createElement('div', null, value, ' ', label), ToolCard: ({ title, onPress }) => React.createElement('button', { onClick: onPress }, title) };
  deps['./LearningUI'] = { SectionHeader: ({ title, action, onPress }) => React.createElement('div', null, title, action && React.createElement('button', { onClick: onPress }, action)) };
  deps['../services/content'] = { lessons: [] };
  deps['../services/course-library'] = { library: [] };
  deps['../services/learning-roadmap'] = roadmap;
  deps['./SyncProgress'] = { SyncProgress: () => null };
  deps['./ContinueLearning'] = { ContinueLearning: () => null };
  deps['../utils/learning-memory'] = { dueReviews: () => [] };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve(file), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, { exports, setInterval, clearInterval, require: name => deps[name] || require(name) });
  function Harness() { const [state, update] = React.useState(snapshot); snapshot = state; return React.createElement(context.Provider, { value: { state, update, ready: true, saveStatus: 'saved', t: (_fr, en) => en, colors: {}, rtl: false } }, React.createElement(exports.default || exports.JourneyDashboard || exports.AcademyDashboard)); }
  let root = createRoot(document.getElementById('root'));
  const button = text => [...document.querySelectorAll('button')].find(b => b.textContent === text);
  const click = async text => { assert(button(text), `Missing button: ${text}`); await React.act(() => button(text).click()); };
  const input = async (label, text) => { const field = [...document.querySelectorAll('textarea')].find(e => e.getAttribute('aria-label') === label); assert(field, label); await React.act(() => { field.value = text; field.dispatchEvent(new dom.window.Event('input', { bubbles: true })); }); };
  try {
    await React.act(() => root.render(React.createElement(Harness)));
    await run({ button, click, input, get: () => snapshot, navigations, remount: async () => { await React.act(() => root.unmount()); snapshot = progress.readProgress(JSON.stringify(snapshot)); root = createRoot(document.getElementById('root')); await React.act(() => root.render(React.createElement(Harness))); } });
  } finally { await React.act(() => root.unmount()); dom.window.close(); Object.assign(global, prior); }
}

test('home offers onboarding, honest empty progress and a weekly goal', async () => {
  await harness('../components/JourneyDashboard.tsx', { ...progress.initial, academy: academy.freshAcademy() }, {}, async h => {
    assert(document.body.textContent.includes('Not enough evidence yet.'));
    await h.click('Set up my learning path'); assert.equal(h.navigations.at(-1), '/onboarding');
    await h.click('Explore Other Subjects'); assert.equal(h.navigations.at(-1), '/explore');
    assert(document.body.textContent.includes('Weekly learning goal'));
  });
});

test('learning journey assesses, restores baseline, opens practice and creates a persistent recall card', async () => {
  const plan = require('./fixtures/learning-journey.cjs').plan();
  await harness('../app/learning-journey.tsx', { ...progress.initial, academy: { ...academy.freshAcademy(), plans: [plan] } }, { id: plan.id }, async h => {
    assert(h.button('Record my answer').disabled);
    await h.click('Baseline incorrect'); await h.click('Confident'); await h.click('Record my answer');
    assert(document.body.textContent.includes('Starting question 1'));
    assert(h.button('Record my answer').disabled, 'choice and confidence reset for the next question');
    await h.remount(); assert(document.body.textContent.includes('Starting question 1'));
    for (let i = 1; i < 3; i++) { await h.click('Baseline correct'); await h.click('Unsure'); await h.click('Record my answer'); }
    assert(document.body.textContent.includes('Your starting answer suggests this topic needs attention'));
    assert.equal(h.get().completed.length, 0); assert.equal(h.get().memory.evidence.length, 0);
    await h.click('Continue learning'); assert.equal(h.navigations.at(-1).pathname, '/plan-lesson');
    assert.equal(h.navigations.at(-1).params.step, '0');
    await h.click('Create recall card'); assert.equal(h.get().flashcards.cards.length, 1);
    assert.equal(h.get().flashcards.cards[0].source, 'plan-journey:0');
    await h.remount(); assert(h.button('Recall card created').disabled);
    await h.click('Open Memory Studio'); assert.equal(h.navigations.at(-1), '/memory-studio');
  });
});

test('onboarding validates a real goal, saves all preferences and survives a restart', async () => {
  await harness('../app/onboarding.tsx', { ...progress.initial, academy: academy.freshAcademy() }, {}, async h => {
    assert(h.button('Continue').disabled);
    await h.input('Name (optional)', 'Sam');
    await h.input('Speak French, learn Python, understand mathematics…', 'Understand algebra');
    await h.input('Work, exams, curiosity… (optional)', 'Prepare for an exam');
    await h.click('Continue'); await h.click('Intermediate'); await h.click('English'); await h.click('Practice'); await h.click('Continue');
    await h.input('Custom minutes (5–240)', '0'); await h.click('Save my profile');
    assert.equal(h.get().academy.profile.onboarded, false);
    await h.input('Custom minutes (5–240)', '45'); await h.click('Free exploration'); await h.click('Save my profile');
    const p = h.get().academy.profile;
    assert.equal(p.name, 'Sam'); assert.equal(p.goal, 'Understand algebra'); assert.equal(p.dailyMinutes, 45);
    assert.equal(p.format, 'practice'); assert.equal(p.approach, 'explore'); assert.equal(p.level, 'intermediate'); assert.equal(h.get().level, 2);
    assert.equal(h.navigations.at(-1), '/roadmap');
    await h.remount(); assert.equal(h.get().academy.profile.motivation, 'Prepare for an exam');
  });
});
test('personal lesson saves an exercise, gates completion and restores notes and exact stage', async () => {
  const lesson = { title: 'Equal parts', objective: 'Find one half', minutes: 10, explanation: 'Divide into equal groups.', example: 'Half of four is two.', mistake: 'Groups must be equal.', exercise: 'Split four apples.', solution: 'Two in each group.', summary: 'Use equal groups.', quiz: [{ prompt: 'Half of four?', options: ['Two', 'Three'], correctIndex: 0, explanation: 'Four divided by two.' }, { prompt: 'Equal groups?', options: ['Yes', 'No'], correctIndex: 0, explanation: 'Equal parts.' }] };
  const plan = { id: 'plan-test', title: 'Fractions', goal: 'Fractions', verification: 'AI-generated', project: 'Recipe', criteria: ['Equal parts'], createdAt: '2026-10-15T12:00:00.000Z', language: 'en', lessons: [lesson, lesson, lesson] };
  await harness('../app/plan-lesson.tsx', { ...progress.initial, academy: { ...academy.freshAcademy(), plans: [plan] } }, { plan: plan.id, step: '0' }, async h => {
    assert.equal(h.get().completed.length, 0);
    await h.click('Summary'); assert(h.button('Complete lesson').disabled);
    await h.click('Practice'); await h.input('Your attempt', 'Two apples in each group.');
    await h.click('Quiz'); await h.click('Three'); await h.click('Yes');
    await h.click('Summary'); assert(h.button('Complete lesson').disabled);
    await h.click('Quiz'); await h.click('Two'); await h.click('Summary'); await h.click('Complete lesson');
    assert(h.get().completed.includes('plan-test:0'));
    await h.input('Something to remember…', 'The groups must be equal.'); await h.click('Bookmark'); await h.click('Helpful');
    await h.remount(); assert.equal(h.get().stages['plan-test:0'], 3);
    assert.equal(h.get().notes['plan-test:0'], 'The groups must be equal.');
    assert.equal(h.get().academy.feedback['plan-test:0'], 'helpful'); assert(h.get().bookmarks.includes('plan-test:0'));
    assert.equal(academy.analytics(h.get()).retained, 0);
    await h.click('Next lesson'); assert.equal(h.navigations.at(-1).params.step, '1');
  });
});


test('memory studio creates a note card, reveals before rating and persists reviews across restart', async () => {
  await harness('../app/memory-studio.tsx', { ...progress.initial, language: 'en', notes: { lesson: 'Two equal parts' } }, { source: 'lesson' }, async h => {
    assert(h.button('Save card').disabled);
    await h.input('Question or fill-in-the-gap prompt', 'What are halves?');
    await h.click('Use my saved note');
    await h.click('Save card');
    assert.equal(h.get().flashcards.cards.length, 1);
    assert.equal(h.get().flashcards.cards[0].answer, 'Two equal parts');
    assert(!h.button('Good'));
    await h.click('Reveal answer'); await h.click('Good');
    assert.equal(h.get().flashcards.events.length, 1);
    assert.equal(h.get().flashcards.cards[0].interval, 1);
    await h.remount();
    assert.equal(h.get().flashcards.events.length, 1);
    assert(document.body.textContent.includes('No cards due right now'));
    await h.click('Edit'); await h.input('Answer', 'Two equal-sized parts'); await h.click('Save card');
    assert.equal(h.get().flashcards.cards.length, 1);
    assert.equal(h.get().flashcards.cards[0].interval, 0);
    assert.equal(h.get().flashcards.events.length, 1);
    await h.click('Reveal answer'); await h.click('Again');
    assert.equal(h.get().flashcards.events.length, 2);
    await h.remount(); assert.equal(h.get().flashcards.cards[0].answer, 'Two equal-sized parts');
    assert.equal(h.get().memory.evidence.length, 0);
  });
});


test('optional onboarding can be skipped and preferences survive a restart', async () => {
  await harness('../app/onboarding.tsx', { ...progress.initial, academy: academy.freshAcademy() }, {}, async h => {
    await h.click('Skip this question'); await h.click('Skip this question');
    await h.input('Routine goal (optional)', 'Walk after learning');
    await h.input('Reading or pacing needs (optional)', 'Short explanations');
    await h.click('Save my profile');
    await h.remount();
    assert.equal(h.get().academy.profile.goal, 'Explore my interests');
    assert.equal(h.get().academy.profile.routineGoal, 'Walk after learning');
    assert.equal(h.get().academy.profile.accessibilityNeeds, 'Short explanations');
  });
});

test('agent workshop runs real tools, saves drafts, reloads and exposes failed budget checks', async () => {
  await harness('../app/agent-studio-basics.tsx', structuredClone(progress.initial), {}, async h => {
    await h.click('Calculator'); await h.input('Agent input', '6 * 7');
    await h.click('Run workflow'); assert(document.body.textContent.includes('6 * 7 = 42'));
    await h.click('Save project'); await h.remount();
    assert.equal(JSON.parse(h.get().drafts['agent-studio.config']).tool, 'calculator');
    await h.click('Run workflow'); assert(document.body.textContent.includes('6 * 7 = 42'));
    await h.click('1'); await h.click('Run 3 checks');
    assert(document.body.textContent.includes('FAIL: supported answer'));
    assert.equal(h.get().memory.evidence.length, 0);
    await h.click('3'); await h.click('Run 3 checks');
    assert(document.body.textContent.includes('PASS: supported answer'));
  });
});
