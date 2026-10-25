// Explicitly authorized one-cluster local rehearsal. Never loads application env.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const net=require('node:net'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {Client}=require('pg');
const {prepare}=require('./prepare-seo-minimal-staging.cjs');
const workspace=path.resolve(__dirname,'..'),bin='C:/Program Files/PostgreSQL/18/bin';
const port=55449,host='127.0.0.1';
const reservation=path.join(workspace,'artifacts/seo-v3-authorized-20261019');
const env={};
for(const [key,value] of Object.entries(process.env))if(/^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|ProgramFiles|ProgramFiles\(x86\))$/i.test(key))env[key]=value;
const report={startedAt:new Date().toISOString(),host,port,syntheticOnly:true,checks:[],stopped:false};
let root,data,started=false;const clients=[];
function run(name,args){
  const fd=fs.openSync(path.join(root,name+'.log'),'a');
  try {const r=cp.spawnSync(path.join(bin,name+'.exe'),args,{env,windowsHide:true,stdio:['ignore',fd,fd],timeout:30000});assert.equal(r.status,0,`${name}:${r.error?.code||r.status}`);}
  finally{fs.closeSync(fd);}
}
async function unusedPort(){await new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen({host,port,exclusive:true},()=>s.close(resolve));});}
async function check(name,fn){try{await fn();report.checks.push({name,result:'passed'});}catch(e){report.checks.push({name,result:'failed',code:e.code||'ASSERTION',detail:e.message});throw e;}}
const rpc=async(c,name,args=[]) => (await c.query(`select ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) value`,args)).rows[0].value;
async function identity(c){
  const r=(await c.query("select current_database() db,current_user role,host(inet_server_addr()) host,inet_server_port() port,current_setting('data_directory') dir,current_setting('listen_addresses') listen,current_setting('server_version') version")).rows[0];
  assert.equal(path.resolve(r.dir).toLowerCase(),data.toLowerCase());assert.equal(r.host,host);assert.equal(r.port,port);
  assert.equal(r.listen,host);assert.equal(r.db,'postgres');assert.equal(r.role,'postgres');assert.match(r.version,/^18\.6/);return r;
}
(async()=>{
  try {
    assert.equal(process.argv.length,2,'No target overrides allowed');
    const plan=prepare();
    await unusedPort();
    // Exclusive task reservation prevents a rerun from provisioning a second cluster.
    fs.mkdirSync(reservation);
    root=path.join(reservation,'cluster-'+crypto.randomUUID());fs.mkdirSync(root);
    data=path.join(root,'data');assert.equal(fs.existsSync(data),false);
    report.directory=root;report.migrations=plan.migrations.map(({file,sha256})=>({file,sha256}));
    fs.writeFileSync(path.join(reservation,'identity.json'),JSON.stringify({root,data,host,port,createdAt:report.startedAt},null,2),{flag:'wx'});
    const password=crypto.randomBytes(32).toString('hex'),passwordFile=path.join(root,'init-password.txt');
    fs.writeFileSync(passwordFile,password,{flag:'wx',mode:0o600});
    try {run('initdb',['-D',data,'-U','postgres','--auth=scram-sha-256','--pwfile='+passwordFile,'--encoding=UTF8','--locale=C']);}
    finally{fs.unlinkSync(passwordFile);}
    // Allow only explicit IPv4 loopback authentication; no inherited HBA networks.
    fs.writeFileSync(path.join(data,'pg_hba.conf'),'host all all 127.0.0.1/32 scram-sha-256\nhost all all 0.0.0.0/0 reject\nhost all all ::/0 reject\n');
    await unusedPort();
    run('pg_ctl',['-D',data,'-l',path.join(root,'server.log'),'-o',`-h ${host} -p ${port}`,'-w','start']);started=true;
    for(let i=0;i<3;i++){
      const c=new Client({host,port,user:'postgres',database:'postgres',password,ssl:false,connectionTimeoutMillis:5000,statement_timeout:10000,query_timeout:15000,application_name:'seo-v3-synthetic-test'});
      clients.push(c);await c.connect();report.identity=await identity(c);
    }
    const [a,b,c]=clients;
    await check('fresh isolated cluster',async()=>{
      assert.deepEqual((await a.query('select datname from pg_database order by datname')).rows.map(x=>x.datname),['postgres','template0','template1']);
      assert.equal((await a.query("select count(*)::int n from pg_tables where schemaname not in ('pg_catalog','information_schema')")).rows[0].n,0);
      for(const table of ['pg_foreign_server','pg_subscription'])assert.equal((await a.query(`select count(*)::int n from ${table}`)).rows[0].n,0);
    });
    await check('five pinned migrations and eleven SEO tables',async()=>{
      await a.query("create role anon;create role authenticated;create role service_role;create table products(id text primary key,name text,slug text,active boolean,stock integer);create table categories(id integer primary key,name text,slug text,active boolean);insert into products values('one','Casque synthétique','one',true,5),('two','سماعة تجريبية','two',true,7);insert into categories values(1,'Audio synthétique','audio',true);");
      for(const {file} of plan.migrations)await a.query(fs.readFileSync(path.join(workspace,file),'utf8'));
      assert.equal((await a.query("select count(*)::int n from pg_tables where schemaname='public' and tablename like 'seo_%'")).rows[0].n,11);
    });
    let first,second,retry;
    await check('SKIP LOCKED distinct jobs and claim rollback',async()=>{
      assert.equal(await rpc(a,'reconcile_seo_queue'),3);
      await a.query('begin');first=await rpc(a,'claim_seo_job');
      second=await rpc(b,'claim_seo_job');assert.notEqual(first.kind+first.entity_id,second.kind+second.entity_id);
      await a.query('rollback');retry=await rpc(c,'claim_seo_job');
      assert.equal(retry.kind+retry.entity_id,first.kind+first.entity_id);assert.notEqual(retry.lease_token,first.lease_token);
    });
    const args=j=>[j.kind,j.entity_id,j.lease_token];
    await check('idempotent completion and stale token rejection',async()=>{
      assert.equal(await rpc(a,'complete_seo_job',args(second)),true);
      assert.equal(await rpc(b,'complete_seo_job',args(second)),false);
      assert.equal(await rpc(c,'complete_seo_job',args(first)),false);
    });
    await check('retry backoff, fresh lease and transaction rollback',async()=>{
      assert.equal(await rpc(a,'fail_seo_job',args(retry)),true);
      const row=(await a.query('select state,available_at>now() delayed from seo_sync_queue where kind=$1 and entity_id=$2',args(retry).slice(0,2))).rows[0];
      assert.equal(row.state,'retry');assert.equal(row.delayed,true);
      await a.query("update seo_sync_queue set available_at=now()-interval '1 day' where kind=$1 and entity_id=$2",args(retry).slice(0,2));
      const next=await rpc(b,'claim_seo_job');assert.equal(next.kind+next.entity_id,retry.kind+retry.entity_id);
      assert.equal(await rpc(a,'complete_seo_job',args(retry)),false);
      await b.query('begin');assert.equal(await rpc(b,'complete_seo_job',args(next)),true);await b.query('rollback');
      assert.equal((await a.query('select state from seo_sync_queue where kind=$1 and entity_id=$2',args(next).slice(0,2))).rows[0].state,'processing');
      assert.equal(await rpc(c,'complete_seo_job',args(next)),true);
    });
    let token;
    await check('concurrent workers acquire one durable run',async()=>{
      const starts=await Promise.all([a,b].map(x=>rpc(x,'begin_seo_run')));assert.equal(starts.filter(Boolean).length,1);token=starts.find(Boolean);
    });
    await check('row lock timeout and unrelated synthetic stock independence',async()=>{
      await a.query('begin');await a.query('select * from seo_worker_control for update');
      await assert.rejects(rpc(b,'seo_run_step',[token,'reconcile_seo_queue',{}]),e=>e.code==='55P03');
      await c.query("update products set stock=stock-1 where id='one'");await a.query('rollback');
      await rpc(b,'seo_run_step',[token,'reconcile_seo_queue',{}]);
    });
    await check('concurrent v3 enqueue deduplicates',async()=>{
      const jobs=await Promise.all([a,b].map(x=>rpc(x,'seo_ai_enqueue_v3',['product','one','premium','Synthetic bilingual concurrency request','fixture'])));assert.equal(jobs[0].id,jobs[1].id);
      await rpc(a,'seo_ai_enqueue_v3',['product','two','premium','Synthetic bilingual concurrency request','fixture']);
    });
    await check('concurrent reservations enforce budget',async()=>{
      await a.query("select seo_ai_authorize(id,.2,'fixture') from seo_ai_jobs");await rpc(a,'seo_ai_set_budget',[true,.21,false,'fixture']);
      const jobs=await Promise.all([a,b].map(x=>rpc(x,'seo_ai_claim_editorial_v3',[token,0])));assert.equal(jobs.filter(Boolean).length,1);assert.equal(jobs.find(Boolean).editorial_revision,3);
      assert.equal(Number((await a.query('select sum(primary_reserve) n from seo_ai_jobs')).rows[0].n),.2);
    });
    await check('expired run fenced and uncertain reservation retained',async()=>{
      await a.query("update seo_worker_control set lease_until=now()-interval '1 second'");
      const replacement=await rpc(b,'begin_seo_run');assert.notEqual(replacement,token);
      await assert.rejects(rpc(c,'seo_ai_claim_editorial_v3',[token,0]),/SEO_RUN_EXPIRED/);
      assert.equal(await rpc(b,'seo_ai_claim_editorial_v3',[replacement,0]),null);
      assert.equal(Number((await a.query('select sum(primary_reserve) n from seo_ai_jobs')).rows[0].n),.2);
    });
    report.passed=true;
  } catch(e){report.passed=false;report.error={code:e.code||'CHECK_FAILED',message:e.message};process.exitCode=1;}
  finally {
    for(const c of clients){await c.query('rollback').catch(()=>{});await c.end().catch(()=>{});}
    if(started){try{run('pg_ctl',['-D',data,'-m','fast','-w','stop']);assert.equal(fs.existsSync(path.join(data,'postmaster.pid')),false);report.stopped=true;}catch(e){report.passed=false;report.shutdownError=e.message;process.exitCode=1;}}
    report.finishedAt=new Date().toISOString();
    if(root)fs.writeFileSync(path.join(root,'result.json'),JSON.stringify(report,null,2),{flag:'wx'});
    console.log(JSON.stringify(report,null,2));
  }
})();
