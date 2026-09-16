import { readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';
// Remove superseded literal defaults using their exact keys.
let path='app/admin/settings/page.tsx', text=readFileSync(path,'utf8');
for(const key of ['store_name','store_email','store_phone','store_address','store_city','currency','whatsapp_number','free_shipping_threshold','shipping_cost','shipping_estimated_days','checkout_minimum_order','maintenance_mode']) {
  text=text.replace(new RegExp('^  '+key+':.*\\n','m'),'');
}
writeFileSync(path,text);
path='mobile/src/lib/product-variant-pricing.ts';
writeFileSync(path,'export { colorPricesFromTags } from "../../../lib/product-variant-pricing";\n');
for(const [path,component] of [['app/admin/products/page.tsx','ProductsPage'],['app/admin/layout.tsx','AdminLayout']]) {
  let text=readFileSync(path,'utf8');
  text=text.replace('"use client";','"use client";\nimport { useSettings as useCentralSettings } from "@/lib/use-settings";\nimport { storeSettings as centralStoreSettings } from "@/lib/store-settings";');
  const ast=ts.createSourceFile(path,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.modifiers?.some(m=>m.kind===ts.SyntaxKind.DefaultKeyword));
  if(!fn?.body) throw new Error('Default component missing '+path);
  const pos=fn.body.getStart(ast)+1;
  text=text.slice(0,pos)+'\n  const lowStockThreshold = Number(centralStoreSettings(useCentralSettings()).low_stock_threshold);'+text.slice(pos);
  text=text.replaceAll('product.stock <= 5','product.stock <= lowStockThreshold').replaceAll('p.stock <= 5','p.stock <= lowStockThreshold').replaceAll('p.stock <= 3','p.stock <= lowStockThreshold');
  text=text.replace('detail: "5 unités ou moins"','detail: `${lowStockThreshold} unités ou moins`');
  text=text.replace('}, [pathname]);','}, [pathname, lowStockThreshold]);');
  writeFileSync(path,text);
}
path='app/admin/stock/page.tsx';text=readFileSync(path,'utf8');
text=text.replace('import Link from', 'import { useSettings } from "@/lib/use-settings";\nimport { storeSettings } from "@/lib/store-settings";\nimport Link from');
text=text.replace('  const [threshold, setThreshold] = useState(5);\n  const [thresholdReady, setThresholdReady] = useState(false);','  const threshold = Number(storeSettings(useSettings()).low_stock_threshold);');
const a=text.indexOf('  useEffect(() => {\n    const saved = Number(localStorage'), b=text.indexOf('  const showToast',a);
if(a<0||b<0) throw new Error('Stock anchors missing');
text=text.slice(0,a)+text.slice(b);
text=text.replace(/<input[^>]*value=\{threshold\}[^>]*onChange=\{.*?\}\s*\/>/,'<span>{threshold} · <Link href="/admin/settings">Modifier dans les paramètres</Link></span>');
writeFileSync(path,text);
