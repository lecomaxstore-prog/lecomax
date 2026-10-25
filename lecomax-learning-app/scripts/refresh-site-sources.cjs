const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { ts, load, root } = require('./inspect.cjs');
const data = path.join(__dirname, '../data');

function analyze(file, content) {
  const ast = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const line = position => ast.getLineAndCharacterOfPosition(position).line + 1;
  const range = node => ({ start: line(node.getStart(ast)), end: line(node.getEnd()) });
  const scopes = node => { const result = []; for (let parent = node.parent; parent; parent = parent.parent) if (ts.isFunctionLike(parent)) result.push(parent.getStart(ast)); return result; };
  const elements = [], definitions = [];
  const calls = node => {
    const names = new Set();
    const visit = child => { if (ts.isCallExpression(child)) names.add(child.expression.getText(ast)); ts.forEachChild(child, visit); };
    visit(node); return [...names].slice(0, 12);
  };
  const visit = node => {
    if (ts.isFunctionDeclaration(node) && node.name) definitions.push({ name: node.name.text, kind: 'function', scope: scopes(node)[0] ?? -1, ...range(node) });
    if (ts.isVariableDeclaration(node)) {
      if (ts.isIdentifier(node.name) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) definitions.push({ name: node.name.text, kind: 'function', scope: scopes(node)[0] ?? -1, ...range(node) });
      if (ts.isArrayBindingPattern(node.name) && node.initializer && ts.isCallExpression(node.initializer) && /^(React\.)?useState$/.test(node.initializer.expression.getText(ast))) {
        const [state, setter] = node.name.elements;
        if (state && setter) definitions.push({ name: setter.getText(ast), state: state.getText(ast), initial: node.initializer.arguments[0]?.getText(ast) || '', kind: 'state', scope: scopes(node)[0] ?? -1, ...range(node) });
      }
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const attributes = {}, events = [];
      for (const attr of node.attributes.properties) {
        if (!ts.isJsxAttribute(attr)) continue;
        const name = attr.name.getText(ast), value = attr.initializer;
        if (value && ts.isStringLiteral(value)) attributes[name] = value.text;
        if (value && ts.isJsxExpression(value) && value.expression) {
          if (ts.isStringLiteral(value.expression)) attributes[name] = value.expression.text;
          if (/^on[A-Z]/.test(name)) events.push({ name, code: value.expression.getText(ast).slice(0, 1800), ...range(attr), calls: calls(value.expression) });
        }
      }
      const parent = node.parent;
      const label = ts.isJsxElement(parent) ? parent.children.filter(ts.isJsxText).map(child => child.text.trim()).filter(Boolean).join(' ').slice(0, 120) : '';
      elements.push({ tag: node.tagName.getText(ast), scopes: scopes(node), ...range(node), attributes, label, events });
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return { elements, definitions };
}

async function refresh() {
  const { collectSourceLibrary } = await import(pathToFileURL(path.join(root, 'scripts/source-library.mjs')));
  const library = await collectSourceLibrary(root);
  const guide = load('lib/source-code-guide.ts');
  const files = library.files.filter(f => (/^(app|components|lib|supabase)\//.test(f.path) || !f.path.includes('/')) && !f.path.startsWith('app/admin/how-it-was-built/') && !f.path.includes('/generated/') && !f.path.includes('content/'));
  const project = [], sources = [], catalog = {};
  const preview = JSON.parse(fs.readFileSync(path.join(data, 'site-pages.json'), 'utf8'));
  const visible = new Set(Object.values(preview.pages).flatMap(page => page.files));
  for (const file of files) {
    const hash = crypto.createHash('sha256').update(file.content).digest('hex');
    fs.writeFileSync(path.join(data, 'source', hash + '.json'), JSON.stringify({ content: file.content }));
    sources.push(`${JSON.stringify(file.path)}:()=>require('./source/${hash}.json')`);
    const imports = [...file.content.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)].map(match => match[1]);
    project.push({ path: file.path, hash, lines: file.lines, imports, importedBy: [], description: Object.fromEntries(['fr', 'en', 'ar'].map(lang => [lang, guide.describeSourceFile(file.path, lang)])), route: /\/(page|route)\.tsx?$/.test(file.path) ? '/' + file.path.replace(/^app\//, '').replace(/\/?(page|route)\.tsx?$/, '') : null });
    if (visible.has(file.path)) catalog[file.path] = { hash, ...analyze(file.path, file.content) };
  }
  const paths = new Set(project.map(file => file.path));
  for (const file of project) for (const imp of file.imports) {
    const base = imp.startsWith('@/') ? imp.slice(2) : imp.startsWith('.') ? path.posix.normalize(path.posix.join(path.posix.dirname(file.path), imp)) : '';
    const target = [base, base + '.ts', base + '.tsx', base + '/index.ts', base + '/index.tsx'].find(value => paths.has(value));
    if (target) project.find(file => file.path === target).importedBy.push(file.path);
  }
  const loaders = fs.readFileSync(path.join(data, 'loaders.ts'), 'utf8');
  const boundary = loaders.indexOf('export const sources:');
  if (boundary < 0) throw Error('Source loader boundary missing');
  fs.writeFileSync(path.join(data, 'loaders.ts'), loaders.slice(0, boundary) + `export const sources:Record<string,()=>{content:string}>={${sources.join(',')}};\n`);
  fs.writeFileSync(path.join(data, 'project.json'), JSON.stringify(project));
  fs.writeFileSync(path.join(data, 'site-source-map.json'), JSON.stringify({ capturedAt: library.generatedAt, fileCount: project.length, files: catalog }));
  console.log(`Saved ${project.length} real source files; indexed ${Object.keys(catalog).length} visible source files and ${Object.values(catalog).reduce((sum, file) => sum + file.elements.length, 0)} elements.`);
}
module.exports = { analyze };
if (require.main === module) refresh().catch(error => { console.error(error); process.exitCode = 1; });
