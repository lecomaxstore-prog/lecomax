const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { load } = require('../scripts/inspect.cjs');
const { archiveReports, readReports, readArchive, mergeReports, serializeHistory } = load('lecomax-learning-app/utils/change-history.ts');
const report = (id = 'first-report') => ({ id, createdAt: '2026-10-09T12:00:00.000Z', title: 'History update', summary: 'Visible history', status: 'needs-testing', pages: ['Home'], components: ['ChangesMade'], files: ['components/ChangeHistory.tsx'], changes: [{ kind: 'added', detail: 'Persistent history' }], validation: [{ name: 'Device', result: 'not-run', detail: 'Pending' }] });

test('archive survives restarts and older bundles without dropping records', async () => {
  let raw = null;
  const storage = { getItem: async () => raw, setItem: async (_key, value) => { raw = value; } };
  await archiveReports(storage, [report()]);
  await archiveReports(storage, [report('second-report')]);
  const restarted = await archiveReports(storage, [report()]);
  assert.equal(restarted.length, 2);
  assert.equal(readArchive(raw).length, 2);
  assert.equal(mergeReports(restarted, restarted).length, 2);
});

test('corrupt and conflicting archives are preserved; failed writes can be retried', async () => {
  let raw = '{broken';
  let writes = 0;
  let fail = false;
  const storage = { getItem: async () => raw, setItem: async (_key, value) => { writes++; if (fail) throw Error('offline'); raw = value; } };
  await assert.rejects(archiveReports(storage, [report()]));
  assert.equal(raw, '{broken');
  assert.equal(writes, 0);
  raw = serializeHistory([report()]);
  await assert.rejects(archiveReports(storage, [{ ...report(), title: 'Overwrite' }]));
  assert.equal(writes, 0);
  fail = true;
  await assert.rejects(archiveReports(storage, [report('new-report')]));
  assert.equal(readArchive(raw).length, 1);
  fail = false;
  await archiveReports(storage, [report('new-report')]);
  assert.equal(readArchive(raw).length, 2);
});

test('invalid previews, duplicate IDs and contradictory statuses are rejected', () => {
  assert.throws(() => readReports([report(), report()]));
  for (const previewPath of ['https://example.com', '//example.com', '/route?x=1', 'javascript:alert(1)']) {
    assert.throws(() => readReports([{ ...report(), preview: { path: previewPath, label: 'Preview', verifiedAt: report().createdAt } }]));
  }
  assert.throws(() => readReports([{ ...report(), status: 'successful', validation: [{ name: 'Check', result: 'failed', detail: 'Error' }] }]));
});

test('append CLI preserves previous reports and refuses missing or edited source records', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'lecomax-history-'));
  const fixture = path.join(temporary, 'app');
  try {
    fs.mkdirSync(path.join(fixture, 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(fixture, 'data'));
    fs.copyFileSync(path.join(__dirname, '../scripts/change-report.cjs'), path.join(fixture, 'scripts/change-report.cjs'));
    fs.writeFileSync(path.join(fixture, 'scripts/inspect.cjs'), 'module.exports = require(' + JSON.stringify(require.resolve('../scripts/inspect.cjs')) + ');');
    fs.writeFileSync(path.join(fixture, 'data/change-history.json'), '[]');
    const input = path.join(temporary, 'report.json');
    const run = (...args) => spawnSync(process.execPath, [path.join(fixture, 'scripts/change-report.cjs'), ...args], { encoding: 'utf8', windowsHide: true });
    fs.writeFileSync(input, JSON.stringify(report()));
    assert.equal(run('--append', input).status, 0);
    assert.equal(run('--append', input).status, 1);
    fs.writeFileSync(input, JSON.stringify({ ...report('second-report'), relatedId: 'first-report' }));
    assert.equal(run('--append', input).status, 0);
    assert.equal(run('--check').status, 0);
    const manifest = fs.readFileSync(path.join(fixture, 'data/change-history.json'), 'utf8');
    const source = path.join(fixture, 'changes/first-report.json');
    fs.writeFileSync(source, JSON.stringify({ ...report(), title: 'Edited' }));
    assert.equal(run('--rebuild').status, 1);
    assert.equal(fs.readFileSync(path.join(fixture, 'data/change-history.json'), 'utf8'), manifest);
    fs.unlinkSync(source);
    assert.equal(run('--rebuild').status, 1);
    assert.equal(run('--append', input).status, 1);
    assert.equal(fs.readFileSync(path.join(fixture, 'data/change-history.json'), 'utf8'), manifest);
  } finally {
    // The absolute target is the unique directory returned by mkdtemp under os.tmpdir().
    assert.equal(path.dirname(temporary), path.resolve(os.tmpdir()));
    assert.match(path.basename(temporary), /^lecomax-history-/);
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
