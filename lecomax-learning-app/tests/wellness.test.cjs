const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const ts=require('typescript');
function load(name,mocks={},cache={}){
 const file=path.resolve(__dirname,'../features/wellness',name);
 if(cache[file])return cache[file];
 const exports={};cache[file]=exports;
 const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 vm.runInNewContext(js,{exports,require:p=>p in mocks?mocks[p]:load(path.resolve(path.dirname(file),p+'.ts'),mocks,cache),Date,Set,Promise,JSON},{filename:file});return exports;
}
const e=load('engine.ts');const data=load('data.ts');
test('native quiet hours cancel suppressed weekly requests and preserve unrelated reminders',async()=>{
 const mock=notificationMock();
 const n=load('notifications.ts',{'react-native':{Platform:{OS:'android'}},'expo-notifications':mock.api});
 const p=e.initialJourney().notifications;p.enabled=true;
 await n.syncNotifications(p,'en');assert(mock.items.has('wellness-morning-1'));
 p.quietStart='00:00';p.quietEnd='00:00';await n.syncNotifications(p,'en');
 assert.equal(mock.items.size,1);assert(mock.items.has('learning'));
 p.quietEnd='07:00';p.categories.morning.time='08:00';await n.syncNotifications(p,'en');assert(mock.items.has('wellness-morning-1'));
});
test('every daily lesson has complete localized guidance and explained answer choices',()=>{
 const {lessonGuides}=load('lesson-guides.ts');
 for(const lesson of data.lessons){
  const guide=lessonGuides[lesson.category];assert(guide,lesson.id);
  assert.equal(guide.steps.length,3);assert(guide.choices.length>=2);
  assert(Number.isInteger(guide.correct)&&guide.correct>=0&&guide.correct<guide.choices.length);
  const copies=[guide.outcome,guide.simple,guide.example,guide.pitfall,...guide.steps,guide.question,guide.takeaway,...guide.choices.flatMap(c=>[c.text,c.feedback])];
  for(const copy of copies)for(const lang of ['en','fr','ar'])assert(typeof copy[lang]==='string'&&copy[lang].trim().length>0,`${lesson.id}/${lang}`);
 }
});
function complete(s,date,n=7){s=e.ensureDay(s,date);for(const task of data.tasks.slice(0,n))s.days[date].tasks[task.id]=true;return s;}
test('local calendar, leap day and DST-safe calendar shifting',()=>{
 assert.equal(e.dateKey(new Date(2026,9,7,23,59)),'2026-10-07');assert.equal(e.shiftDate('2024-02-28',1),'2024-02-29');assert.equal(e.shiftDate('2026-03-29',1),'2026-03-30');assert.equal(e.shiftDate('2026-01-01',-1),'2025-12-31');
});
test('70% completion, yesterday grace, gaps and longest streak',()=>{
 let s=e.initialJourney('2026-10-01');s=complete(s,'2026-10-01');s=complete(s,'2026-10-02');s=complete(s,'2026-10-03',6);
 assert.equal(e.stats(s,'2026-10-03').current,2);assert.equal(e.stats(s,'2026-10-04').current,0);assert.equal(e.stats(s,'2026-10-04').longest,2);assert.equal(e.stats(s,'2026-10-04').completedDays,2);
 s=complete(s,'2026-10-03');assert.equal(e.stats(s,'2026-10-03').current,3);assert(e.earned(s,'2026-10-03').includes('streak3'));
});
test('stable plans, varied content, goals, dietary exclusions and time budgets',()=>{
 const p=e.initialJourney().preferences;
 for(const diet of ['balanced','vegetarian','vegan'])for(const interest of [[],['memory'],Object.keys(data.interests)]){
  const pref={...p,diet,interests:interest,exerciseMinutes:5};let previous;
  for(let i=0;i<40;i++){
   const date=e.shiftDate('2026-10-01',i),plan=e.createPlan(date,pref);assert.deepEqual(plan,e.createPlan(date,pref));assert.equal(plan.minutes,5);
   if(previous){assert.notEqual(plan.brain,previous.brain);assert.notEqual(plan.lesson,previous.lesson);}
   plan.meals.forEach((id,slot)=>{const meal=data.meals[slot].find(m=>m.id===id);assert(meal);if(diet==='vegan')assert(meal.vegan);if(diet==='vegetarian')assert(meal.vegetarian);});previous=plan;
  }
 }
});
test('storage roundtrip preserves check-in, history, plans, settings and achievements',()=>{
 let s=complete(e.initialJourney('2026-10-01'),'2026-10-01');s.days['2026-10-01'].checkIn={mood:4,focus:2,note:'Ù‡Ø¯ÙˆØ¡'};s.achievements=['first'];s.notifications.categories.brain.time='11:15';
 assert.equal(JSON.stringify(e.parseJourney(JSON.stringify(s))),JSON.stringify(s));
 assert.throws(()=>e.parseJourney('{bad'));assert.throws(()=>e.parseJourney(JSON.stringify({...s,version:2})));
 const broken=JSON.parse(JSON.stringify(s));broken.days['2026-10-01'].tasks.water='yes';assert.throws(()=>e.parseJourney(JSON.stringify(broken)));
});
test('lessons do not repeat within an eight-day cycle, even with one interest',()=>{
 const p={...e.initialJourney().preferences,interests:['memory']};
 const ids=Array.from({length:8},(_,i)=>e.createPlan(e.shiftDate('2026-10-01',i),p).lesson);
 assert.equal(new Set(ids).size,8);
});
test('averages exclude absent ratings; missing calendar days count as zero',()=>{
 let s=complete(e.initialJourney('2026-10-05'),'2026-10-05',10);s=e.ensureDay(s,'2026-10-07');s.days['2026-10-05'].checkIn={mood:4,sleep:2,note:''};s.days['2026-10-07'].checkIn={mood:2,note:''};const stats=e.stats(s,'2026-10-07','week');
 assert.equal(stats.completion,33);assert.equal(stats.mood,3);assert.equal(stats.sleep,2);assert.equal(stats.focus,null);
});
test('AsyncStorage writes serialize, recover from errors, and reload exact history',async()=>{
 const map=new Map();let fail=false;const api={getItem:async k=>map.get(k)||null,setItem:async(k,v)=>{await new Promise(r=>setTimeout(r,5));if(fail){fail=false;throw Error('disk');}map.set(k,v);}};
 const storage=load('storage.ts',{'@react-native-async-storage/async-storage':api});let s=complete(e.initialJourney('2026-10-01'),'2026-10-01');await storage.saveJourney(s);assert.equal(JSON.stringify(await storage.readJourney()),JSON.stringify(s));
 fail=true;await assert.rejects(storage.saveJourney(s));s=complete(s,'2026-10-02');await storage.saveJourney(s);assert.equal((await storage.readJourney()).days['2026-10-02'].tasks.water,true);
});
function notificationMock(){
 let granted=true;let requestCount=0;let schedules=0;const items=new Map([['learning',{identifier:'learning',content:{data:{lessonId:'test'}}}]]);
 const api={IosAuthorizationStatus:{PROVISIONAL:3},AndroidImportance:{DEFAULT:3,NONE:0},SchedulableTriggerInputTypes:{DAILY:'daily',WEEKLY:'weekly',TIME_INTERVAL:'timeInterval'},getAllScheduledNotificationsAsync:async()=>[...items.values()],cancelScheduledNotificationAsync:async id=>items.delete(id),setNotificationChannelAsync:async()=>{},getNotificationChannelAsync:async()=>({importance:3}),getPermissionsAsync:async()=>({granted,canAskAgain:true}),requestPermissionsAsync:async()=>{requestCount++;granted=true;return {granted:true};},scheduleNotificationAsync:async n=>{schedules++;items.set(n.identifier,n);return n.identifier;}};
 return {api,items,deny:()=>granted=false,counts:()=>({requestCount,schedules})};
}

