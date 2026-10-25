const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');

function load(name, mocks, cache = {}) {
  const file = path.resolve(__dirname, '../features/wellness', name);
  if (cache[file]) return cache[file];
  const exports = {}; cache[file] = exports;
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(output, { exports, Date, require: name => {
    if (name in mocks) return mocks[name];
    if (name === 'react' || name === 'react/jsx-runtime') return require(name);
    return load(path.resolve(path.dirname(file), name + '.ts'), mocks, cache);
  } });
  return exports;
}
const box = ({ children }) => React.createElement('div', null, children);
test('daily action plan sends current meals and progress to teacher and follows date changes', async () => withDOM(async ({ root, click }) => {
  const engine = load('engine.ts', {});
  let today = '2026-10-12';
  let state = engine.ensureDay(engine.initialJourney(today), today);
  state.days[today].tasks.move = true;
  let route;
  const { DailyActionPlan } = load('DailyActionPlan.tsx', {
    'react-native': { View: box },
    'expo-router': { router: { push: value => { route = value; } } },
    '../../components/UI': ui,
    '../../store/School': { useSchool: () => ({ t: (_fr, en) => en, state: { language: 'en' }, colors: {} }) },
    './components': { useCopy: () => value => value.en },
    './useJourney': { useJourney: () => ({ today, state }) },
  });
  await React.act(() => root.render(React.createElement(DailyActionPlan)));
  assert.match(document.body.textContent, /Breakfast/);
  assert.match(document.body.textContent, /Optional snack/);
  await click('Get recipes and a shopping list');
  assert.equal(route.pathname, '/(tabs)/teacher');
  assert.match(route.params.question, /shopping list/);
  const context = JSON.parse(route.params.question.split('\n').at(-1));
  assert.equal(context.date, today);
  assert.equal(context.menu.length, 4);
  assert.equal(context.completed.length, 1);
  today = '2026-10-13'; state = engine.ensureDay(state, today);
  await React.act(() => root.render(React.createElement(DailyActionPlan)));
  await click('Plan my day with AI teacher');
  assert.equal(JSON.parse(route.params.question.split('\n').at(-1)).date, today);
  await click('Edit my preferences'); assert.equal(route, '/wellness/preferences');
}));
const ui = {
  Card: box, Row: box, Label: box,
  Button: ({ title, onPress, disabled, loading }) => React.createElement('button', { onClick: onPress, disabled: disabled || loading }, title),
  Field: ({ value, onChangeText, editable, placeholder }) => React.createElement('textarea', { value, disabled: editable === false, 'aria-label': placeholder, onInput: e => onChangeText(e.target.value) }),
};
async function withDOM(run) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.getElementById('root'));
  const click = async text => {
    const element = [...document.querySelectorAll('button')].find(b => b.textContent === text);
    assert(element, text); await React.act(async () => element.click());
  };
  try { await run({ root, click, dom }); }
  finally { await React.act(() => root.unmount()); dom.window.close(); Object.assign(global, saved); }
}

test('daily moment keeps draft on write failure, persists gratitude and completion, and restores after remount', async () => withDOM(async ({ root, click, dom }) => {
  const engine = load('engine.ts', {});
  let state = engine.ensureDay(engine.initialJourney('2026-10-07'), '2026-10-07');
  let fail = true;
  const school = { t: (_fr, en) => en, colors: {}, state: { language: 'en' } };
  const { DailyMoment } = load('DailyMoment.tsx', {
    'react-native': { View: box }, '@expo/vector-icons/Ionicons': () => null,
    '../../components/UI': ui, '../../store/School': { useSchool: () => school },
    './components': { useCopy: () => value => value.en },
    './useJourney': { useJourney: () => ({ today: '2026-10-07', state, update: async fn => {
      if (fail) throw Error('disk'); state = fn(state);
    } }) },
  });
  await React.act(() => root.render(React.createElement(DailyMoment)));
  const input = document.querySelector('textarea');
  await React.act(() => { input.value = 'A friend made me laugh.'; input.dispatchEvent(new dom.window.Event('input', { bubbles: true })); });
  await click('Save this moment');
  assert.match(document.body.textContent, /Could not save/);
  assert.equal(document.querySelector('textarea').value, 'A friend made me laugh.');
  assert.equal(state.days['2026-10-07'].dailyMoment, undefined);
  fail = false;
  await click('Save this moment');
  await click('I took this small step');
  assert.equal(state.days['2026-10-07'].dailyMoment.completed, true);
  assert.equal(state.days['2026-10-07'].dailyMoment.gratitude, 'A friend made me laugh.');
  assert.equal(engine.percentage(state.days['2026-10-07']), 0);
  await React.act(() => root.render(null));
  await React.act(() => root.render(React.createElement(DailyMoment)));
  assert.equal(document.querySelector('textarea').value, 'A friend made me laugh.');
  assert.match(document.body.textContent, /Small step completed/);
}));

