const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { load, ts } = require('../scripts/inspect.cjs');
const { teacherBlocks } = load('lecomax-learning-app/utils/teacher-markdown.ts');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../utils/teacher-math.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText, { exports: exportsObject, require });
const { renderFormula } = exportsObject;

test('teacher separates supported math delimiters and preserves fenced source', () => {
  const blocks = teacherBlocks('Before \\(x^2\\) then $$y=2$$ and \\[z=3\\]\n```js\nconst price = "$$5$$";\n```');
  assert.equal(blocks.filter(b => b.kind === 'math').length, 3);
  assert.equal(blocks.at(-1).kind, 'code');
  assert.equal(blocks.at(-1).text, 'const price = "$$5$$";');
  assert.equal(teacherBlocks('Price $5 and $10')[0].kind, 'text');
});

test('formula produces real fractions and roots with bounded plain-text fallback', () => {
  const markup = renderFormula(String.raw`x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}`);
  assert.match(markup, /<mfrac>/);
  assert.match(markup, /<msqrt>/);
  assert.equal(renderFormula(''), null);
  assert.equal(renderFormula('x'.repeat(4001)), null);
  assert.equal(renderFormula(String.raw`\unknowncommand{x}`), null);
  const unsafe = renderFormula(String.raw`\href{javascript:alert(1)}{click}`);
  assert(!unsafe || !/<a\b|href=|<script/i.test(unsafe));
});