test('legacy schedules migrate without enabling bedtime and the routine preset schedules a separate high-priority alert', async () => {
 const old=e.initialJourney('2026-10-16');delete old.notifications.categories.bedtime;
 const restored=e.parseJourney(JSON.stringify(old));
 assert.equal(restored.notifications.categories.bedtime.enabled,false);
 assert.equal(restored.notifications.categories.bedtime.time,old.preferences.sleepTime);
 const d=load('daily-content.ts');const p=d.reminderPreset(restored.notifications,'routine');
 assert.deepEqual(Object.entries(p.categories).filter(([,v])=>v.enabled).map(([id])=>id).sort(),['bedtime','evening','morning']);
 const mock=notificationMock(),channels=[];mock.api.AndroidImportance.HIGH=4;
 mock.api.setNotificationChannelAsync=async(id,value)=>channels.push({id,...value});
 const n=load('notifications.ts',{'react-native':{Platform:{OS:'android'}},'expo-notifications':mock.api});
 await n.syncNotifications(p,'ar',true);
 assert.equal(mock.counts().schedules,21);
 assert.equal(mock.items.get('wellness-bedtime-1').trigger.channelId,'wellness-bedtime-sound-v1');
 assert.equal(mock.items.get('wellness-bedtime-1').content.data.category,'bedtime');
 const channel=channels.find(c=>c.id==='wellness-bedtime-sound-v1');assert.equal(channel.importance,4);assert.equal(channel.bypassDnd,false);
 p.sound=false;await n.syncNotifications(p,'en');
 assert.equal(mock.items.get('wellness-bedtime-1').content.sound,false);
 assert.equal(mock.items.get('wellness-bedtime-1').trigger.channelId,'wellness-bedtime-silent-v1');
 for(const language of ['ar','en','fr'])for(const id of ['morning','evening','bedtime'])assert(d.reminderMessage(id,1,language).body.length>50);
});
test('notification reconciliation is idempotent and preserves learning reminders',async()=>{
 const mock=notificationMock();const n=load('notifications.ts',{'react-native':{Platform:{OS:'android'}},'expo-notifications':mock.api});const prefs=e.initialJourney().notifications;prefs.enabled=true;for(const v of Object.values(prefs.categories))v.enabled=true;
 await Promise.all([n.syncNotifications(prefs,'ar'),n.syncNotifications(prefs,'ar')]);assert.equal(mock.items.size,50);assert.equal(mock.counts().schedules,49);
 prefs.categories.brain.time='11:15';prefs.categories.meal.enabled=false;prefs.sound=false;await n.syncNotifications(prefs,'en');assert.equal(mock.items.size,43);assert.equal(mock.items.get('wellness-brain-1').trigger.hour,11);assert.equal(mock.items.get('wellness-brain-1').trigger.minute,15);assert.equal(mock.items.get('wellness-brain-1').content.sound,false);
 prefs.enabled=false;await n.syncNotifications(prefs,'en');assert.equal(mock.items.size,1);assert(mock.items.has('learning'));
});
test('permission is only requested on opt-in; web never schedules',async()=>{
 const mock=notificationMock();mock.deny();const p=e.initialJourney().notifications;p.enabled=true;
 const n=load('notifications.ts',{'react-native':{Platform:{OS:'ios'}},'expo-notifications':mock.api});await assert.rejects(n.syncNotifications(p,'en'),/PERMISSION_DENIED/);assert.equal(mock.counts().requestCount,0);await n.syncNotifications(p,'en',true);assert.equal(mock.counts().requestCount,1);
 const web=load('notifications.ts',{'react-native':{Platform:{OS:'web'}},'expo-notifications':mock.api});await assert.rejects(web.syncNotifications(p,'en'),/NATIVE_ONLY/);
});

