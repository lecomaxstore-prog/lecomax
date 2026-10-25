// Read-only targeted provider check. No secret values, hashes, or URLs are emitted.
const fs = require('node:fs');
const { vercelApiFetch } = require('./vercel-cli-api.cjs');
const project = 'prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb';
const team = 'team_yFLUcpSvgQi8EQuvuorOZW7w';
const report = { at: new Date().toISOString(), readOnly: true, provider: 'Vercel CLI authenticated API', valuesExported: false };
async function get(route) {
  const url = new URL(route, 'https://api.vercel.com'); url.searchParams.set('teamId', team);
  const r = await vercelApiFetch(url); if (!r.ok) throw Error('HTTP_' + r.status); return r.json();
}
(async () => {
  const p = await get('/v9/projects/' + project);
  if (p.id !== project || p.accountId !== team) throw Error('IDENTITY');
  const entries = (await get('/v10/projects/' + project + '/env?decrypt=false')).envs;
  const entry = entries.filter(e => e.key === 'OWNER_DATABASE_URL' && e.target.includes('production') && !e.gitBranch);
  if (entry.length !== 1) throw Error('DATABASE_SCOPE_AMBIGUOUS');
  report.storageType = entry[0].type;
  const result = await get('/v1/projects/' + project + '/env/' + entry[0].id);
  report.readable = typeof result.value === 'string' && result.value.length > 0;
  if (report.readable) {
    try {
      const u = new URL(result.value), ref = 'yddqwgdgeljkzfsmtein';
      report.productionIdentityMatches = u.protocol.startsWith('postgres') && (u.hostname === `db.${ref}.supabase.co` || u.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(u.username).endsWith('.' + ref));
      report.sessionPort = !u.port || u.port === '5432';
      report.passwordPresent = Boolean(u.password);
    } catch { report.productionIdentityMatches = false; }
  }
})().catch(e => { report.failure = /^HTTP_\d+$/.test(e.message) ? e.message : 'PROVIDER_CHECK_FAILED'; process.exitCode = 1; })
.finally(() => { const file = `artifacts/seo-production-credential-provider-${Date.now()}.json`; fs.writeFileSync(file, JSON.stringify(report, null, 2), { flag: 'wx' }); console.log(JSON.stringify({ file, ...report })); });