test('reminder presets wait for save, persist before scheduling, and test notification is explicit', async () => withDOM(async ({ root, click }) => {
  const engine = load('engine.ts', {});
  let state = engine.initialJourney('2026-10-07');
  const events = [];
  const { default: Screen } = load('NotificationsScreen.tsx', {
    'react-native': { Platform: { OS: 'android' }, Linking: { openSettings: async () => {} }, Switch: () => null },
    '../../components/UI': ui,
    '../../store/School': { useSchool: () => ({ t: (_fr, en) => en, state: { language: 'en' } }) },
    './components': { JourneyPage: box, useCopy: () => value => value.en },
    './useJourney': { useJourney: () => ({ state, notificationError: '', clearNotificationError: () => {}, update: async fn => { events.push('saved'); state = fn(state); } }) },
    './notifications': { ensureReminderPermission: async () => events.push('permission'), syncNotifications: async (p, lang, request) => {
      events.push('scheduled'); assert.equal(state.notifications, p); assert.equal(request, true); assert.equal(lang, 'en');
    }, testNotification: async () => events.push('test') },
  });
  await React.act(() => root.render(React.createElement(Screen)));
  await click('Morning and evening');
  assert.equal(events.length, 0);
  await click('Save reminders');
  assert.deepEqual(events, ['permission', 'saved', 'scheduled']);
  assert.equal(Object.values(state.notifications.categories).filter(v => v.enabled).length, 2);
  assert.match(document.body.textContent, /Your messages are scheduled/);
  await click('Test in 3 seconds');
  assert.deepEqual(events, ['permission', 'saved', 'scheduled', 'test']);
  await click('Morning, evening and bedtime');
  await click('Save reminders');
  assert.equal(Object.values(state.notifications.categories).filter(v => v.enabled).length, 3);
  assert.equal(state.notifications.categories.bedtime.time,state.preferences.sleepTime);
  assert.equal(state.notifications.categories.morning.time,state.preferences.wakeTime);
}));

test('full routine opens the evening/bedtime programme and persists only explicitly checked tasks', async () => withDOM(async ({root,click}) => {
 const engine=load('engine.ts',{}),today=engine.dateKey();let state=engine.ensureDay(engine.initialJourney(today),today),reminder='evening';
 const {RoutineProgramme}=load('RoutineProgramme.tsx',{
  'expo-router':{useLocalSearchParams:()=>({reminder})},
  '../../components/UI':ui,
  '../../store/School':{useSchool:()=>({t:(_fr,en)=>en})},
  './useJourney':{useJourney:()=>({state,today,update:async fn=>{state=fn(state);}})},
  './components':{TaskCard:({task,done,onToggle})=>React.createElement('button',{onClick:onToggle,'aria-pressed':done},task.id)},
 });
 const render=()=>React.act(()=>root.render(React.createElement(RoutineProgramme)));
 await render();assert.match(document.body.textContent,/What did you do today/);
 await click('water');await render();assert.equal(state.days[today].tasks.water,true);
 await click('water');await render();assert.equal(state.days[today].tasks.water,false);
 reminder='bedtime';await render();assert.match(document.body.textContent,/Time to prepare for sleep/);
 assert.match(document.body.textContent,/leave unfinished tasks for tomorrow/);
 assert.equal(Object.values(state.days[today].tasks).filter(Boolean).length,0);
}));

test('daily compass preserves draft after failed save and restores focus and connection after remount', async () => withDOM(async ({ root, click, dom }) => {
  const engine = load('engine.ts', {});
  let state = engine.ensureDay(engine.initialJourney('2026-10-09'), '2026-10-09');
  let fail = true;
  const { DailyCompass } = load('DailyCompass.tsx', {
    'react-native': { View: box }, '@expo/vector-icons/Ionicons': () => null,
    '../../components/UI': ui,
    '../../store/School': { useSchool: () => ({ t: (_fr, en) => en, colors: {} }) },
    './components': { useCopy: () => value => value.en },
    './useJourney': { useJourney: () => ({ today: '2026-10-09', state, update: async fn => {
      if (fail) throw Error('disk'); state = fn(state);
    } }) },
  });
  await React.act(() => root.render(React.createElement(DailyCompass)));
  const input = document.querySelector('textarea');
  await React.act(() => { input.value = 'Finish my portfolio'; input.dispatchEvent(new dom.window.Event('input', { bubbles: true })); });
  await click('Save my priority');
  assert.match(document.body.textContent, /Could not save/);
  assert.equal(input.value, 'Finish my portfolio');
  assert.equal(state.days['2026-10-09'].compass, undefined);
  fail = false;
  await click('Save my priority');
  await click('I completed my focus session');
  await click('I made time for someone');
  assert.deepEqual(JSON.parse(JSON.stringify(state.days['2026-10-09'].compass)), { priority: 'Finish my portfolio', focused: true, connected: true });
  await React.act(() => root.render(null));
  await React.act(() => root.render(React.createElement(DailyCompass)));
  assert.equal(document.querySelector('textarea').value, 'Finish my portfolio');
  await click('Focus session done · Undo');
  assert.equal(state.days['2026-10-09'].compass.focused, false);
  assert.equal(state.days['2026-10-09'].compass.connected, true);
}));