test('daily moments vary across two weeks, localize every field and preserve calendar identity',()=>{
 const d=load('daily-content.ts');
 const ids=new Set();
 for(let i=0;i<14;i++){
  const date=e.shiftDate('2026-10-04',i),moment=d.dailyMoment(date);
  ids.add(moment.id);assert.deepEqual(moment,d.dailyMoment(date));
  for(const lang of ['en','fr','ar'])for(const field of ['title','encouragement','action','reflection'])assert(moment[field][lang].length>8);
 }
 assert.equal(ids.size,14);
 for(const lang of ['ar','en','fr'])for(const id of Object.keys(data.reminders)){
  const bodies=Array.from({length:7},(_,i)=>d.reminderMessage(id,i+1,lang).body);
  assert.equal(new Set(bodies).size,['morning','evening','bedtime'].includes(id)?1:7);assert(bodies.every(body=>body.length<350));
 }
});

test('daily presets preserve times and sound; preview crosses midnight without scheduling in the past',()=>{
 const d=load('daily-content.ts'),original=e.initialJourney().notifications;
 original.sound=false;original.categories.morning.time='09:15';
 for(const [mode,count] of [['daily',1],['twice',2],['routine',3],['all',7]]){
  const p=d.reminderPreset(original,mode);
  assert.equal(Object.values(p.categories).filter(v=>v.enabled).length,count);
  assert.equal(p.categories.morning.time,'09:15');assert.equal(p.sound,false);
  const next=d.nextReminder(p,new Date(2026,9,7,23,59));
  assert.equal(e.dateKey(next.date),'2026-10-08');assert.equal(next.date.getHours(),9);
 }
 assert.equal(original.enabled,false);
 assert.equal(d.nextReminder(original),undefined);
 const p=d.reminderPreset(original,'daily');
 assert.equal(e.dateKey(d.nextReminder(p,new Date(2026,9,7,9,15)).date),'2026-10-08');
});

