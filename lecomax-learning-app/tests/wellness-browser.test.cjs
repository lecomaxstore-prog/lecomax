const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function harness() {
  const notices = [], saved = new Map(), timers = new Set(), routes = [], listeners = new Map();
  let asks = 0;
  class Notification {
    static permission = 'default';
    static async requestPermission() { asks++; return this.permission; }
    constructor(title, options) { notices.push({ title, ...options }); }
    close() {}
  }
  const cache = {};
  function load(name) {
    const file = path.resolve(__dirname, '../features/wellness', name);
    if (cache[file]) return cache[file];
    const exports = {}; cache[file] = exports;
    const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(js, { exports, Date, Notification, window: { isSecureContext: true, Notification, focus() {}, addEventListener: (event, fn) => listeners.set(event, fn), removeEventListener: event => listeners.delete(event) },
      localStorage: { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) },
      setInterval: fn => { timers.add(fn); return fn; }, clearInterval: fn => timers.delete(fn),
      require: name => name === 'expo-router' ? { router: { push: route => routes.push(route) } } : load(path.resolve(path.dirname(file), name + '.ts')),
    });
    return exports;
  }
  return { load, Notification, notices, saved, timers, listeners, asks: () => asks };
}
test('browser quiet hours suppress due and delayed delivery, without catch-up after quiet hours',async()=>{
 const h=harness(),n=h.load('notifications.web.ts'),p=h.load('engine.ts').initialJourney().notifications;
 h.Notification.permission='granted';p.enabled=true;p.quietStart='22:00';p.quietEnd='08:00';p.categories.morning.time='07:55';
 await n.syncNotifications(p,'en');h.notices.length=0;
 n.checkBrowserReminders(new Date(2030,0,1,7,55));n.checkBrowserReminders(new Date(2030,0,1,8,0));assert.equal(h.notices.length,0);
 p.categories.morning.time='08:00';await n.syncNotifications(p,'en');h.notices.length=0;
 n.checkBrowserReminders(new Date(2030,0,2,8,0));assert.equal(h.notices.length,1);
 p.quietEnd='';await assert.rejects(n.syncNotifications(p,'en'),/INVALID_QUIET_HOURS/);assert.equal(h.timers.size,1);
});
test('routine suggests a suitable unfinished step without making missed morning tasks a gate', () => {
  const h = harness(), engine = h.load('engine.ts'), routine = h.load('routine.ts');
  const state = engine.ensureDay(engine.initialJourney('2026-10-09'), '2026-10-09'), day = state.days['2026-10-09'];
  assert.equal(routine.suggestedSection(day, 8), 'morning');
  assert.equal(routine.suggestedSection(day, 12), 'food');
  assert.equal(routine.suggestedSection(day, 16), 'body');
  assert.equal(routine.suggestedSection(day, 21), 'evening');
  for (const task of h.load('data.ts').tasks) day.tasks[task.id] = true;
  assert.equal(routine.suggestedSection(day, 21), undefined);
  const tomorrow = engine.ensureDay(state, '2026-10-10');
  assert.equal(routine.suggestedSection(tomorrow.days['2026-10-10'], 8), 'morning');
  assert.equal(routine.suggestedSection(tomorrow.days['2026-10-09'], 8), undefined);
});
test('browser reminders require consent, deduplicate delivery, tolerate a late timer and stop when disabled', async () => {
  const h = harness(), n = h.load('notifications.web.ts'), p = h.load('engine.ts').initialJourney().notifications;
  p.enabled = true; p.categories.morning.time = '08:00';
  await assert.rejects(n.syncNotifications(p, 'en'), /PERMISSION_DENIED/);
  assert.equal(h.asks(), 0); assert.equal(h.timers.size, 0);
  await assert.rejects(n.ensureReminderPermission(), /PERMISSION_DENIED/); assert.equal(h.asks(), 1);
  h.Notification.permission = 'granted'; await n.syncNotifications(p, 'en');
  h.notices.length = 0; h.saved.clear();
  const now = new Date(2030, 0, 1, 8, 2);
  n.checkBrowserReminders(now); n.checkBrowserReminders(now);
  assert.equal(h.notices.length, 1);
  await n.syncNotifications(p, 'fr'); n.checkBrowserReminders(now);
  assert.equal(h.timers.size, 1); assert.equal(h.notices.length, 1);
  n.checkBrowserReminders(new Date(2030, 0, 2, 8, 16)); assert.equal(h.notices.length, 1);
  n.checkBrowserReminders(new Date(2030, 0, 3, 8, 0)); assert.equal(h.notices.length, 2);
  p.enabled = false; await n.syncNotifications(p, 'en');
  assert.equal(h.timers.size, 0);
  n.checkBrowserReminders(new Date(2030, 0, 4, 8, 0)); assert.equal(h.notices.length, 2);
});
test('a delivered browser reminder survives module restart and revoking permission stops delivery', async () => {
  const h = harness(), n = h.load('notifications.web.ts'), p = h.load('engine.ts').initialJourney().notifications;
  p.enabled = true; p.categories.morning.time = '08:00'; h.Notification.permission = 'granted';
  await n.syncNotifications(p, 'ar'); h.notices.length = 0;
  const key = '2030-01-01:morning:08:00'; h.saved.set('lecomax-wellness-web-delivery-v1', JSON.stringify([key]));
  n.checkBrowserReminders(new Date(2030, 0, 1, 8, 1)); assert.equal(h.notices.length, 0);
  h.Notification.permission = 'denied'; n.checkBrowserReminders(new Date(2030, 0, 2, 8, 1)); assert.equal(h.notices.length, 0);
  await assert.rejects(n.testNotification('ar', true), /PERMISSION_DENIED/);
  n.stopBrowserReminders();
});


