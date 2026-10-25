const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { vercelApiFetch, parseResponse } = require('../scripts/vercel-cli-api.cjs');
const ok = { code: 0, output: 'HTTP 200 OK\r\ncontent-type: application/json\r\n\r\n{"id":"fixture"}' };

test('GET delegates authentication to CLI, preserving team scope without credentials', async () => {
  let calls = 0;
  const r = await vercelApiFetch('https://api.vercel.com/v9/projects?teamId=team_fixture', {}, async (args, body) => {
    calls++;
    assert.deepEqual(args, ['api', '/v9/projects?teamId=team_fixture', '--method', 'GET', '--raw', '--include', '--non-interactive']);
    assert.equal(body, undefined); return ok;
  });
  assert.equal(calls, 1); assert.deepEqual(await r.json(), { id: 'fixture' });
});
test('mutation body goes through stdin, never arguments; failed requests are not retried', async () => {
  const secret = 'synthetic-secret-not-real'; let calls = 0;
  const r = await vercelApiFetch('https://api.vercel.com/v1/projects/fixture', { method: 'PATCH', body: JSON.stringify({ secret }) }, async (args, input) => {
    calls++; assert(!args.join(' ').includes(secret)); assert.equal(JSON.parse(input).secret, secret);
    assert.deepEqual(args.slice(-2), ['--input', '-']);
    return { code: 1, output: `HTTP 403 Forbidden\ncontent-type: application/json\n\n{"echo":"${secret}"}` };
  });
  assert.equal(calls, 1); assert.equal(r.status, 403); assert.equal(await r.text(), '{}');
});
test('rejects foreign origins, userinfo, headers and GET bodies before starting CLI', async () => {
  for (const [url, options] of [
    ['https://evil.invalid/v2/user', {}], ['https://api.vercel.com.evil.invalid/', {}],
    ['https://secret@api.vercel.com/v2/user', {}], ['https://api.vercel.com/#secret', {}],
    ['https://api.vercel.com/', { headers: { Authorization: 'Bearer fixture' } }],
    ['https://api.vercel.com/', { body: 'fixture' }], ['https://api.vercel.com/', { method: 'DELETE' }],
  ]) await assert.rejects(vercelApiFetch(url, options, () => { assert.fail('must not spawn'); }));
});
test('sanitizes malformed/failed CLI output and handles no-content responses', async () => {
  for (const result of [{ code: 1, output: 'private stderr' }, { ...ok, code: 1 }])
    assert.throws(() => parseResponse(result), /^Error: VERCEL_CLI_API_FAILED$/);
  assert.equal(parseResponse({ code: 0, output: 'HTTP 204 No Content\nserver: fixture\n\n' }).status, 204);
});
test('active operational scripts never read the Vercel credential cache', () => {
  for (const file of fs.readdirSync('scripts').filter(f => /\.(cjs|mjs|ps1)$/.test(f))) {
    const source = fs.readFileSync('scripts/' + file, 'utf8');
    assert(!/com\.vercel\.cli[\/\\]auth\.json/.test(source), file);
  }
});
