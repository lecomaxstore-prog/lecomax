const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function setup(read, active = () => true) {
  let now = 0, serial = 0;
  const timers = new Map(), errors = [], exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../utils/terminal-pump.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, Date: { now: () => now }, Error,
    setTimeout: (fn, delay) => { const id = ++serial; timers.set(id, { fn, delay }); return id; },
    clearTimeout: id => timers.delete(id),
  });
  const pump = exports.createTerminalPump({ read, active, fail: e => errors.push(e) });
  return { pump, errors, timers, async tick() { const [id, task] = timers.entries().next().value; timers.delete(id); now += task.delay; task.fn(); await Promise.resolve(); await Promise.resolve(); }, delay: () => [...timers.values()][0]?.delay };
}

test('typing wakes an idle poll, batches input, and waits for each request', async () => {
  const writes = []; let release;
  const ctx = setup(data => { writes.push(data); return new Promise(resolve => { release = resolve; }); });
  ctx.pump.start(); await ctx.tick();
  ctx.pump.write('a'); ctx.pump.write('b');
  assert.equal(ctx.timers.size, 0, 'no overlapping request while read is in flight');
  release(true); await Promise.resolve(); await Promise.resolve();
  assert.equal(ctx.delay(), 0); await ctx.tick(); assert.deepEqual(writes, ['', 'ab']);
  release(true); await Promise.resolve(); await Promise.resolve();
  assert.equal(ctx.delay(), 50);
  ctx.pump.write('\r'); assert.equal(ctx.delay(), 8); await ctx.tick();
  assert.deepEqual(writes, ['', 'ab', '\r']); ctx.pump.stop(); release(true);
});

test('failed input is never replayed and stops polling', async () => {
  const writes = []; const ctx = setup(async data => { writes.push(data); throw Error('NETWORK'); });
  ctx.pump.write('command\r'); await ctx.tick(); ctx.pump.wake(); ctx.pump.write('again');
  assert.deepEqual(writes, ['command\r']); assert.equal(ctx.errors.length, 1); assert.equal(ctx.timers.size, 0);
});

test('hidden sessions back off and wake immediately; stop ignores in-flight completion', async () => {
  const ctx = setup(async () => true, () => false); ctx.pump.start(); await ctx.tick();
  assert.equal(ctx.delay(), 5000); ctx.pump.wake(); assert.equal(ctx.delay(), 0);
  ctx.pump.stop(); assert.equal(ctx.timers.size, 0);
  let release; const pending = setup(() => new Promise(r => { release = r; }));
  pending.pump.start(); await pending.tick(); pending.pump.stop(); release(true); await Promise.resolve();
  assert.equal(pending.timers.size, 0);
});

test('large input is chunked in order and overflow terminates the queue', async () => {
  const writes = []; const ctx = setup(async data => { writes.push(data); return true; });
  ctx.pump.write('a'.repeat(5000)); await ctx.tick(); await ctx.tick();
  assert.deepEqual(writes.map(x => x.length), [4000, 1000]);
  ctx.pump.write('x'.repeat(64001)); assert.equal(ctx.errors[0].message, 'INPUT_TOO_LARGE'); assert.equal(ctx.timers.size, 0);
});