test('disabled incomplete times are ignored and invalid active drafts preserve the running timer', async () => {
 const h=harness(), n=h.load('notifications.web.ts'), p=h.load('engine.ts').initialJourney().notifications;
 h.Notification.permission='granted';p.enabled=true;p.categories.brain.enabled=false;p.categories.brain.time='';
 await n.syncNotifications(p,'en');assert.equal(h.timers.size,1);
 p.categories.morning.time='99:99';
 await assert.rejects(n.syncNotifications(p,'en'),/INVALID_TIME/);
 assert.equal(h.timers.size,1);
 h.notices.length=0;h.saved.clear();n.checkBrowserReminders(new Date(2030,0,1,8,1));
 assert.equal(h.notices.length,1);n.stopBrowserReminders();assert.equal(h.listeners.size,0);
});
test('late permission resolution cannot reactivate disabled browser reminders', async () => {
 const h=harness(), n=h.load('notifications.web.ts'), p=h.load('engine.ts').initialJourney().notifications;
 let grant;h.Notification.requestPermission=()=>new Promise(resolve=>{grant=resolve;});p.enabled=true;
 const pending=n.syncNotifications(p,'en',true);
 await n.syncNotifications({...p,enabled:false},'en');
 h.Notification.permission='granted';grant('granted');await pending;
 assert.equal(h.timers.size,0);assert.equal(h.listeners.size,0);
});
test('scheduled message uses the delivery weekday and waking checks without extra timers', async () => {
 const h=harness(), n=h.load('notifications.web.ts'), p=h.load('engine.ts').initialJourney().notifications;
 h.Notification.permission='granted';p.enabled=true;await n.syncNotifications(p,'en');
 assert.equal(h.listeners.has('focus'),true);h.listeners.get('focus')();assert.equal(h.timers.size,1);
 h.notices.length=0;h.saved.clear();const now=new Date(2030,0,1,8,1);n.checkBrowserReminders(now);
 assert.equal(h.notices[0].body,h.load('daily-content.ts').reminderMessage('morning',now.getDay()+1,'en').body);
 n.stopBrowserReminders();assert.equal(h.listeners.size,0);
});
