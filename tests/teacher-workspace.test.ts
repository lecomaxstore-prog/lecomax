import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { saveTeacherWorkspace } from '../lib/teacher-workspace.ts';
import { validWebFiles } from '../lib/teacher-web-files.ts';

test('server workspace validation accepts only the bounded three-file contract', () => {
  assert.equal(validWebFiles({ html: '', css: '', javascript: '' }), true);
  assert.equal(validWebFiles({ html: 'x'.repeat(20000), css: '', javascript: '' }), true);
  for (const value of [null, [], {}, { html: '', css: '' }, { html: 5, css: '', javascript: '' },
    { html: '', css: '', javascript: '', extra: '' }, { html: 'x'.repeat(20001), css: '', javascript: '' }]) {
    assert.equal(validWebFiles(value), false);
  }
});
test('VS Code export creates separate complete projects and preserves older copies', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'lecomax-export-test-'));
  const files = { html: '<h1>My page</h1>', css: 'h1 { color: green; }', javascript: 'console.log("ready")' };
  const first = await saveTeacherWorkspace(files, root);
  const second = await saveTeacherWorkspace({ ...files, html: '<h1>Changed</h1>' }, root);
  assert.notEqual(first.directory, second.directory);
  assert(first.directory.startsWith(root + path.sep));
  assert.match(await readFile(path.join(first.directory, 'index.html'), 'utf8'), /My page/);
  assert.match(await readFile(path.join(first.directory, 'index.html'), 'utf8'), /style.css/);
  assert.equal(await readFile(path.join(first.directory, 'script.js'), 'utf8'), files.javascript);
  assert.deepEqual((await readdir(first.directory)).sort(), ['README.md', 'index.html', 'script.js', 'style.css']);
  assert.equal(new URL(first.vscodeUrl).protocol, 'vscode:');
  assert.equal(decodeURIComponent(new URL(first.vscodeUrl).pathname).slice(1), first.directory.replace(/\\/g, '/'));
  await assert.rejects(saveTeacherWorkspace({ ...files, html: 'x'.repeat(20001) }, root), /INVALID_INPUT/);
});