test('gratitude survives restart, remains separate from habit scores, and validates saved text',()=>{
 const s=e.ensureDay(e.initialJourney('2026-10-07'),'2026-10-07');
 s.days['2026-10-07'].dailyMoment={completed:true,gratitude:'Ø´ÙƒØ±Ø§Ù‹ Ù„Ù„Ø­Ø¸Ø© Ø¬Ù…ÙŠÙ„Ø©'};
 const restored=e.parseJourney(JSON.stringify(s));
 assert.equal(restored.days['2026-10-07'].dailyMoment.gratitude,'Ø´ÙƒØ±Ø§Ù‹ Ù„Ù„Ø­Ø¸Ø© Ø¬Ù…ÙŠÙ„Ø©');
 assert.equal(e.percentage(restored.days['2026-10-07']),0);
 const next=e.ensureDay(restored,'2026-10-08');assert.equal(next.days['2026-10-08'].dailyMoment,undefined);
 for(const invalid of [null,{completed:'yes',gratitude:''},{completed:true,gratitude:'x'.repeat(2001)}]){
  const broken=JSON.parse(JSON.stringify(s));broken.days['2026-10-07'].dailyMoment=invalid;
  assert.throws(()=>e.parseJourney(JSON.stringify(broken)));
 }
});

test('weekly reminders migrate legacy schedules and cover all weekdays without expiry or duplicates',async()=>{
 const mock=notificationMock();mock.items.set('wellness-morning',{identifier:'wellness-morning',content:{data:{feature:'wellness'}}});
 const n=load('notifications.ts',{'react-native':{Platform:{OS:'ios'}},'expo-notifications':mock.api});
 const p=e.initialJourney().notifications;p.enabled=true;
 await n.syncNotifications(p,'ar');
 assert.equal(mock.items.size,8);assert(!mock.items.has('wellness-morning'));
 for(let weekday=1;weekday<=7;weekday++){
  const item=mock.items.get(`wellness-morning-${weekday}`);
  assert.equal(item.trigger.type,'weekly');assert.equal(item.trigger.weekday,weekday);
  assert.equal(item.trigger.hour,8);assert(item.content.body);assert.equal(item.content.data.category,'morning');
 }
 const before=mock.counts().schedules;
 await n.syncNotifications(p,'ar');assert.equal(mock.counts().schedules,before);
 p.categories.morning.time='25:00';
 await assert.rejects(n.syncNotifications(p,'ar'),/INVALID_TIME/);assert.equal(mock.items.size,8);
});

