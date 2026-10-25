const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const root = path.resolve(__dirname, '..');
const files = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(path.join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(dir, e.name)] : []);
const routeFiles = files(path.join(root, 'app')).filter(f => !/_[^/\\]+\.tsx$/.test(f));
const routes = routeFiles.map(f => '/' + path.relative(path.join(root, 'app'), f).replaceAll('\\', '/').replace(/\.tsx?$/, '').replace(/\([^/]+\)\//g, '').replace(/(^|\/)index$/, ''));
const valid = route => routes.includes(route) || routes.some(r => new RegExp('^' + r.replace(/\[([^\]]+)\]/g, '[^/]+') + '$').test(route));
const controls = [], navigation = [];
for (const file of ['app', 'components', 'features'].flatMap(dir => files(path.join(root, dir)))) {
  const source = fs.readFileSync(file, 'utf8'); const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = node => {
    const at = { file: path.relative(root, file).replaceAll('\\', '/'), line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1 };
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const component = node.tagName.getText(ast);
      if (/^(Button|IconButton|ToolCard|ListItem|Pressable|TouchableOpacity)$/.test(component)) {
        const attrs = node.attributes.properties.filter(ts.isJsxAttribute);
        const attr = name => attrs.find(a => a.name.getText(ast) === name);
        controls.push({ ...at, component, label: (attr('title') || attr('label') || attr('accessibilityLabel'))?.initializer?.getText(ast).slice(0, 250) || '(child/dynamic label)', hasHandler: !!attr('onPress'), spreadProps: node.attributes.properties.some(ts.isJsxSpreadAttribute) });
      }
    }
    if (ts.isCallExpression(node) && /^router\.(push|replace|navigate)$/.test(node.expression.getText(ast))) {
      const arg = node.arguments[0]; let target;
      if (arg && ts.isStringLiteral(arg)) target = arg.text;
      else if (arg && ts.isObjectLiteralExpression(arg)) { const p = arg.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText(ast) === 'pathname'); if (p && ts.isStringLiteral(p.initializer)) target = p.initializer.text; }
      navigation.push({ ...at, target: target || '(dynamic)', status: !target ? 'requires interaction check' : valid(target.replace(/\/\([^/]+\)/g, '') || '/') ? 'route exists' : 'inspect' });
    }
    ts.forEachChild(node, visit);
  }; visit(ast);
}
const report = { createdAt: new Date().toISOString(), scope: 'Static inventory of all app/components/features TSX controls and router destinations. Existence and handlers are not proof of runtime behavior.', routeCount: routes.length, controlCount: controls.length, missingHandlers: controls.filter(c => !c.hasHandler && !c.spreadProps), unresolved: navigation.filter(n => n.status === 'inspect'), controls, navigation };
fs.writeFileSync(path.join(root, 'artifacts/universe-control-audit.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ routes: routes.length, controls: controls.length, missingHandlers: report.missingHandlers, unresolved: report.unresolved }, null, 2));
