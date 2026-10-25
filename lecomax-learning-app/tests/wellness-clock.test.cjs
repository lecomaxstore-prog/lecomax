const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
test('device clock refreshes while open, after resume, at midnight and on offset change', async () => {
 const dom = new JSDOM('<div id="root"></div>');
 const old = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
 Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
 let instant = new Date(2026, 9, 9, 23, 59), offset = 0, ticks = [], listeners = [], synced = 0, latest;
 class DeviceDate extends Date { constructor(...args) { super(...(args.length ? args : [instant.getTime()])); } getTimezoneOffset() { return offset; } }
 const dateKey = (date = new DeviceDate()) => [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
 const state = { days: {}, achievements: [], notifications: { enabled: false } };
 const ensureDay = (s, key) => ({ ...s, days: { ...s.days, [key]: s.days[key] || {} } });
 const deps = {
  'react-native': { Platform: { OS: 'android' }, AppState: { addEventListener: (_event, fn) => { listeners.push(fn); return { remove: () => { listeners = listeners.filter(x => x !== fn); } }; } } },
  '../../store/School': { useSchool: () => ({ state: { language: 'en' } }) },
  './engine': { dateKey, ensureDay, earned: () => [] },
  './storage': { readJourney: async () => state, saveJourney: async () => {} },
  './notifications': { syncNotifications: async () => { synced++; }, stopBrowserReminders: () => {} },
 };
 const exports = {};
 const js = ts.transpileModule(fs.readFileSync(require.resolve('../features/wellness/useJourney.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
 vm.runInNewContext(js, { exports, Date: DeviceDate, Intl, setInterval: fn => { ticks.push(fn); return fn; }, clearInterval: fn => { ticks = ticks.filter(x => x !== fn); }, require: name => deps[name] || require(name) });
 const Consumer = () => { latest = exports.useJourney(); return null; };
 const root = createRoot(document.getElementById('root'));
 try {
  await React.act(async () => root.render(React.createElement(exports.JourneyProvider, null, React.createElement(Consumer))));
  assert.equal(latest.today, '2026-10-09');
  instant = new Date(2026, 9, 10, 0, 1);
  await React.act(async () => ticks.forEach(fn => fn()));
  assert.equal(latest.today, '2026-10-10');
  assert.equal(latest.now.getMinutes(), 1);
  assert(latest.state.days['2026-10-09']);
  assert(latest.state.days['2026-10-10']);
  const before = synced;
  offset = -60;
  await React.act(async () => ticks.forEach(fn => fn()));
  assert(synced > before, 'offset change reschedules reminders');
  instant = new Date(2026, 9, 10, 8, 15);
  await React.act(async () => [...listeners].forEach(fn => fn('active')));
  assert.equal(latest.now.getHours(), 8);
  assert.equal(latest.now.getMinutes(), 15);
 } finally { await React.act(() => root.unmount()); assert.equal(ticks.length, 0); dom.window.close(); Object.assign(global, old); }
});
