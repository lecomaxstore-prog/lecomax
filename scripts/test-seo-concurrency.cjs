// Synthetic localhost PostgreSQL cluster, retained under artifacts. No env files.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {Client}=require('pg');
const bin='C:/Program Files/PostgreSQL/18/bin';
const root=path.resolve('artifacts/seo-concurrency-'+Date.now());
const port=55441;
const env={...process.env};for(const key of Object.keys(env))if(/^PG/.test(key))delete env[key];
fs.mkdirSync(root,{recursive:true});
const run=(name,args)=>{
  const fd=fs.openSync(path.join(root,name+'.log'),'a');
  const r=cp.spawnSync(path.join(bin,name+'.exe'),args,{env,windowsHide:true,stdio:['ignore',fd,fd],timeout:30000});fs.closeSync(fd);
  assert.equal(r.status,0,name+' failed; inspect local log');
};
const connect=async()=>{const c=new Client({host:'127.0.0.1',port,user:'postgres',database:'postgres',connectionTimeoutMillis:5000,query_timeout:10000});await c.connect();const r=(await c.query("select current_setting('data_directory') dir,host(inet_server_addr()) host")).rows[0];assert.equal(path.resolve(r.dir).toLowerCase(),path.join(root,'data').toLowerCase());assert.equal(r.host,'127.0.0.1');return c;};
(async()=>{
  let started=false;const clients=[];
  try {
    run('initdb',['-D',path.join(root,'data'),'-U','postgres','-A','trust','--encoding=UTF8','--locale=C']);
    run('pg_ctl',['-D',path.join(root,'data'),'-l',path.join(root,'server.log'),'-o',`-h 127.0.0.1 -p ${port}`,'-w','start']);started=true;
    const a=await connect(),b=await connect(),c=await connect();clients.push(a,b,c);
    await a.query(`create role anon;create role authenticated;create role service_role bypassrls;
      create table products(id text primary key,name text,slug text,active boolean,stock integer);
      create table categories(id text primary key,name text,slug text,active boolean);
      insert into products values('1','First','first',true,10),('2','Second','second',true,10);`);
    await a.query(fs.readFileSync('supabase/alternatives/202610180002_seo_decoupled.sql','utf8'));
    await a.query('select reconcile_seo_queue()');
    await a.query('begin');
    const first=(await a.query('select claim_seo_job() job')).rows[0].job;
    const second=(await b.query('select claim_seo_job() job')).rows[0].job;
    assert.notEqual(first.entity_id,second.entity_id,'SKIP LOCKED must select another job');
    await a.query('commit');
    await a.query('begin');
    await a.query('lock table seo_sync_queue in access exclusive mode');
    await a.query('lock table seo_documents in access exclusive mode');
    await b.query("set statement_timeout='1000ms'");
    await b.query("update products set stock=stock-1,name='Changed while SEO locked' where id='1'");
    await b.query("insert into products values('3','Third','third',true,4)");
    assert.equal((await b.query("select stock from products where id='1'")).rows[0].stock,9);
    await assert.rejects(c.query('select reconcile_seo_queue()'),e=>e.code==='55P03');
    await a.query('rollback');
    await c.query('select reconcile_seo_queue()');
    assert.equal((await c.query('select complete_seo_job($1,$2,$3) ok',[first.kind,first.entity_id,first.lease_token])).rows[0].ok,false);
    const jobs=await Promise.all([a.query('select claim_seo_job() job'),b.query('select claim_seo_job() job')]);
    const claimed=jobs.map(r=>r.rows[0].job).filter(Boolean);
    assert.equal(new Set(claimed.map(j=>j.kind+':'+j.entity_id)).size,claimed.length);
    const report={at:new Date().toISOString(),localOnly:true,server:(await a.query('select version() version')).rows[0].version,
      skipLockedDistinctJobs:true,concurrentClaimsDistinct:true,commerceWritesSucceedWhileSeoTablesExclusivelyLocked:true,
      blockedReconcilerTimesOut:true,staleAcknowledgementRejected:true,hostedTest:false};
    fs.writeFileSync(path.join(root,'result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({directory:root,...report}));
  } finally {
    for(const client of clients){await client.query('rollback').catch(()=>{});await client.end();}
    if(started)run('pg_ctl',['-D',path.join(root,'data'),'-m','fast','-w','stop']);
  }
})().catch(e=>{console.error('Local concurrency test failed:',e.code,e.message);process.exitCode=1;});

