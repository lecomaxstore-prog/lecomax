// Explicit owner-authorized repair. No password reset, deployment or SQL writes.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const readline = require('node:readline');
const {pathToFileURL} = require('node:url');
const {Client} = require('pg');
const {vercelApiFetch} = require('./vercel-cli-api.cjs');
const root=path.resolve(__dirname,'..');
const project='prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb', team='team_yFLUcpSvgQi8EQuvuorOZW7w', ref='yddqwgdgeljkzfsmtein';
const host='aws-0-eu-west-1.pooler.supabase.com';
const check=(ok,code)=>{if(!ok)throw Error(code);};
const emit=v=>process.stdout.write(JSON.stringify(v)+'\n');
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const scope=e=>e.target?.length===1&&e.target[0]==='production'&&!e.gitBranch&&!e.customEnvironmentIds?.length;
function entries(envs) {
  const urls=envs.filter(e=>e.key==='OWNER_DATABASE_URL'&&e.target?.includes('production'));
  const bindings=envs.filter(e=>e.key==='OWNER_DATABASE_BINDING'&&e.target?.includes('production'));
  check(urls.length===1&&scope(urls[0])&&urls[0].type==='sensitive','DATABASE_SCOPE_CHANGED');
  check(bindings.length===0,'BINDING_ALREADY_EXISTS_REVIEW_REQUIRED');
  return urls[0];
}
function makeUri(password) {
  check(typeof password==='string'&&password.length>0&&password.length<4096&&!/[\r\n\0]/.test(password),'PASSWORD_INPUT_INVALID');
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@${host}:5432/postgres?sslmode=verify-full`;
}
async function api(route,method='GET',body) {
  const u=new URL(route,'https://api.vercel.com');u.searchParams.set('teamId',team);
  const r=await vercelApiFetch(u,method==='GET'?{}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  check(r.ok,'VERCEL_REQUEST_FAILED');return r.json();
}
async function list() {
  const r=await api(`/v10/projects/${project}/env?decrypt=false`);
  check(Array.isArray(r.envs)&&!r.pagination?.next,'ENV_PAGINATION');return r.envs;
}
async function validateClient(client,report) {
  await client.connect();
  report.connectionAccepted=true;
  report.tlsVerified=client.connection.stream.authorized===true;
  check(report.tlsVerified,'DATABASE_TLS_VERIFICATION_FAILED');
  await client.query('BEGIN READ ONLY');
  try {
    const r=(await client.query("select current_database() db, current_user usr, current_setting('transaction_read_only') ro")).rows[0];
    report.databaseChecks={databaseMatches:r.db==='postgres',roleMatches:r.usr==='postgres',readOnly:r.ro==='on'};
    check(report.databaseChecks.databaseMatches,'DATABASE_NAME_MISMATCH');
    check(report.databaseChecks.roleMatches,'DATABASE_ROLE_MISMATCH');
    check(report.databaseChecks.readOnly,'DATABASE_READONLY_NOT_ENFORCED');
  } finally {await client.query('ROLLBACK');}
}
async function database(uri,report) {
  const u=new URL(uri);
  const client=new Client({host:u.hostname,port:5432,user:decodeURIComponent(u.username),password:decodeURIComponent(u.password),database:'postgres',ssl:{rejectUnauthorized:true,servername:host,ca:fs.readFileSync(path.join(root,'supabase/prod-ca-2021.crt'),'utf8')},options:'-c default_transaction_read_only=on -c statement_timeout=15000',connectionTimeoutMillis:15000,query_timeout:15000});
  try {
    await validateClient(client,report);
  } finally {await client.end().catch(()=>{});}
}
// Injectable operations make the no-write-before-validation boundary testable.
async function repair(uri,before,report,io={list,database,api}) {
  const original=entries(before);
  report.stage='database-read-only-validation';
  await io.database(uri,report);
  report.database='READ_ONLY_QUERY_TLS_CERTIFICATE_AND_HOSTNAME_PASS';
  const fresh=await io.list();
  check(hash(JSON.stringify(fresh))===hash(JSON.stringify(before)),'ENVIRONMENT_DRIFT');
  entries(fresh);
  report.stage='replace-production-uri';
  report.uriWrite='ATTEMPTED_OUTCOME_UNKNOWN';
  await io.api(`/v9/projects/${project}/env/${encodeURIComponent(original.id)}`,'PATCH',{value:uri});
  report.uriWrite='ACKNOWLEDGED_SENSITIVE_VALUE_NOT_READABLE';
  const middle=await io.list();
  entries(middle);
  check(before.filter(e=>e.id!==original.id).every(e=>middle.some(x=>x.id===e.id&&hash(JSON.stringify(x))===hash(JSON.stringify(e)))),'UNRELATED_ENV_DRIFT');
  const binding=ref+':'+hash(uri);
  report.stage='create-production-binding';
  report.bindingWrite='ATTEMPTED_OUTCOME_UNKNOWN';
  await io.api(`/v10/projects/${project}/env`,'POST',{key:'OWNER_DATABASE_BINDING',value:binding,type:'encrypted',target:['production']});
  report.bindingWrite='ACKNOWLEDGED';
  const after=await io.list();
  const b=after.filter(e=>e.key==='OWNER_DATABASE_BINDING'&&e.target?.includes('production'));
  check(b.length===1&&scope(b[0]),'BINDING_SCOPE_READBACK_FAILED');
  const result=await io.api(`/v1/projects/${project}/env/${encodeURIComponent(b[0].id)}?decrypt=true`);
  check(result.value===binding,'BINDING_READBACK_FAILED');
  report.binding='EXACT_HASH_READBACK_PASS';
  const saved=after.filter(e=>e.key==='OWNER_DATABASE_URL'&&e.target?.includes('production'));
  check(saved.length===1&&saved[0].id===original.id&&scope(saved[0])&&saved[0].type==='sensitive','URI_METADATA_READBACK_FAILED');
  report.unrelatedEntriesPreserved=before.filter(e=>e.id!==original.id).every(e=>after.some(x=>x.id===e.id&&hash(JSON.stringify(x))===hash(JSON.stringify(e))));
  check(report.unrelatedEntriesPreserved,'UNRELATED_ENV_DRIFT');
}
async function main() {
  const report={at:new Date().toISOString(),status:'STARTED',databaseWrites:false,deployed:false,passwordResetByScript:false,localSecretsPersisted:false};
  let lock,uri;
  const lockPath=path.join(root,'artifacts/production-database-repair.lock');
  try {
    check(process.argv.includes('--owner-authorized'),'OWNER_AUTHORIZATION_REQUIRED');
    // Keep a receipt across executions. Re-running a partially completed mutation requires review.
    lock=fs.openSync(lockPath,'wx');fs.writeSync(lock,JSON.stringify({at:report.at,pid:process.pid}));
    report.stage='vercel-preflight';emit({message:'Verification du projet Vercel et des variables avant saisie...'});
    const p=await api('/v9/projects/'+project);
    check(p.id===project&&p.accountId===team&&p.name==='lecomax','PROJECT_IDENTITY_FAILED');
    const shared=await api('/v1/env');check(Array.isArray(shared.data)&&!shared.data.length&&!shared.pagination?.next,'SHARED_ENV_REVIEW_REQUIRED');
    const before=await list();entries(before);
    const alias=await api('/v4/aliases/lecomax.com');
    const deploymentId=alias.deploymentId||alias.deployment?.id;
    const d=await api('/v13/deployments/'+deploymentId);check(d.projectId===project,'ALIAS_IDENTITY_FAILED');
    const input=readline.createInterface({input:process.stdin,terminal:false})[Symbol.asyncIterator]();
    emit({prompt:'NEW_DATABASE_PASSWORD'});
    const next=await input.next();check(!next.done,'INPUT_CANCELLED');
    let payload=JSON.parse(next.value);uri=makeUri(payload.value);payload=null;
    const policy=await import(pathToFileURL(path.join(root,'operations/seo-vercel/lib/environment-target.mjs')));
    check(policy.ownerTarget({APP_ENV:'production'},uri)===ref,'TARGET_REJECTED');
    emit({message:'Test PostgreSQL en lecture seule et certificat TLS. Si valide, mise a jour des deux variables autorisees...'});
    await repair(uri,before,report);
    const current=await api('/v4/aliases/lecomax.com');
    report.aliasUnchanged=(current.deploymentId||current.deployment?.id)===deploymentId;
    check(report.aliasUnchanged,'ALIAS_DRIFT');
    report.status='VERCEL_CONFIGURATION_REPAIRED_NOT_DEPLOYED';
  } catch(e) {
    report.status='STOPPED_DO_NOT_RETRY';
    report.failure=e.code==='EEXIST'?'PREVIOUS_REPAIR_REQUIRES_REVIEW':e.code==='28P01'?'28P01':/^[A-Z_]{3,70}$/.test(e.message)?e.message:'REPAIR_FAILED';
    process.exitCode=1;
  } finally {
    uri=null;if(lock!==undefined)fs.closeSync(lock);
    report.limitations=[report.uriWrite==='ACKNOWLEDGED_SENSITIVE_VALUE_NOT_READABLE'?'Sensitive URI write acknowledged by API; its stored bytes cannot be read back.':report.uriWrite?'URI write was attempted; inspect outcome before resuming.':'No Vercel URI write was attempted.','Existing deployments retain old configuration. No deployment or session signer change performed.','No automatic retries or rollback; inspect attempted writes before resuming.','External consumers and backup credentials are not updated.'];
    const stamp=Date.now(),file=path.join(root,`artifacts/production-database-repair-${stamp}.json`);
    fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});
    const history={id:'production-database-repair-run-'+stamp,relatedId:'production-database-repair-prepared-20261021',createdAt:new Date().toISOString(),title:'Authorized Production database credential repair run',summary:report.status,status:report.failure?'failed':'needs-testing',pages:['Production operations','Change History'],components:['Production database credentials'],files:['scripts/repair-production-database.cjs','scripts/verify-production-credentials.ps1'],changes:[{kind:'modified',detail:'URI write: '+(report.uriWrite||'not attempted')+'. Binding write: '+(report.bindingWrite||'not attempted')+'. No deployment, migration, SQL write or session signer modification.'}],validation:[{name:'Database and provider checks',result:report.failure?'failed':'passed',detail:'Database: '+(report.database||'not verified')+'. Binding: '+(report.binding||'not verified')+'. Failure: '+(report.failure||'none')+'. Sensitive URI bytes cannot be independently read back; runtime deployment remains untested.'}]};
    const historyFile=path.join(root,`artifacts/production-database-repair-history-${stamp}.json`);
    fs.writeFileSync(historyFile,JSON.stringify(history,null,2),{flag:'wx'});
    const cp=require('node:child_process');
    const append=cp.spawnSync(process.execPath,[path.join(root,'lecomax-learning-app/scripts/change-report.cjs'),'--append',historyFile],{cwd:root,stdio:'pipe',windowsHide:true});
    const verify=append.status===0?cp.spawnSync(process.execPath,[path.join(root,'lecomax-learning-app/scripts/change-report.cjs'),'--check'],{cwd:root,stdio:'pipe',windowsHide:true}):null;
    emit({message:verify?.status===0?'Rapport ajoute a Change History.':'Rapport local conserve ; ajout a Change History a verifier.'});
    emit({report:file,status:report.status});process.stdin.destroy();
  }
}
module.exports={makeUri,entries,repair,validateClient};
if(require.main===module)main().catch(()=>{emit({message:'Arret securise. Examiner les rapports locaux avant toute reprise.'});process.exitCode=1;});
