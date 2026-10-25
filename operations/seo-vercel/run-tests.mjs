// The worker suite includes shared SQL/fixture files rooted in the repository.
// Use this runtime and a fixed working directory from any npm invocation.
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

if (process.argv.length !== 2) throw Error('NO_TEST_TARGET_OVERRIDES');
const root = fileURLToPath(new URL('../../', import.meta.url));
const directory = new URL('./tests/', import.meta.url);
const tests = readdirSync(directory).filter(name => name.endsWith('.test.mjs')).sort()
  .map(name => fileURLToPath(new URL(name, directory)));
if (!tests.length) throw Error('WORKER_TESTS_MISSING');
const result = spawnSync(process.execPath, ['--test', ...tests], {
  cwd: root, env: process.env, windowsHide: true, stdio: 'inherit',
});
if (result.error) console.error('WORKER_TEST_RUNNER_FAILED');
process.exitCode = result.status ?? 1;
