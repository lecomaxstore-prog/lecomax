const fs=require('fs'),path=require('path'),ts=require('../node_modules/typescript');
const root=path.resolve(__dirname,'../src');const mapping=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../out/localization/mapping.json'),'utf8'));
const files=fs.readdirSync(root,{recursive:true}).filter(f=>/\.tsx?$/.test(f)&&!f.startsWith('data')&&!f.startsWith('i18n')&&!/i18n\.ts|language-policy/.test(f));
const pending=[];let count=0;
for(const file of files){let code=fs.readFileSync(path.join(root,file),'utf8');const sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS),edits=[];
function add(n,text){edits.push({start:n.getStart(sf),end:n.end,text});}
function inFunction(n){for(let p=n.parent;p;p=p.parent)if(ts.isFunctionLike(p))return true;return false;}
function walk(n){
 if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n)||ts.isJsxText(n)){
  const value=ts.isJsxText(n)?n.text.replace(/\s+/g,' ').trim():n.text,key=mapping[value],p=n.parent;
  const forbidden=ts.isLiteralTypeNode(p)||ts.isImportDeclaration(p)||ts.isExportDeclaration(p)||(ts.isPropertyAssignment(p)&&p.name===n)||(ts.isBinaryExpression(p)&&['===','!==','==','!='].includes(p.operatorToken.getText(sf)))||ts.isElementAccessExpression(p);
  // These are persisted address data and support request subjects, not UI labels.
  const data=(file==='services\\addresses.ts'&&['Maroc','Adresse','Adresse principale'].includes(value))||(file==='app\\support.tsx'&&ts.isArrayLiteralExpression(p));
  if(key&&!forbidden&&!data){const expr=`msg(${JSON.stringify(key)})`;
   if(ts.isCallExpression(p)&&['tr','translate'].includes(p.expression.getText(sf))&&p.arguments.length===1){add(p,expr);return;}
   if(ts.isJsxText(n)){add(n,`{${expr}}`);return;}
   if(ts.isJsxAttribute(p)){add(n,`{${expr}}`);return;}
   if(!inFunction(n)&&ts.isPropertyAssignment(p)&&p.initializer===n){add(p,`get ${p.name.getText(sf)}() { return ${expr}; }`);return;}
   if(!inFunction(n))pending.push({file,line:sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1,text:value});
   add(n,expr);return;
  }
 }
 ts.forEachChild(n,walk);
}walk(sf);
if(!edits.length)continue;
let needsHook=false;
function hooks(n){
 if((ts.isFunctionDeclaration(n)||ts.isFunctionExpression(n)||ts.isArrowFunction(n))&&n.body&&ts.isBlock(n.body)){
  const name=n.name?.getText(sf)||(ts.isVariableDeclaration(n.parent)?n.parent.name.getText(sf):'');
  if(/^[A-Z]/.test(name)&&file.endsWith('tsx')){edits.push({start:n.body.getStart(sf)+1,end:n.body.getStart(sf)+1,text:'\n  useLocale();'});needsHook=true;}
 }
 ts.forEachChild(n,hooks);
}hooks(sf);
edits.sort((a,b)=>b.start-a.start);for(const e of edits)code=code.slice(0,e.start)+e.text+code.slice(e.end);
code=`import { msg${needsHook?', useLocale()':''} } from "@/i18n";\n`.replace('useLocale()','useLocale')+code;
fs.writeFileSync(path.join(root,file),code.replace(/^\uFEFF/,''));count++;
}
fs.writeFileSync(path.resolve(__dirname,'../out/localization/module-strings.json'),JSON.stringify(pending,null,2));console.log(count+' files migrated');console.log(JSON.stringify(pending,null,2));
