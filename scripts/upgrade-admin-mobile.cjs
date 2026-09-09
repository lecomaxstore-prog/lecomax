// One-time source migration: preserve JSX bodies and handlers verbatim.
const fs = require('node:fs');
const ts = require('typescript');
const tableRoutes = new Set(['customers','coupons','newsletter','loyalty','staff','mobile-app','client-data','analytics','size-guide','smart-assistant','ecomedia']);
for (const dir of fs.readdirSync('app/admin', { withFileTypes: true }).filter(x => x.isDirectory())) {
  const file = `app/admin/${dir.name}/page.tsx`;
  if (!fs.existsSync(file) || dir.name === 'how-it-was-built') continue;
  let source = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  let tables = false, sections = false;
  const add = (start, end, text) => edits.push({start,end,text});
  const sectionMarkers = dir.name === 'products' ? [
    ['{/* General info */}', 'Informations générales', true],
    ['{/* Colors */}', 'Couleurs et prix'], ['{/* Sizes */}', 'Tailles et stock par variante'],
    ['{/* Images */}', 'Images du produit'], ['{/* Status & Options */}', 'Visibilité'],
  ] : [];
  const sectionPositions = sectionMarkers.map(([marker,title,open]) => ({pos: source.indexOf('<div ', source.indexOf(marker)), title, open})).filter(x=>x.pos>=0);
  function visit(node) {
    if (ts.isJsxElement(node)) {
      const tag = node.openingElement.tagName;
      if (tag.getText(ast) === 'table' && tableRoutes.has(dir.name)) {
        add(tag.getStart(ast), tag.end, 'ResponsiveTable');
        add(node.closingElement.tagName.getStart(ast), node.closingElement.tagName.end, 'ResponsiveTable');
        tables = true;
      }
      const section = sectionPositions.find(x=>x.pos === node.getStart(ast));
      if (section) {
        add(node.getStart(ast), node.getStart(ast), `<MobileSection title="${section.title}"${section.open ? ' defaultOpen' : ''}>`);
        add(node.end, node.end, '</MobileSection>'); sections=true;
      }
      const attrs = node.openingElement.attributes.properties;
      const cls = attrs.find(a=>ts.isJsxAttribute(a)&&a.name.getText(ast)==='className');
      if (cls?.initializer && ts.isStringLiteral(cls.initializer) && cls.initializer.text.includes('fixed inset-0') && /bg-(?:black|neutral-900)/.test(cls.initializer.text)) {
        add(cls.initializer.getStart(ast)+1, cls.initializer.getStart(ast)+1, 'admin-dialog-overlay ');
      }
    }
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === 'input') {
      const attrs=node.attributes.properties;
      const type=attrs.find(a=>ts.isJsxAttribute(a)&&a.name.getText(ast)==='type');
      const mode=attrs.some(a=>ts.isJsxAttribute(a)&&a.name.getText(ast)==='inputMode');
      if (type?.initializer && ts.isStringLiteral(type.initializer) && !mode) {
        const value=type.initializer.text;
        if (['number','email','tel','url'].includes(value)) add(node.attributes.end,node.attributes.end,` inputMode="${value==='number'?'decimal':value}"`);
      }
    }
    ts.forEachChild(node,visit);
  }
  visit(ast);
  for(const edit of edits.sort((a,b)=>b.start-a.start)) source=source.slice(0,edit.start)+edit.text+source.slice(edit.end);
  if(tables) source=source.replace('"use client";', '"use client";\nimport ResponsiveTable from "@/components/admin/ResponsiveTable";');
  if(sections) source=source.replace('"use client";', '"use client";\nimport MobileSection from "@/components/admin/MobileSection";');
  if(edits.length) { fs.writeFileSync(file,source); console.log(`${dir.name}: ${edits.length} edits`); }
}
