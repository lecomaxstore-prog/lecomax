import test from 'node:test';
import assert from 'node:assert/strict';
import {ownerHttpFixture} from './helpers/owner-http.ts';
import {createSessionClient,SessionError} from '../lecomax-learning-app/services/owner-session.ts';
await test('HTTP end-to-end: actual Next handlers + Argon2 + SQL + mobile lifecycle',async()=>{
 const server=await ownerHttpFixture();let saved:string|null=null;
 const request=async(action:string,body?:unknown,access?:string,method='POST')=>{const r=await fetch(server.url+'/api/learning-mobile/auth'+(action?'/'+action:''),{method,headers:{'Content-Type':'application/json',...(access?{Authorization:'Bearer '+access}:{})},body:body===undefined?undefined:JSON.stringify(body)});assert.match(r.headers.get('cache-control')||'',/no-store/);const data=await r.json();if(!r.ok)throw new SessionError(r.status,data.error);return data;};
 const deps={device:'HTTP Android test',request,read:async()=>saved,save:async(v:string)=>{saved=v;},remove:async()=>{saved=null;}};
 try{
  const direct=await fetch(server.url+'/api/learning-mobile/teacher',{method:'POST'});assert.equal(direct.status,401);
  await assert.rejects(request('',{email:'wrong@example.test',password:server.password}),{status:401});
  await assert.rejects(request('',{email:server.email,password:'wrong'}),{status:401});
  const client=createSessionClient(deps);await client.restore();assert.equal(client.snapshot(),'signedOut');await client.login(server.email,server.password);assert.equal(client.snapshot(),'choice');await client.choose(true);assert.ok(saved);const first=await client.token();
  assert.equal((await fetch(server.url+'/api/learning-mobile/teacher',{method:'POST',headers:{Authorization:'Bearer '+first}})).status,200);
  const reopened=createSessionClient(deps);await reopened.restore();assert.equal(reopened.snapshot(),'authenticated');assert.notEqual(await reopened.token(),first);
  const other=createSessionClient({...deps,read:async()=>null,save:async()=>{},remove:async()=>{}});await other.restore();await other.login(server.email,server.password);await other.choose(false);await reopened.revoke('others');await assert.rejects(other.validate(),{status:401});assert.equal(other.snapshot(),'signedOut');
  const token=await reopened.token();await reopened.logout();assert.equal(saved,null);assert.equal((await fetch(server.url+'/api/learning-mobile/teacher',{method:'POST',headers:{Authorization:'Bearer '+token}})).status,401);
  const sessionOnly=createSessionClient(deps);await sessionOnly.restore();await sessionOnly.login(server.email,server.password);await sessionOnly.choose(false);assert.equal(saved,null);const restart=createSessionClient(deps);await restart.restore();assert.equal(restart.snapshot(),'signedOut');
  const malformed=await fetch(server.url+'/api/learning-mobile/auth',{method:'POST',body:'{'});assert.equal(malformed.status,400);
  const large=await fetch(server.url+'/api/learning-mobile/auth',{method:'POST',body:JSON.stringify({email:server.email,password:'x'.repeat(5000)})});assert.equal(large.status,400);
  server.disable();await assert.rejects(request('',{email:server.email,password:server.password}),{status:503,message:'UNAVAILABLE'});
 }finally{await server.close();}
});
