import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import argon2 from 'argon2';
import {PGlite} from '@electric-sql/pglite';
import {createOwnerAuth,ownerConfig,type Database} from '../lib/owner-auth-core.ts';
const password=randomBytes(24).toString('hex');
const hash=await argon2.hash(password,{type:argon2.argon2id,memoryCost:19456,timeCost:2,parallelism:1});
const config=ownerConfig({OWNER_EMAIL:'owner@example.test',OWNER_PASSWORD_HASH:hash,SESSION_SECRET:randomBytes(32).toString('hex')});
const pg=new PGlite();await pg.exec(await readFile(new URL('../supabase/migrations/202610080001_learning_owner_sessions.sql',import.meta.url),'utf8'));
const wrap=(client:any):Database=>({query:(q,v)=>client.query(q,v),transaction:fn=>client.transaction((tx:any)=>fn(wrap(tx)))});
const db=wrap(pg),auth=createOwnerAuth(db,config);
let sequence=0;
const signIn=async(remember=true)=>{const {challenge}=await auth.login(config.email,password,'device-'+sequence++);return auth.confirm(challenge,remember,'Android test');};
await test('startup rejects missing credentials, weak secret and non-Argon2id hashes',()=>{
 assert.throws(()=>ownerConfig({}));assert.throws(()=>ownerConfig({OWNER_EMAIL:config.email,OWNER_PASSWORD_HASH:hash,SESSION_SECRET:'short'}));assert.throws(()=>ownerConfig({OWNER_EMAIL:config.email,OWNER_PASSWORD_HASH:'bcrypt',SESSION_SECRET:config.secret}));
});
await test('correct credentials produce a challenge, never an access token',async()=>{
 const result=await auth.login(config.email,password,'valid');assert.ok(result.challenge);assert.equal('accessToken' in result,false);await assert.rejects(auth.authenticate(result.challenge),{status:401});
});
await test('incorrect email and password return identical rejection',async()=>{
 await assert.rejects(auth.login('other@example.test',password,'bad-email'),{status:401,message:'INVALID_CREDENTIALS'});
 await assert.rejects(auth.login(config.email,'wrong','bad-password'),{status:401,message:'INVALID_CREDENTIALS'});
});
await test('bounded input and invalid remember choice are rejected',async()=>{
 await assert.rejects(auth.login(config.email,'x'.repeat(1025),'large'),{status:400});await assert.rejects(auth.confirm('x',true,'Android'),{status:400});
});
await test('login throttling persists in the database with a finite cooldown',async()=>{
 for(let i=0;i<8;i++)await assert.rejects(auth.login(config.email,'bad','brute'),{status:401});
 await assert.rejects(auth.login(config.email,password,'brute'),{status:429});
 await db.query("UPDATE learning_private.throttle SET expires_at=now()-interval '1 second'");
 assert.ok((await auth.login(config.email,password,'brute')).challenge);
});
await test('remember choice creates 30-day or 12-hour sessions with five-minute access',async()=>{
 for(const remembered of [true,false]){const s=await signIn(remembered);const row=await auth.authenticate(s.accessToken);assert.equal(row.remembered,remembered);assert.ok(s.expiresAt-Date.now()<=300000);const days=(s.sessionExpiresAt-Date.now())/86400000;assert.ok(remembered?days>29:days<1);}
});
await test('challenge is single use and expires',async()=>{
 const {challenge}=await auth.login(config.email,password,'one-use');await auth.confirm(challenge,true,'Android');await assert.rejects(auth.confirm(challenge,true,'Android'),{status:401});
 const expired=await auth.login(config.email,password,'expired');await db.query("UPDATE learning_private.challenges SET expires_at=now()-interval '1 second'");await assert.rejects(auth.confirm(expired.challenge,true,'Android'),{status:401});
});
await test('database contains hashes, not bearer secrets',async()=>{
 const s=await signIn();const dump=JSON.stringify((await db.query('SELECT * FROM learning_private.sessions')).rows)+JSON.stringify((await db.query('SELECT * FROM learning_private.tokens')).rows);assert.ok(!dump.includes(s.refreshToken));assert.ok(!dump.includes(s.accessToken));assert.ok(!dump.includes(password));
});
await test('rotated refresh works; reuse revokes the entire family immediately',async()=>{
 const s=await signIn();const renewed=await auth.refresh(s.refreshToken);assert.notEqual(s.refreshToken,renewed.refreshToken);await assert.rejects(auth.authenticate(s.accessToken),{status:401});await auth.authenticate(renewed.accessToken);await assert.rejects(auth.refresh(s.refreshToken),{status:401});await assert.rejects(auth.authenticate(renewed.accessToken),{status:401});await assert.rejects(auth.refresh(renewed.refreshToken),{status:401});
});
await test('expired access can refresh; expired session cannot',async()=>{
 const s=await signIn();await db.query("UPDATE learning_private.sessions SET access_expires=now()-interval '1 second' WHERE id=$1",[s.sessionId]);await assert.rejects(auth.authenticate(s.accessToken),{status:401});const next=await auth.refresh(s.refreshToken);await db.query("UPDATE learning_private.sessions SET expires_at=now()-interval '1 second' WHERE id=$1",[s.sessionId]);await assert.rejects(auth.refresh(next.refreshToken),{status:401});
});
await test('logout invalidates access and refresh without relying on device deletion',async()=>{
 const s=await signIn();await auth.logout(s.refreshToken);await assert.rejects(auth.authenticate(s.accessToken),{status:401});await assert.rejects(auth.refresh(s.refreshToken),{status:401});
});
await test('other-device revocation preserves current; all-device revocation ends current',async()=>{
 const current=await signIn(),other=await signIn();const list=await auth.sessions(current.accessToken);assert.equal(list.currentSessionId,current.sessionId);assert.ok(list.sessions.some(s=>s.id===other.sessionId));await auth.revoke(current.accessToken,'others');await auth.authenticate(current.accessToken);await assert.rejects(auth.authenticate(other.accessToken),{status:401});await auth.revoke(current.accessToken,'all');await assert.rejects(auth.authenticate(current.accessToken),{status:401});
});
await test('specific device revocation and unauthenticated management',async()=>{
 const current=await signIn(),other=await signIn();await auth.revoke(current.accessToken,other.sessionId);await assert.rejects(auth.refresh(other.refreshToken),{status:401});await assert.rejects(auth.sessions(''),{status:401});await assert.rejects(auth.revoke('',current.sessionId),{status:401});
});
await test('password/email/secret security changes invalidate existing sessions',async()=>{
 const s=await signIn();const changed=createOwnerAuth(db,{...config,version:'different-credential-version'});await assert.rejects(changed.authenticate(s.accessToken),{status:401});await assert.rejects(changed.refresh(s.refreshToken),{status:401});
});
await pg.close();
