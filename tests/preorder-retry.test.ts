import { securityIo } from "./helpers/security-io.ts";
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('mobile timeout retry survives remount and success allows a new intentional order',async()=>{
  const storage=new Map<string,string>();
  const keys:string[]=[];
  let fail=true;
  const load=()=>{
    const exports:any={};
    const source=readFileSync(new URL('../mobile/src/services/orders.ts',import.meta.url),'utf8');
    vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
      exports,require:(name:string)=>{
      const securityModule = securityIo(name); if (securityModule) return securityModule;
        if(name==='@/i18n')return {msg:(key:string)=>key};
        if(name==='@react-native-async-storage/async-storage')return {default:{getItem:async(key:string)=>storage.get(key)??null,setItem:async(key:string,value:string)=>{storage.set(key,value);},removeItem:async(key:string)=>{storage.delete(key);}}};
        if(name==='@/lib/api-client')return {apiRequest:async(_url:string,init:any)=>{keys.push(init.headers['Idempotency-Key']);if(fail)throw new Error('timeout');return {id:'same-order',order_number:'ECO-TEST'};}};
        throw new Error(name);
      },
    });
    return exports.createOrder;
  };
  const customer={name:'Test',email:'test@example.invalid',phone:'0600000000',city:'Rabat',address:'Test',payment:'cod'};
  const cart=[{product:{slug:'test',name:'Test',price:100},quantity:1,fulfillment_type:'PREORDER'}];
  const quote={items:[{slug:'test',quantity:1,price:100,fulfillment_type:'PREORDER'}],shipping:0,discount:0,paymentFee:0,total:100};
  const submit=(key:string)=>load()(customer,cart,{cost:0},key,undefined,0,undefined,0,quote);
  await assert.rejects(submit('first-request-key'),/timeout/);
  fail=false;
  await submit('remounted-request-key');
  assert.deepEqual(keys,['first-request-key','first-request-key']);
  assert.equal(storage.size,0);
  await submit('intentional-new-order');
  assert.equal(keys[2],'intentional-new-order');
});
