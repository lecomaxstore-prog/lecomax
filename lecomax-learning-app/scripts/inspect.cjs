const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('../../node_modules/typescript');
const root = path.resolve(__dirname, '../..');
const base = 'app/admin/how-it-was-built/';
function load(relative) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  if(relative.endsWith('.json')) return JSON.parse(source);
  const exports = {};
  const js = ts.transpileModule(source, {compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(js, {exports, require:(p)=>load(path.posix.normalize(path.posix.join(path.posix.dirname(relative),p))+(path.extname(p)?'':'.ts'))}, {timeout:5000});
  return exports;
}
if(require.main === module) {
  for(const folder of ['course','learning']) for(const name of fs.readdirSync(path.join(root,base,folder)).filter(x=>x.endsWith('.ts')&&!/progress|path|types|journey/.test(x))) {
    try { const data=load(base+folder+'/'+name); console.log(name, Object.fromEntries(Object.entries(data).filter(([,v])=>v&&typeof v==='object').map(([k,v])=>[k,{count:Array.isArray(v)?v.length:Object.keys(v).length,sample:Array.isArray(v)?Object.keys(v[0]||{}):Object.keys(Object.values(v)[0]||{})}]))); } catch(e) {console.log(name,e.message);}
  }
  const source=ts.createSourceFile('page.tsx',fs.readFileSync(path.join(root,base,'page.tsx'),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  console.log('Page data:', source.statements.filter(ts.isVariableStatement).flatMap(s=>s.declarationList.declarations.map(d=>d.name.getText(source))));
}
module.exports={load,root,base,ts};

