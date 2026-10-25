// Real psql on a new synthetic localhost cluster. No application env is loaded.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve('artifacts/seo-rollout-guards-'+Date.now()),bin='C:/Program Files/PostgreSQL/18/bin',port=55442;
fs.mkdirSync(root,{recursive:true});
const env={...process.env};for(const key of Object.keys(env))if(/^PG/.test(key))delete env[key];
Object.assign(env,{PGHOST:'127.0.0.1',PGPORT:String(port),PGUSER:'postgres',PGDATABASE:'postgres'});
const run=(tool,args,allowed=false)=>{const r=cp.spawnSync(path.join(bin,tool+'.exe'),args,{env,windowsHide:true,encoding:'utf8',timeout:30000});if(!allowed)assert.equal(r.status,0,tool+' failed');return r;};
let started=false;
try {
  run('initdb',['-D',path.join(root,'data'),'-U','postgres','-A','trust','--encoding=UTF8','--locale=C']);
  const fd=fs.openSync(path.join(root,'startup.log'),'w');
  const start=cp.spawnSync(path.join(bin,'pg_ctl.exe'),['-D',path.join(root,'data'),'-l',path.join(root,'server.log'),'-o',`-h 127.0.0.1 -p ${port}`,'-w','start'],{env,windowsHide:true,stdio:['ignore',fd,fd],timeout:30000});fs.closeSync(fd);assert.equal(start.status,0);started=true;
  const psql=(args,allowed=false)=>run('psql',['-X','-w','-v','ON_ERROR_STOP=1',...args],allowed);
  const cases=[
    {name:'retired synchronous wrapper',args:['-f','supabase/verification/seo-approved-session-procedure.psql'],marker:'retired_unsafe_seo_wrapper'},
    {name:'missing explicit approval',args:['-f','operations/seo/apply.psql'],marker:'approval_guard_failed'},
    {name:'wrong target despite approval acknowledgement',args:['-v','seo_approval=APPROVED_DECOUPLED_202610180002','-f','operations/seo/apply.psql'],marker:'identity_guard_failed'},
  ];
  for(const c of cases){const result=psql(c.args,true);assert.equal(result.status,3,c.name);assert.match(result.stderr,/division by zero/);}
  const present=psql(['-At','-c',"select count(*) from pg_class where relname in ('seo_documents','seo_sync_queue')"]);assert.equal(present.stdout.trim(),'0');
  const report={at:new Date().toISOString(),localOnly:true,guardCases:cases.map(c=>c.name),allRejectedBeforeMigration:true,seoObjectsCreated:0};
  fs.writeFileSync(path.join(root,'result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({directory:root,...report}));
} finally {if(started)run('pg_ctl',['-D',path.join(root,'data'),'-m','fast','-w','stop']);}
