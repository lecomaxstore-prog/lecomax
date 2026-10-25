// Fresh isolated six-migration editorial concurrency rehearsal. Never loads application env.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const net=require('node:net'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {Client}=require('pg');
const {localPostgresProfile}=require('./seo-local-postgres-profile.cjs');
const profile=localPostgresProfile(process.argv.slice(2));
const planFile='operations/seo/editorial-six-migration-plan.json';
const workspace=path.resolve(__dirname,'..'),bin=profile.bin;
const {port,host}=profile;
const reservation=path.join(workspace,'artifacts/seo-editorial-native-'+Date.now());
const env={};
for(const [key,value] of Object.entries(process.env))if(/^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|ProgramFiles|ProgramFiles\(x86\))$/i.test(key))env[key]=value;
const report={startedAt:new Date().toISOString(),host,port,expectedVersion:profile.expectedVersion,syntheticOnly:true,checks:[],stopped:false};
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
  assert.equal(r.listen,host);assert.equal(r.db,'postgres');assert.equal(r.role,'postgres');assert.match(r.version,profile.versionPattern);return r;
}
(async()=>{
  try {
    // Fail before provisioning if the selected local server version is unavailable.
    const executable=path.join(bin,'postgres.exe');
    assert.ok(fs.existsSync(executable),'LOCAL_POSTGRES_VERSION_NOT_INSTALLED');
    const installed=cp.execFileSync(executable,['--version'],{env,windowsHide:true,encoding:'utf8',timeout:5000});
    assert.match(installed.replace(/^.*?PostgreSQL\)\s*/,''),profile.versionPattern,'LOCAL_POSTGRES_VERSION_MISMATCH');
    if(profile.postgrest)require('./seo-local-rest-checks.cjs').preflight(workspace,env);
    const plan=JSON.parse(fs.readFileSync(path.join(workspace,planFile),'utf8'));
    assert.equal(plan.migrations.length,6);
    for(const m of plan.migrations)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(workspace,m.file))).digest('hex'),m.sha256,'MIGRATION_DRIFT');
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
    started=true; // Also clean up if startup succeeds but its acknowledgement times out.
    run('pg_ctl',['-D',data,'-l',path.join(root,'server.log'),'-o',`-h ${host} -p ${port}`,'-w','start']);
    for(let i=0;i<3;i++){
      const c=new Client({host,port,user:'postgres',database:'postgres',password,ssl:false,connectionTimeoutMillis:5000,statement_timeout:10000,query_timeout:15000,application_name:'seo-v3-synthetic-test'});
      clients.push(c);await c.connect();report.identity=await identity(c);
    }
    const [a,b,c]=clients;
    const {shoeFixture}=await import('../operations/seo-vercel/tests/editorial-quality-fixtures.mjs');
    const {source,draft}=shoeFixture();
    await check('fresh isolated cluster',async()=>{
      assert.deepEqual((await a.query('select datname from pg_database order by datname')).rows.map(x=>x.datname),['postgres','template0','template1']);
      assert.equal((await a.query("select count(*)::int n from pg_tables where schemaname not in ('pg_catalog','information_schema')")).rows[0].n,0);
      for(const table of ['pg_foreign_server','pg_subscription'])assert.equal((await a.query(`select count(*)::int n from ${table}`)).rows[0].n,0);
    });

    await check('six pinned migrations with broad default grants',async()=>{
      await a.query('create role anon;create role authenticated;create role service_role;alter default privileges in schema public grant all on tables to public,anon,authenticated,service_role;alter default privileges in schema public grant all on sequences to public,anon,authenticated,service_role;create table products(id text primary key,name text,slug text,active boolean,description text,brand text,category text,images jsonb,stock integer);create table categories(id text primary key,name text,slug text,active boolean);');
      await a.query("insert into products values('one',$1,'fixture',true,$2,$3,$4,'[]',7)",[source.name,source.description,source.brand,source.category]);
      for(const {file} of plan.migrations)await a.query(fs.readFileSync(path.join(workspace,file),'utf8'));
      await a.query("select sync_seo_document('product',to_jsonb(p)) from products p");
    });
    const read=x=>rpc(x,'seo_editorial_read',['one']);
    const mutate=(x,state,action,event=null)=>rpc(x,'seo_editorial_mutate',['one',state.version,state.revision,state.source,action,draft,null,event,{facts:true,french:true,arabic:true,duplicates:true},'Reviewed isolated synthetic fixture','editor@example.invalid']);
    await check('concurrent saves accept exactly one expected version',async()=>{
      const base=await read(a),results=await Promise.allSettled([mutate(a,base,'save'),mutate(b,base,'save')]);
      assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
      assert.match(results.find(r=>r.status==='rejected').reason.message,/CONFLICT/);
      assert.equal((await read(c)).revision,1);
    });
    await check('concurrent publication is fenced and rollback is version fenced',async()=>{
      await mutate(a,await read(a),'approved');const base=await read(a);
      const results=await Promise.allSettled([mutate(a,base,'publish'),mutate(b,base,'publish')]);
      assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.match(results.find(r=>r.status==='rejected').reason.message,/CONFLICT/);
      const published=await read(a);assert.deepEqual(published.published,draft);
      const event=published.events.find(e=>e.action==='publish').id;
      const rollbacks=await Promise.allSettled([mutate(a,published,'rollback',event),mutate(b,published,'rollback',event)]);
      assert.equal(rollbacks.filter(r=>r.status==='fulfilled').length,1);assert.match(rollbacks.find(r=>r.status==='rejected').reason.message,/CONFLICT/);
      assert.equal((await read(c)).published,null);
    });
    await check('source lock timeout fails without committing a revision',async()=>{
      const base=await read(b);await a.query('begin');await a.query("update products set name='Synthetic locked source' where id='one'");
      await assert.rejects(mutate(b,base,'save'),e=>e.code==='55P03');await a.query('rollback');
      assert.equal((await read(c)).revision,base.revision);
    });
    await check('transaction rollback preserves draft and events atomically',async()=>{
      const base=await read(a);await a.query('begin');await mutate(a,base,'save');await a.query('rollback');assert.deepEqual(await read(b),base);
    });
    await check('actual database roles cannot read private tables or bypass bounded RPC grants',async()=>{
      for(const role of ['anon','authenticated','service_role']){
        await c.query('set role '+role);
        for(const table of ['seo_editorial_revisions','seo_editorial_events'])await assert.rejects(c.query('select * from '+table),e=>e.code==='42501');
        if(role==='service_role')assert.equal((await read(c)).revision,1);
        else await assert.rejects(read(c),e=>e.code==='42501');
        await c.query('reset role');
      }
      const rows=(await a.query("select relname,relrowsecurity from pg_class where relname in ('seo_editorial_revisions','seo_editorial_events')")).rows;
      assert.equal(rows.length,2);assert.ok(rows.every(r=>r.relrowsecurity));
    });
    if(profile.postgrest)await require('./seo-local-rest-checks.cjs').runChecks({workspace,root,data,bin,env,host,port,password,client:a,check,report});
    report.passed=true;
  } catch(e){report.passed=false;report.error={code:e.code||'CHECK_FAILED',message:e.message};process.exitCode=1;}
  finally {
    for(const c of clients){await c.query('rollback').catch(()=>{});await c.end().catch(()=>{});}
    if(started){try{if(fs.existsSync(path.join(data,'postmaster.pid')))run('pg_ctl',['-D',data,'-m','fast','-w','stop']);assert.equal(fs.existsSync(path.join(data,'postmaster.pid')),false);report.stopped=true;}catch(e){report.passed=false;report.shutdownError=e.message;process.exitCode=1;}}
    report.finishedAt=new Date().toISOString();
    if(root)fs.writeFileSync(path.join(root,'result.json'),JSON.stringify(report,null,2),{flag:'wx'});
    console.log(JSON.stringify(report,null,2));
  }
})();
