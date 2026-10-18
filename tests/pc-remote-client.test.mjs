import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../scripts/pc-remote/client.js', import.meta.url), 'utf8');
for (const failure of ['bad-code', 'missing-cookie']) test(`pairing displays ${failure} and restores Connect button`, async () => {
 const elements = new Map();
 const el = id => { if (!elements.has(id)) elements.set(id, { style: {}, value: 'example', textContent: '', disabled: false, addEventListener(type, fn) { this[type] = fn; }, blur() { this.blurred = true; }, querySelector() { return el('submit'); } }); return elements.get(id); };
 vm.runInNewContext(source, { document: { getElementById: el }, URLSearchParams, fetch: async url => ({ ok: false, text: async () => 'Incorrect pairing code', ...(url === '/pair' && failure === 'missing-cookie' ? {ok:true}: {}) }) });
 await el('pair').submit({preventDefault(){}});
 assert.match(el('error').textContent, failure === 'bad-code' ? /Incorrect pairing code/ : /session was not saved/);
 assert.equal(el('submit').disabled, false);
 assert.equal(el('code').blurred, true);
 assert.match(el('submit').textContent, /Connect/);
});
