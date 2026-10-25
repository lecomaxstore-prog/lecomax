const { vercelApiFetch } = require('./vercel-cli-api.cjs');
// Owner-authorized staging configuration only. Never deploys or changes Supabase.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const id = 'prj_jPniwpH4s81bhISVReUKTQN0GwvD';
const team = 'team_yFLUcpSvgQi8EQuvuorOZW7w';
const ref = 'tyltharlnbxrxibuxyye';
const origin = 'https://lecomax-seo-staging.vercel.app';
const cli = 'C:/Users/Ziko/AppData/Local/npm-cache/_npx/aa8e5c70f9d8d161/node_modules/@supabase/cli-windows-x64/bin/supabase.exe';
const report = { at: new Date().toISOString(), projectId: id, teamId: team, supabaseRef: ref, deployed: false, databaseWrites: false, secretValuesPrinted: false };
const check = (ok, code) => { if (!ok) throw Error(code); };
(async () => {
  async function api(route, method = 'GET', body) {
    const url = new URL(route, 'https://api.vercel.com');
    url.searchParams.set('teamId', team);
    const response = await vercelApiFetch(url, { method, redirect: 'error', headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000) });
    check(response.ok, `VERCEL_${method}_${response.status}`);
    return response.json();
  }
  const project = await api(`/v9/projects/${id}`);
  const ownership = await api(`/v2/teams/${team}`);
  check(project.id === id && project.name === 'lecomax-seo-staging' && project.accountId === team && ownership.slug === 'lecomaxstore-4321s-projects', 'IDENTITY_MISMATCH');
  check(!project.link && project.ssoProtection?.deploymentType === 'all', 'SECURITY_DRIFT');
  check((await api(`/v6/deployments?projectId=${id}&limit=1`)).deployments.length === 0, 'DEPLOYMENT_PRESENT');
  const domains = await api(`/v9/projects/${id}/domains`);
  check(domains.domains.length === 1 && domains.domains[0].name === new URL(origin).hostname, 'DOMAIN_DRIFT');
  const existing = await api(`/v10/projects/${id}/env?decrypt=false`);
  check(existing.envs.length === 0, 'ENV_ALREADY_CONFIGURED_STOP_WITHOUT_OVERWRITE');
  const shared = await api('/v1/env');
  check(Array.isArray(shared.data) && shared.data.length === 0 && !shared.pagination?.next, 'SHARED_ENV_REVIEW_REQUIRED');
  const integrations = await api('/v1/integrations/configurations?view=account');
  check(Array.isArray(integrations) && integrations.every(x => x.projectSelection === 'selected' && Array.isArray(x.projects) && !x.projects.includes(id)), 'INTEGRATION_REVIEW_REQUIRED');
  report.identityVerified = true;
  const keysResult = cp.spawnSync(cli, ['projects', 'api-keys', '--project-ref', ref, '--output', 'json'], { encoding: 'utf8', windowsHide: true, timeout: 60000 });
  check(keysResult.status === 0, 'STAGING_KEY_RETRIEVAL_FAILED');
  const keys = JSON.parse(keysResult.stdout);
  const publicKey = keys.find(k => k.name === 'anon' && k.type === 'legacy')?.api_key;
  const serviceKey = keys.find(k => k.name === 'service_role' && k.type === 'legacy')?.api_key;
  for (const [key, role] of [[publicKey, 'anon'], [serviceKey, 'service_role']]) {
    check(typeof key === 'string', 'KEY_MISSING');
    const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
    check(claims.ref === ref && claims.role === role, 'KEY_IDENTITY_MISMATCH');
  }
  const sha = value => crypto.createHash('sha256').update(value).digest('hex');
  const env = {
    APP_ENV: 'staging', NEXT_PUBLIC_APP_ENV: 'staging', SEO_RUNTIME_ENV: 'staging',
    NEXT_PUBLIC_SITE_URL: origin, NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publicKey, SUPABASE_SERVICE_ROLE_KEY: serviceKey,
    NEXT_PUBLIC_SUPABASE_KEY_BINDING: `${ref}:${sha(publicKey)}`, SUPABASE_SERVICE_KEY_BINDING: `${ref}:${sha(serviceKey)}`,
    ADMIN_EMAIL: 'owner@staging.invalid', ADMIN_SESSION_SECRET: crypto.randomBytes(48).toString('base64url'),
    SEO_SYNC_ENABLED: 'false', SEO_AI_ENABLED: 'false', SEO_EDITORIAL_ENABLED: 'false',
    SEO_MANUAL_SYNC_ENABLED: 'false', SEO_MIRAI_FALLBACK_ENABLED: 'false',
    PAYPAL_ENABLED: 'false', INDEXNOW_ENABLED: 'false', AGENT_STUDIO_LIVE_ENABLED: 'false', TUTOR_DAILY_TOKEN_BUDGET: '0',
  };
  const { applicationEnvironment } = await import(pathToFileURL(path.join(root, 'operations/seo-vercel/lib/environment-target.mjs')));
  await applicationEnvironment(env);
  report.environmentValidation = 'passed in memory; independently retrieved staging legacy keys with matching ref/role';
  const settings = { framework: 'nextjs', rootDirectory: null, nodeVersion: '24.x', installCommand: 'npm ci', buildCommand: 'npm run build', outputDirectory: null };
  await api(`/v9/projects/${id}`, 'PATCH', settings);
  report.buildSettingsWritten = true;
  const sensitive = new Set(['SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_SESSION_SECRET']);
  for (const [key, value] of Object.entries(env)) {
    await api(`/v10/projects/${id}/env`, 'POST', { key, value, type: sensitive.has(key) ? 'sensitive' : 'encrypted', target: ['production', 'preview'] });
    (report.configuredKeys ||= []).push(key);
  }
  const after = await api(`/v9/projects/${id}`);
  for (const [key, value] of Object.entries(settings)) check((after[key] ?? null) === value, 'BUILD_READBACK_MISMATCH');
  check(!after.link && after.ssoProtection?.deploymentType === 'all', 'SECURITY_READBACK_MISMATCH');
  const readback = await api(`/v10/projects/${id}/env?decrypt=false`);
  check(readback.envs.length === Object.keys(env).length, 'ENV_COUNT_MISMATCH');
  for (const e of readback.envs) check(e.key in env && e.target.length === 2 && e.target.includes('production') && e.target.includes('preview') && (!sensitive.has(e.key) || e.type === 'sensitive'), 'ENV_METADATA_MISMATCH');
  report.settings = settings;
  report.environment = readback.envs.map(e => ({ key: e.key, target: e.target, type: e.type }));
  report.readbackPassed = true;
  report.limitations = ['Secret values not decrypted for readback.', 'owner@staging.invalid is a reserved fixture identity; no Auth user provisioned.', 'No schema, Auth configuration changes, deployment or live authentication tests.'];
})().catch(error => {
  report.failure = /^[A-Z0-9_]+$/.test(error.message) ? error.message : 'CONFIGURATION_FAILED_NO_SECRETS_LOGGED';
  process.exitCode = 1;
}).finally(() => {
  report.finishedAt = new Date().toISOString();
  const file = path.join(root, 'artifacts', `seo-staging-hosting-config-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ file, ...report }, null, 2));
});
