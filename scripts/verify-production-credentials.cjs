// Read-only verifier. Secrets remain in memory and cross only anonymous stdin pipes.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const readline = require('node:readline');
const { pathToFileURL } = require('node:url');
const { Client } = require('pg');
const { vercelApiFetch } = require('./vercel-cli-api.cjs');
const root = path.resolve(__dirname, '..');
const project = 'prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb', team = 'team_yFLUcpSvgQi8EQuvuorOZW7w', ref = 'yddqwgdgeljkzfsmtein';
const pairs = { OWNER_DATABASE_URL:'OWNER_DATABASE_BINDING', NEXT_PUBLIC_SUPABASE_ANON_KEY:'NEXT_PUBLIC_SUPABASE_KEY_BINDING', SUPABASE_SERVICE_ROLE_KEY:'SUPABASE_SERVICE_KEY_BINDING' };
const literals = { APP_ENV:'production', NEXT_PUBLIC_APP_ENV:'production', SEO_RUNTIME_ENV:'production', NEXT_PUBLIC_SITE_URL:'https://lecomax.com', NEXT_PUBLIC_SUPABASE_URL:`https://${ref}.supabase.co`, SEO_SYNC_ENABLED:'false', SEO_MANUAL_SYNC_ENABLED:'false', SEO_AI_ENABLED:'false', SEO_EDITORIAL_ENABLED:'false', SEO_MIRAI_FALLBACK_ENABLED:'false', INDEXNOW_ENABLED:'false' };
const assert = (v, code) => { if (!v) throw Error(code); };
const emit = value => process.stdout.write(JSON.stringify(value)+'\n');
async function api(route) {
  const u = new URL(route, 'https://api.vercel.com'); u.searchParams.set('teamId',team);
  const r = await vercelApiFetch(u); assert(r.ok, 'VERCEL_READ_FAILED'); return r.json();
}
async function run({preflight=false, selfTest=false}={}) {
  const report = {at:new Date().toISOString(), productionWrites:false, deployments:false, migrations:false, credentialsPersisted:false, checks:{}, sources:{}};
  let client, lines;
  try {
    const policy = await import(pathToFileURL(path.join(root,'operations/seo-vercel/lib/environment-target.mjs')));
    if (selfTest) {
      const good=`postgresql://postgres:fixture@db.${ref}.supabase.co:5432/postgres?sslmode=verify-full`;
      assert(policy.ownerTarget({APP_ENV:'production'},good)===ref,'SELF_TEST_FAILED');
      for (const bad of [good.replace('verify-full','require'),good.replace(':5432',':6543'),good.replace('postgres:fixture','wrong:fixture'),good+'&host=evil.example']) {
        let rejected=false; try{policy.ownerTarget({APP_ENV:'production'},bad);}catch{rejected=true;} assert(rejected,'SELF_TEST_FAILED');
      }
      report.checks.policy='PASS'; report.status='SELF_TEST_PASS'; return;
    }
    const p = await api('/v9/projects/'+project);
    assert(p.id===project&&p.name==='lecomax'&&p.accountId===team,'PROJECT_IDENTITY_FAILED');
    const listing = await api(`/v10/projects/${project}/env?decrypt=false`);
    assert(Array.isArray(listing.envs)&&!listing.pagination?.next,'ENV_PAGINATION_REVIEW_REQUIRED');
    const shared=await api('/v1/env');
    assert(Array.isArray(shared.data)&&!shared.data.length&&!shared.pagination?.next,'SHARED_ENV_REVIEW_REQUIRED');
    const select = key => listing.envs.filter(e=>e.key===key&&e.target?.includes('production'));
    const entry = key => { const es=select(key); assert(es.length===1&&!es[0].gitBranch&&!es[0].customEnvironmentIds?.length,'ENV_SCOPE_OR_MISSING'); return es[0]; };
    const read = async e => {
      // Sensitive Vercel entries cannot be decrypted. Never interpret ciphertext as a secret.
      if(e.type==='sensitive') return null;
      const d=await api(`/v1/projects/${project}/env/${encodeURIComponent(e.id)}?decrypt=true`);
      return typeof d.value==='string'&&d.value ? d.value : null;
    };
    for (const [key,value] of Object.entries(literals)) {
      const e=entry(key), actual=await read(e);
      report.checks[key]=actual===null?'UNREADABLE':actual!==value?'MISMATCH':e.target.length!==1?'SHARED_SCOPE_REVIEW_REQUIRED':'PASS';
    }
    const admin=entry('ADMIN_SESSION_SECRET');
    report.checks.adminSessionSecret=admin.type==='sensitive'&&admin.target.length===1?'METADATA_PASS_VALUE_NOT_READ':'REVIEW_REQUIRED';
    const values={};
    for (const key of Object.keys(pairs)) {
      values[key]=await read(entry(key));
      report.sources[key]=values[key]?'VERCEL_EXACT_READBACK':'VERCEL_UNREADABLE';
    }
    report.storedOwnerUriHasVerifyFull=values.OWNER_DATABASE_URL ? new URL(values.OWNER_DATABASE_URL).searchParams.get('sslmode')==='verify-full' : 'UNKNOWN';
    if(!preflight) lines=readline.createInterface({input:process.stdin,terminal:false})[Symbol.asyncIterator]();
    for(const [key,binding] of Object.entries(pairs)) {
      const bs=select(binding);
      report.checks[binding]=bs.length===0?'MISSING':bs.length!==1?'AMBIGUOUS':'UNCHECKED';
      if(!values[key]&&!preflight&&(key==='OWNER_DATABASE_URL'||bs.length===1)) {
        emit({prompt:key});
        const next=await lines.next(); assert(!next.done,'INPUT_CANCELLED');
        values[key]=JSON.parse(next.value).value;
        assert(typeof values[key]==='string'&&values[key].length>0&&values[key].length<16384,'INPUT_REQUIRED');
        report.sources[key]='OWNER_INPUT_NOT_PROVEN_IDENTICAL_TO_VERCEL';
      }
      if(!values[key]) continue;
      assert(values[key]===values[key].trim()&&!/[\r\n]/.test(values[key]),'INPUT_WHITESPACE_REJECTED');
      const expected=ref+':'+crypto.createHash('sha256').update(values[key]).digest('hex');
      if(key==='OWNER_DATABASE_URL') {
        policy.ownerTarget({APP_ENV:'production'},values[key]);
        report.checks.databaseTargetPortUserTLSContract='PASS';
      } else await policy.supabaseCredential({APP_ENV:'production'},`https://${ref}.supabase.co`,values[key],expected,key==='NEXT_PUBLIC_SUPABASE_ANON_KEY'?'anon':'service_role');
      if(bs.length===1) {
        const b=await read(entry(binding));
        report.checks[binding]=b===expected?'MATCH':b?'MISMATCH':'UNREADABLE';
      }
    }
    if(preflight) {report.status='PREFLIGHT_ONLY_NO_DATABASE_CONNECTION';return;}
    const u=new URL(values.OWNER_DATABASE_URL);
    client=new Client({host:u.hostname,port:5432,user:decodeURIComponent(u.username),password:decodeURIComponent(u.password),database:'postgres',ssl:{rejectUnauthorized:true,servername:u.hostname,ca:fs.readFileSync(path.join(root,'supabase/prod-ca-2021.crt'),'utf8')},options:'-c default_transaction_read_only=on -c statement_timeout=15000',connectionTimeoutMillis:15000,query_timeout:15000});
    for(const key of Object.keys(values)) values[key]=null;
    await client.connect();
    const row=(await client.query("select current_database() db, current_setting('transaction_read_only') ro")).rows[0];
    assert(row.db==='postgres'&&row.ro==='on'&&client.connection.stream.authorized===true,'DATABASE_TLS_OR_READONLY_FAILED');
    report.checks.database='READ_ONLY_QUERY_AND_CERTIFICATE_VERIFICATION_PASS';
    report.status='CHECKS_COMPLETED_REVIEW_INDIVIDUAL_RESULTS';
  } catch(e) {
    const allowed=['28P01','ENOTFOUND','ECONNREFUSED','ETIMEDOUT','CERT_HAS_EXPIRED','UNABLE_TO_VERIFY_LEAF_SIGNATURE','SELF_SIGNED_CERT_IN_CHAIN'];
    report.failure=allowed.includes(e.code)?e.code:/^[A-Z_]{3,70}$/.test(e.message)?e.message:'VERIFICATION_FAILED';
    report.status='STOPPED_NO_AUTOMATIC_RETRY';process.exitCode=1;
  } finally {
    if(client) await client.end().catch(()=>{});
    report.limitations=['A successful supplied connection does not prove equality with the stored Vercel URI.','Unreadable sensitive values require the exact existing value from the approved owner secret manager; never reset or overwrite to inspect.','JWT role/ref checks are consistency checks, not signature authentication.','No full application validation, backup, restore, migration, or deployment performed.'];
    const file=path.join(root,'artifacts',`production-credential-verification-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.json`);
    fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'}); emit({report:file,status:report.status});
    process.stdin.destroy();
  }
}
run({preflight:process.argv.includes('--preflight'),selfTest:process.argv.includes('--self-test')}).catch(()=>{emit({status:'SAFE_VERIFIER_FAILURE'});process.exitCode=1;});
