const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const ts = require('typescript');
const { load } = require('../scripts/inspect.cjs');
function setup() {
  const timers = new Map(), messages = []; let tick = 0;
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../utils/python-session.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, require: () => load('lecomax-learning-app/utils/python-sandbox.ts'),
    setTimeout: (fn, ms) => { const id = ++tick; timers.set(id, { fn, ms }); return id; }, clearTimeout: id => timers.delete(id),
  });
  const engine = new exports.PythonSession(m => messages.push(m), () => 100);
  engine.receive({ type: 'ready' });
  return { engine, messages, timers };
}
test('empty code, duplicate run/stop, waiting deadlines, network failure and stale completion', async () => {
  const { engine, messages, timers } = setup();
  await assert.rejects(engine.run(' ', '', true));
  const run = engine.run('print(input())', '', true);
  await assert.rejects(engine.run('print(2)', '', true), /already running/);
  engine.receive({ type: 'running', interactive: true });
  engine.receive({ type: 'input', id: 1, prompt: 'First: ' });
  assert.equal(engine.state.status, 'Waiting for input');
  assert(![...timers.values()].some(t => t.ms === 10000));
  assert.equal(engine.answer('15'), true); assert.equal(engine.answer('duplicate'), false);
  engine.receive({ type: 'input', id: 2, prompt: 'Second: ' });
  assert.equal(engine.answer('25'), true);
  engine.stop(); engine.stop();
  assert.equal((await run).status, 'Cancelled');
  assert.equal(messages.filter(m => m.type === 'stop').length, 1);
  assert.equal(timers.size, 0);
  engine.receive({ type: 'result', result: { stdout: 'late', stderr: '', exitCode: 0, durationMs: 0, truncated: false } });
  assert.equal(engine.state.status, 'Cancelled');
  engine.receive({ type: 'ready' });
  const failed = engine.run('print(1)', '', true);
  engine.receive({ type: 'failure', message: 'Python download failed: network unavailable.' });
  assert.equal((await failed).status, 'Failed');
  assert.match(engine.state.stderr, /network unavailable/);
  assert.equal(timers.size, 0);
  const generation = engine.state.generation;
  engine.restart();
  assert.equal(engine.state.generation, generation + 1);
  assert.equal(engine.state.status, 'Ready');
});
test('output snapshots remain ordered and invalid payloads cannot inflate the console', async () => {
  const { engine } = setup();
  const run = engine.run('print(1)', '', false);
  const output = [{ stream: 'stdout', text: 'one\n' }, { stream: 'stderr', text: 'warning\n' }, { stream: 'stdout', text: 'two\n' }];
  engine.receive({ type: 'output', output });
  assert.equal(engine.state.output.map(c => c.text).join(''), 'one\nwarning\ntwo\n');
  engine.receive({ type: 'output', output: [{ stream: 'stdout', text: 'x'.repeat(48001) }] });
  assert.equal(engine.state.output.length, 3);
  engine.receive({ type: 'result', result: { stdout: 'one\ntwo\n', stderr: 'warning\n', output, exitCode: 0, durationMs: 4, truncated: false } });
  assert.equal((await run).status, 'Completed');
});
