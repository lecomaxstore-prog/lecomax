const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const { resolveApiOrigin } = load('lecomax-learning-app/services/api-origin.ts');

test('release always uses the live HTTPS API despite inherited development configuration', () => {
  for (const configured of [undefined, '', 'http://127.0.0.1:3002', 'http://192.168.1.11:3002', 'https://staging.example.com']) {
    assert.equal(resolveApiOrigin(configured, false), 'https://lecomax.com');
  }
});

test('development keeps local API overrides and defaults to the live API', () => {
  assert.equal(resolveApiOrigin('http://127.0.0.1:3002/', true), 'http://127.0.0.1:3002');
  assert.equal(resolveApiOrigin(undefined, true), 'https://lecomax.com');
});
