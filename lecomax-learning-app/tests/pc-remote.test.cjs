const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync(require.resolve('../utils/pc-remote.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {}, URL }; vm.runInNewContext(compiled, context);
const { pcRemoteUrl } = context.exports;
test('My PC accepts local bridge addresses and HTTPS gateway origins, not credentials or unsafe navigation', () => {
  assert.equal(pcRemoteUrl('192.168.1.11'), 'http://192.168.1.11:6081');
  assert.equal(pcRemoteUrl('http://10.0.0.2:6081/'), 'http://10.0.0.2:6081');
  assert.equal(pcRemoteUrl('100.100.20.4'), 'http://100.100.20.4:6081');
  assert.equal(pcRemoteUrl('https://pc.example.com'), 'https://pc.example.com');
  for (const value of ['http://example.com:6081', 'https://pc.example.com:8443', 'https://pc.example.com/desktop', 'https://user:pass@pc.example.com', 'http://192.168.1.11:6081@evil.com', 'http://127.0.0.1:6081', 'http://192.168.1.11:6081/evil', 'http://192.168.1.11:6081?x=y', 'http://192.168.1.11:5908', 'http://192.168.999.1:6081', 'javascript:alert(1)']) assert.equal(pcRemoteUrl(value), null, value);
});
