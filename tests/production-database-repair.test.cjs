const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeUri,repair,validateClient}=require('../scripts/repair-production-database.cjs');
const initial=[{id:'db',key:'OWNER_DATABASE_URL',target:['production'],type:'sensitive'},{id:'admin',key:'ADMIN_SESSION_SECRET',target:['production'],type:'sensitive'}];
function fixture({dbFailure=false,drift=false,patchFailure=false,postFailure=false}={}) {
  let state=structuredClone(initial),binding;
  const calls=[];
  return {calls,io:{database:async()=>{calls.push('database');if(dbFailure)throw Error('28P01');},list:async()=>{calls.push('list');return drift?[]:structuredClone(state);},api:async(route,method='GET',body)=>{
    calls.push(method);
    if(method==='PATCH'){if(patchFailure)throw Error('NETWORK_FAILURE');state[0].updatedAt=1;}
    if(method==='POST'){if(postFailure)throw Error('NETWORK_FAILURE');binding=body.value;state.push({id:'binding',key:body.key,type:body.type,target:body.target});}
    return method==='GET'?{value:binding}:{};
  }}};
}
test('password encoding preserves special characters and forces verify-full',()=>{
  const p='fixture@:/?#% unicode-é';const u=new URL(makeUri(p));
  assert.equal(decodeURIComponent(u.password),p);assert.equal(u.search,'?sslmode=verify-full');assert.equal(u.port,'5432');
});
test('failed database validation causes zero provider writes',async()=>{
  const f=fixture({dbFailure:true});await assert.rejects(repair(makeUri('fixture'),initial,{},f.io));assert.deepEqual(f.calls,['database']);
});
test('configuration drift prevents both writes',async()=>{
  const f=fixture({drift:true});await assert.rejects(repair(makeUri('fixture'),initial,{},f.io));assert.deepEqual(f.calls,['database','list']);
});
test('uncertain URI write is not retried and does not create binding',async()=>{
  const f=fixture({patchFailure:true}),r={};await assert.rejects(repair(makeUri('fixture'),initial,r,f.io));assert.equal(r.uriWrite,'ATTEMPTED_OUTCOME_UNKNOWN');assert.equal(f.calls.filter(v=>v==='PATCH').length,1);assert.ok(!f.calls.includes('POST'));
});
test('partial binding failure retains accurate URI receipt without retry',async()=>{
  const f=fixture({postFailure:true}),r={};await assert.rejects(repair(makeUri('fixture'),initial,r,f.io));assert.equal(r.uriWrite,'ACKNOWLEDGED_SENSITIVE_VALUE_NOT_READABLE');assert.equal(r.bindingWrite,'ATTEMPTED_OUTCOME_UNKNOWN');assert.equal(f.calls.filter(v=>v==='POST').length,1);
});
test('successful repair validates before mutation and verifies binding and unrelated entries',async()=>{
  const f=fixture(),r={};await repair(makeUri('fixture'),initial,r,f.io);assert.deepEqual(f.calls,['database','list','PATCH','list','POST','list','GET']);assert.equal(r.unrelatedEntriesPreserved,true);assert.equal(r.binding,'EXACT_HASH_READBACK_PASS');
});
test('explicit read-only transaction precedes query and always rolls back',async()=>{
  const calls=[],r={};
  const client={connect:async()=>{},connection:{stream:{authorized:true}},query:async sql=>{calls.push(sql);return {rows:[{db:'postgres',usr:'postgres',ro:'on'}]};}};
  await validateClient(client,r);assert.equal(calls[0],'BEGIN READ ONLY');assert.equal(calls.at(-1),'ROLLBACK');assert.equal(r.databaseChecks.readOnly,true);
});
test('identity failure is specific, sanitized and rolls back',async()=>{
  const calls=[],r={};
  const client={connect:async()=>{},connection:{stream:{authorized:true}},query:async sql=>{calls.push(sql);return {rows:[{db:'postgres',usr:'unexpected',ro:'on'}]};}};
  await assert.rejects(validateClient(client,r),/DATABASE_ROLE_MISMATCH/);assert.equal(calls.at(-1),'ROLLBACK');assert.equal(r.databaseChecks.roleMatches,false);assert.ok(!JSON.stringify(r).includes('unexpected'));
});
test('unauthorized certificate stops before any query',async()=>{
  const client={connect:async()=>{},connection:{stream:{authorized:false}},query:async()=>{assert.fail('query forbidden');}};
  await assert.rejects(validateClient(client,{}),/DATABASE_TLS_VERIFICATION_FAILED/);
});
