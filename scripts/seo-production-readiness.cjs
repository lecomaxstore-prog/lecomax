// Read-only production inspection. Never executes migration or deployment.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {Client}=require('pg');require('@next/env').loadEnvConfig(process.cwd(),false,{info(){},error(){}});
const base='C:\\Users\\Ziko\\Backups\\LECOMAX',stamp=Date.now(),out=path.join(base,'production-readiness-'+stamp),bin='C:\\Program Files\\PostgreSQL\\18\\bin';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const u=new URL(process.env.OWNER_DATABASE_URL),ref=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
if(!(u.hostname===`db.${ref}.supabase.co`||u.hostname.endsWith('.pooler.supabase.com')&&decodeURIComponent(u.username).endsWith('.'+ref))||u.port==='6543')throw Error('Target guard failed');
const ca=path.resolve('supabase/prod-ca-2021.crt');
const env={...process.env,PGHOST:u.hostname,PGPORT:u.port||'5432',PGUSER:decodeURIComponent(u.username),PGPASSWORD:decodeURIComponent(u.password),PGDATABASE:decodeURIComponent(u.pathname.slice(1)),PGSSLMODE:'verify-full',PGSSLROOTCERT:ca,PGCONNECT_TIMEOUT:'15',PGOPTIONS:'-c default_transaction_read_only=on -c timezone=UTC'};delete env.PGHOSTADDR;
function run(tool,args){const r=cp.spawnSync(path.join(bin,tool+'.exe'),args,{env,encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:32*1024*1024});if(r.status!==0)throw Error(tool+' failed; no credentials logged');return r.stdout;}
const blocks=s=>new Map(s.replace(/^\\(?:un)?restrict .*$/gm,'').split(/\n--\n-- Name: /).slice(1).map(b=>{const head=b.split('\n')[0];const body=b.slice(b.indexOf('\n')).replace(/^--.*$/gm,'').trim();return [head,body];}));
(async()=>{
 fs.mkdirSync(out);
 const candidates=fs.readdirSync(base).filter(n=>/^lecomax-production-.*\.dump$/.test(n)).sort();if(!candidates.length)throw Error('Backup absent');
 const backup=path.join(base,candidates.at(-1)),record=JSON.parse(fs.readFileSync(backup+'.report.json'));
 if(sha(fs.readFileSync(backup))!==record.sha256)throw Error('Backup checksum mismatch');
 const listing=run('pg_restore',['--list',backup]);
 run('pg_restore',['--schema-only','--file',path.join(out,'backup-schema.sql'),backup]);
 const client=new Client({host:env.PGHOST,port:Number(env.PGPORT),user:env.PGUSER,password:env.PGPASSWORD,database:env.PGDATABASE,ssl:{rejectUnauthorized:true,ca:fs.readFileSync(ca,'utf8')},connectionTimeoutMillis:15000});
 try{
  await client.connect();await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');await client.query("SET LOCAL statement_timeout='20s'");
  const identity=(await client.query("select current_setting('transaction_read_only') read_only,current_setting('server_version') version,current_user role,current_database() database,pg_is_in_recovery() replica")).rows[0];
  if(identity.read_only!=='on'||identity.database!==env.PGDATABASE)throw Error('Read-only identity check failed');
  const snapshot=(await client.query('select pg_export_snapshot() snapshot')).rows[0].snapshot;
  run('pg_dump',['--schema-only','--snapshot',snapshot,'--lock-wait-timeout=5000','--file',path.join(out,'current-schema.sql')]);
  const integrity={};for(const table of ['public.products','public.categories','public.orders','auth.users'])integrity[table]=(await client.query(`select count(*)::int rows, md5(coalesce(string_agg(row_to_json(t)::text,E'\\n' order by row_to_json(t)::text),'')) content_fingerprint from ${table} t`)).rows[0];
  const schemaCreate=(await client.query("select rolname,has_schema_privilege(rolname,'public','CREATE') can_create from pg_roles where rolname in ('anon','authenticated','service_role')")).rows;
  await client.query('ROLLBACK');
  const preflight=await client.query(fs.readFileSync('supabase/verification/seo-preflight.sql','utf8'));
  const results=preflight.filter(r=>r.command==='SELECT').map(r=>r.rows);
  await client.query('BEGIN READ ONLY');const ledger=(await client.query("select version from supabase_migrations.schema_migrations where version='202610180001'")).rows;await client.query('ROLLBACK');
  const a=blocks(fs.readFileSync(path.join(out,'backup-schema.sql'),'utf8')),b=blocks(fs.readFileSync(path.join(out,'current-schema.sql'),'utf8'));
  const differences=[...new Set([...a.keys(),...b.keys()])].filter(k=>a.get(k)!==b.get(k)).map(k=>({object:k,change:!a.has(k)?'added':!b.has(k)?'removed':'modified'}));
  const flat=results.flat();
  const issues=[];
  for(const x of flat.filter(x=>['existing_relations','existing_functions','existing_policies','catalogue_triggers'].includes(x.check_name)))issues.push('Existing SEO object or catalogue trigger: '+x.check_name);
  for(const x of flat.filter(x=>x.check_name==='catalogue_integrity'))if(['null_required','empty_required','duplicate_ids','duplicate_active_slugs'].some(k=>Number(x[k])!==0))issues.push('Catalogue integrity: '+x.table_name);
  if(ledger.length)issues.push('Migration already recorded');
  const report={at:new Date().toISOString(),backup:{file:backup,bytes:fs.statSync(backup).size,sha256:record.sha256,checksumMatches:true,archiveEntries:listing.split(/\r?\n/).filter(l=>/^\d+;/.test(l)).length,createdAt:record.startedAt},identity:{...identity,tlsCertificateVerified:client.connection.stream.authorized===true},schemaComparison:{backupObjects:a.size,currentObjects:b.size,differences,matched:differences.length===0,scope:'All named schema dump blocks including owners, ACLs, policies, triggers, functions and extensions; not role globals or external platform settings'},integrity,schemaCreate,preflight:results,migrationLedger:ledger,issues,migrationSha256:sha(fs.readFileSync('supabase/migrations/202610180001_seo_engine.sql')),localEnvironmentPresence:Object.fromEntries(['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','ADMIN_EMAIL','ADMIN_SESSION_SECRET','SEO_AI_BASE_URL','SEO_AI_API_KEY','SEO_AI_MODEL'].map(k=>[k,Boolean(process.env[k])])),productionWritesPerformed:false};
  fs.writeFileSync(path.join(out,'readiness.json'),JSON.stringify(report,null,2));fs.writeFileSync('artifacts/seo-migration/production-readiness-'+stamp+'.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({file:'artifacts/seo-migration/production-readiness-'+stamp+'.json',backup:report.backup,identity:report.identity,schemaComparison:report.schemaComparison,counts:Object.fromEntries(Object.entries(integrity).map(([k,v])=>[k,v.rows])),issues,schemaCreate,migrationSha256:report.migrationSha256},null,2));
 }finally{await client.end();}
})().catch(e=>{console.error('Read-only readiness failed: '+(e.code||'CHECK_FAILED'));process.exitCode=1;});
