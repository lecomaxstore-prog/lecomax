const fs=require('node:fs'),ts=require('typescript');
let file='app/admin/products/page.tsx',source=fs.readFileSync(file,'utf8');
const start=source.lastIndexOf('<DuplicateButton'),end=source.indexOf('</button>',start)+9;
source=source.slice(0,start)+'<ActionMenu label={"Autres actions pour " + p.name}>'+source.slice(start,end)+'</ActionMenu>'+source.slice(end);
fs.writeFileSync(file,source);
for(const route of ['products','promotions']){
 const file='app/admin/'+route+'/page.tsx';let source=fs.readFileSync(file,'utf8');
 const ast=ts.createSourceFile(file,source,99,true,4),edits=[];
 function visit(node){
  if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='div'){
   const attrs=node.openingElement.attributes.properties;
   const click=attrs.find(x=>x.name?.getText(ast)==='onClick')?.getText(ast)||'';
   const key=click.includes('setForm({ ...form, active:')?'active':click.includes('setForm({ ...form, featured:')?'featured':null;
   if(key)edits.push({p:node.openingElement.tagName.getStart(ast),e:node.openingElement.tagName.end,t:`button type="button" role="switch" aria-checked={form.${key}} aria-label="${key==='active'?'Actif':'Mis en avant'}"`},{p:node.closingElement.tagName.getStart(ast),e:node.closingElement.tagName.end,t:'button'});
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);for(const x of edits.sort((a,b)=>b.p-a.p))source=source.slice(0,x.p)+x.t+source.slice(x.e);
 fs.writeFileSync(file,source);
}
