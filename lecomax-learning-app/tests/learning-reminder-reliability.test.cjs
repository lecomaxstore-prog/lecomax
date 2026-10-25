const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function fixture(os = 'android') {
  const items = new Map([
    ['wellness', { identifier: 'wellness', content: { data: { feature: 'wellness' } } }],
  ]);
  let count = 0,
    blocked = false,
    permitted = true,
    failAt = Infinity,
    prompts = 0;
  const api = {
    AndroidImportance: { DEFAULT: 3, NONE: 0 },
    IosAuthorizationStatus: { PROVISIONAL: 3 },
    SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'interval' },
    setNotificationHandler() {},
    setNotificationChannelAsync: async () => {},
    getNotificationChannelAsync: async () => ({ importance: blocked ? 0 : 3 }),
    getPermissionsAsync: async () => ({ granted: permitted, canAskAgain: true }),
    requestPermissionsAsync: async () => {
      prompts++;
      return { granted: permitted };
    },
    getAllScheduledNotificationsAsync: async () => [...items.values()],
    cancelScheduledNotificationAsync: async (id) => items.delete(id),
    scheduleNotificationAsync: async (n) => {
      count++;
      if (count === failAt) throw Error('OS_FAILURE');
      const id = n.identifier || 'new-' + count;
      items.set(id, { ...n, identifier: id });
      return id;
    },
  };
  const deps = {
    'react-native': { Platform: { OS: os } },
    'expo-notifications': api,
    './content': {
      lessons: [{ id: 'one', moduleId: 'daily' }],
      getLesson: (_id, language) => ({
        id: 'one',
        title: language,
        summary: ['summary'],
        concept: 'concept',
      }),
    },
    '../utils/reminders': {
      reminderDates: (n) =>
        n ? Array.from({ length: 14 }, (_, i) => new Date(Date.now() + (i + 1) * 86400000)) : [],
    },
  };
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(require.resolve('../services/notifications.ts'), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    { exports, require: (n) => deps[n], Intl, Date },
  );
  return {
    service: exports,
    items,
    api,
    counts: () => ({ count, prompts }),
    deny: () => (permitted = false),
    block: () => (blocked = true),
    failNext: () => (failAt = count + 2),
  };
}
test('foreground renewal retains clocks, replenishes low batches, and changes language', async () => {
  const f = fixture();
  await f.service.setReminder(60, 'en');
  assert.equal(await f.service.pendingReminders(), 14);
  const ids = [...f.items.keys()];
  await f.service.setReminder(60, 'en', false, true);
  assert.deepEqual([...f.items.keys()], ids);
  for (const id of ids.filter((x) => x !== 'wellness').slice(0, 8)) f.items.delete(id);
  const retained = [...f.items.keys()];
  await f.service.setReminder(60, 'en', false, true);
  assert.equal(await f.service.pendingReminders(), 14);
  assert(retained.every(id => f.items.has(id)), 'renewal preserves pending reminder times');
  await f.service.setReminder(60, 'ar', false, true);
  assert(
    [...f.items.values()]
      .filter((x) => x.identifier !== 'wellness')
      .every((x) => x.content.title === 'ar'),
  );
  assert.equal(f.counts().prompts, 0);
});
test('concurrent save/disable is ordered; wellness reminders are preserved', async () => {
  const f = fixture();
  await Promise.all([f.service.setReminder(30, 'ar'), f.service.setReminder(0, 'ar')]);
  assert.deepEqual([...f.items.keys()], ['wellness']);
});
test('permission and channel failures preserve reminders and background never prompts', async () => {
  const f = fixture();
  await f.service.setReminder(60, 'en');
  const ids = [...f.items.keys()];
  f.deny();
  await assert.rejects(f.service.setReminder(60, 'ar', false, true), /PERMISSION_DENIED/);
  assert.equal(f.counts().prompts, 0);
  assert.deepEqual([...f.items.keys()], ids);
  const blocked = fixture();
  blocked.block();
  await assert.rejects(blocked.service.setReminder(60, 'en'), /CHANNEL_BLOCKED/);
});
test('failed replacement rolls back staged notifications; recovery and test tap data remain valid', async () => {
  const f = fixture();
  await f.service.setReminder(60, 'en');
  const ids = [...f.items.keys()];
  f.failNext();
  await assert.rejects(f.service.setReminder(30, 'ar'), /OS_FAILURE/);
  assert.deepEqual([...f.items.keys()], ids);
  await f.service.setReminder(30, 'ar');
  await f.service.testLearningNotification('ar');
  assert.equal(f.items.get('learning-test').trigger.seconds, 5);
  assert.equal(f.items.get('learning-test').content.data.lessonId, 'one');
  assert.equal(await f.service.pendingReminders(), 14);
});
test('web permits disabling but does not falsely claim native scheduling', async () => {
  const f = fixture('web');
  await f.service.setReminder(0, 'ar');
  await assert.rejects(f.service.setReminder(60, 'ar'), /NATIVE_ONLY/);
});
