import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {adminApiPermission,hasAdminPermission} from '../lib/admin-policy.ts';
import {validApprovalTarget} from '../lib/approval-target.ts';

function accessLoader(email:string|null, rows:any[]) {
  let calls=0;
  const exports:any={};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/admin-access.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
    exports,URLSearchParams,AbortSignal,process:{env:{ADMIN_EMAIL:'owner@example.test',NEXT_PUBLIC_SUPABASE_URL:'https://database.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-server-secret'}},
    require:(name:string)=>name==='server-only'?{}:{verifySessionToken:async()=>email},
    fetch:async()=>{calls++;return {ok:true,json:async()=>rows.shift()};},
  });
  return {load:exports.getAdminAccess,calls:()=>calls};
}
const request=()=>({cookies:{get:(name:string)=>name==='admin_session'?{value:'signed'}:undefined}});

test('deleting staff permissions cookie never grants owner rights',async()=>{
  const loader=accessLoader('manager@example.test',[[{role_id:'role'}],[{permission_slug:'products.view'}]]);
  const req=request();const access=await loader.load(req);
  assert.equal(access.owner,false);
  assert.equal(hasAdminPermission(access,adminApiPermission('/api/products','GET')),true);
  assert.equal(hasAdminPermission(access,adminApiPermission('/api/products','POST')),false);
  assert.equal(hasAdminPermission(access,adminApiPermission('/api/admin/roles','POST')),false);
  await loader.load(req);assert.equal(loader.calls(),2);
});
test('suspended or deleted staff and database failures fail closed',async()=>{
  assert.equal(await accessLoader('removed@example.test',[[]]).load(request()),null);
  assert.equal(await accessLoader('staff@example.test',[null]).load(request()),null);
  assert.equal(await accessLoader(null,[]).load(request()),null);
});
test('permission revocation is observed on the next request',async()=>{
  const loader=accessLoader('manager@example.test',[[{role_id:'role'}],[{permission_slug:'products.edit'}],[{role_id:'role'}],[]]);
  assert.equal(hasAdminPermission(await loader.load(request()),'products.edit'),true);
  assert.equal(hasAdminPermission(await loader.load(request()),'products.edit'),false);
});
test('owner bypass is tied to verified identity, unknown APIs are owner-only',async()=>{
  const loader=accessLoader('owner@example.test',[]);
  assert.equal(hasAdminPermission(await loader.load(request()),undefined),true);
  assert.equal(loader.calls(),0);
  assert.equal(hasAdminPermission({owner:false,permissions:['products.edit']},adminApiPermission('/api/admin/unknown','POST')),false);
});
test('approval execution is restricted to an entity-specific internal target',()=>{
  assert.equal(validApprovalTarget('product','create','/api/products','POST'),true);
  for(const target of ['https://evil.invalid','//evil.invalid','/api/admin/roles','/api/products/../admin/roles','/api/products?redirect=evil']) assert.equal(validApprovalTarget('product','create',target,'POST'),false);
});
