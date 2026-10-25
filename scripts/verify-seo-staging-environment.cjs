const { vercelApiFetch } = require('./vercel-cli-api.cjs');
// GET-only staging metadata/value verification. Never prints environment values.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), crypto = require('node:crypto');
const id = 'prj_jPniwpH4s81bhISVReUKTQN0GwvD', team = 'team_yFLUcpSvgQi8EQuvuorOZW7w', ref = 'tyltharlnbxrxibuxyye';
const report = { at: new Date().toISOString(), projectId: id, teamId: team, supabaseRef: ref, readOnly: true, valuesPrinted: false, checks: [] };
const check = (ok, name) => { report.checks.push({ name, passed: Boolean(ok) }); if (!ok) throw Error(name); };
(async () => {
  async function get(route) {
    const url = new URL(route, 'https://api.vercel.com'); url.searchParams.set('teamId', team);
    const r = await vercelApiFetch(url, { redirect: 'error', headers: { }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw Error(`API_${r.status}`);
    return r.json();
  }
  const project = await get(`/v9/projects/${id}`);
  check(project.id === id && project.accountId === team && project.name === 'lecomax-seo-staging', 'PROJECT_IDENTITY');
  check(!project.link && project.ssoProtection?.deploymentType === 'all', 'GIT_AND_PROTECTION');
  check(project.framework === 'nextjs' && project.nodeVersion === '24.x' && !project.rootDirectory && !project.outputDirectory && project.installCommand === 'npm ci' && project.buildCommand === 'npm run build', 'BUILD_SETTINGS');
  const deployments = (await get(`/v6/deployments?projectId=${id}&limit=10`)).deployments;
  check(Array.isArray(deployments) && deployments.every(d => d.projectId === id), 'EXISTING_DEPLOYMENTS_STAGING_ONLY');
  const shared = await get('/v1/env');
  check(Array.isArray(shared.data) && shared.data.length === 0 && !shared.pagination?.next, 'NO_SHARED_VARIABLES');
  const integrations = await get('/v1/integrations/configurations?view=account');
  check(Array.isArray(integrations) && integrations.every(x => x.projectSelection === 'selected' && Array.isArray(x.projects) && !x.projects.includes(id)), 'NO_ASSIGNED_INTEGRATIONS');
  const keysResult = cp.spawnSync('C:/Users/Ziko/AppData/Local/npm-cache/_npx/aa8e5c70f9d8d161/node_modules/@supabase/cli-windows-x64/bin/supabase.exe', ['projects', 'api-keys', '--project-ref', ref, '--output', 'json'], { encoding: 'utf8', windowsHide: true, timeout: 60000 });
  check(keysResult.status === 0, 'STAGING_KEY_PROVENANCE');
  const keys = JSON.parse(keysResult.stdout);
  const anon = keys.find(x => x.name === 'anon' && x.type === 'legacy')?.api_key;
  const service = keys.find(x => x.name === 'service_role' && x.type === 'legacy')?.api_key;
  const sha = v => crypto.createHash('sha256').update(v).digest('hex');
  check([anon, service].every(k => typeof k === 'string' && JSON.parse(Buffer.from(k.split('.')[1], 'base64url')).ref === ref), 'KEY_PROJECT_CLAIMS');
  const expected = {
    APP_ENV: 'staging', NEXT_PUBLIC_APP_ENV: 'staging', SEO_RUNTIME_ENV: 'staging',
    NEXT_PUBLIC_SITE_URL: 'https://lecomax-seo-staging.vercel.app', NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anon, NEXT_PUBLIC_SUPABASE_KEY_BINDING: `${ref}:${sha(anon)}`, SUPABASE_SERVICE_KEY_BINDING: `${ref}:${sha(service)}`,
    ADMIN_EMAIL: 'owner@staging.invalid', SEO_SYNC_ENABLED: 'false', SEO_AI_ENABLED: 'false', SEO_EDITORIAL_ENABLED: 'false', SEO_MANUAL_SYNC_ENABLED: 'false',
    SEO_MIRAI_FALLBACK_ENABLED: 'false', PAYPAL_ENABLED: 'false', INDEXNOW_ENABLED: 'false', AGENT_STUDIO_LIVE_ENABLED: 'false', TUTOR_DAILY_TOKEN_BUDGET: '0',
  };
  const sensitive = ['SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_SESSION_SECRET'];
  const metadata = (await get(`/v10/projects/${id}/env?decrypt=false`)).envs;
  check(metadata.length === 20 && new Set(metadata.map(e => e.key)).size === 20 && metadata.every(e => e.key in expected || sensitive.includes(e.key)), 'EXACT_20_KEYS_NO_EXTRA_OR_DUPLICATE');
  check(metadata.every(e => e.target.length === 2 && e.target.includes('production') && e.target.includes('preview') && !e.gitBranch && !e.customEnvironmentIds?.length), 'SCOPES_NO_BRANCH_OVERRIDES');
  check(metadata.filter(e => sensitive.includes(e.key)).every(e => e.type === 'sensitive'), 'SENSITIVE_STORAGE');
  // Current installed CLI pull endpoint. Never persist the response or platform OIDC token.
  report.sensitiveReadback = {};
  for (const scope of ['production', 'preview']) {
    const { env } = await get(`/v3/env/pull/${id}/${scope}?source=vercel-cli:pull`);
    for (const [key, value] of Object.entries(expected)) check(env[key] === value, `VALUE_${scope.toUpperCase()}_${key}`);
    report.sensitiveReadback[scope] = {
      serviceMatchesIndependentStagingKey: env.SUPABASE_SERVICE_ROLE_KEY === service,
      adminHasExpectedGeneratedFormat: /^[A-Za-z0-9_-]{64}$/.test(env.ADMIN_SESSION_SECRET || '') && env.ADMIN_SESSION_SECRET !== service,
      serviceWithheld: !env.SUPABASE_SERVICE_ROLE_KEY,
      adminWithheld: !env.ADMIN_SESSION_SECRET,
    };
  }
  report.verifiedReadableValues = Object.keys(expected).length;
  report.sensitiveMetadataVerified = sensitive;
  report.limitations = ['Two Vercel sensitive values are write-only; their exact stored bytes are not independently re-read.', 'Their initial provenance/generation and successful write are recorded in seo-staging-hosting-config-1792518704470.json.', 'This check verifies configuration only; hosted application acceptance is separate.'];
  report.passed = true;
})().catch(e => { report.passed = false; report.failure = /^[A-Z0-9_]+$/.test(e.message) ? e.message : 'READ_ONLY_CHECK_FAILED'; process.exitCode = 1; }).finally(() => {
  const file = `artifacts/seo-staging-env-verified-${Date.now()}.json`;
  fs.writeFileSync(file, JSON.stringify(report, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ file, ...report }, null, 2));
});
