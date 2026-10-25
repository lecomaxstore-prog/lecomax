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
  const exports = {};
  cache[file] = exports;
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(output, {
    exports,
    Date,
    require: (name) => {
      if (name in mocks) return mocks[name];
      if (name === 'react' || name === 'react/jsx-runtime') return require(name);
      return load(path.resolve(path.dirname(file), name + '.ts'), mocks, cache);
    },
  });
  return exports;
}
const box = ({ children }) => React.createElement('div', null, children);
const ui = {
  Card: box,
  Row: box,
  Label: box,
  Button: ({ title, onPress, disabled, loading }) =>
    React.createElement('button', { onClick: onPress, disabled: disabled || loading }, title),
  Field: ({ value, onChangeText, editable, placeholder }) =>
    React.createElement('textarea', {
      value,
      disabled: editable === false,
      'aria-label': placeholder,
      onInput: (e) => onChangeText(e.target.value),
    }),
};
async function withDOM(run) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const saved = {
    window: global.window,
    document: global.document,
    IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT,
  };
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.getElementById('root'));
  const click = async (text) => {
    const element = [...document.querySelectorAll('button')].find((b) => b.textContent === text);
    assert(element, text);
    await React.act(async () => element.click());
  };
  try {
    await run({ root, click, dom });
  } finally {
    await React.act(() => root.unmount());
    dom.window.close();
    Object.assign(global, saved);
  }
}

const model = load('life-model.ts', {});
test('workspace changes selected week, preserves guided route and requires deletion confirmation', async () =>
  withDOM(async ({ root, click }) => {
    const engine = load('engine.ts', {});
    let state = engine.ensureDay(engine.initialJourney('2026-10-16'), '2026-10-16');
    state.life = model.saveHabit(model.newLife(), {
      id: 'read',
      title: 'Read',
      category: 'reading',
      target: 1,
      unit: 'page',
      days: [5],
      created: '2026-10-16',
    });
    let route, selected, notificationPreferences;
    const Screen = load('HealthyLifeScreen.tsx', {
      'react-native': { View: box, ActivityIndicator: box, ScrollView:box, Pressable:({children,onPress})=>React.createElement('button',{onClick:onPress},children) },
      'expo-router': {
        router: {
          push: (value) => {
            route = value;
          },
        },
      },
      '../../components/UI': { ...ui, Page: box },
      '../../components/AcademySignature': { IconTile: box },
      '../../store/School': {
        useSchool: () => ({ t: (_fr, en) => en, colors: {}, state: { language: 'en' } }),
      },
      './useJourney': {
        useJourney: () => ({
          state,
          today: '2026-10-16',
          error: '',
          retry: () => {},
          update: async (fn) => {
            state = fn(state);
            render();
          },
        }),
      },
      './LifeEditors': {
        DayTimeline: ({ date }) => {
          selected = date;
          return null;
        },
        HabitsView: box,
        PlannerView: box,
        InsightsView: box,
      },
      './LifeFocus': { LifeFocus: box },
      './LifeAcademy': { LifeAcademy: box },
      './LifePrograms': { LifePrograms: box },
      './LifeOverview': { LifeOverview: box },
      './notifications': {
        syncNotifications: async (p) => {
          notificationPreferences = p;
        },
      },
    }).default;
    const render = () => root.render(React.createElement(Screen));
    await React.act(render);
    await click('Earlier week');
    assert.equal(selected, '2026-10-09');
    await click('Later week');
    assert.equal(selected, '2026-10-16');
    await click('My existing guided routines');
    assert.equal(route, '/wellness/guided');
    await click('Privacy');
    await click('Delete all wellness data');
    assert.equal(state.life.habits.length, 1);
    await click('Keep my data');
    assert.equal(state.life.habits.length, 1);
    await click('Delete all wellness data');
    await click('Confirm all wellness deletion');
    assert.equal(state.life, undefined);
    assert.equal(notificationPreferences.enabled, false);
  }));
test('habit editor retains failed drafts, saves, rests, skips and restores after remount', async () =>
  withDOM(async ({ root, click, dom }) => {
    let life = model.newLife(),
      fail = true;
    const { HabitsView } = load('LifeEditors.tsx', {
      'react-native': { View: box },
      'expo-router': { router: { push: () => {} } },
      '../../components/UI': { ...ui, ProgressBar: box },
    });
    const commit = async (fn) => {
      if (fail) return false;
      life = model.readLife(fn(life));
      render();
      return true;
    };
    const render = () =>
      root.render(React.createElement(HabitsView, { life, date: '2026-10-16', commit }));
    await React.act(render);
    await click('Add habit');
    const input = document.querySelector('textarea[aria-label="Habit name"]');
    await React.act(() => {
      input.value = 'Read pages';
      input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
    await click('Save habit');
    assert.equal(life.habits.length, 0);
    assert.equal(input.value, 'Read pages');
    fail = false;
    await click('Save habit');
    assert.equal(life.habits.length, 1);
    await click('Rest: Read pages');
    assert.match(document.body.textContent, /Rest day/);
    await click('Skip: Read pages');
    assert.match(document.body.textContent, /Skipped by choice/);
    life = model.readLife(JSON.parse(JSON.stringify(life)));
    await React.act(() => root.render(null));
    await React.act(render);
    assert.match(document.body.textContent, /Skipped by choice/);
    await click('Undo check-in: Read pages');
    assert.equal(Object.keys(life.checks['2026-10-16']).length, 0);
    await click('Delete: Read pages');
    await click('Keep habit');
    assert.equal(life.habits.length, 1);
    await click('Delete: Read pages');
    await click('Confirm habit deletion');
    assert.equal(life.habits.length, 0);
  }));
test('planner preview is optional and only apply changes the routine', async () =>
  withDOM(async ({ root, click }) => {
    let life = model.newLife();
    life.planner = { ...life.planner, wake: '07:00', sleep: '22:00' };
    const { PlannerView } = load('LifeEditors.tsx', {
      'react-native': { View: box },
      'expo-router': { router: { push: () => {} } },
      '../../components/UI': { ...ui, ProgressBar: box },
    });
    const commit = async (fn) => {
      life = model.readLife(fn(life));
      return true;
    };
    await React.act(() =>
      root.render(React.createElement(PlannerView, { life, date: '2026-10-16', commit })),
    );
    await click('Preview short day');
    assert.equal(life.activities.length, 0);
    await click('Discard preview');
    assert.equal(life.activities.length, 0);
    await click('Preview short day');
    await click('Add this plan to my routine');
    assert.equal(life.activities.length, 4);
  }));