test('interrupted scheduling recovers on retry and disabling cancels every owned reminder',async()=>{
 const mock=notificationMock(),schedule=mock.api.scheduleNotificationAsync;
 let attempts=0;
 mock.api.scheduleNotificationAsync=async value=>{if(++attempts===3)throw Error('OS_FAILED');return schedule(value);};
 const n=load('notifications.ts',{'react-native':{Platform:{OS:'android'}},'expo-notifications':mock.api});
 const p=e.initialJourney().notifications;p.enabled=true;
 await assert.rejects(n.syncNotifications(p,'en'),/OS_FAILED/);
 await n.syncNotifications(p,'en');assert.equal(mock.items.size,8);
 p.enabled=false;await n.syncNotifications(p,'en');assert.equal(mock.items.size,1);assert(mock.items.has('learning'));
});

test('daily compass survives storage, starts fresh tomorrow, and does not inflate wellbeing scores', () => {
 let state = e.ensureDay(e.initialJourney('2026-10-09'), '2026-10-09');
 state.days['2026-10-09'].compass = { priority: 'Practise one skill', focused: true, connected: false };
 const restored = e.parseJourney(JSON.stringify(state));
 assert.deepEqual(restored.days['2026-10-09'].compass, state.days['2026-10-09'].compass);
 assert.equal(e.percentage(restored.days['2026-10-09']), 0);
 state = e.ensureDay(restored, '2026-10-10');
 assert.equal(state.days['2026-10-10'].compass, undefined);
 assert.equal(state.days['2026-10-09'].compass.priority, 'Practise one skill');
 state.days['2026-10-09'].compass.priority = 'x'.repeat(241);
 assert.throws(() => e.parseJourney(JSON.stringify(state)));
});
test('daily direction rotates predictably across a week and has complete translations', () => {
 const { dailyTheme } = load('daily-plan.ts');
 const titles = new Set();
 for(let i=0; i<7; i++) {
  const date = e.shiftDate('2026-10-09', i), theme = dailyTheme(date);
  assert.deepEqual(theme, dailyTheme(date)); titles.add(theme.title.en);
  for(const field of ['title','prompt','action']) for(const language of ['en','fr','ar']) assert(theme[field][language].trim().length > 0);
 }
 assert.equal(titles.size, 7);
});



test('test reminders survive background reconciliation and failed replacements preserve old schedule', async () => {
 const mock=notificationMock();
 const n=load('notifications.ts',{'react-native':{Platform:{OS:'android'}},'expo-notifications':mock.api});
 const p=e.initialJourney().notifications;p.enabled=true;
 await n.syncNotifications(p,'en');
 await n.testNotification('en',true);
 await n.syncNotifications(p,'en');
 assert(mock.items.has('wellness-test'));
 const old=[...mock.items.keys()].filter(k=>k.startsWith('wellness-morning-'));
 p.categories.morning.time='10:45';
 mock.api.scheduleNotificationAsync=async()=>{throw Error('OS_FAILED');};
 await assert.rejects(n.syncNotifications(p,'en'),/OS_FAILED/);
 for(const id of old)assert(mock.items.has(id));
 assert(mock.items.has('learning'));
});

