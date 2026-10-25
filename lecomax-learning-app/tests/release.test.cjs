const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {load,ts,root}=require('../scripts/inspect.cjs');
const {reminderDates}=load('lecomax-learning-app/utils/reminders.ts');
function hasRuntimeDebugCode(source){
 const tree=ts.createSourceFile('source.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 let found=false;
 function visit(node){
  if(ts.isDebuggerStatement(node))found=true;
  if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&ts.isIdentifier(node.expression.expression)&&node.expression.expression.text==='console'&&/^(log|debug|info|warn|error)$/.test(node.expression.name.text))found=true;
  ts.forEachChild(node,visit);
 }
 visit(tree);return found;
}
test('release debug audit distinguishes lesson text from executable debug statements',()=>{
 assert.equal(hasRuntimeDebugCode('const lesson = "console.log(42); debugger;"; // console.log(1)'),false);
 assert.equal(hasRuntimeDebugCode('console.log(42)'),true);
 assert.equal(hasRuntimeDebugCode('function run(){debugger;}'),true);
 assert.equal(hasRuntimeDebugCode('const message = `${console.warn("oops")}`'),true);
});
function moduleAt(file,dependencies,extras={}){
 dependencies = {'../utils/academy': load('lecomax-learning-app/utils/academy.ts'), ...dependencies};
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'lecomax-learning-app',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:name=>{assert(name in dependencies,'Unmocked import '+name);return dependencies[name]},process:{env:{}},setTimeout,clearTimeout,AbortController,Error,...extras});
 return exports;
}
test('reminder schedules are bounded, daytime-only and use calendar dates',()=>{
 for(const n of [10,30,60,1440])for(const now of [new Date(2026,9,7,23,58),new Date(2026,2,28,23,58)]){
  const dates=reminderDates(n,now);assert.equal(dates.length,14);const counts={};
  for(const date of dates){assert(date>now);assert(date.getHours()>=9&&date.getHours()<20);const key=date.toDateString();counts[key]=(counts[key]||0)+1;assert(counts[key]<=3);if(n===1440)assert.equal(date.getHours(),10);}
  if(n===1440)assert.equal(Object.keys(counts).length,14);
 }
 assert.equal(reminderDates(0).length,0);assert.throws(()=>reminderDates(-1));
});
test('notification failure rolls back new requests and preserves previous reminders',async()=>{
 const cancelled=[],scheduled=[];let behavior;
 const notifications={setNotificationHandler:h=>behavior=h,AndroidImportance:{DEFAULT:3},SchedulableTriggerInputTypes:{DATE:'date'},setNotificationChannelAsync:async()=>{},getNotificationChannelAsync:async()=>({importance:3}),getPermissionsAsync:async()=>({granted:true}),requestPermissionsAsync:async()=>({granted:true}),getAllScheduledNotificationsAsync:async()=>[{identifier:'old',content:{data:{lessonId:'daily-one'}}}],scheduleNotificationAsync:async value=>{scheduled.push(value);if(scheduled.length===2)throw new Error('OS scheduling failure');return 'new-one'},cancelScheduledNotificationAsync:async id=>cancelled.push(id)};
 const api=moduleAt('services/notifications.ts',{'react-native':{Platform:{OS:'android'}},'expo-notifications':notifications,'./content':{lessons:[{id:'daily-one',moduleId:'daily'}],getLesson:()=>({id:'daily-one',title:'درس',summary:['ملخص'],concept:'Concept'})},'../utils/reminders':{reminderDates}});
 await assert.rejects(api.setReminder(10,'ar'),/OS scheduling failure/);assert.deepEqual(cancelled,['new-one']);assert.equal(scheduled[0].content.data.lessonId,'daily-one');assert.equal((await behavior.handleNotification({request:{content:{data:{}}}})).shouldShowBanner,true);
});
test('teacher network failures return a recoverable error and keep authentication',async()=>{
 let deleted=0;
 const teacher=moduleAt('services/teacher.ts',{'./auth':{API:'https://test.invalid',auth:{token:async()=> 'test-session',invalidate:async()=>deleted++,logout:async()=>deleted++}}},{fetch:async()=>{throw new TypeError('Network request failed')}});
 await assert.rejects(teacher.askTeacher('Explain this','ar','simple','',[]),/NETWORK_OR_TIMEOUT/);assert.equal(deleted,0);
});

test('teacher cancellation preserves authentication and forwards the full question with separate lesson context',async()=>{
 let deleted=0, body;
 const controller=new AbortController();
 const teacher=moduleAt('services/teacher.ts',{'./auth':{API:'https://test.invalid',auth:{token:async()=> 'test-session',invalidate:async()=>deleted++,logout:async()=>deleted++}}},{fetch:async(url,options)=>{
  body=JSON.parse(options.body);
  return new Promise((resolve,reject)=>{options.signal.addEventListener('abort',()=>reject(new Error('aborted')));controller.abort();});
 }});
 await assert.rejects(teacher.askTeacher('x'.repeat(6000),'en','teach','',[],{topic:'nextjs',level:'beginner',lesson:{title:'Routes',concept:'URL to page'},signal:controller.signal}),/REQUEST_CANCELLED/);
 assert.equal(body.message.length,6000);assert.equal(body.lesson.title,'Routes');assert.equal(body.topic,'nextjs');assert.equal(deleted,0);
});
test('release configuration, icons, offline catalog and package versions agree',()=>{
 const app=require('../app.json').expo,pkg=require('../package.json'),eas=require('../eas.json');
 assert.equal(pkg.version,app.version);assert.equal(app.android.package,'com.lecomax.learning');assert.equal(eas.build.preview.android.buildType,'apk');assert.equal(eas.build.preview.distribution,'internal');assert.equal(eas.build.preview.credentialsSource,'local');
 for(const icon of [app.icon,app.android.adaptiveIcon.foregroundImage]){const bytes=fs.readFileSync(path.join(root,'lecomax-learning-app',icon));assert.equal(bytes.readUInt32BE(16),1024);assert.equal(bytes.readUInt32BE(20),1024);}
 const index=require('../data/index.json');for(const m of index)for(const lang of ['ar','en','fr'])assert(fs.existsSync(path.join(root,'lecomax-learning-app/data/lessons',lang,m.id+'.json')));
 const folders=['app','components','features','services','store','utils'];
 function inspect(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())inspect(file);else if(/\.[tj]sx?$/.test(e.name)&&e.name!=='source-guide.js')assert(!hasRuntimeDebugCode(fs.readFileSync(file,'utf8')),'Runtime debug code: '+file);}}
 for(const folder of folders)inspect(path.join(root,'lecomax-learning-app',folder));
});
