import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applicationEnvironment, environment, supabaseTarget, supabaseConfiguration, supabaseCredential, ownerTarget,
  fingerprint, PROJECTS } from '../lib/environment-target.mjs';
import { createHandler } from '../lib/handler.mjs';

async function fixture(selected = 'staging') {
  const project = selected === 'production' ? PROJECTS.production : PROJECTS.staging;
  return { APP_ENV: selected, NEXT_PUBLIC_APP_ENV: selected, NODE_ENV: 'production',
    NEXT_PUBLIC_SITE_URL: selected === 'production' ? 'https://lecomax.com' : 'https://staging.example.test',
    NEXT_PUBLIC_SUPABASE_URL: `https://${project}.supabase.co`,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_synthetic_staging',
    SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_synthetic_staging',
    NEXT_PUBLIC_SUPABASE_KEY_BINDING: `${project}:${await fingerprint('sb_publishable_synthetic_staging')}`,
    SUPABASE_SERVICE_KEY_BINDING: `${project}:${await fingerprint('sb_secret_synthetic_staging')}`,
    ADMIN_SESSION_SECRET: 'synthetic-independent-admin-secret-minimum-32' };
}
test('environment and exact URL guards reject missing, contradictory, production nonproduction and lookalike targets', () => {
  for (const env of [{}, { APP_ENV: 'production', VERCEL_ENV: 'preview' },
    { APP_ENV: 'production', NODE_ENV: 'development' }, { APP_ENV: 'staging', NEXT_PUBLIC_APP_ENV: 'production' },
    { APP_ENV: 'staging', VERCEL_ENV: 'unknown' }]) assert.throws(() => environment(env), /ISOLATION/);
  for (const selected of ['development', 'preview', 'staging']) {
    for (const url of [`https://${PROJECTS.production}.supabase.co`, `https://${PROJECTS.staging}.supabase.co.evil.test`,
      `https://${PROJECTS.staging}.supabase.co/?redirect=production`, `https://user:pass@${PROJECTS.staging}.supabase.co`]) {
      assert.throws(() => supabaseTarget({ APP_ENV: selected }, url), /ISOLATION/);
    }
  }
  assert.equal(supabaseTarget({APP_ENV:'staging',VERCEL_ENV:'production'},`https://${PROJECTS.staging}.supabase.co`).project,PROJECTS.staging);
});
test('reviewed bindings reject copied opaque secrets, wrong key roles and cross-project JWTs', async () => {
  const env = await fixture();
  await applicationEnvironment(env);
  for (const patch of [{ SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_other_project' },
    { SUPABASE_SERVICE_KEY_BINDING: '' }, { ADMIN_SESSION_SECRET: '' },
    { NEXT_PUBLIC_APP_ENV: 'production' }, { NEXT_PUBLIC_SITE_URL: 'https://lecomax.com' }]) {
    await assert.rejects(applicationEnvironment({...env,...patch}), /ISOLATION/);
  }
  for (const key of ['sb_secret_must_not_be_public',
    'eyJ.'+Buffer.from(JSON.stringify({ref:PROJECTS.production,role:'anon'})).toString('base64url')+'.signature']) {
    await assert.rejects(supabaseCredential(env,env.NEXT_PUBLIC_SUPABASE_URL,key,
      `${PROJECTS.staging}:${await fingerprint(key)}`,'anon'),/ISOLATION/);
  }
});
test('nonproduction application fails closed on paid and outbound integration credentials or activation', async () => {
  const env = await fixture();
  for (const name of ['OPENAI_API_KEY','GROQ_API_KEY','RESEND_API_KEY','PRIVATE_EMAIL_PASS',
    'VAPID_PRIVATE_KEY','PAYPAL_CLIENT_SECRET','WHATSAPP_ACCESS_TOKEN','EXPO_ACCESS_TOKEN',
    'INDEXNOW_KEY', 'NEXT_PUBLIC_EMAILJS_PUBLIC_KEY', 'TRUSTPILOT_API_KEY',
    'CMI_STORE_KEY', 'SMTP_PASS', 'IMAP_PASS', 'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN',
    'CRON_SECRET', 'LEARNING_CRON_SECRET', 'SEO_WORKER_URL', 'SEO_WORKER_CRON_SECRET']) {
    await assert.rejects(applicationEnvironment({...env,[name]:'synthetic-secret'}),/ISOLATION/);
  }
  for (const name of ['PAYPAL_ENABLED','SEO_AI_ENABLED','SEO_EDITORIAL_ENABLED','SEO_MIRAI_FALLBACK_ENABLED',
    'INDEXNOW_ENABLED', 'SEO_SYNC_ENABLED', 'SEO_MANUAL_SYNC_ENABLED']) {
    await assert.rejects(applicationEnvironment({...env,[name]:'true'}),/ISOLATION/);
  }
});
test('owner database denies production, pooler user confusion, insecure TLS and injected options', () => {
  const env={APP_ENV:'staging'};
  const good=`postgresql://postgres.${PROJECTS.staging}:synthetic@aws-0.example.pooler.supabase.com:5432/postgres?sslmode=verify-full`;
  assert.equal(ownerTarget(env,good),PROJECTS.staging);
  for (const url of [good.replace(PROJECTS.staging,PROJECTS.production),good.replace('verify-full','require'),
    good+'&options=-c%20search_path%3Dpublic',good.replace(':5432',':6543'),
    'postgresql://postgres:synthetic@localhost:5432/postgres']) assert.throws(()=>ownerTarget(env,url),/ISOLATION/);
});
test('staging worker remains read-only even when sync is explicitly enabled', async () => {
  const base=await fixture();
  const env={...base,SEO_RUNTIME_ENV:'staging',CRON_SECRET:'synthetic-worker-secret-at-least-32',
    SEO_SYNC_SUPABASE_URL:base.NEXT_PUBLIC_SUPABASE_URL,SEO_SYNC_SERVICE_ROLE_KEY:base.SUPABASE_SERVICE_ROLE_KEY,
    SEO_SYNC_KEY_BINDING:base.SUPABASE_SERVICE_KEY_BINDING};
  for(const patch of [{},{SEO_SYNC_ENABLED:'true',SEO_SYNC_SUPABASE_URL:`https://${PROJECTS.production}.supabase.co`},
    {SEO_SYNC_ENABLED:'true',OPENAI_API_KEY:'synthetic'},{SEO_SYNC_ENABLED:'true',SEO_SYNC_KEY_BINDING:''},
    {SEO_SYNC_ENABLED:'true'}]) {
    const calls=[];
    const handler=createHandler({env:{...env,...patch},log:()=>{},fetcher:async(url,init)=>{
      calls.push(url);assert.equal(new URL(url).origin,base.NEXT_PUBLIC_SUPABASE_URL);
      assert.equal(init.redirect,'error');
      assert.equal(init.headers.apikey, base.SUPABASE_SERVICE_ROLE_KEY);
      assert.equal(init.headers.Authorization, undefined);
      return Response.json(url.endsWith('begin_seo_run')?'run':url.endsWith('finish_seo_run')?true:null);
    }});
    const res={setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
    await handler({method:'GET',headers:{authorization:`Bearer ${env.CRON_SECRET}`}},res);
    assert.equal(res.code,503);
    assert.equal(calls.length,0);
  }
});
test('legacy direct worker executables cannot bypass the guarded HTTP worker', () => {
  for(const file of ['../../../scripts/seo-sync-worker.mjs','../../seo/worker/scripts/seo-sync-worker.mjs']) {
    const result=spawnSync(process.execPath,[fileURLToPath(new URL(file,import.meta.url)),'--run'],{
      env:{...process.env,SEO_SYNC_ENABLED:'true'},encoding:'utf8',windowsHide:true});
    assert.equal(result.status,1);
    assert.match(result.stderr,/LEGACY_SEO_RUNNER_DISABLED/);
  }
});
test('local owner URLs cannot override the endpoint through PostgreSQL query parameters', () => {
  const base = 'postgresql://postgres:synthetic@127.0.0.1:54322/postgres';
  assert.equal(ownerTarget({ APP_ENV: 'development' }, base), 'local');
  assert.equal(ownerTarget({ APP_ENV: 'development' }, base + '?sslmode=disable'), 'local');
  for (const query of ['host=db.' + PROJECTS.production + '.supabase.co', 'port=5432',
    'user=postgres.' + PROJECTS.production, 'database=production', 'options=-c%20search_path=public',
    'sslmode=disable&host=production', 'sslmode=disable&sslmode=disable']) {
    assert.throws(() => ownerTarget({ APP_ENV: 'development' }, base + '?' + query), /ISOLATION/);
  }
  assert.throws(() => ownerTarget({ APP_ENV: 'development' }, base.replace(/\/postgres$/, '/other')), /ISOLATION/);
});
test('custom Vercel targets cannot masquerade as production', () => {
  for (const target of ['staging', 'preview', 'development', 'custom']) {
    assert.throws(() => environment({ APP_ENV: 'production', VERCEL_ENV: 'production',
      VERCEL_TARGET_ENV: target }), /ISOLATION/);
  }
  assert.equal(environment({ APP_ENV: 'staging', VERCEL_ENV: 'production', VERCEL_TARGET_ENV: 'staging' }), 'staging');
});
test('synchronous browser initialization rejects cross-project targets and privileged keys before SDK side effects', async () => {
  const env = await fixture();
  const check = (patch = {}) => {
    const config = { ...env, ...patch };
    return supabaseConfiguration(config, config.NEXT_PUBLIC_SUPABASE_URL,
      config.NEXT_PUBLIC_SUPABASE_ANON_KEY, config.NEXT_PUBLIC_SUPABASE_KEY_BINDING, 'anon');
  };
  assert.equal(check().project, PROJECTS.staging);
  for (const patch of [{ NEXT_PUBLIC_SUPABASE_URL: `https://${PROJECTS.production}.supabase.co` },
    { NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_secret_private' }, { NEXT_PUBLIC_SUPABASE_KEY_BINDING: '' }]) {
    assert.throws(() => check(patch), /ISOLATION/);
  }
  for (const key of ['sb_secret_private', 'eyJ.' + Buffer.from(JSON.stringify({
    ref: PROJECTS.production, role: 'anon' })).toString('base64url') + '.sig']) {
    assert.throws(() => supabaseConfiguration({ APP_ENV: 'development' }, 'http://localhost:54321',
      key, 'local:' + 'a'.repeat(64), 'anon'), /ISOLATION/);
  }
});
test('offline staging validator accepts disabled fixtures and sanitizes invalid configuration', async () => {
  const base = { ...await fixture(), SEO_RUNTIME_ENV: 'staging',
    SEO_SYNC_ENABLED: 'false', SEO_AI_ENABLED: 'false', SEO_EDITORIAL_ENABLED: 'false',
    SEO_MANUAL_SYNC_ENABLED: 'false', SEO_MIRAI_FALLBACK_ENABLED: 'false',
  };
  base.SEO_SYNC_SUPABASE_URL = base.NEXT_PUBLIC_SUPABASE_URL;
  base.SEO_SYNC_SERVICE_ROLE_KEY = base.SUPABASE_SERVICE_ROLE_KEY;
  base.SEO_SYNC_KEY_BINDING = base.SUPABASE_SERVICE_KEY_BINDING;
  const directory = mkdtempSync(join(tmpdir(), 'seo-offline-validator-'));
  const file = join(directory, 'fixture.env');
  try {
    for (const mode of ['--app', '--worker']) {
      for (const patch of [{}, { OPENAI_API_KEY: 'synthetic-must-not-appear' },
        { SEO_SYNC_ENABLED: 'true' }, { APP_ENV: 'production' }]) {
        writeFileSync(file, Object.entries({ ...base,
          ...(mode === '--worker' ? { CRON_SECRET: 'synthetic-worker-secret-at-least-32' } : {}), ...patch }).map(([name, value]) =>
          `${name}=${value}`).join('\n'));
        const result = spawnSync(process.execPath,
          [fileURLToPath(new URL('../../../scripts/validate-seo-environment.mjs', import.meta.url)), mode, file],
          { encoding: 'utf8', windowsHide: true });
        const valid = Object.keys(patch).length === 0;
        assert.equal(result.status, valid ? 0 : 1);
        assert.doesNotMatch(result.stdout + result.stderr, /synthetic-must-not-appear|sb_secret_/);
        if (valid) assert.equal(JSON.parse(result.stdout).networkContacted, false);
        else assert.match(result.stderr, /STAGING_CONFIGURATION_INVALID/);
      }
    }
  } finally {
    unlinkSync(file);
    rmdirSync(directory);
  }
});
