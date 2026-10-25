// Owner-assisted, create-only binding configuration. Raw inputs only on stdin.
const fs = require('node:fs');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { vercelApiFetch } = require('./vercel-cli-api.cjs');
const project = 'prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb', team = 'team_yFLUcpSvgQi8EQuvuorOZW7w';
const ref = 'yddqwgdgeljkzfsmtein';
const inputs = { NEXT_PUBLIC_SUPABASE_KEY_BINDING: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', SUPABASE_SERVICE_KEY_BINDING: 'SUPABASE_SERVICE_ROLE_KEY', OWNER_DATABASE_BINDING: 'OWNER_DATABASE_URL' };
const literals = { APP_ENV:'production', NEXT_PUBLIC_APP_ENV:'production', SEO_RUNTIME_ENV:'production', NEXT_PUBLIC_SITE_URL:'https://lecomax.com', SEO_SYNC_ENABLED:'false', SEO_MANUAL_SYNC_ENABLED:'false', SEO_AI_ENABLED:'false', SEO_EDITORIAL_ENABLED:'false', SEO_MIRAI_FALLBACK_ENABLED:'false', INDEXNOW_ENABLED:'false' };
const check = (ok, code) => { if (!ok) throw Error(code); };
const hash = v => crypto.createHash('sha256').update(v).digest('hex');
async function derive(values, apiKeysOnly = false) {
  const policy = await import(pathToFileURL(path.resolve(__dirname, '../operations/seo-vercel/lib/environment-target.mjs')));
  const bindings = {};
  for (const [binding, input] of Object.entries(inputs)) {
    if(apiKeysOnly && input==='OWNER_DATABASE_URL') continue;
    const value = values[input];
    check(typeof value === 'string' && value.length > 0 && value.length < 16384, input+'_INPUT_REQUIRED');
    check(value===value.trim()&&!/[\r\n]/.test(value),input+'_WHITESPACE_FORBIDDEN');
    bindings[binding] = ref + ':' + hash(value);
    if (input === 'OWNER_DATABASE_URL') {
      let u;try{u=new URL(value);}catch{throw Error('OWNER_DATABASE_URL_INVALID_URI');}
      check(['postgres:','postgresql:'].includes(u.protocol),'OWNER_DATABASE_URL_POSTGRES_SCHEME_REQUIRED');
      check(u.port==='5432','OWNER_DATABASE_URL_EXPLICIT_PORT_5432_REQUIRED');
      check(u.pathname==='/postgres','OWNER_DATABASE_URL_POSTGRES_DATABASE_REQUIRED');
      check(u.searchParams.get('sslmode')==='verify-full','OWNER_DATABASE_URL_SSLMODE_VERIFY_FULL_REQUIRED');
      check(!!u.username&&!!u.password,'OWNER_DATABASE_URL_USER_PASSWORD_REQUIRED');
      check(!u.hash&&[...u.searchParams.keys()].every(k=>k==='sslmode')&&u.searchParams.getAll('sslmode').length===1,'OWNER_DATABASE_URL_QUERY_OR_FRAGMENT_FORBIDDEN');
      try{check(policy.ownerTarget({APP_ENV:'production'}, value) === ref, 'DATABASE_TARGET');}catch{throw Error('OWNER_DATABASE_URL_PRODUCTION_HOST_OR_USERNAME_INVALID');}
      await policy.credentialBinding(value, bindings[binding], ref);
    } else {try{await policy.supabaseCredential({APP_ENV:'production'}, `https://${ref}.supabase.co`, value, bindings[binding], input === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' ? 'anon' : 'service_role');}catch{throw Error(input+'_FORMAT_PROJECT_OR_ROLE_INVALID');}}
  }
  return bindings;
}
async function run() {
  const report = { at:new Date().toISOString(), added:[], verified:[], credentialsExported:false, deployed:false, migrationsExecuted:false };
  async function api(route, body) {
    const url = new URL(route, 'https://api.vercel.com'); url.searchParams.set('teamId', team);
    const r = await vercelApiFetch(url, body ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {});
    check(r.ok, 'HTTP_' + r.status); return r.json();
  }
  const list = async () => { const r=await api(`/v10/projects/${project}/env?decrypt=false`); check(!r.pagination?.next, 'PAGINATION_REVIEW_REQUIRED'); return r.envs; };
  const select = (es, key) => es.filter(e => e.key === key && e.target?.includes('production'));
  const read = async e => (await api(`/v1/projects/${project}/env/${e.id}`)).value;
  let before, initialProject, initialAlias;
  try {
    const validateOnly=process.argv[2]==='--validate-only';
    const apiKeysOnly=process.argv.includes('--api-keys-only');
    report.apiKeysOnly=apiKeysOnly;
    check(validateOnly||process.argv[2] === '--owner-attested', 'OWNER_ATTESTATION_REQUIRED');
    let raw=''; for await (const chunk of process.stdin) {raw+=chunk;check(raw.length<65536,'INPUT_TOO_LARGE');}
    const values=JSON.parse(raw); raw='';
    check(values.exactCurrentProductionValues === true, 'OWNER_ATTESTATION_REQUIRED');
    report.stage='credential-contract';
    const bindings=await derive(values,apiKeysOnly);
    if(validateOnly){report.validationOnly=true;report.networkContacted=false;report.bindingContract='PASS';report.stage='local-validation-complete';return;}
    report.stage='remote-preflight';
    initialProject=await api('/v9/projects/'+project);
    check(initialProject.id===project&&initialProject.name==='lecomax'&&initialProject.accountId===team,'PROJECT_IDENTITY');
    initialAlias=await api('/v4/aliases/lecomax.com');
    const deployment=await api('/v13/deployments/'+(initialAlias.deploymentId||initialAlias.deployment?.id));
    check(deployment.projectId===project,'ALIAS_IDENTITY');
    const shared=await api('/v1/env');check(Array.isArray(shared.data)&&!shared.data.length&&!shared.pagination?.next,'SHARED_ENV_REVIEW_REQUIRED');
    before=await list();
    for (const [key,expected] of Object.entries(literals)) {
      const es=select(before,key);check(es.length===1&&es[0].target.length===1&&!es[0].gitBranch&&!es[0].customEnvironmentIds?.length,'LITERAL_SCOPE');
      check(await read(es[0])===expected,'LITERAL_MISMATCH');report.verified.push(key);
    }
    for(const input of Object.values(inputs)) {
      if(apiKeysOnly && input==='OWNER_DATABASE_URL') continue;
      const es=select(before,input);check(es.length===1&&!es[0].gitBranch,'SOURCE_SCOPE');
      const actual=await read(es[0]);if(typeof actual==='string'&&actual)check(actual===values[input],'SOURCE_VALUE_MISMATCH');
    }
    // Preflight all existing bindings before creating any missing one.
    report.stage='existing-binding-preflight';
    for(const [key,value] of Object.entries(bindings)) {
      const es=select(before,key);check(es.length<=1,'AMBIGUOUS_BINDING');
      if(es.length)check(es[0].target.length===1&&!es[0].gitBranch&&!es[0].customEnvironmentIds?.length&&await read(es[0])===value,'EXISTING_BINDING_MISMATCH');
    }
    for(const [key,value] of Object.entries(bindings)) {
      report.stage='binding-reconcile';report.currentBinding=key;
      const es=select(await list(),key);
      if(!es.length){await api(`/v10/projects/${project}/env`,{key,value,type:'encrypted',target:['production']});report.added.push(key);}
      const after=select(await list(),key);
      check(after.length===1&&after[0].target.length===1&&!after[0].gitBranch&&!after[0].customEnvironmentIds?.length&&await read(after[0])===value,'BINDING_READBACK_FAILED');
      report.verified.push(key);
    }
    report.bindingProvenance='Owner attests exact current Vercel bytes; source secret readback may be unavailable. JWT role/ref checks are consistency checks, not signature authentication.';
    report.bindingContract='PASS';
    report.stage='complete';
    report.fullEnvironmentValidation='BLOCKED_ADMIN_SECRET_WRITE_ONLY';
    report.build='NOT_RUN_FULL_PRODUCTION_ENVIRONMENT_UNAVAILABLE';
  } catch(e) {report.failure=/^[A-Z0-9_]+$/.test(e.message)?e.message:'BINDING_OPERATION_FAILED';process.exitCode=1;}
  finally {
    try {
      if(before){const after=await list();report.allRequiredNamesPresent=[...Object.keys(literals),...Object.keys(inputs),'ADMIN_SESSION_SECRET'].every(k=>select(after,k).length===1);
        report.priorEntriesPreserved=before.every(e=>after.some(x=>x.id===e.id&&hash(JSON.stringify(x))===hash(JSON.stringify(e))));
        const admin=select(after,'ADMIN_SESSION_SECRET');report.adminSignerMetadataVerified=admin.length===1&&admin[0].type==='sensitive'&&admin[0].target.length===1&&!admin[0].gitBranch&&!admin[0].customEnvironmentIds?.length;
        const p=await api('/v9/projects/'+project),a=await api('/v4/aliases/lecomax.com');
        report.cronsPreserved=JSON.stringify(p.crons)===JSON.stringify(initialProject.crons);
        report.deploymentUnchanged=(a.deploymentId||a.deployment?.id)===(initialAlias.deploymentId||initialAlias.deployment?.id);
        check(report.priorEntriesPreserved&&report.cronsPreserved&&report.deploymentUnchanged,'PRESERVATION_FAILED');}
    }catch{report.preservationCheckFailed=true;process.exitCode=1;}
    const stamp=Date.now();
    const file=path.resolve(__dirname,'../artifacts/seo-owner-bindings-'+stamp+'.json');fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});
    const history={id:'seo-owner-binding-execution-'+stamp,createdAt:new Date().toISOString(),title:'Owner-assisted production binding execution',summary:'Create-only binding run; consult validation for partial results. No deployment or migration.',status:report.failure||report.preservationCheckFailed?'failed':'needs-testing',pages:['Production configuration','Change History'],components:['Credential bindings'],files:['scripts/complete-production-bindings.cjs','scripts/complete-production-bindings.ps1'],changes:[{kind:'added',detail:'Created binding names: '+(report.added.join(', ')||'none')+'. Verified names: '+(report.verified.join(', ')||'none')+'.'}],validation:[{name:'Execution',result:report.failure||report.preservationCheckFailed?'failed':'passed',detail:report.failure||'Binding readback and preservation checks completed; source equality relies on owner attestation where Vercel withholds values.'},{name:'Production build and runtime',result:'not-run',detail:'Full environment remains unavailable locally; admin signer readback withheld. No runtime login, deployment or migration.'}]};
    const historyFile=path.resolve(__dirname,'../artifacts/seo-owner-binding-history-'+stamp+'.json');fs.writeFileSync(historyFile,JSON.stringify(history,null,2),{flag:'wx'});
    const cp=require('node:child_process');
    for(const args of [['--append',historyFile],['--check']]){const r=cp.spawnSync(process.execPath,[path.resolve(__dirname,'../lecomax-learning-app/scripts/change-report.cjs'),...args],{windowsHide:true,stdio:'ignore'});if(r.status!==0){report.historyAppendOrCheckFailed=true;process.exitCode=1;break;}}
    console.log(JSON.stringify({file,historyFile,...report}));
  }
}
module.exports={derive};
if(require.main===module) {
  if(process.argv[2]==='--transport-self-test') {
    (async()=>{let raw='';for await(const chunk of process.stdin){raw+=chunk;check(raw.length<1024,'SELF_TEST_SIZE');}const v=JSON.parse(raw);check(v.test==='fixture-'+String.fromCharCode(233),'SELF_TEST_TRANSPORT');console.log('UTF8_TRANSPORT_PASS_NO_NETWORK');})().catch(()=>{console.log('TRANSPORT_SELF_TEST_FAILED');process.exitCode=1;});
  } else run();
}
