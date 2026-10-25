const test = require('node:test'), assert = require('node:assert/strict');
const { plan, validateEvidence, runReadOnly: execute } = require('../scripts/seo-staging-acceptance.cjs');
const now = Date.UTC(2026, 9, 20, 12);
const fixture = () => ({ origin: 'https://isolated-staging.vercel.app',
  projectRef: 'tyltharlnbxrxibuxyye', stagingVercelProjectId: 'prj_staging',
  productionProjectRef: 'yddqwgdgeljkzfsmtein', productionVercelProjectId: 'prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb', deploymentId: 'dpl_fixture',
  sourceRevision: 'a'.repeat(40), reviewedAt: new Date(now - 1000).toISOString(),
  reviewedBy: 'Synthetic reviewer', identityVerified: true, environmentScopesVerified: true,
  providerIsolationVerified: true, automationDisabled: true, migrationAcceptanceApproved: true,
  readOnlyRouteReviewed: true, sessionOriginVerified: true });
const sessions = () => Object.fromEntries(plan().actors.filter(a => a.sessionEnvironment)
  .map(a => [a.sessionEnvironment, 'synthetic_session_' + a.name.replace(/-/g, '_')]));
const success = () => Response.json({ enabled: false, run: { state: 'idle' } },
  { headers: { 'Cache-Control': 'private, no-store' } });
test('offline plan exposes no executable target or credentials', () => {
  assert.equal(plan().executionEnabled, false);
  assert.equal(plan().origin, undefined);
  assert.equal(plan().actors.length, 8);
});
test('production, misleading URLs, project confusion and stale evidence fail before HTTP', async () => {
  for (const patch of [{ origin: 'https://lecomax.com' }, { origin: 'https://staging.lecomax.com' },
    { origin: 'https://isolated-staging.vercel.app.evil.test' },
    { origin: 'https://isolated-staging.vercel.app/api/sync' },
    { origin: 'https://user:password@isolated-staging.vercel.app' },
    { projectRef: 'yddqwgdgeljkzfsmtein' }, { stagingVercelProjectId: 'prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb' },
    { reviewedAt: new Date(now - 86_400_001).toISOString() },
    { reviewedAt: new Date(now + 1).toISOString() }, { providerIsolationVerified: false }]) {
    let calls = 0;
    await assert.rejects(runReadOnly({ ...fixture(), ...patch }, sessions(), {
      now, fetcher: async () => { calls++; return success(); },
    }), /EVIDENCE_REQUIRED/);
    assert.equal(calls, 0);
  }
  assert.equal(validateEvidence(fixture(), now).projectRef, fixture().projectRef);
});
test('all genuine sessions must be safe and present before the first request', async () => {
  for (const value of [undefined, 'x; session=other', 'x\r\nHeader: value', 'x'.repeat(4097)]) {
    let calls = 0;
    await assert.rejects(runReadOnly(fixture(), { ...sessions(), SEO_ACCEPTANCE_OWNER_SESSION: value },
      { now, fetcher: async () => { calls++; return success(); } }), /SESSIONS_REQUIRED/);
    assert.equal(calls, 0);
  }
});
test('actor matrix uses only the pinned staging status GET and never returns sessions', async () => {
  const actors = plan().actors; let calls = 0;
  const result = await runReadOnly(fixture(), sessions(), { now, fetcher: async (url, init) => {
    assert.equal(url, fixture().origin + '/api/admin/seo/sync');
    assert.equal(init.method, 'GET'); assert.equal(init.redirect, 'error');
    assert.equal(init.cache, 'no-store'); assert.ok(init.signal instanceof AbortSignal);
    const expected = actors[calls++].expected;
    return expected === 200 ? success() : new Response(null, { status: expected });
  } });
  assert.equal(calls, 8); assert.equal(result.complete, true);
  assert.doesNotMatch(JSON.stringify(result), /synthetic_session|Cookie|admin_session|Synthetic reviewer/);
});
test('redirects and transport errors stop immediately with sanitized results', async () => {
  for (const transport of [async () => new Response(null, { status: 302 }),
    async () => { throw Error('PRIVATE_SESSION_VALUE'); }]) {
    let calls = 0;
    const result = await runReadOnly(fixture(), sessions(), { now, fetcher: async () => {
      calls++; return transport();
    } });
    assert.equal(result.complete, false); assert.equal(calls, 1);
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE_SESSION_VALUE/);
  }
});
test('enabled worker, leaked fields, oversized bodies and missing no-store fail acceptance', async () => {
  for (const bad of [
    () => Response.json({ enabled: true, run: {} }),
    () => Response.json({ enabled: false, run: { token: 'PRIVATE_TOKEN' } }),
    () => Response.json({ enabled: false, run: {} }),
    () => new Response('x'.repeat(65_537)),
  ]) {
    let calls = 0;
    const result = await runReadOnly(fixture(), sessions(), { now, fetcher: async () =>
      ++calls < 3 ? new Response(null, { status: 401 }) : bad() });
    assert.equal(result.complete, false); assert.equal(calls, 3);
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE_TOKEN/);
  }
});

