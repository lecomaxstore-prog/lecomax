import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
test('proposed registry denies public reads and limits service updates to revocation',async()=>{
 const db=new PGlite();try{
 await db.exec('create role anon;create role authenticated;create role service_role;alter default privileges in schema public grant all on tables to public,anon,authenticated,service_role;');
 await db.exec(readFileSync(new URL('./schema-proposal.sql',import.meta.url),'utf8'));
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);await assert.rejects(db.query('select * from admin_session_registry'),e=>e.code==='42501');await assert.rejects(db.query("insert into admin_session_registry values(repeat('a',64),'x@example.invalid',1,100,null)"),e=>e.code==='42501');await db.exec('reset role');}
 await db.exec("set role service_role;insert into admin_session_registry values(repeat('a',64),'owner@example.invalid',1,100,null)");
 assert.equal((await db.query('select * from admin_session_registry')).rows.length,1);
 for(const sql of ["update admin_session_registry set expires_at=200","update admin_session_registry set email='other@example.invalid'",'delete from admin_session_registry','truncate admin_session_registry'])await assert.rejects(db.query(sql),e=>e.code==='42501');
 await db.exec('update admin_session_registry set revoked_at=50');assert.equal(Number((await db.query('select revoked_at from admin_session_registry')).rows[0].revoked_at),50);
 }finally{await db.close();}
});
