import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {blankEditorial, editorialDraftKey, parseLocalEditorialDraft} from '../lib/seo-editorial.ts';
import {assessEditorial} from '../operations/seo-vercel/lib/seo-editorial-quality.mjs';
import {shoeFixture} from '../operations/seo-vercel/tests/editorial-quality-fixtures.mjs';
const {source,draft}=shoeFixture();
const initial={version:7,revision:2,source,head:{content:draft},published:null,revisions:[],events:[],canEdit:true,canPublish:true};
const flush=()=>new Promise(done=>setImmediate(done));
function fixture(state:any=initial, storage:any={getItem:()=>null,setItem(){},removeItem(){}}, id='one', confirm=()=>true){
  const slots:any[]=[],pending:{url:string;init:any;resolve:(value:any)=>void}[]=[],effects:(()=>any)[]=[];
  let cursor=0,changed=0;const exports:any={};
  const hooks={
    useState(value:any){const index=cursor++;if(!(index in slots))slots[index]=typeof value==='function'?value():value;return [slots[index],(next:any)=>{slots[index]=typeof next==='function'?next(slots[index]):next;}];},
    useRef(value:any){const index=cursor++;return slots[index]??={current:value};},
    useCallback(fn:any){return fn;},useEffect(fn:any){effects.push(fn);},
  };
  const jsx=(type:any,props:any,key:any)=>({type,props,key});
  const mocks:Record<string,any>={react:hooks,'react/jsx-runtime':{jsx,jsxs:jsx},'@/lib/seo-editorial':{blankEditorial,editorialDraftKey,parseLocalEditorialDraft},'@/operations/seo-vercel/lib/seo-editorial-quality.mjs':{assessEditorial},'./seo.module.css':{default:{}}};
  new Function('exports','require','fetch','window',ts.transpileModule(readFileSync('app/admin/seo/EditorialWorkspace.tsx','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(exports,(name:string)=>{assert.ok(name in mocks,name);return mocks[name];},(url:string,init:any)=>new Promise(resolve=>pending.push({url,init,resolve})),{sessionStorage:storage,confirm,addEventListener(){},removeEventListener(){}});
  const render=()=>{cursor=0;effects.length=0;return exports.default({id,onChanged(){changed++;}});};
  const nodes=(v:any):any[]=>!v||typeof v!=='object'?[]:Array.isArray(v)?v.flatMap(nodes):[v,...nodes(v.props?.children)];
  const text=(v:any):string=>v===null||v===undefined?'':typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(text).join(''):text(v.props?.children);
  const all=()=>nodes(render());
  const button=(label:string)=>all().find(n=>n.type==='button'&&text(n).includes(label));
  const input=(label:string)=>{const node=all().find(n=>n.type==='label'&&text(n).includes(label));return nodes(node).find(n=>['textarea','input'].includes(n.type));};
  async function respond(index:number,value:any,status=200){pending[index].resolve({ok:status<400,json:async()=>value});await flush();}
  render();const cleanup=effects[0]();
  const ready=async()=>{await respond(0,state);};
  return {all,button,input,pending,respond,ready,cleanup,text:()=>text(render()),changed:()=>changed};
}

test('bilingual fields retain Arabic RTL; dirty edits cannot be reviewed or published',async()=>{
  const f=fixture({...initial,events:[{id:'1',revision:2,action:'approved'}]});await f.ready();
  assert.ok(f.all().some(n=>n.props?.lang==='ar'&&n.props.dir==='rtl'));
  assert.equal(f.input('Titre (ar)').props.value,draft.ar.title);
  f.input('Notes et motif').props.onChange({target:{value:'Source and languages checked.'}});
  assert.equal(f.button('Publier la révision').props.disabled,false);
  f.input('Titre (fr)').props.onChange({target:{value:'Correction locale française'}});
  assert.equal(f.button('Publier la révision').props.disabled,true);
  assert.equal(f.button('Approuver cette révision').props.disabled,true);
  f.button('Enregistrer une nouvelle').props.onClick();
  const body=JSON.parse(f.pending[1].init.body);
  assert.equal(body.version,7);assert.equal(body.revision,2);assert.equal(body.content.fr.title,'Correction locale française');assert.equal(body.content.ar.title,draft.ar.title);
});

test('tab recovery isolates products/accounts and retains stale editing base until explicit merge',async()=>{
  const values=new Map<string,string>();const storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)};
  const state={...initial,draftScope:'editor@example.invalid'};
  const f=fixture(state,storage);await f.ready();
  f.input('Titre (fr)').props.onChange({target:{value:'Texte local\nà récupérer'}});
  f.input('Notes et motif').props.onChange({target:{value:'Notes locales à récupérer'}});
  f.cleanup();
  const other=fixture(state,storage,'two');await other.ready();assert.equal(other.input('Titre (fr)').props.value,draft.fr.title);
  const account=fixture({...state,draftScope:'another@example.invalid'},storage);await account.ready();assert.equal(account.input('Titre (fr)').props.value,draft.fr.title);
  const revoked=fixture({...state,canEdit:false},storage);await revoked.ready();assert.equal(revoked.input('Titre (fr)').props.value,draft.fr.title);
  const restored=fixture({...state,version:12,revision:6},storage);await restored.ready();
  assert.equal(restored.input('Titre (fr)').props.value,'Texte local\nà récupérer');assert.match(restored.text(),/Version serveur 12/);
  assert.equal(restored.input('Notes et motif').props.value,'Notes locales à récupérer');
  restored.button('Enregistrer une nouvelle').props.onClick();assert.equal(JSON.parse(restored.pending[1].init.body).version,7);
  await restored.respond(1,{error:'conflict'},409);assert.equal(values.size,1);
  restored.button('Charger le texte serveur').props.onClick();assert.equal(values.size,0);assert.equal(restored.input('Titre (fr)').props.value,draft.fr.title);
});

test('storage failure is visible and failed save retains recovery while success clears it',async()=>{
  const broken=fixture({...initial,draftScope:'editor'}, {getItem:()=>null,setItem(){throw Error('quota');}});await broken.ready();
  broken.input('Titre (fr)').props.onChange({target:{value:'Texte conservé'}});assert.match(broken.text(),/Copie locale indisponible/);
  const values=new Map<string,string>();const storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)};
  const f=fixture({...initial,draftScope:'editor'},storage);await f.ready();f.input('Titre (fr)').props.onChange({target:{value:'Correction'}});
  f.input('Notes et motif').props.onChange({target:{value:'Enregistrer cette correction'}});
  f.button('Enregistrer une nouvelle').props.onClick();await f.respond(1,{error:'offline'},503);assert.equal(values.size,1);
  f.button('Enregistrer une nouvelle').props.onClick();await f.respond(2,{...initial,version:8,revision:3,draftScope:'editor'});assert.equal(values.size,0);
  for(const raw of ['{','null','{}',JSON.stringify({base:{version:7,revision:2,source},content:{},notes:''})])assert.equal(parseLocalEditorialDraft(raw),null);
});
test('conflicts preserve local text and comparison never silently upgrades its base version',async()=>{
  const f=fixture();await f.ready();
  f.input('Titre (fr)').props.onChange({target:{value:'Mon texte à conserver'}});
  f.input('Notes et motif').props.onChange({target:{value:'Manual conflict resolution.'}});
  f.button('Enregistrer une nouvelle').props.onClick();await f.respond(1,{error:'Conflit détecté'},409);
  assert.equal(f.input('Titre (fr)').props.value,'Mon texte à conserver');assert.match(f.text(),/Conflit détecté/);
  f.button('Comparer avec').props.onClick();await f.respond(2,{...initial,version:9,revision:3});
  assert.equal(f.input('Titre (fr)').props.value,'Mon texte à conserver');
  f.button('Enregistrer une nouvelle').props.onClick();assert.equal(JSON.parse(f.pending[3].init.body).version,7);
  await f.respond(3,{error:'Conflit détecté'},409);
  f.button('Conserver mon texte').props.onClick();f.button('Enregistrer une nouvelle').props.onClick();
  const rebased=JSON.parse(f.pending[4].init.body);assert.equal(rebased.version,9);assert.equal(rebased.revision,3);assert.equal(rebased.content.fr.title,'Mon texte à conserver');
});
test('save success advances revision and duplicate clicks submit only once',async()=>{
  const f=fixture();await f.ready();f.input('Notes et motif').props.onChange({target:{value:'Persist this draft safely.'}});
  f.button('Enregistrer une nouvelle').props.onClick();f.button('Enregistrer une nouvelle').props.onClick();assert.equal(f.pending.length,2);
  await f.respond(1,{...initial,version:8,revision:3});assert.match(f.text(),/Version 8 · révision 3/);assert.equal(f.changed(),1);
});
test('view-only roles cannot edit or publish; old revision restore requires a new save and review',async()=>{
  const viewer=fixture({...initial,canEdit:false,canPublish:false});await viewer.ready();
  assert.ok(viewer.all().some(n=>n.type==='fieldset'&&n.props.disabled));assert.equal(viewer.button('Publier la révision'),undefined);
  const f=fixture({...initial,revisions:[{revision:1,content:{...draft,fr:{...draft.fr,title:'Ancienne révision française'}},actor:'editor',created_at:'date'}]});await f.ready();
  f.button('Reprendre comme nouveau').props.onClick();assert.equal(f.input('Titre (fr)').props.value,'Ancienne révision française');assert.match(f.text(),/Modifications non enregistrées/);assert.equal(f.pending.length,1);
});
test('unmounted editor ignores late mutation results and does not refresh another selection',async()=>{
  const f=fixture();await f.ready();f.input('Notes et motif').props.onChange({target:{value:'Save before changing selection.'}});
  f.button('Enregistrer une nouvelle').props.onClick();f.cleanup();await f.respond(1,{...initial,version:99,revision:8});
  assert.equal(f.changed(),0);assert.doesNotMatch(f.text(),/Version 99/);
});

