const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {root,base,load,ts}=require('./inspect.cjs');
function constants(relative) {
 const text=fs.readFileSync(path.join(root,relative),'utf8');
 const ast=ts.createSourceFile(relative,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const context=vm.createContext({}); const result={};
 for(const statement of ast.statements.filter(ts.isVariableStatement)) for(const d of statement.declarationList.declarations) {
  if(!d.initializer || !ts.isIdentifier(d.name)) continue;
  const name=d.name.text;
  try {const js=ts.transpileModule(`var ${name} = ${d.initializer.getText(ast)};`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
   vm.runInContext(js,context,{timeout:500});
   if(context[name] && typeof context[name]==='object') result[name]=JSON.parse(JSON.stringify(context[name]));
  } catch { /* UI components and closures are not data sources. */ }
 }
 function visit(node,scope='') {
  if(ts.isFunctionDeclaration(node)&&node.name) scope=node.name.text;
  if(scope&&ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.initializer){
   try { const js=ts.transpileModule('('+node.initializer.getText(ast)+')',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
    const value=vm.runInContext(js,context,{timeout:500});
    if(value&&typeof value==='object'&&Object.keys(value).length) result[scope+'_'+node.name.text]=JSON.parse(JSON.stringify(value));
   }catch{}
  }
  ts.forEachChild(node,child=>visit(child,scope));
 }
 visit(ast);
 return result;
}
const datasets={};
for(const folder of ['course','learning']) for(const f of fs.readdirSync(path.join(root,base,folder)).filter(x=>x.endsWith('.ts')&&!/progress|types/.test(x))) {
 const relative=base+folder+'/'+f;
 try {datasets[relative]=JSON.parse(JSON.stringify(load(relative)));} catch(e) {throw new Error(relative+': '+e.message);}
}
for(const f of ['page.tsx','CodeCoachGame.tsx','FirstShopLab.tsx','CodingTutor.tsx','SourceLearningPaths.tsx','SourceMap.tsx']) datasets[base+f]=constants(base+f);
{
 const text=fs.readFileSync(path.join(root,base,'CodeCoachGame.tsx'),'utf8');
 const ast=ts.createSourceFile('game.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const nodes=ast.statements.filter(s=>!ts.isImportDeclaration(s)&&s.getStart(ast)<text.indexOf('export default function CodeCoachGame'));
 const js=ts.transpileModule(nodes.map(s=>s.getText(ast)).join('\n')+'\nexports.levels=LEVELS;', {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const exports={}; vm.runInNewContext(js,{exports},{timeout:5000});
 datasets[base+'CodeCoachGame.tsx'].LEVELS=exports.levels;
}
for(const f of ['lib/micro-learning-curriculum.ts','lib/ai-tutor-course.ts','lib/source-code-guide.ts','lib/source-connections.ts']) {
 try {datasets[f]=JSON.parse(JSON.stringify(load(f)));}catch {datasets[f]=constants(f);}
}
const manifest=JSON.parse(fs.readFileSync(path.join(root,base,'course/generated/manifest.json'),'utf8'));
const report={version:1,academy:manifest, sources:Object.entries(datasets).map(([file,data])=>({file,exports:Object.fromEntries(Object.entries(data).map(([key,value])=>[key,Array.isArray(value)?value.length:typeof value==='object'&&value?Object.keys(value).length:typeof value]))}))};
fs.mkdirSync(path.join(root,'lecomax-learning-app/docs'),{recursive:true});
fs.writeFileSync(path.join(root,'lecomax-learning-app/docs/inventory.json'),JSON.stringify(report,null,2));
if(require.main===module) console.log(JSON.stringify(report.sources,null,2));
module.exports={datasets,constants};
