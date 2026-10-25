const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const React=require('react');
const {createRoot}=require('react-dom/client');
const {JSDOM}=require('jsdom');
const {load,ts}=require('../scripts/inspect.cjs');
const {phoneTeacherRoute}=load('lecomax-learning-app/utils/phone-teacher.ts');

test('phone teacher validates requests and supplies trusted lesson context in the selected language',()=>{
  for(const language of ['en','fr','ar'])for(const intent of ['explain','example','quiz','question']){
    const route=phoneTeacherRoute({type:'ask-phone-teacher',id:'inductors',intent,question:'How does it work?',detail:'FAKE LESSON'},language);
    assert.equal(route.pathname,'/(tabs)/teacher');assert.ok(route.params.explain);
    assert.match(route.params.question,/Inductors/);assert.match(route.params.question,/AI-generated/);
    assert.match(route.params.question,/Assembly principles:/);
    assert.match(route.params.question,/Related components:/);
    assert.doesNotMatch(route.params.question,/FAKE LESSON/);
    assert.match(route.params.question,new RegExp('Reply in '+({en:'English',fr:'French',ar:'Arabic'})[language]));
    assert.ok(route.params.question.length<6000);
  }
  for(const request of [null,{},'bad',{type:'learned'},{type:'ask-phone-teacher',id:'missing',intent:'explain'},{type:'ask-phone-teacher',id:'battery',intent:'delete'},{type:'ask-phone-teacher',id:'battery',intent:'question',question:'  '},{type:'ask-phone-teacher',id:'battery',intent:'question',question:'a'.repeat(601)}])assert.equal(phoneTeacherRoute(request,'en'),null);
});

test('web and native phone bridges open the existing AI teacher, with web source checking',async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost'});
  const previous={window:global.window,document:global.document,IS_REACT_ACT_ENVIRONMENT:global.IS_REACT_ACT_ENVIRONMENT};
  Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
  const routes=[];let nativeMessage;
  const dependencies={
    'expo-router':{router:{push:r=>routes.push(r)}},
    '../store/School':{useSchool:()=>({state:{language:'fr',drafts:{}},update:()=>{},t:(fr)=>fr})},
    '../utils/phone-teacher':{phoneTeacherRoute},
    '../utils/phone-explorer-document':{phoneExplorerDocument:()=>'<p>Phone</p>'},
    '../utils/phone-learning':{phoneLearningIds:()=>[],PHONE_LEARNING_KEY:'phone'},
    'react-native':{View:({children})=>React.createElement('div',null,children),Linking:{}},
    'react-native-webview':{WebView:props=>{nativeMessage=props.onMessage;return React.createElement('div');}},
  };
  const root=createRoot(document.getElementById('root'));
  try{
    for(const platform of ['.web','']){
      const exports={};const source=fs.readFileSync(require.resolve('../components/PhoneExplorer'+platform+'.tsx'),'utf8');
      vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports,window:dom.window,require:name=>dependencies[name]||require(name)});
      await React.act(()=>root.render(React.createElement(exports.PhoneExplorer)));
      const message=JSON.stringify({type:'ask-phone-teacher',id:'camera',intent:'quiz'});const before=routes.length;
      if(platform){
        dom.window.dispatchEvent(new dom.window.MessageEvent('message',{data:message,source:dom.window}));assert.equal(routes.length,before);
        dom.window.dispatchEvent(new dom.window.MessageEvent('message',{data:message,source:document.querySelector('iframe').contentWindow}));
      }else nativeMessage({nativeEvent:{data:message}});
      assert.equal(routes.length,before+1);assert.equal(routes.at(-1).pathname,'/(tabs)/teacher');
      assert.match(routes.at(-1).params.question,/Cameras/);assert.match(routes.at(-1).params.question,/Wait for my answer/);
    }
  }finally{await React.act(()=>root.unmount());dom.window.close();Object.assign(global,previous);}
});
