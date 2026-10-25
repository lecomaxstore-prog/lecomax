// Explicit owner approval: new independent signer and admin re-login on next deployment.
// Create only; no overwrite, retry, deployment, or credential persistence.
const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { vercelApiFetch } = require('./vercel-cli-api.cjs');
const project = 'prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb';
const team = 'team_yFLUcpSvgQi8EQuvuorOZW7w';
const key = 'ADMIN_SESSION_SECRET';
const report = { at: new Date().toISOString(), key, project, productionOnly: true,
  ownerApprovedSessionInvalidation: true, created: false, deployed: false, secretExported: false };
const hash = v => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
async function api(route, body) {
  const url = new URL(route, 'https://api.vercel.com'); url.searchParams.set('teamId', team);
  const response = await vercelApiFetch(url, body ? { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
  if (!response.ok) throw Error('HTTP_' + response.status);
  return response.json();
}
(async () => {
  assert(process.argv[2] === '--approved-session-invalidation');
  const p = await api('/v9/projects/' + project);
  assert(p.id === project && p.name === 'lecomax' && p.accountId === team);
  const alias = await api('/v4/aliases/lecomax.com');
  const deploymentId = alias.deploymentId || alias.deployment?.id;
  const deployment = await api('/v13/deployments/' + deploymentId);
  assert.equal(deployment.projectId, project);
  const before = (await api('/v10/projects/' + project + '/env?decrypt=false')).envs;
  assert(!before.some(e => e.key === key && e.target?.includes('production')), 'EXISTING_SECRET_DO_NOT_OVERWRITE');
  const shared = await api('/v1/env');
  assert(Array.isArray(shared.data) && !shared.data.length && !shared.pagination?.next, 'SHARED_REVIEW_REQUIRED');
  const value = crypto.randomBytes(48).toString('base64url');
  assert(value.length >= 32);
  const result = await api('/v10/projects/' + project + '/env', {
    key, value, type: 'sensitive', target: ['production'],
  });
  const receipt = (Array.isArray(result.created) ? result.created.find(e => e.key === key) : result.created) || result;
  assert(!result.error && !result.errors?.length, 'CREATE_RECEIPT_ERROR');
  report.created = true;
  report.randomBits = 384;
  report.creationReceiptId = receipt.id || null;
  const after = (await api('/v10/projects/' + project + '/env?decrypt=false')).envs;
  const entries = after.filter(e => e.key === key && e.target?.includes('production'));
  assert.equal(entries.length, 1);
  const e = entries[0];
  assert(e.type === 'sensitive' && e.target.length === 1 && !e.gitBranch && !e.customEnvironmentIds?.length);
  if (receipt.id) assert.equal(e.id, receipt.id);
  report.metadataVerified = true;
  report.entryId = e.id;
  report.secretReadback = 'UNAVAILABLE_FOR_SENSITIVE_VALUES';
  report.existingEntriesPreserved = before.every(e => after.some(x => x.id === e.id && hash(x) === hash(e)));
  assert(report.existingEntriesPreserved && after.length === before.length + 1);
  const finalProject = await api('/v9/projects/' + project);
  const finalAlias = await api('/v4/aliases/lecomax.com');
  report.cronsPreserved = hash(p.crons) === hash(finalProject.crons);
  report.deploymentUnchanged = (finalAlias.deploymentId || finalAlias.deployment?.id) === deploymentId;
  assert(report.cronsPreserved && report.deploymentUnchanged);
  report.complete = true;
})().catch(e => {
  report.failure = /^[A-Z0-9_]+$/.test(e.message) ? e.message : 'SECRET_CONFIGURATION_FAILED_RECHECK_METADATA_BEFORE_RETRY';
  process.exitCode = 1;
}).finally(() => {
  const file = 'artifacts/seo-approved-admin-secret-' + Date.now() + '.json';
  fs.writeFileSync(file, JSON.stringify(report, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ file, ...report }));
});
