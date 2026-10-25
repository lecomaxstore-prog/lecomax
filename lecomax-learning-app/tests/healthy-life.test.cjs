const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const m = load('lecomax-learning-app/features/wellness/life-model.ts');
const e = load('lecomax-learning-app/features/wellness/engine.ts');
test('lighter days adapt only unfinished work on the chosen date and survive restart',()=>{
 let s=m.newLife();
 for(const [id,kind] of [['study','study'],['walk','movement'],['done','study']])s=m.saveActivity(s,{id,kind,title:id,time:id==='walk'?'10:00':'09:00',minutes:30,days:[5]});
 s.routineChecks['2026-10-16']={done:'done',study:'missed'};
 s=m.lighterDay(s,'2026-10-16');
 assert.equal(s.dayMinutes['2026-10-16'].study,10);
 assert.equal(s.dayMinutes['2026-10-16'].done,undefined);
 assert.equal(s.routineChecks['2026-10-16'].walk,'rest');
 assert.equal(s.activities[0].minutes,30);
 const restored=m.readLife(JSON.parse(JSON.stringify(s)));
 assert.equal(restored.dayMinutes['2026-10-16'].study,10);
 assert.equal(restored.dayMinutes['2026-10-17'],undefined);
 assert.equal(m.deleteLifeItem(s,'activity','study').dayMinutes['2026-10-16'].study,undefined);
});
test('recovery rejects overlapping and protected time, clears missed status only on successful move',()=>{
 let s=m.newLife();s.planner={...s.planner,busyStart:'12:00',busyEnd:'13:00'};
 for(const [id,time] of [['study','09:00'],['meal','11:00']])s=m.saveActivity(s,{id,title:id,kind:'study',time,minutes:30,days:[5]});
 s.routineChecks['2026-10-16']={study:'missed'};
 for(const time of ['11:15','12:10'])assert.throws(()=>m.recoverActivity(s,'study','2026-10-16',time),/TIME_CONFLICT/);
 assert.equal(s.routineChecks['2026-10-16'].study,'missed');
 s=m.recoverActivity(s,'study','2026-10-16','14:00');
 assert.equal(s.overrides['2026-10-16'].study,'14:00');
 assert.equal(s.routineChecks['2026-10-16'].study,undefined);
});
test('optional learning and focus data validate, preserve legacy states and reject corrupt records',()=>{
 const s=m.newLife();s.learning={walking:{level:'gentle',completed:[0,2]}};s.focusNotes={task:'Review fractions',distractions:'Look up later'};
 assert.equal(m.readLife(JSON.parse(JSON.stringify(s))).learning.walking.completed.length,2);
 assert.throws(()=>m.readLife({...s,learning:{walking:{level:'unsafe',completed:[0]}}}));
 assert.throws(()=>m.readLife({...s,focusNotes:{task:'x'.repeat(151),distractions:''}}));
});
test('short waking windows never produce overlapping suggested blocks and preserve chosen weekdays',()=>{
 const p={...m.newLife().planner,wake:'08:00',sleep:'10:00',minutes:180,days:[1,3]};
 const titles=Object.fromEntries(m.activityKinds.map(k=>[k,k]));
 const plan=m.suggestedDay(p,false,'short-window',titles);
 for(let i=0;i<plan.length-1;i++)assert(m.timeMinutes(plan[i].time)+plan[i].minutes<=m.timeMinutes(plan[i+1].time));
 for(const a of plan)assert.equal(JSON.stringify(a.days),'[1,3]');
});
test('quiet hours handle overnight, boundaries, all-day silence and next-reminder preview',()=>{
 const {validQuietHours,reminderSuppressed}=load('lecomax-learning-app/features/wellness/reminder-policy.ts');
 const p=e.initialJourney().notifications;p.enabled=true;p.quietStart='22:00';p.quietEnd='08:00';
 assert.equal(validQuietHours(p),true);
 for(const time of ['22:00','23:59','07:59'])assert.equal(reminderSuppressed(p,time),true);
 assert.equal(reminderSuppressed(p,'08:00'),false);
 assert.equal(validQuietHours({...p,quietEnd:undefined}),false);
 p.quietEnd='22:00';
 const {nextReminder}=load('lecomax-learning-app/features/wellness/daily-content.ts');
 assert.equal(nextReminder(p),undefined);
});
const habit = {
  id: 'read',
  title: 'Read',
  category: 'reading',
  target: 5,
  unit: 'pages',
  days: [1],
  created: '2026-10-12',
};
test('legacy journey and new workspace survive serialization together', () => {
  const legacy = e.initialJourney('2026-10-12');
  assert.equal(e.parseJourney(JSON.stringify(legacy)).life, undefined);
  legacy.life = m.saveHabit(m.newLife(), habit);
  const restored = e.parseJourney(JSON.stringify(legacy));
  assert.equal(restored.life.habits[0].title, 'Read');
  assert.equal(JSON.stringify(restored.preferences), JSON.stringify(legacy.preferences));
});
test('rest, skip and missing days never enter active completion denominator; targets remain historical', () => {
  let s = m.saveHabit(m.newLife(), habit);
  s = m.checkHabit(s, 'read', '2026-10-12', 'active', 5);
  s = m.saveHabit(s, { ...habit, target: 10 });
  s = m.checkHabit(s, 'read', '2026-10-12', 'active', 6);
  assert.equal(s.checks['2026-10-12'].read.target, 5);
  s = m.checkHabit(s, 'read', '2026-10-13', 'rest');
  s = m.checkHabit(s, 'read', '2026-10-14', 'skip');
  const results = m.habitInsights(s, ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15']);
  assert.equal(results[0].rate, 1);
  for (const day of results.slice(1)) assert.equal(day.rate, null);
  assert.equal(m.deleteLifeItem(s, 'habit', 'read').checks['2026-10-12'].read, undefined);
});
test('invalid dates and fields reject without changing the original state', () => {
  const s = m.newLife();
  for (const created of ['2026-02-30', '2026-99-99'])
    assert.throws(() => m.saveHabit(s, { ...habit, created }));
  assert.throws(() => m.saveHabit(s, { ...habit, days: [] }));
  assert.throws(() => m.saveHabit(s, { ...habit, target: NaN }));
  assert.equal(s.habits.length, 0);
});
test('plans respect overnight busy intervals and movement preference without mutating storage', () => {
  const s = m.newLife();
  const p = {
    ...s.planner,
    wake: '18:00',
    sleep: '08:00',
    busyStart: '22:00',
    busyEnd: '03:00',
    movement: 'none',
  };
  const titles = Object.fromEntries(m.activityKinds.map((k) => [k, k]));
  const plan = m.suggestedDay(p, false, 'plan', titles);
  assert.equal(s.activities.length, 0);
  assert.equal(
    plan.some((a) => a.kind === 'movement'),
    false,
  );
  for (const a of plan.filter((a) => !['wake', 'sleep'].includes(a.kind)))
    for (let i = 0; i < a.minutes; i++)
      assert.equal(
        m.isQuiet(m.clockTime(m.timeMinutes(a.time) + i), p.busyStart, p.busyEnd),
        false,
      );
});
test('focus resumes after reload, pauses and records completion only once', () => {
  let s = m.newLife();
  s.focus = { minutes: 1, remaining: 60000, since: 1000, id: 'session', breakNotice: true };
  s = m.readLife(JSON.parse(JSON.stringify(s)));
  assert.equal(m.focusRemaining(s.focus, 31000), 30000);
  assert.throws(() => m.finishFocus(s, '2026-10-16', '', 31000));
  s.focus = { ...s.focus, remaining: m.focusRemaining(s.focus, 31000), since: null };
  assert.equal(m.focusRemaining(s.focus, 99000), 30000);
  s.focus.since = 100000;
  s = m.finishFocus(s, '2026-10-16', 'Useful', 130000);
  assert.equal(s.sessions.length, 1);
  assert.throws(() => m.finishFocus(s, '2026-10-16', '', 140000));
});
