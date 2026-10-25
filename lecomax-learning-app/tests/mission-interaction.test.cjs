const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const React=require('react');
const {createRoot}=require('react-dom/client');
const {JSDOM}=require('jsdom');
const {load,ts}=require('../scripts/inspect.cjs');
const engine=load('lecomax-learning-app/services/assessment.ts');
const {valuesMission:mission}=load('lecomax-learning-app/data/missions/values.ts');
const progress=load('lecomax-learning-app/utils/progress.ts');

test('daily mission saves answers, requires explicit validation, resumes and preserves progress on errors',async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost'});
  const saved={window:global.window,document:global.document,IS_REACT_ACT_ENVIRONMENT:global.IS_REACT_ACT_ENVIRONMENT};
  Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
  const Context=React.createContext(null);
  let snapshot={...progress.initial,language:'en',drafts:{existing:'keep'},completed:['keep']};
  let change;
  let error='';
  let retries=0;
  const routes=[];
  const box=({children})=>React.createElement('div',null,children);
  const dependencies={
    'expo-router':{router:{push:r=>routes.push(r),navigate:r=>routes.push(r)}},
    '../components/UI':{Card:box,Label:box,Page:box,Row:box,ProgressBar:()=>null,
      Button:({title,onPress,disabled})=>React.createElement('button',{onClick:onPress,disabled},title),
      Field:({value,onChangeText,editable})=>React.createElement('textarea',{value,disabled:!editable,onInput:e=>onChangeText(e.target.value)})},
    '../components/CodeViewer':{CodeViewer:({code})=>React.createElement('pre',null,code)},
    '../store/School':{useSchool:()=>React.useContext(Context)},
    '../utils/progress':progress,'../data/missions/values':{valuesMission:mission},'../services/assessment':engine,
  };
  const exports={};
  const js=ts.transpileModule(fs.readFileSync(require.resolve('../features/DailyMission.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  vm.runInNewContext(js,{exports,require:n=>dependencies[n]||require(n)});
  function Harness(){const [state,update]=React.useState(snapshot);snapshot=state;change=update;return React.createElement(Context.Provider,{value:{state,update,colors:{},ready:true,error,retry:()=>retries++,t:(...s)=>s[{fr:0,en:1,ar:2}[state.language]]}},React.createElement(exports.DailyMission));}
  let root=createRoot(document.getElementById('root'));
  const button=label=>[...document.querySelectorAll('button')].find(b=>b.textContent===label);
  const click=async label=>{assert.ok(button(label),label);await React.act(()=>button(label).click());};
  const current=()=>engine.readMission(mission,snapshot.drafts[engine.missionKey(mission)],'2026-10-09');
  try{
    await React.act(()=>root.render(React.createElement(Harness)));
    assert.ok(snapshot.drafts[engine.missionKey(mission)]);
    assert.ok(document.body.textContent.includes('Your goal'));
    assert.ok(!document.body.textContent.includes('This mission assesses reasoning'));
    await click('What does this mission assess?');
    assert.ok(document.body.textContent.includes('This mission assesses reasoning'));
    await click('Hide mission details');
    await click('6. Mission final assessment');
    assert.ok(document.body.textContent.includes('Pass the earlier activities'));
    assert.equal(button('Check my answers'),undefined);
    await click('Resume pending activity');
    await click('Check my answers');
    assert.equal(engine.missionStatus(mission,current()).done,0);
    assert.ok(document.body.textContent.includes('Needs practice.'));
    await click('item.stock = 2');
    const field=document.querySelector('textarea');
    await React.act(()=>{field.value='3492';field.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});
    assert.equal(engine.missionStatus(mission,current()).done,0);
    await click('Check my answers');
    assert.equal(engine.missionStatus(mission,current()).done,1);
    await click('Next pending activity');
    await click('20 min');
    assert.equal(current().active,1);assert.equal(current().goal,20);
    await click('Pause · return home');assert.equal(routes.at(-1),'/(tabs)');
    error='Save failed';await React.act(()=>root.render(React.createElement(Harness)));
    await click('Retry saving');assert.equal(retries,1);
    await React.act(()=>root.unmount());root=createRoot(document.getElementById('root'));
    snapshot=progress.readProgress(JSON.stringify(snapshot));error='';
    await React.act(()=>root.render(React.createElement(Harness)));
    assert.equal(current().active,1);assert.equal(current().responses['text-plus'],'3492');
    assert.deepEqual(Array.from(snapshot.completed),['keep']);assert.equal(snapshot.drafts.existing,'keep');
    await React.act(()=>change(s=>({...s,language:'ar'})));
    assert.ok(document.body.textContent.includes('2. تطبيق موجه'));
    assert.ok(document.body.textContent.includes('جلسة على إيقاعك'));
    await click((45).toLocaleString('ar') + ' دقيقة');
    assert.equal(current().goal,45);
    const key=engine.missionKey(mission);
    await React.act(()=>change(s=>({...s,drafts:{...s.drafts,[key]:'{broken'}})));
    assert.equal(snapshot.drafts[key],'{broken');
    assert.ok(document.body.textContent.includes('البيانات باقية'));
    assert.equal(document.querySelectorAll('textarea').length,0);
  }finally{await React.act(()=>root.unmount());dom.window.close();Object.assign(global,saved);}
});
