// Offline plan by default. Execution requires reviewed staging evidence and
// genuine staging sessions; never loads dotenv, logs cookies or invokes workers.
const fs = require('node:fs');
const path = require('node:path');
const STAGING = 'tyltharlnbxrxibuxyye';
// Public identifiers recovered from the reviewed repository checkpoint.
const PRODUCTION = 'yddqwgdgeljkzfsmtein';
const PRODUCTION_VERCEL = 'prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb';
const ACTORS = [
  ['anonymous', null, 401],
  ['invalid', null, 401],
  ['owner', 'SEO_ACCEPTANCE_OWNER_SESSION', 200],
  ['catalogue-editor', 'SEO_ACCEPTANCE_EDITOR_SESSION', 200],
  ['view-only', 'SEO_ACCEPTANCE_VIEWER_SESSION', 403],
  ['product-only', 'SEO_ACCEPTANCE_PRODUCT_EDITOR_SESSION', 403],
  ['suspended', 'SEO_ACCEPTANCE_SUSPENDED_SESSION', 401],
  ['expired', 'SEO_ACCEPTANCE_EXPIRED_SESSION', 401],
];
const fail = () => { throw Error('STAGING_ACCEPTANCE_EVIDENCE_REQUIRED'); };
function validateEvidence(input, now = Date.now()) {
  if (!input || input.projectRef !== STAGING || input.productionProjectRef !== PRODUCTION) fail();
  let url;
  try { url = new URL(input.origin); } catch { fail(); }
  if (url.origin !== input.origin || url.protocol !== 'https:' ||
      !/^[a-z0-9-]+\.vercel\.app$/.test(url.hostname) || url.port) fail();
  if (!/^prj_[a-zA-Z0-9]+$/.test(input.stagingVercelProjectId) ||
      input.productionVercelProjectId !== PRODUCTION_VERCEL ||
      input.stagingVercelProjectId === input.productionVercelProjectId ||
      !/^dpl_[a-zA-Z0-9]+$/.test(input.deploymentId) ||
      !/^[a-f0-9]{40}$/.test(input.sourceRevision)) fail();
  const reviewed = typeof input.reviewedAt === 'string' && /Z$/.test(input.reviewedAt)
    ? Date.parse(input.reviewedAt) : NaN;
  if (!Number.isFinite(reviewed) || reviewed > now || now - reviewed > 86_400_000 ||
      typeof input.reviewedBy !== 'string' || !input.reviewedBy.trim()) fail();
  for (const key of ['identityVerified', 'environmentScopesVerified', 'providerIsolationVerified',
    'automationDisabled', 'migrationAcceptanceApproved', 'readOnlyRouteReviewed', 'sessionOriginVerified']) {
    if (input[key] !== true) fail();
  }
  return { origin: url.origin, projectRef: STAGING, deploymentId: input.deploymentId,
    stagingVercelProjectId: input.stagingVercelProjectId,
    productionProjectRef: PRODUCTION, productionVercelProjectId: PRODUCTION_VERCEL,
    sourceRevision: input.sourceRevision, reviewedAt: input.reviewedAt };
}
async function boundedJson(response) {
  const reader = response.body?.getReader();
  if (!reader) throw Error('INVALID_BODY');
  const chunks = []; let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 65_536) throw Error('BODY_TOO_LARGE');
      chunks.push(Buffer.from(value));
    }
  } finally { await reader.cancel().catch(() => {}); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
// Verify the immutable deployment URL before any session leaves this process.
// No aliases, project links, dotenv files, SQL or deployment endpoints are used.
async function verifyDeployment(target, token, fetcher) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_.-]{16,512}$/.test(token))
    throw Error('STAGING_METADATA_REQUIRED');
  try {
    const response = await fetcher(`https://api.vercel.com/v13/deployments/${target.deploymentId}`, {
      method: 'GET', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15_000),
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status !== 200) {
      await response.body?.cancel().catch(() => {});
      throw Error('METADATA_STATUS');
    }
    const deployment = await boundedJson(response);
    if (deployment.id !== target.deploymentId ||
        deployment.projectId !== target.stagingVercelProjectId ||
        deployment.projectId === PRODUCTION_VERCEL ||
        `https://${deployment.url}` !== target.origin || deployment.readyState !== 'READY' ||
        (deployment.gitSource?.sha || deployment.meta?.githubCommitSha) !== target.sourceRevision) fail();
  } catch { throw Error('STAGING_DEPLOYMENT_IDENTITY_FAILED'); }
}
function plan() {
  return { executionEnabled: false, projectRef: STAGING, method: 'GET',
    path: '/api/admin/seo/sync', actors: ACTORS.map(([name, sessionEnvironment, expected]) =>
      ({ name, sessionEnvironment, expected })),
    prerequisites: 'Reviewed evidence younger than 24h, isolated deployment and genuine staging sessions. See docs/seo-hosted-staging-acceptance-20261020.md.',
    excluded: ['production', 'worker GET /api/sync', 'POST', 'RPC mutations', 'login', 'paid providers'] };
}
async function runReadOnly(evidence, sessions, {
  fetcher = fetch, metadataFetcher = fetch, metadataToken, now = Date.now(),
} = {}) {
  const target = validateEvidence(evidence, now);
  // Preflight every session before sending even an anonymous request.
  for (const [, key] of ACTORS) {
    if (key && (typeof sessions?.[key] !== 'string' ||
      !/^[A-Za-z0-9_-]{1,4096}$/.test(sessions[key]))) throw Error('STAGING_SESSIONS_REQUIRED');
  }
  await verifyDeployment(target, metadataToken, metadataFetcher);
  const results = [];
  for (const [name, key, expected] of ACTORS) {
    const cookie = key ? sessions[key] : name === 'invalid' ? 'invalid-readonly-probe' : null;
    try {
      const response = await fetcher(target.origin + '/api/admin/seo/sync', {
        method: 'GET', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15_000),
        headers: cookie ? { Cookie: 'admin_session=' + cookie } : {},
      });
      let passed = response.status === expected;
      if (expected === 200 && response.status === 200) {
        const body = await boundedJson(response);
        passed = body?.enabled === false && body.run !== null &&
          typeof body.run === 'object' && !Array.isArray(body.run) &&
          !/"[^"]*(?:token|secret)[^"]*"\s*:/i.test(JSON.stringify(body)) &&
          /no-store/i.test(response.headers.get('cache-control') || '');
      } else { await response.body?.cancel().catch(() => {}); }
      results.push({ actor: name, expected, status: response.status, result: passed ? 'passed' : 'failed' });
      if (!passed) break; // Stop on unexpected routing/auth/configuration.
    } catch {
      results.push({ actor: name, expected, result: 'failed', error: 'STAGING_READ_FAILED' });
      break; // Never return raw bodies, headers, session values or exceptions.
    }
  }
  return { at: new Date(now).toISOString(), ...target, httpMethodsReadOnly: true,
    deploymentIdentityVerified: true, environmentAndDatabaseIdentity: 'operator-attested-not-remotely-verified',
    productionAppRequested: false, databaseInspectionPerformed: false, databaseReadOnlyTransactionVerified: false,
    complete: results.length === ACTORS.length && results.every(r => r.result === 'passed'), results };
}
module.exports = { validateEvidence, plan, runReadOnly };
if (require.main === module) {
  (async () => {
    const [mode, file, extra] = process.argv.slice(2);
    if (mode === undefined || mode === '--plan' && !file) {
      console.log(JSON.stringify(plan(), null, 2)); return;
    }
    if (mode !== '--execute-readonly' || !file || extra) throw Error('INVALID_ARGUMENTS');
    const report = await runReadOnly(JSON.parse(fs.readFileSync(file, 'utf8')), process.env,
      { metadataToken: process.env.SEO_ACCEPTANCE_VERCEL_READ_TOKEN });
    const directory = path.resolve(__dirname, '../artifacts/seo-staging-acceptance');
    fs.mkdirSync(directory, { recursive: true });
    const output = path.join(directory, `readonly-${Date.now()}.json`);
    fs.writeFileSync(output, JSON.stringify(report, null, 2), { flag: 'wx' });
    console.log(JSON.stringify({ output, ...report }));
    if (!report.complete) process.exitCode = 1;
  })().catch(() => { console.error('STAGING_ACCEPTANCE_BLOCKED'); process.exitCode = 1; });
}