test('server replacement asks before discarding notes-only edits and cancellation preserves recovery',async()=>{
  const values=new Map<string,string>();
  const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key)};
  let consent=false,confirmations=0;
  const f=fixture({...initial,draftScope:'editor'},storage,'one',()=>{confirmations++;return consent;});
  await f.ready();f.input('Notes et motif').props.onChange({target:{value:'Notes françaises et عربية à conserver'}});
  f.button('Comparer avec').props.onClick();await f.respond(1,{...initial,draftScope:'editor'});
  f.button('Charger le texte serveur').props.onClick();
  assert.equal(confirmations,1);assert.equal(values.size,1);
  assert.equal(f.input('Notes et motif').props.value,'Notes françaises et عربية à conserver');
  consent=true;f.button('Charger le texte serveur').props.onClick();
  assert.equal(confirmations,2);assert.equal(values.size,0);assert.equal(f.input('Notes et motif').props.value,'');
});

test('recovery compares revision independently of document version and retains the original save guard',async()=>{
  const raw=JSON.stringify({content:draft,notes:'Recovered review notes',base:{version:7,revision:1,source}});
  const f=fixture({...initial,draftScope:'editor'},{getItem:()=>raw,setItem(){},removeItem(){}});
  await f.ready();assert.match(f.text(),/Version serveur 7/);
  f.button('Enregistrer une nouvelle').props.onClick();
  assert.equal(JSON.parse(f.pending[1].init.body).revision,1);
});
