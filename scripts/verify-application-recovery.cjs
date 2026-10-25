// Recovery rehearsal only. Fixed loopback cluster; never loads .env or accepts a remote target.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {Client}=require('pg');
const base='C:\\Users\\Ziko\\Backups\\LECOMAX',cluster=path.join(base,'restore-test-20261018');
const backup=path.join(base,'lecomax-production-2026-10-18T17-42-58-995Z.dump');
const bin='C:\\Program Files\\PostgreSQL\\18\\bin';
const resume=process.argv[2];if(resume&&!/^\d{13}$/.test(resume))throw Error('Invalid rehearsal identifier');
const stamp=resume||Date.now(),db='lecomax_app_recovery_'+stamp,out=path.join(base,'application-recovery-'+stamp);
const password=fs.readFileSync(path.join(cluster,'password.txt'),'utf8').trim(),ca=path.join(cluster,'localhost.crt');
const env={...process.env};for(const k of Object.keys(env))if(/^PG|DATABASE|SUPABASE|SECRET|TOKEN|PASSWORD|API_KEY/i.test(k))delete env[k];
Object.assign(env,{PGHOST:'localhost',PGPORT:'55439',PGDATABASE:db,PGUSER:'postgres',PGPASSWORD:password,PGSSLMODE:'verify-full',PGSSLROOTCERT:ca,PGOPTIONS:'-c timezone=UTC'});
function run(exe,args,label){const r=cp.spawnSync(path.join(bin,exe+'.exe'),args,{env,encoding:'utf8',windowsHide:true,timeout:600000,maxBuffer:32*1024*1024});fs.writeFileSync(path.join(out,label+'.log'),(r.stdout||'')+'\n'+(r.stderr||''));if(r.status!==0)throw Error(label+' failed; protected log retained');return r.stdout;}
async function connect(database){const c=new Client({host:'localhost',port:55439,database,user:'postgres',password,ssl:{rejectUnauthorized:true,ca:fs.readFileSync(ca,'utf8')}});await c.connect();const row=(await c.query("select current_database() db,host(inet_server_addr()) host,current_setting('data_directory') dir")).rows[0];assert.equal(row.db,database);assert.equal(row.host,'127.0.0.1');assert.equal(path.resolve(row.dir).toLowerCase(),path.resolve(cluster,'data').toLowerCase());return c;}
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function copies(file){const tables={};let key=null;for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){if(key){if(line==='\\.')key=null;else tables[key].rows.push(line);}else{const m=line.match(/^COPY (\S+) (\(.*\)) FROM stdin;$/);if(m){key=m[1].replaceAll('"','');tables[key]={columns:m[2],rows:[]};}}}for(const t of Object.values(tables)){t.count=t.rows.length;t.sha256=sha(t.rows.sort().join('\n'));delete t.rows;}return tables;}
(async()=>{
 assert.equal(sha(fs.readFileSync(backup)),JSON.parse(fs.readFileSync(backup+'.report.json')).sha256,'Original backup checksum mismatch');
 if(!resume)fs.mkdirSync(out);
 const originalToc=run('pg_restore',['--list',backup],'archive-list');
 const omitted=[];const selected=originalToc.split(/\r?\n/).filter(line=>{
  if(!/^\d+;/.test(line))return true;
  let reason=null;
  if(/(?:EXTENSION -|COMMENT - EXTENSION) (pg_cron|pg_net|supabase_vault)(?: |$)/.test(line))reason='Unavailable managed extension';
  else if(/ (cron|net|vault) /.test(line)||/(?:SCHEMA -|ACL - SCHEMA) (cron|net|vault)(?: |$)/.test(line))reason='Managed extension namespace and dependencies';
  else if(/ EVENT TRIGGER /.test(line))reason='Hosted infrastructure event trigger';
  if(reason)omitted.push({entry:line,reason});return !reason;
 });
 assert.equal(omitted.filter(x=>x.reason==='Hosted infrastructure event trigger').length,6);
 fs.writeFileSync(path.join(out,'application.list'),selected.join('\n'));fs.writeFileSync(path.join(out,'omitted-objects.json'),JSON.stringify(omitted,null,2));
 if(!resume){
 const admin=await connect('postgres');try{assert.equal((await admin.query('select 1 from pg_database where datname=$1',[db])).rowCount,0);await admin.query(`CREATE DATABASE "${db}" TEMPLATE template0`);}finally{await admin.end();}
 // No --clean, no owner stripping, no ACL stripping: unexpected failures roll back the entire restore.
 run('pg_restore',['--exit-on-error','--single-transaction','--use-list',path.join(out,'application.list'),'--dbname',db,backup],'application-restore');
 }
 run('pg_dump',['--data-only','--file',path.join(out,'restored-data.sql')],'application-data');
 const expected=copies(path.join(cluster,'archive-data.sql')),actual=copies(path.join(out,'restored-data.sql'));
 const comparison=Object.entries(expected).filter(([k])=>!k.startsWith('cron.')&&!k.startsWith('vault.')).map(([table,e])=>({table,rows:e.count,passed:actual[table]?.count===e.count&&actual[table]?.sha256===e.sha256&&actual[table]?.columns===e.columns}));
 fs.writeFileSync(path.join(out,'row-content-comparison.json'),JSON.stringify(comparison,null,2));assert.equal(comparison.length,110);assert(comparison.every(x=>x.passed),'Archive row-content mismatch');
 fs.writeFileSync(path.join(out,'row-content-comparison.json'),JSON.stringify(comparison,null,2));
 const c=await connect(db);
 try{
  // Reproduce migration-owner restrictions in a separate role, without changing the existing cluster owner.
  const role='seo_migration_rehearsal_'+stamp;
  await c.query(`CREATE ROLE "${role}" NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION BYPASSRLS`);
  await c.query(`GRANT postgres TO "${role}" WITH INHERIT TRUE, SET FALSE`);
  // Mirror broad default grants relevant to Supabase; the migration must revoke them explicitly.
  await c.query(`ALTER DEFAULT PRIVILEGES FOR ROLE "${role}" IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated,service_role`);
  await c.query(`ALTER DEFAULT PRIVILEGES FOR ROLE "${role}" IN SCHEMA public GRANT ALL ON SEQUENCES TO anon,authenticated,service_role`);
  await c.query(`ALTER DEFAULT PRIVILEGES FOR ROLE "${role}" IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon,authenticated,service_role`);
  await c.query(`SET ROLE "${role}"`);
  assert.equal((await c.query("select rolsuper from pg_roles where rolname=current_user")).rows[0].rolsuper,false);
  const migration=fs.readFileSync('supabase/migrations/202610180001_seo_engine.sql');assert.equal(sha(migration),'958e8727fb9d5f32df6702b00cd17e1e0a2e71b98674f1523ae29e439af3332f');
  await c.query(migration.toString());
  const result=await c.query(fs.readFileSync('supabase/verification/seo-postflight.sql','utf8'));const checks=result.flatMap(r=>r.rows||[]).filter(r=>'passed'in r);assert.equal(checks.length,34);assert(checks.every(r=>r.passed));
  await c.query('RESET ROLE');
  const ts=require('typescript'),exports={};new Function('exports',ts.transpileModule(fs.readFileSync('lib/seo-engine.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exports);
  await c.query('BEGIN');
  try{
   const id=crypto.randomUUID(),slug='isolated-recovery-'+stamp;
   await c.query("INSERT INTO public.products(id,slug,name,description,price,active) VALUES($1,$2,'Isolated SEO test','Local product recovery test.',99,true)",[id,slug]);
   let doc=(await c.query("select * from public.seo_documents where kind='product' and entity_id=$1",[id])).rows[0];assert(doc);assert.equal(doc.slug,slug);
   await c.query("UPDATE public.products SET name='Isolated SEO updated' WHERE id=$1",[id]);
   doc=(await c.query("select * from public.seo_documents where kind='product' and entity_id=$1",[id])).rows[0];assert.equal(doc.source.name,'Isolated SEO updated');
   const content=exports.fallbackSeo(doc.source,'product');assert(exports.validSeoContent(content));
   await c.query('SET LOCAL ROLE service_role');
   const draft=(await c.query("select public.save_seo_document('product',$1,$2,'draft',$3,'recovery-test@example.invalid','deterministic',null) doc",[id,doc.version,content])).rows[0].doc;
   assert.deepEqual(draft.draft,content);assert.equal(draft.published,null);
   await c.query("select public.save_seo_document('product',$1,$2,'approve',null,'recovery-test@example.invalid','deterministic',null)",[id,draft.version]);
  }finally{await c.query('ROLLBACK');}
  const report={at:new Date().toISOString(),database:db,outputDirectory:out,originalBackupUnchanged:sha(fs.readFileSync(backup))===JSON.parse(fs.readFileSync(backup+'.report.json')).sha256,restoreExitCode:0,excludedObjects:omitted.length,copyTablesWithExactRowContent:comparison.length,publicTablesRecovered:comparison.filter(x=>x.table.startsWith('public.')).length,nonSuperuserMigrationPassed:true,postflightChecks:checks.length,productCreationPassed:true,productUpdatePassed:true,realDeterministicSeoGenerationPassed:true,serviceRoleSaveAndApprovePassed:true,behavioralWritesRolledBack:true,fullSupabaseStack:false,adminHttpAuthorizationTested:false};
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await c.end();}
})().catch(e=>{if(fs.existsSync(out))fs.writeFileSync(path.join(out,'failure.log'),e.stack||e.message);console.error('Local application recovery failed: '+(e.code||'ERROR')+' '+(e.stack?.split('\n').find(l=>l.includes('verify-application-recovery.cjs:'))||''));process.exitCode=1;});
