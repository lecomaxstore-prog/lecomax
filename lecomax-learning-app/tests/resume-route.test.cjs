const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../utils/resume-route.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: api, URL });
test('page restoration accepts app pages and excludes secret links and foreign URLs', () => {
  for (const path of ['/phone', '/teacher', '/lesson/intro', '/wellness/preferences', '/', '/practice', '/practice-lab', '/account']) assert.equal(api.savedResumeRoute(path), path);
  const file = api.resumeRoute('/file', { path: 'app/home.tsx', line: '101', token: 'private' });
  assert.equal(file, '/file?path=app%2Fhome.tsx&line=101');
  assert.equal(api.savedResumeRoute(file), file);
  assert.equal(api.resumeRoute('/phone', { pair: 'secret' }), null);
  assert.equal(api.resumeRoute('/phone', { invite: 'secret' }), null);
  assert.equal(api.savedResumeRoute('/phone?invite=secret'), null);
  for (const value of ['https://evil.example/phone', '//evil.example/phone', '/phone?pair=secret', '/phone?token=secret', '/unknown', '/phone#secret', '/lesson/../unknown']) assert.equal(api.savedResumeRoute(value), null);
});
