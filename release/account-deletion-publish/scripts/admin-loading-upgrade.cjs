const fs=require('node:fs'),ts=require('typescript');
for(const dir of fs.readdirSync('app/admin',{withFileTypes:true}).filter(d=>d.isDirectory())){
 const file=`app/admin/${dir.name}/page.tsx`;
 if(!fs.existsSync(file)||dir.name==='how-it-was-built')continue;
 let source=fs.readFileSync(file,'utf8');const ast=ts.createSourceFile(file,source,99,true,4),edits=[];let skeleton=false;
 function visit(node){
  if(ts.isConditionalExpression(node)&&node.condition.getText(ast)==='loading'){
   const yes=ts.isParenthesizedExpression(node.whenTrue)?node.whenTrue.expression:node.whenTrue;
   if(ts.isJsxElement(yes)&&yes.getText(ast).includes('animate-spin')&&!yes.getText(ast).includes('button')){
    edits.push({p:yes.getStart(ast),e:yes.end,t:'<AdminLoading />'});skeleton=true;
   }
  }
  if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(ast)==='img'&&!node.attributes.properties.some(a=>a.name?.getText(ast)==='loading'))edits.push({p:node.attributes.end,e:node.attributes.end,t:' loading="lazy" decoding="async"'});
  ts.forEachChild(node,visit);
 }
 visit(ast);if(!edits.length)continue;
 for(const x of edits.sort((a,b)=>b.p-a.p))source=source.slice(0,x.p)+x.t+source.slice(x.e);
 if(skeleton&&!source.includes('import AdminLoading'))source=source.replace('import ','import AdminLoading from "@/components/admin/AdminLoading";\nimport ');
 fs.writeFileSync(file,source);console.log(dir.name);
}
