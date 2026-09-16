import assert from 'node:assert/strict';

// Explicit opt-in: consumes only this caller's tracking-IP quota for 15 minutes.
// Missing order/email parameters stop processing before any database lookup.
assert.ok(process.argv.includes('--live'), 'Use --live to verify the production tracking limiter.');
let blocked = false;
for (let request = 1; request <= 31; request++) {
  const response = await fetch('https://lecomax.com/api/tracking', {
    headers: { 'User-Agent': 'Lecomax-Deployment-Verification' },
    cache: 'no-store', signal: AbortSignal.timeout(15000),
  });
  const body = await response.json();
  if (response.status === 429) {
    assert.equal(body.error, 'Trop de tentatives. Réessayez plus tard.', 'Must be the shared Redis limiter, not a local middleware counter.');
    const retryAfter = Number(response.headers.get('retry-after'));
    assert.ok(retryAfter >= 1 && retryAfter <= 900, 'Shared counter must have a bounded expiry.');
    console.log(`Production Redis limiter verified: HTTP 429 at request ${request}, Retry-After ${retryAfter}s. No order/customer data queried.`);
    blocked = true;
    break;
  }
  assert.equal(response.status, 400, 'Unblocked requests should only report missing parameters.');
}
assert.ok(blocked, 'The shared limiter must block by request 31.');
