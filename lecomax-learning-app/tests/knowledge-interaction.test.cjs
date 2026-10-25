const test=require('node:test'); const assert=require('node:assert/strict');
const fs=require('node:fs'); const vm=require('node:vm'); const React=require('react');
const {createRoot}=require('react-dom/client'); const {JSDOM}=require('jsdom');
const {load,ts}=require('../scripts/inspect.cjs');
const progress=load('lecomax-learning-app/utils/progress.ts');
const memory=load('lecomax-learning-app/utils/learning-memory.ts');
test('knowledge review hides prior answers, saves feedback and survives remount',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost'});
 const saved={window:global.window,document:global.document,IS_REACT_ACT_ENVIRONMENT:global.IS_REACT_ACT_ENVIRONMENT};
 Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
 const Context=React.createContext(null); let snapshot=progress.recordAnswer(progress.initial,'lesson','q',0,false,1);
 const box=({children})=>React.createElement('div',null,children);
 const deps={'../utils/progress':progress,'../utils/learning-memory':memory,'expo-router':{router:{push(){}}},'../store/School':{useSchool:()=>React.useContext(Context)},'../services/content':{getLesson:()=>({title:'Recall',quiz:[{id:'q',question:'Two plus two?',options:['Three','Four'],correctIndex:1,explanation:'Four is correct.'}]})},'../components/UI':{Card:box,Label:box,Page:box,Button:({title,onPress})=>React.createElement('button',{onClick:onPress},title)}};
 const exports={}; vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../app/knowledge.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports,require:n=>deps[n]||require(n)});
 function Harness(){const[state,update]=React.useState(snapshot);snapshot=state;return React.createElement(Context.Provider,{value:{state,update,t:(_fr,en)=>en}},React.createElement(exports.default));}
 let root=createRoot(document.getElementById('root'));
 try{await React.act(()=>root.render(React.createElement(Harness)));
 assert.ok(document.body.textContent.includes('Two plus two?'));assert.ok(!document.body.textContent.includes('Four is correct.'));
 await React.act(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Four').click());
 assert.ok(document.body.textContent.includes('Four is correct.'));assert.equal(snapshot.memory.evidence.length,2);
 await React.act(()=>root.unmount());snapshot=progress.readProgress(JSON.stringify(snapshot));root=createRoot(document.getElementById('root'));
 await React.act(()=>root.render(React.createElement(Harness)));assert.ok(document.body.textContent.includes('No review questions available'));assert.equal(snapshot.memory.reviews['lesson::q'].mistakes,1);
 }finally{await React.act(()=>root.unmount());dom.window.close();Object.assign(global,saved);}
});
