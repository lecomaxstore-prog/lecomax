const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(store) {
  const compile = file => ts.transpileModule(fs.readFileSync(require.resolve(file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const pairing = {};
  vm.runInNewContext(compile('../utils/phone-pairing.ts'), { exports: pairing, URL });
  const exports = {};
  vm.runInNewContext(compile('../utils/phone-session.ts'), { exports, require: name => name === 'expo-secure-store' ? store : pairing });
  return exports;
}
test('saved session survives module restart, stays origin-bound, and ordered Stop removes it', async () => {
  const values = new Map(), origin = 'http://100.80.1.2:8092', token = 'a'.repeat(32);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const store = { getItemAsync: async key => values.get(key), setItemAsync: async (key, value) => { await gate; values.set(key, value); }, deleteItemAsync: async key => { values.delete(key); } };
  const first = load(store);
  const pendingSave = first.savePhoneSession(origin, token);
  const pendingStop = first.savePhoneSession(origin, '');
  release(); await Promise.all([pendingSave, pendingStop]);
  assert.equal(await first.readPhoneSession(origin), '');
  await first.savePhoneSession(origin, token);
  const restarted = load(store);
  assert.equal(await restarted.readPhoneSession(origin), token);
  assert.equal(await restarted.readPhoneSession('http://100.80.1.3:8092'), '');
  for (const other of ['https://evil.example', origin + '/path', 'http://192.168.1.2:8092']) {
    await restarted.savePhoneSession(other, token);
    assert.equal(await restarted.readPhoneSession(other), '');
  }
  assert.equal(values.size, 1);
  await assert.rejects(restarted.savePhoneSession(origin, 'invalid'));
  await restarted.savePhoneSession(origin, '');
  assert.equal(await load(store).readPhoneSession(origin), '');
});
test('secure storage failures propagate and do not poison later writes', async () => {
  let fail = true, value;
  const store = { getItemAsync: async () => value, setItemAsync: async (_, token) => { if (fail) throw Error('unavailable'); value = token; }, deleteItemAsync: async () => { value = undefined; } };
  const session = load(store), origin = 'http://100.80.1.2:8092';
  await assert.rejects(session.savePhoneSession(origin, 'a'.repeat(32)));
  fail = false;
  await session.savePhoneSession(origin, 'b'.repeat(32));
  assert.equal(await session.readPhoneSession(origin), 'b'.repeat(32));
});
