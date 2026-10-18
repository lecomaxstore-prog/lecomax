import test from 'node:test';
import assert from 'node:assert/strict';
import {createSessionClient,SessionError} from '../lecomax-learning-app/services/owner-session.ts';
function fixture(){let saved:string|null=null,refreshes=0,offline=false,revoked=false,remembered=false,storageFails=false;
 const dependencies={device:'Android',read:async()=>saved,save:async(t:string)=>{if(storageFails)throw Error('keystore');saved=t;},remove:async()=>{saved=null;},request:async(action:string,body?:any)=>{
  if(offline)throw new SessionError(0,'NETWORK_OR_TIMEOUT');if(revoked&&action!=='logout')throw new SessionError(401,'INVALID_CREDENTIALS');
  if(action==='')return {challenge:'proof'};
  if(action==='logout'){revoked=true;return {ok:true};}
  if(action==='sessions')return {sessions:[],currentSessionId:'id'};
  if(action==='confirm')remembered=body.remember;
  if(action==='refresh')refreshes++;
  return {accessToken:'access-'+refreshes,refreshToken:'refresh-'+refreshes,expiresAt:Date.now()+300000,sessionId:'id',remembered};
 }};
 return {dependencies,client:createSessionClient(dependencies),saved:()=>saved,refreshes:()=>refreshes,offline:(v:boolean)=>{offline=v;},revoke:()=>{revoked=true;},storageFails:()=>{storageFails=true;}};
}
async function login(f:ReturnType<typeof fixture>,remember:boolean){await f.client.restore();await f.client.login('owner@example.test','test-only');assert.equal(f.client.snapshot(),'choice');await f.client.choose(remember);}
test('YES persists only refresh token and restores a new app instance',async()=>{const f=fixture();await login(f,true);assert.equal(f.saved(),'refresh-0');const reopened=createSessionClient(f.dependencies);await reopened.restore();assert.equal(reopened.snapshot(),'authenticated');assert.equal(f.saved(),'refresh-1');});
test('NO never persists and a new process requires login',async()=>{const f=fixture();await login(f,false);assert.equal(f.saved(),null);const reopened=createSessionClient(f.dependencies);await reopened.restore();assert.equal(reopened.snapshot(),'signedOut');});
test('network failure never opens protected content and retains a recoverable remembered token',async()=>{const f=fixture();await login(f,true);f.offline(true);const reopened=createSessionClient(f.dependencies);await assert.rejects(reopened.restore());assert.equal(reopened.snapshot(),'offline');assert.ok(f.saved());f.offline(false);await reopened.retry();assert.equal(reopened.snapshot(),'authenticated');});
test('revoked session clears secure storage on next validation',async()=>{const f=fixture();await login(f,true);f.revoke();await assert.rejects(f.client.validate());assert.equal(f.saved(),null);assert.equal(f.client.snapshot(),'signedOut');});
test('concurrent startup and API callers perform one refresh',async()=>{const f=fixture();await login(f,true);const reopened=createSessionClient(f.dependencies);await Promise.all([reopened.restore(),reopened.token(),reopened.token(),reopened.token()]);assert.equal(f.refreshes(),1);});
test('logout requires backend revocation and clears auth without touching progress',async()=>{const f=fixture();await login(f,true);f.offline(true);await assert.rejects(f.client.logout());assert.ok(f.saved());f.offline(false);await f.client.logout();assert.equal(f.saved(),null);assert.equal(f.client.snapshot(),'signedOut');});
test('secure-storage failure revokes newly issued session and denies access',async()=>{const f=fixture();await f.client.restore();await f.client.login('owner','test');f.storageFails();await assert.rejects(f.client.choose(true));assert.equal(f.client.snapshot(),'signedOut');assert.equal(f.saved(),null);});
test('background transition preserves navigation while foreground validation checks revocation',async()=>{const f=fixture();await login(f,true);f.client.background();assert.equal(f.client.snapshot(),'authenticated');await f.client.validate();assert.equal(f.client.snapshot(),'authenticated');});

test('temporary foreground network failure preserves a still-valid session',async()=>{const f=fixture();await login(f,true);f.client.background();f.offline(true);await assert.rejects(f.client.validate());assert.equal(f.client.snapshot(),'authenticated');f.offline(false);f.revoke();await assert.rejects(f.client.validate());assert.equal(f.client.snapshot(),'signedOut');});

test('retry failure with a valid session never leaves the gate loading',async()=>{const f=fixture();await login(f,false);f.offline(true);await assert.rejects(f.client.retry());assert.equal(f.client.snapshot(),'authenticated');});

test('retry rereads secure storage after a temporary read failure',async()=>{const f=fixture();await login(f,true);let fail=true;const reopened=createSessionClient({...f.dependencies,read:async()=>{if(fail)throw Error('storage unavailable');return f.saved();}});await assert.rejects(reopened.restore());assert.equal(reopened.snapshot(),'offline');await assert.rejects(reopened.retry());assert.equal(reopened.snapshot(),'offline');assert.ok(f.saved());fail=false;await reopened.retry();assert.equal(reopened.snapshot(),'authenticated');});

test('offline owner can return to sign-in without a network request or protected access',async()=>{const f=fixture();await login(f,true);f.offline(true);const reopened=createSessionClient(f.dependencies);await assert.rejects(reopened.restore());await reopened.invalidate();assert.equal(reopened.snapshot(),'signedOut');assert.equal(f.saved(),null);await assert.rejects(reopened.token(),/OWNER_LOGIN_REQUIRED/);});
