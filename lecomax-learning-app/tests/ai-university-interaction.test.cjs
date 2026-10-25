const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const {JSDOM}=require('jsdom');
const React=require('react');
const {createRoot}=require('react-dom/client');
const {load}=require('../scripts/inspect.cjs');
test('Q&A workbench retrieves, saves, requires consent and safely restores edited artifacts',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost'});
 const previous={window:global.window,document:global.document,IS_REACT_ACT_ENVIRONMENT:global.IS_REACT_ACT_ENVIRONMENT};
 Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
 const base='lecomax-learning-app/features/ai-university/';
 let data=load(base+'engine.ts').freshUniversity();let requests=0;
 const box=({children})=>React.createElement('div',null,children);
 const deps={
  react:React,'expo-router':{router:{push(){}}},
  '../../components/UI':{Card:box,Label:box,Row:box,Button:({title,onPress,disabled})=>React.createElement('button',{onClick:onPress,disabled},title),Field:({value,accessibilityLabel})=>React.createElement('input',{value,readOnly:true,'aria-label':accessibilityLabel})},
  '../../services/auth':{auth:{token:async()=>null},API:'http://localhost'},
  './retrieval':load(base+'retrieval.ts'),'./project-contract':load(base+'project-contract.ts'),
  './useUniversity':{useUniversity:()=>({data,change:fn=>{data=fn(data);},corrupt:false})},
 };
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('features/ai-university/ProjectWorkbench.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:n=>deps[n]||require(n),AbortController,setTimeout,clearTimeout,fetch:()=>{requests++;throw Error('Unexpected network');}});
 const root=createRoot(document.getElementById('root'));
 const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
 const click=async text=>{assert(button(text),text);await React.act(async()=>button(text).click());};
 try{
  await React.act(()=>root.render(React.createElement(exports.ProjectWorkbench)));
  assert(button('Ask live AI using these sources').disabled);
  await click('Run local retrieval');assert.match(document.body.textContent,/source-1/);assert.match(document.body.textContent,/no language model was called/);assert.equal(requests,0);
  await click('Save Q&A project');assert.equal(data.projects.length,1);assert.equal(data.projects[0].checked,false);
  await click('Allow this question and document to be sent to the configured AI provider');
  assert(!button('Ask live AI using these sources').disabled);
  await click('Ask live AI using these sources');assert.match(document.body.textContent,/OWNER_LOGIN_REQUIRED/);assert.equal(requests,0);
  data.projects[0].artifact='{"question":42,"document":[]}';
  await React.act(()=>root.render(React.createElement(exports.ProjectWorkbench,{key:'reload'})));
  assert.match(document.body.textContent,/remains in your portfolio/);
  assert.equal(document.querySelector('[aria-label="Q&A question"]').value,'What is the returns window?');
  assert(button('Ask live AI using these sources').disabled);
 }finally{await React.act(()=>root.unmount());dom.window.close();Object.assign(global,previous);}
});
