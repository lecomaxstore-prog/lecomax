const ts = require("typescript");
const path = require("node:path");

// Source locations support the private learning workshop in every build.
// Only relative paths and line numbers are exposed, never file contents.
module.exports = function sourceInspectorLoader(source) {
  this.cacheable?.();
  const filename = path.relative(this.rootContext, this.resourcePath).replace(/\\/g, "/");
  if (!/^(app|components)\//.test(filename) || /^app\/(admin|api)\//.test(filename)) return source;
  const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const result = ts.transform(file, [context => root => {
    const visit = node => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(file);
        // Next Link/Image forward data attributes to their underlying DOM element.
        if (/^[a-z]/.test(tag) || ["Link", "Image"].includes(tag)) {
          const properties = node.attributes.properties;
          const names = new Set(properties.filter(ts.isJsxAttribute).map(item => item.name.getText(file)));
          const extra = [
            ["data-source-file", filename],
            ["data-source-line", String(file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1)],
          ].filter(([name]) => !names.has(name)).map(([name, value]) => ts.factory.createJsxAttribute(ts.factory.createIdentifier(name), ts.factory.createStringLiteral(value)));
          const attributes = ts.factory.updateJsxAttributes(node.attributes, [...properties, ...extra]);
          node = ts.isJsxOpeningElement(node)
            ? ts.factory.updateJsxOpeningElement(node, node.tagName, node.typeArguments, attributes)
            : ts.factory.updateJsxSelfClosingElement(node, node.tagName, node.typeArguments, attributes);
        }
      }
      return ts.visitEachChild(node, visit, context);
    };
    return ts.visitNode(root, visit);
  }]);
  try { return ts.createPrinter().printFile(result.transformed[0]); }
  finally { result.dispose(); }
};
