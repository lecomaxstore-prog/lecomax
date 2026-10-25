// Run with PYTHON_EXECUTABLE set when Python is not on PATH.
const { rows } = require('./python-mastery.cjs');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'lecomax-python-'));
for (const row of rows) {
  let code = row.code + '\n' + row.solution;
  if (row.id === 'tests') code = row.code.replace('if __name__ == "__main__":', row.solution + '\n\nif __name__ == "__main__":');
  if (row.id === 'capstone') {
    fs.writeFileSync(path.join(folder, 'catalog_csv.py'), rows.find(r => r.id === 'csv').code);
    fs.writeFileSync(path.join(folder, 'report.py'), row.code);
    code = row.solution;
  }
  const filename = path.join(folder, 'verify_' + row.id + '.py');
  fs.writeFileSync(filename, code);
  const result = spawnSync(process.env.PYTHON_EXECUTABLE || 'python', [filename], { encoding: 'utf8', cwd: folder });
  assert.equal(result.status, 0, `${row.id}: ${result.error || result.stderr}`);
  console.log(`PASS ${row.id}: runnable example and exercise solution`);
}
