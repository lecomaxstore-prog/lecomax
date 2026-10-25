// Exact approved staging package only. No production mutations or secret output.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const { vercelApiFetch } = require('./vercel-cli-api.cjs');
const root = path.resolve(__dirname, '..');
const project = 'prj_jPniwpH4s81bhISVReUKTQN0GwvD', team = 'team_yFLUcpSvgQi8EQuvuorOZW7w';
const base = path.join(root, 'artifacts/seo-write-guard-20261021');
const out = path.join(root, 'artifacts/seo-security-resume-20261021');
fs.mkdirSync(out, { recursive: true });
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const report = { at: new Date().toISOString(), project, team, checks: [], deployed: false };
function check(value, name) { report.checks.push({ name, passed: !!value }); assert(value, name); }
async function get(route) { const u = new URL(route, 'https://api.vercel.com'); u.searchParams.set('teamId', team); const r = await vercelApiFetch(u); if (!r.ok) throw Error('HTTP_' + r.status); return r.json(); }
(async () => {
 const m = JSON.parse(fs.readFileSync(path.join(base, 'release-manifest.json')));
 check(hash(fs.readFileSync(path.join(base, 'seo-security-fix.zip'))) === 'b25949d1e9f2c553233fd7bd0fe3436dada8fc8fdeeb5af86b249cf6f5c7dafb', 'ARCHIVE_PIN');
 const baselinePath = path.join(root, 'artifacts/seo-fix-integration-20261021/source-manifest.json');
 check(hash(fs.readFileSync(baselinePath)) === m.baselineManifestSha256, 'BASELINE_MANIFEST_PIN');
 const baseline = JSON.parse(fs.readFileSync(baselinePath));
 check(m.files.length === 2124 && m.delta.length === 3, 'PACKAGE_SIZE');
 const delta = new Map(m.delta.map(f => [f.file, f]));
 const source = path.join(out, 'source'); fs.mkdirSync(source, { recursive: true });
 for (const f of m.files) {
  check(!path.isAbsolute(f.file) && !f.file.split('/').includes('..'), 'SAFE_PATH_' + f.file);
  const old = baseline.files.find(x => x.file === f.file); assert(old);
  const original = fs.readFileSync(path.join(root, 'artifacts/seo-fix-integration-20261021/source', f.file));
  assert.equal(hash(original), old.sha256);
  const b = delta.has(f.file) ? fs.readFileSync(path.join(base, 'source', f.file)) : original;
  assert.equal(hash(b), f.sha256); if(delta.has(f.file)) assert.equal(old.sha256, delta.get(f.file).beforeSha256);
  const dest = path.join(source, f.file); fs.mkdirSync(path.dirname(dest), { recursive: true });
  if(fs.existsSync(dest)) assert.equal(hash(fs.readFileSync(dest)), f.sha256); else fs.writeFileSync(dest, b, { flag: 'wx' });
 }
 report.checks = report.checks.filter(x => !x.name.startsWith('SAFE_PATH_'));
 check(true, 'ALL_2124_SOURCE_HASHES'); report.delta = m.delta;
 const [p, ownership, a, ds, domains, shared, integrations, env] = await Promise.all([
  get('/v9/projects/' + project), get('/v2/teams/' + team), get('/v4/aliases/lecomax-seo-staging.vercel.app'),
  get('/v6/deployments?projectId=' + project + '&limit=100'), get('/v9/projects/' + project + '/domains'),
  get('/v1/env'), get('/v1/integrations/configurations?view=account'), get('/v10/projects/' + project + '/env?decrypt=false')]);
 check(p.id === project && p.accountId === team && p.name === 'lecomax-seo-staging' && ownership.slug === 'lecomaxstore-4321s-projects', 'PROJECT_TEAM');
 check(p.ssoProtection?.deploymentType === 'all' && !p.link && !p.crons?.definitions?.length, 'PROTECTION_NO_CRON_NO_GIT');
 check((a.deploymentId || a.deployment?.id) === m.baselineDeployment, 'ALIAS_BASELINE');
 report.deployments = ds.deployments.map(d => ({ id: d.uid || d.id, state: d.readyState || d.state, url: d.url }));
 check(report.deployments.every(d => ['dpl_BTTcn1fzEYdVSxbevGo6njShC7UJ','dpl_9PVLNqN3YRoSmDgi4T5D9o81Svcv','dpl_A2Zu5TrCJ787DskFvBvtXb3jU9oG'].includes(d.id)), 'NO_NEW_DEPLOYMENT');
 const rollback = await get('/v13/deployments/' + m.baselineDeployment);
 check(rollback.readyState === 'READY' && rollback.projectId === project, 'ROLLBACK_READY');
 check(domains.domains.length === 1 && domains.domains[0].name === 'lecomax-seo-staging.vercel.app', 'STAGING_DOMAIN_ONLY');
 check(Array.isArray(shared.data) && shared.data.length === 0 && !shared.pagination?.next, 'NO_SHARED_ENV');
 check(Array.isArray(integrations) && integrations.every(x => x.projectSelection === 'selected' && Array.isArray(x.projects) && !x.projects.includes(project)), 'NO_INTEGRATIONS');
 const expected = { APP_ENV:'staging', NEXT_PUBLIC_APP_ENV:'staging', SEO_RUNTIME_ENV:'staging', NEXT_PUBLIC_SITE_URL:'https://lecomax-seo-staging.vercel.app', NEXT_PUBLIC_SUPABASE_URL:'https://tyltharlnbxrxibuxyye.supabase.co', SEO_SYNC_ENABLED:'false', SEO_AI_ENABLED:'false', SEO_EDITORIAL_ENABLED:'false', SEO_MANUAL_SYNC_ENABLED:'false', SEO_MIRAI_FALLBACK_ENABLED:'false', PAYPAL_ENABLED:'false', INDEXNOW_ENABLED:'false', AGENT_STUDIO_LIVE_ENABLED:'false', TUTOR_DAILY_TOKEN_BUDGET:'0', ADMIN_EMAIL:'owner@staging.invalid' };
 const extra = ['NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','NEXT_PUBLIC_SUPABASE_KEY_BINDING','SUPABASE_SERVICE_KEY_BINDING','ADMIN_SESSION_SECRET'];
 check(!env.pagination?.next && env.envs.length === Object.keys(expected).length + extra.length && env.envs.every(e => [...Object.keys(expected), ...extra].includes(e.key) && e.target?.length === 2 && e.target.includes('production') && e.target.includes('preview') && !e.gitBranch && !e.customEnvironmentId), 'ENV_ALLOWLIST_AND_SCOPES');
 // Retrieve only nonsensitive configuration individually; never print API values.
 for (const [key, value] of Object.entries(expected)) {
  const e = env.envs.find(x => x.key === key); const v = await get('/v1/projects/' + project + '/env/' + e.id + '?decrypt=true');
  check(v.value === value, 'CONFIG_' + key);
 }
 report.environment = env.envs.map(e => ({ key:e.key, type:e.type, target:e.target, updatedAt:e.updatedAt, createdAt:e.createdAt }));
 report.source = source; report.passed = true;
})().catch(e => { report.passed = false; report.failure = /^[A-Z0-9_]+$/.test(e.message) ? e.message : 'PREFLIGHT_FAILED'; process.exitCode = 1; }).finally(() => {
 const file = path.join(out, 'preflight-' + Date.now() + '.json'); fs.writeFileSync(file, JSON.stringify(report,null,2), {flag:'wx'}); console.log(JSON.stringify({file,passed:report.passed,failure:report.failure,checks:report.checks}));
});
