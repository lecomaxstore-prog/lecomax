const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
test('native reminder taps and cold-start responses open the current daily programme with the right context',async()=>{
 const routes=[];let listener,clear=0,cleanup;
 const response=(category,id=category)=>({notification:{date:100,request:{identifier:id,content:{data:{feature:'wellness',category}}}}});
 const deps={
  react:{useEffect:fn=>{cleanup=fn();}},
  'react-native':{Platform:{OS:'android'}},
  'expo-router':{router:{push:route=>routes.push(route)},useRootNavigationState:()=>({key:'ready'})},
  'expo-notifications':{addNotificationResponseReceivedListener:fn=>{listener=fn;return{remove(){}};},getLastNotificationResponseAsync:async()=>response('morning'),clearLastNotificationResponseAsync:async()=>{clear++;}},
  '../services/content':{lessons:[]},'../store/School':{useSchool:()=>({ready:true})},'../services/notifications':{},
 };
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../features/NotificationBridge.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:name=>deps[name]});
 exports.NotificationBridge();await Promise.resolve();await Promise.resolve();
 assert.equal(routes[0].pathname,'/wellness');assert.equal(routes[0].params.reminder,'morning');
 listener(response('evening'));assert.equal(routes.at(-1).params.reminder,'evening');
 listener(response('bedtime'));listener(response('bedtime'));assert.equal(routes.length,3);assert.equal(routes.at(-1).params.reminder,'bedtime');
 listener(response('../../anything'));assert.equal(routes.at(-1).pathname,'/wellness');assert.equal(routes.at(-1).params.reminder,'morning');
 cleanup();listener(response('evening','after-unmount'));assert.equal(routes.length,4);assert.equal(clear,4);
});
