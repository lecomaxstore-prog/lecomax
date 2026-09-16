const fs=require('fs'),path=require('path'),ts=require('../node_modules/typescript');
const root=path.resolve(__dirname,'../src');
const files=fs.readdirSync(root,{recursive:true}).filter(f=>/\.(tsx?|json)$/.test(f)&&!f.startsWith('data')&&!/ui-en|i18n|language-policy/.test(f)&&!f.endsWith('.json'));
const items=new Map();
for(const file of files){const sf=ts.createSourceFile(file,fs.readFileSync(path.join(root,file),'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);function walk(n){
 if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n)||ts.isJsxText(n)){
  const value=ts.isJsxText(n)?n.text.replace(/\s+/g,' ').trim():n.text;
  const p=n.parent;const attr=ts.isJsxAttribute(p)?p.name.getText(sf):'';
  const skip=ts.isImportDeclaration(p)||ts.isExportDeclaration(p)||ts.isLiteralTypeNode(p)||ts.isPropertyAssignment(p)&&p.name===n||ts.isBinaryExpression(p)&&['===','!==','==','!='].includes(p.operatorToken.getText(sf));
  if(!skip&&value&&/[a-zA-ZÀ-ÿ]/.test(value)&&(/[À-ÿ\s]/.test(value)||/^[A-Z][a-zA-Z]{2,}$/.test(value))&&!/^(https?:|@\/|#|rgba?\(|\/?[\w/-]+\.(png|webp|jpg)|\^)/.test(value)&&!['className','name','key','testID','nativeID','href','type','autoComplete','textContentType','keyboardType','returnKeyType','accessibilityRole'].includes(attr)&&!/(?:flex-|text-|bg-|items-|justify-|rounded-|font-|padding|margin)/.test(value)){
   const entry=items.get(value)||{text:value,uses:[]};entry.uses.push({file,line:sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1,context:p.getText(sf).slice(0,140)});items.set(value,entry);
  }
 }
 ts.forEachChild(n,walk);
}walk(sf);}
fs.mkdirSync(path.resolve(__dirname,'../out/localization'),{recursive:true});fs.writeFileSync(path.resolve(__dirname,'../out/localization/strings.json'),JSON.stringify([...items.values()],null,2));
console.log(items.size+' candidate strings');
console.log([...items.values()].slice(0,150).map((x,i)=>i+' '+JSON.stringify(x.text)).join('\n'));