function metadata(patch = {}) {
  return Response.json({ id: fixture().deploymentId, projectId: fixture().stagingVercelProjectId,
    url: new URL(fixture().origin).hostname, readyState: 'READY', gitSource: { sha: fixture().sourceRevision }, ...patch });
}
function runReadOnly(evidence, cookies, options) {
  return execute(evidence, cookies, { metadataToken: 'synthetic_read_token',
    metadataFetcher: async (url, init) => {
      assert.equal(url, 'https://api.vercel.com/v13/deployments/dpl_fixture');
      assert.equal(init.method, 'GET'); assert.equal(init.redirect, 'error');
      assert.equal(init.headers.Cookie, undefined);
      return metadata();
    }, ...options });
}
test('independent production identities and every approval are mandatory', () => {
  for (const key of ['projectRef', 'productionProjectRef', 'productionVercelProjectId',
    'stagingVercelProjectId', 'deploymentId', 'sourceRevision', 'reviewedAt', 'reviewedBy',
    'identityVerified', 'environmentScopesVerified', 'providerIsolationVerified', 'automationDisabled',
    'migrationAcceptanceApproved', 'readOnlyRouteReviewed', 'sessionOriginVerified']) {
    const input = fixture(); delete input[key];
    assert.throws(() => validateEvidence(input, now), /EVIDENCE_REQUIRED/);
  }
});
test('live metadata rejects wrong project, deployment, URL, revision and readiness before sessions', async () => {
  for (const patch of [{ projectId: fixture().productionVercelProjectId }, { id: 'dpl_other' },
    { url: 'lecomax.com' }, { url: 'alias.vercel.app' }, { readyState: 'BUILDING' },
    { gitSource: { sha: 'b'.repeat(40) } }]) {
    let calls = 0;
    await assert.rejects(runReadOnly(fixture(), sessions(), { now,
      metadataFetcher: async () => metadata(patch), fetcher: async () => { calls++; return success(); }
    }), /STAGING_DEPLOYMENT_IDENTITY_FAILED/);
    assert.equal(calls, 0);
  }
});
test('metadata denial, redirects, malformed bodies and transport errors fail closed without leaks', async () => {
  for (const transport of [async () => new Response(null, { status: 403 }),
    async () => new Response(null, { status: 302 }), async () => new Response('PRIVATE_BAD_JSON'),
    async () => new Response('x'.repeat(65537)), async () => { throw Error('PRIVATE_TOKEN'); }]) {
    let calls = 0;
    await assert.rejects(runReadOnly(fixture(), sessions(), { now, metadataFetcher: transport,
      fetcher: async () => { calls++; return success(); } }), { message: 'STAGING_DEPLOYMENT_IDENTITY_FAILED' });
    assert.equal(calls, 0);
  }
  await assert.rejects(runReadOnly(fixture(), sessions(), { now, metadataToken: undefined }), /METADATA_REQUIRED/);
});