test('blocked Android channel is reported even when app permission is granted', async () => {
 const mock=notificationMock();mock.api.getNotificationChannelAsync=async()=>({importance:0});
 const n=load('notifications.ts',{'react-native':{Platform:{OS:'android'}},'expo-notifications':mock.api});
 await assert.rejects(n.ensureReminderPermission(),/CHANNEL_BLOCKED/);
 assert.equal(mock.counts().schedules,0);
});


test('routine follows local wake/sleep times without missed-morning suggestions at night', () => {
 const { routinePeriod, suggestedSection } = load('routine.ts');
 assert.equal(routinePeriod(7.5, '07:30', '22:30'), 'morning');
 assert.equal(routinePeriod(7.49, '07:30', '22:30'), 'evening');
 assert.equal(routinePeriod(21.5, '07:30', '22:30'), 'evening');
 assert.equal(routinePeriod(0, '07:30', '22:30'), 'evening');
 assert.equal(routinePeriod(18, '18:00', '08:00'), 'morning');
 assert.equal(routinePeriod(2, '18:00', '08:00'), 'body');
 assert.equal(routinePeriod(8, '18:00', '08:00'), 'evening');
 const state = e.ensureDay(e.initialJourney('2026-10-09'), '2026-10-09');
 const day = state.days['2026-10-09'];
 for (const task of data.tasks.filter(t => t.section === 'evening')) day.tasks[task.id] = true;
 assert.equal(suggestedSection(day, 23), 'evening');
 assert.notEqual(suggestedSection(day, 15), 'morning');
 for (const task of data.tasks) day.tasks[task.id] = true;
 assert.equal(suggestedSection(day, 23), undefined);
});


test('turning wellness off also cancels a pending test without touching learning reminders', async () => {
 const mock=notificationMock();
 const n=load('notifications.ts',{'react-native':{Platform:{OS:'android'}},'expo-notifications':mock.api});
 const p=e.initialJourney().notifications;p.enabled=true;
 await n.syncNotifications(p,'en');await n.testNotification('en',true);
 p.enabled=false;await n.syncNotifications(p,'en');
 assert.deepEqual([...mock.items.keys()],['learning']);
});
test('iOS provisional authorization schedules quietly without requesting permission again', async () => {
 const mock=notificationMock();
 mock.api.getPermissionsAsync=async()=>({granted:false,canAskAgain:true,ios:{status:3}});
 const n=load('notifications.ts',{'react-native':{Platform:{OS:'ios'}},'expo-notifications':mock.api});
 const p=e.initialJourney().notifications;p.enabled=true;
 await n.syncNotifications(p,'en',true);
 assert.equal(mock.items.size,8);assert.equal(mock.counts().requestCount,0);
});
test('an OS that silently drops requests cannot produce a successful sync', async () => {
 const mock=notificationMock();
 mock.api.scheduleNotificationAsync=async value=>value.identifier;
 const n=load('notifications.ts',{'react-native':{Platform:{OS:'android'}},'expo-notifications':mock.api});
 const p=e.initialJourney().notifications;p.enabled=true;
 await assert.rejects(n.syncNotifications(p,'en'),/SCHEDULE_INCOMPLETE/);
 assert(mock.items.has('learning'));
});


test('a UTC offset change replaces native reminders even when the zone name is unchanged', async () => {
 const mock=notificationMock();
 const n=load('notifications.ts',{'react-native':{Platform:{OS:'android'}},'expo-notifications':mock.api});
 const p=e.initialJourney().notifications;p.enabled=true;
 const original=Date.prototype.getTimezoneOffset;
 try {
  Date.prototype.getTimezoneOffset=()=>-120;
  await n.syncNotifications(p,'en');const before=mock.counts().schedules;
  Date.prototype.getTimezoneOffset=()=>-60;
  await n.syncNotifications(p,'en');assert.equal(mock.counts().schedules,before+7);
  await n.syncNotifications(p,'en');assert.equal(mock.counts().schedules,before+7);
 } finally {Date.prototype.getTimezoneOffset=original;}
});
