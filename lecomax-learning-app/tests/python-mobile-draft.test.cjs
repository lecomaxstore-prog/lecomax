const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const { readPythonMobileDraft } = load('lecomax-learning-app/utils/python-mobile-bridge.ts');

test('immediate native recovery accepts bounded working drafts, never named saves or unrelated data', () => {
  for (const key of ['python-studio:draft', 'python-lesson:12:45:67', 'python-working:hello', 'python-exercise:greeting']) {
    assert.equal(readPythonMobileDraft({ key, code: '' }).code, '');
    assert.equal(readPythonMobileDraft({ key, code: 'print("مرحبا")' }).key, key);
  }
  for (const value of [null, {}, { key: '__proto__', code: 'x' }, { key: 'unrelated-note', code: 'x' }, { key: 'python-script:saved', code: 'overwrite' }, { key: 'python-studio:draft', code: 1 }, { key: 'python-studio:draft', code: 'x'.repeat(64001) }, { key: 'python-working:' + 'x'.repeat(151), code: '' }]) assert.equal(readPythonMobileDraft(value), null);
  assert.equal(readPythonMobileDraft({ key: 'python-studio:draft', code: 'x'.repeat(64000) }).code.length, 64000);
});
