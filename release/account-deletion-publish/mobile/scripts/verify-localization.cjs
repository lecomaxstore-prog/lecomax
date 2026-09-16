const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('../node_modules/typescript');
const root = path.resolve(__dirname, '../src');
const catalogs = {};
const failures = [];
for (const language of ['fr', 'en']) {
  const text = fs.readFileSync(path.join(root, `i18n/locales/${language}.json`), 'utf8');
  const parsed = ts.parseJsonText(language + '.json', text);
  const keys = [];
  function visit(node) { if (ts.isPropertyAssignment(node)) keys.push(node.name.text); ts.forEachChild(node, visit); }
  visit(parsed);
  if (new Set(keys).size !== keys.length) failures.push(`${language}: duplicate keys`);
  catalogs[language] = JSON.parse(text);
}
const { fr, en } = catalogs;
for (const key of new Set([...Object.keys(fr), ...Object.keys(en)])) {
  if (!(key in fr) || !(key in en)) failures.push(`Missing counterpart: ${key}`);
  const params = value => [...(value ?? '').matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]).sort();
  try { assert.deepEqual(params(fr[key]), params(en[key])); } catch { failures.push(`Interpolation mismatch: ${key}`); }
  if (/Ã.|â€|Â |�/.test(fr[key] + en[key])) failures.push(`Encoding: ${key}`);
}
const referenced = new Set(), dynamic = [], literals = [], frozen = [];
const files = fs.readdirSync(root, { recursive: true }).filter(f => /\.(tsx?|jsx?|json)$/.test(f));
for (const file of files) {
  if (file.endsWith('.json')) continue;
  const sf = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), 99, true, /[jt]sx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const location = n => `${file}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`;
  function visit(n) {
    if (ts.isCallExpression(n) && ['msg', 'translate'].includes(n.expression.getText(sf))) {
      const arg = n.arguments[n.expression.getText(sf) === 'translate' ? 1 : 0];
      if (arg && ts.isStringLiteral(arg)) {
        referenced.add(arg.text);
        if (!(arg.text in fr)) failures.push(`Unknown key: ${arg.text} (${location(n)})`);
      } else dynamic.push(location(n));
      let ancestor = n.parent;
      while (ancestor && !ts.isFunctionLike(ancestor) && !ts.isSourceFile(ancestor)) ancestor = ancestor.parent;
      if (ancestor && ts.isSourceFile(ancestor)) frozen.push({ at: location(n), text: n.getText(sf) });
    }
    if (!file.startsWith('i18n') && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isJsxText(n))) {
      const value = n.text.trim();
      if (value && /[a-zA-ZÀ-ÿ]/.test(value) && !ts.isImportDeclaration(n.parent) && !/^(#|https?:|@\/)/.test(value)) literals.push({ at: location(n), value, context: n.parent.getText(sf).slice(0, 170) });
    }
    ts.forEachChild(n, visit);
  }
  visit(sf);
  if (file === path.join('i18n', 'legacy-keys.ts')) for (const match of sf.text.matchAll(/"(common\.[^"]+)"/g)) referenced.add(match[1]);
}
const unused = Object.keys(fr).filter(key => !referenced.has(key) && !(/_(one|other|many)$/.test(key) && referenced.has(key.replace(/_(one|other|many)$/, ''))));
const report = { filesScanned: files.length, keysPerLanguage: Object.keys(fr).length, failures, dynamic, potentiallyUnused: unused, frozen, literals };
const out = path.resolve(__dirname, '../out/localization');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ filesScanned: files.length, keysPerLanguage: report.keysPerLanguage, failures, dynamic, potentiallyUnused: unused, frozen }, null, 2));
if (failures.length) process.exitCode = 1;
