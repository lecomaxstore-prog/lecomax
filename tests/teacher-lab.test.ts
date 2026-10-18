import test from 'node:test';
import assert from 'node:assert/strict';
import { executeLab, labAllowed, labInput } from '../lib/teacher-lab.ts';

test('terminal is explicit opt-in, loopback-only, origin-bound and disabled in production', () => {
  const env = { NODE_ENV: 'development', LECOMAX_LOCAL_TERMINAL: '1' };
  assert(labAllowed('http://127.0.0.1:3002/api/learning-mobile/lab', 'http://localhost:8081', env));
  for (const [url, origin, settings] of [
    ['https://lecomax.com/api/learning-mobile/lab', 'http://localhost:8081', env],
    ['http://127.0.0.1:3002', 'https://evil.example', env],
    ['http://127.0.0.1:3002', null, env],
    ['http://127.0.0.1:3002', 'http://localhost:8081', { ...env, NODE_ENV: 'production' }],
    ['http://127.0.0.1:3002', 'http://localhost:8081', {}],
  ] as const) assert.equal(labAllowed(url, origin, settings), false);
  assert.equal(labInput({ runtime: 'bash', code: 'echo x' }), null);
  assert.equal(labInput({ runtime: 'javascript', code: 'x'.repeat(12001) }), null);
});
test('real runtimes return output, errors, timeouts and bounded output', async () => {
  process.env.LECOMAX_TEST_SECRET = 'must-not-reach-child';
  try {
    const js = await executeLab('javascript', 'console.log(80 * 2 + 10 * 3); console.log(process.env.LECOMAX_TEST_SECRET)');
    assert.equal(js.exitCode, 0); assert.match(js.stdout, /190\r?\nundefined/);
    const failure = await executeLab('javascript', 'throw new Error("lesson error")');
    assert.notEqual(failure.exitCode, 0); assert.match(failure.stderr, /lesson error/);
    const timeout = await executeLab('javascript', 'while (true) {}', undefined, 300);
    assert.equal(timeout.timedOut, true);
    const huge = await executeLab('javascript', 'console.log("x".repeat(50000))');
    assert.equal(huge.truncated, true); assert(huge.stdout.length <= 24000);
    if (process.platform === 'win32') {
      const ps = await executeLab('powershell', 'Write-Output (80 * 2 + 10 * 3)');
      assert.equal(ps.exitCode, 0); assert.equal(ps.stdout.trim(), '190');
      const bad = await executeLab('powershell', 'Get-Item -LiteralPath "missing-lab-file"');
      assert.notEqual(bad.exitCode, 0); assert(bad.stderr.length > 0);
    }
  } finally { delete process.env.LECOMAX_TEST_SECRET; }
});
test('cancels an active process and rejects overlapping execution', async () => {
  const abort = new AbortController();
  const run = executeLab('javascript', 'setInterval(() => {}, 100)', abort.signal);
  await assert.rejects(executeLab('javascript', 'console.log(1)'), /LAB_BUSY/);
  setTimeout(() => abort.abort(), 200);
  assert.equal((await run).cancelled, true);
});
test('Python executes Unicode and standard library code, returns tracebacks and stops loops', async () => {
  assert.equal(labInput({ runtime: 'python', code: 'print(190)' })?.runtime, 'python');
  const result = await executeLab('python', 'import json\nprint(json.dumps({"total": 80 * 2 + 10 * 3}))\nprint("مرحبا")');
  assert.equal(result.exitCode, 0); assert.match(result.stdout, /190/); assert.match(result.stdout, /مرحبا/);
  const failure = await executeLab('python', 'print(1 / 0)');
  assert.notEqual(failure.exitCode, 0); assert.match(failure.stderr, /ZeroDivisionError/);
  const timeout = await executeLab('python', 'while True: pass', undefined, 300);
  assert.equal(timeout.timedOut, true);
});
