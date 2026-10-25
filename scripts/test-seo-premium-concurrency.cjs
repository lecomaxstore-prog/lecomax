// Synthetic loopback PostgreSQL only. No environment files or production access.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {Client}=require('pg');
const bin='C:/Program Files/PostgreSQL/18/bin',root=path.resolve('artifacts/seo-premium/concurrency-'+Date.now()),port=55447;
const env={...process.env};for(const key of Object.keys(env))if(/^PG/.test(key))delete env[key];
fs.mkdirSync(root,{recursive:true});
function run(name,args){const fd=fs.openSync(path.join(root,name+'.log'),'a');const r=cp.spawnSync(path.join(bin,name+'.exe'),args,{env,windowsHide:true,stdio:['ignore',fd,fd],timeout:30000});fs.closeSync(fd);assert.equal(r.status,0,name+' failed');}
async function connect(){const c=new Client({host:'127.0.0.1',port,user:'postgres',database:'postgres',connectionTimeoutMillis:5000});await c.connect();const r=(await c.query("select current_setting('data_directory') dir,host(inet_server_addr()) host")).rows[0];assert.equal(path.resolve(r.dir).toLowerCase(),path.join(root,'data').toLowerCase());assert.equal(r.host,'127.0.0.1');return c;}
(async()=>{let started=false;const clients=[];try{
  run('initdb',['-D',path.join(root,'data'),'-U','postgres','-A','trust','--encoding=UTF8','--locale=C']);
  run('pg_ctl',['-D',path.join(root,'data'),'-l',path.join(root,'server.log'),'-o',`-h 127.0.0.1 -p ${port}`,'-w','start']);started=true;
  const a=await connect(),b=await connect();clients.push(a,b);
  await a.query("create role anon;create role authenticated;create role service_role;create table products(id text primary key,name text,slug text,active boolean,stock integer);create table categories(id text primary key,name text,slug text,active boolean);insert into products values('one','One','one',true,5),('two','Two','two',true,5);");
  for(const f of ['supabase/alternatives/202610180002_seo_decoupled.sql','operations/seo-vercel/supabase/migrations/20261018193508_seo_worker_run_control.sql','operations/seo-vercel/supabase/migrations/202610190001_seo_ai_budget.sql','operations/seo-vercel/supabase/migrations/202610190002_seo_editorial.sql'])await a.query(fs.readFileSync(f,'utf8'));
  const duplicate=await Promise.all([a,b].map(c=>c.query("select seo_ai_enqueue('product','one','premium','Premium bilingual editorial request','fixture') j")));
  assert.equal(duplicate[0].rows[0].j.id,duplicate[1].rows[0].j.id);
  await a.query("select seo_ai_enqueue('product','two','premium','Premium bilingual editorial request','fixture');select seo_ai_authorize(id,.2,'fixture') from seo_ai_jobs;select seo_ai_set_budget(true,.21,false,'fixture')");
  const token=(await a.query('select begin_seo_run() token')).rows[0].token;
  const claims=await Promise.all([a,b].map(c=>c.query('select seo_ai_claim_editorial($1,0) j',[token])));
  assert.equal(claims.filter(r=>r.rows[0].j).length,1,'one reservation fits budget');
  assert.equal(Number((await a.query('select sum(primary_reserve) n from seo_ai_jobs')).rows[0].n),.2);
  await a.query('begin');await a.query('lock table seo_ai_jobs,seo_ai_settings in access exclusive mode');
  await b.query("set statement_timeout='1s';update products set stock=stock-1 where id='one'");await a.query('rollback');
  await a.query("update seo_worker_control set lease_until=now()-interval '1 second'");
  const replacement=(await b.query('select begin_seo_run() token')).rows[0].token;
  assert.equal((await b.query('select seo_ai_claim_editorial($1,0) j',[replacement])).rows[0].j,null,'crashed reservation is retained');
  await assert.rejects(a.query('select seo_ai_claim_editorial($1,0)',[token]),/SEO_RUN_EXPIRED/);
  const result={at:new Date().toISOString(),localOnly:true,duplicateEnqueueSingleJob:true,concurrentReservationsWithinCap:true,crashedReservationRetained:true,staleRunRejected:true,commerceWriteWhileAiLocked:true};
  fs.writeFileSync(path.join(root,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({directory:root,...result}));
}finally{for(const c of clients){await c.query('rollback').catch(()=>{});await c.end();}if(started)run('pg_ctl',['-D',path.join(root,'data'),'-m','fast','-w','stop']);}})().catch(()=>{console.error('Local AI concurrency verification failed; inspect retained local logs.');process.exitCode=1;});
