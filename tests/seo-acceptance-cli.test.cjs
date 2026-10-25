const test = require('node:test'), assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
function invoke(file, args) {
  const guard = 'data:text/javascript,' + encodeURIComponent(
    "globalThis.fetch=()=>{console.log('NETWORK_ATTEMPT');throw Error('NETWORK_FORBIDDEN');};");
  return spawnSync(process.execPath, ['--import', guard, file, ...args],
    { encoding: 'utf8', windowsHide: true });
}
test('both acceptance CLIs default to offline plans and reject unknown arguments', () => {
  for (const file of ['scripts/seo-hosted-acceptance-readonly.cjs', 'scripts/seo-staging-acceptance.cjs']) {
    for (const args of [[], ['--plan']]) {
      const result = invoke(file, args);
      assert.equal(result.status, 0);
      assert.doesNotMatch(result.stdout + result.stderr, /NETWORK_ATTEMPT/);
    }
    const result = invoke(file, ['--unknown']);
    assert.equal(result.status, 1);
    assert.doesNotMatch(result.stdout + result.stderr, /NETWORK_ATTEMPT/);
  }
});
test('legacy production runner refuses execution even with the old execution flag', () => {
  const result = invoke('scripts/seo-hosted-acceptance-readonly.cjs', ['--execute-readonly']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /PRODUCTION_ACCEPTANCE_DISABLED_USE_STAGING_RUNNER/);
  assert.doesNotMatch(result.stdout + result.stderr, /NETWORK_ATTEMPT/);
});
