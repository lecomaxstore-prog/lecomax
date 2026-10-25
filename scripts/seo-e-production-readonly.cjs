// Catalog-only production inventory. No application rows, RPCs or mutations.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {Client}=require('pg');
const out=path.resolve('artifacts/seo-e-final-20261022');fs.mkdirSync(out,{recursive:true});
const report={at:new Date().toISOString(),productionWrites:false,applicationRowsRead:false};
(async()=>{
 require('@next/env').loadEnvConfig(process.cwd(),false,{info(){},error(){}});
 const ref='yddqwgdgeljkzfsmtein',u=new URL(process.env.OWNER_DATABASE_URL);
 assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,ref+'.supabase.co');
 assert(u.hostname==='db.'+ref+'.supabase.co'||u.hostname.endsWith('.pooler.supabase.com')&&decodeURIComponent(u.username).endsWith('.'+ref));assert.notEqual(u.port,'6543');
 const c=new Client({host:u.hostname,port:Number(u.port||5432),user:decodeURIComponent(u.username),password:decodeURIComponent(u.password),database:decodeURIComponent(u.pathname.slice(1)),ssl:{rejectUnauthorized:true,ca:fs.readFileSync('supabase/prod-ca-2021.crt','utf8')},options:'-c default_transaction_read_only=on',connectionTimeoutMillis:15000});
 try{await c.connect();await c.query('begin isolation level repeatable read read only');await c.query("set local statement_timeout='15s'");
 const q=async s=>(await c.query(s)).rows;
 report.identity=(await q("select current_database() database,current_setting('transaction_read_only') read_only,current_setting('server_version') version"))[0];assert.equal(report.identity.read_only,'on');assert(c.connection.stream.authorized);report.tlsVerified=true;report.projectRef=ref;
 report.columns=await q("select table_name,column_name,udt_name,is_nullable,column_default from information_schema.columns where table_schema='public' and (table_name in ('products','categories','admin_staff','admin_roles','admin_role_permissions','admin_sessions') or table_name like 'seo_%') order by 1,ordinal_position");
 report.relations=await q("select relname,relkind,relrowsecurity,relforcerowsecurity from pg_class where relnamespace='public'::regnamespace and relname like 'seo_%' order by 1");
 report.functions=await q("select p.oid::regprocedure::text signature,p.prosecdef,p.proconfig,p.proacl::text acl,md5(pg_get_functiondef(p.oid)) definition_hash from pg_proc p where p.pronamespace='public'::regnamespace and p.proname like '%seo%' order by 1");
 report.grants=await q("select grantee,table_name,privilege_type from information_schema.table_privileges where table_schema='public' and table_name like 'seo_%' order by 2,1,3");
 report.policies=await q("select tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname='public' and tablename like 'seo_%'");
 report.roles=await q("select rolname,rolbypassrls,rolcanlogin from pg_roles where rolname in ('anon','authenticated','service_role','authenticator') order by 1");
 report.schemaPrivileges=await q("select rolname,has_schema_privilege(rolname,'public','CREATE') can_create,has_schema_privilege(rolname,'public','USAGE') can_use from pg_roles where rolname in ('anon','authenticated','service_role','authenticator') order by 1");
 report.defaultPrivileges=await q("select defaclrole::regrole::text owner,defaclnamespace::regnamespace::text namespace,defaclobjtype,defaclacl::text acl from pg_default_acl where defaclnamespace in (0,'public'::regnamespace) order by 1,2,3");
 report.constraints=await q("select conrelid::regclass::text relation,conname,contype,pg_get_constraintdef(oid) definition from pg_constraint where conrelid in ('public.products'::regclass,'public.categories'::regclass) order by 1,2");
 report.ledger=await q("select version from supabase_migrations.schema_migrations order by version");
 report.triggers=await q("select c.relname,t.tgname,t.tgenabled,p.proname,pg_get_functiondef(p.oid) ~* '(seo_sync|seo_document|seo_queue|claim_seo|reconcile_seo)' references_seo from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_proc p on p.oid=t.tgfoid where c.relnamespace='public'::regnamespace and c.relname in ('products','categories','orders') and not t.tgisinternal");
 await c.query('rollback');report.passed=true;
 }finally{await c.end();}
})().catch(e=>{report.passed=false;report.error=e.code||'READONLY_INVENTORY_FAILED';process.exitCode=1;}).finally(()=>{const file=path.join(out,'production-schema-'+Date.now()+'.json');fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({file,passed:report.passed,error:report.error,identity:report.identity,seoRelations:report.relations?.length,seoFunctions:report.functions?.length,tlsVerified:report.tlsVerified}));});
