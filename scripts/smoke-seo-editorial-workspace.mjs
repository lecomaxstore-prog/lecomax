// Actual React dashboard/editor, isolated loopback fixtures. No dotenv, session
// token, hosted client, SQL execution, provider transport or worker activation.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import ts from 'typescript';
import {shoeFixture} from '../operations/seo-vercel/tests/editorial-quality-fixtures.mjs';
import {CdpClient,evaluate,waitFor,setViewport,saveScreenshot,findChrome,waitForDevToolsFile} from './smoke-admin-dashboard-ui.mjs';

if(process.argv.length!==2)throw Error('NO_TARGET_OR_EXECUTION_OVERRIDES');
const require=createRequire(import.meta.url),compiler=require('next/dist/compiled/webpack/webpack');compiler.init();
const parent=path.resolve('artifacts/seo-editorial-browser');fs.mkdirSync(parent,{recursive:true});
const output=fs.mkdtempSync(path.join(parent,'run-'));
const sourceHashes=Object.fromEntries([
  'scripts/smoke-seo-editorial-workspace.mjs','scripts/smoke-admin-dashboard-ui.mjs',
  'app/admin/seo/EditorialWorkspace.tsx','app/admin/seo/page.tsx','app/admin/seo/seo.module.css',
  'lib/seo-engine.ts','lib/seo-editorial.ts',
  'operations/seo-vercel/lib/seo-editorial-quality.mjs','operations/seo-vercel/tests/editorial-quality-fixtures.mjs',
].map(file=>[file,createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
function compile(file,name,replacements={}){
  let result=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const css=Object.fromEntries([...fs.readFileSync('app/admin/seo/seo.module.css','utf8').matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m=>[m[1],m[1]]));
  const mapping={'./seo.module.css':`({__esModule:true,default:${JSON.stringify(css)}})`,
    '@/lib/seo-engine':'require("./engine.cjs")','@/lib/seo-editorial':'require("./editorial.cjs")',
    '@/operations/seo-vercel/lib/seo-editorial-quality.mjs':`require(${JSON.stringify(path.resolve('operations/seo-vercel/lib/seo-editorial-quality.mjs'))})`,...replacements};
  for(const [from,to] of Object.entries(mapping))result=result.replaceAll(`require(${JSON.stringify(from)})`,to);
  fs.writeFileSync(path.join(output,name),result);
}
compile('lib/seo-engine.ts','engine.cjs');compile('lib/seo-editorial.ts','editorial.cjs');
compile('app/admin/seo/EditorialWorkspace.tsx','workspace.cjs');
compile('app/admin/seo/page.tsx','dashboard.cjs',{'./EditorialWorkspace':'require("./workspace.cjs")','./SeoAiControl':'({__esModule:true,default:()=>require("react").createElement("p",null,"Restricted AI management fixture")})','./SeoSyncControl':'({__esModule:true,default:()=>null})','next/link':'({__esModule:true,default:"a"})'});
const fixture=shoeFixture();
fs.writeFileSync(path.join(output,'entry.cjs'),`
const React=require('react'),{createRoot}=require('react-dom/client'),Dashboard=require('./dashboard.cjs').default;
const source=${JSON.stringify(fixture.source)},original=${JSON.stringify(fixture.draft)};
const fallback={title:'Fixture SEO title',description:'Fixture metadata description',imageAlt:'Fixture image'};
const documents=['one','two'].map((id,i)=>({kind:'product',entity_id:id,slug:id,active:true,source:{...source,name:'Fixture product '+id,slug:id,images:[]},fallback,draft:null,published:null,draft_source:null,published_source:null,version:3,updated_at:'2026-10-19T00:00:00Z'}));
const states=Object.fromEntries(documents.map(d=>[d.entity_id,{version:3,revision:1,source:{...source,id:d.entity_id,slug:d.slug,active:true,images:[]},head:{revision:1,content:original},published:null,revisions:[{revision:1,content:original,actor:'fixture-editor',created_at:'fixture date'}],events:[],draftScope:"fixture@example.invalid",canEdit:true,canPublish:true,suggestions:[{id:'00000000-0000-4000-8000-000000000001',tier:'editorial-sol',content:original}]}]));
let ordinal=0;window.calls=[];window.confirmResult=true;window.confirmCount=0;window.delaySave=false;
window.confirm=()=>{window.confirmCount++;return window.confirmResult;};
window.remoteChange=()=>{const s=states.one;s.version++;s.revision++;s.head={revision:s.revision,content:{...original,fr:{...original.fr,title:'Remote French revision'}}};documents[0].version=s.version;};
window.fetch=async(url,init)=>{
 const u=new URL(url,location.origin);if(u.origin!==location.origin)throw Error('NON_LOCAL_FETCH');
 if(u.pathname==='/api/admin/seo')return Response.json(u.searchParams.has('id')?{events:[]}:{documents,canEditProducts:true,canEditCategories:false,aiConfigured:false,synchronization:null});
 if(u.pathname!=='/api/admin/seo/editorial')throw Error('NON_FIXTURE_ROUTE');
 const input=init?.method==='POST'?JSON.parse(init.body):null,id=input?.id??u.searchParams.get('id'),s=states[id];
 if(!s)return Response.json({error:'Not found'}, {status:404});
 if(input){
   window.calls.push(input);if(window.delaySave){window.delaySave=false;await new Promise(resolve=>window.releaseSave=resolve);}
   if(input.version!==s.version||input.revision!==s.revision)return Response.json({error:'Fixture conflict: text preserved.'},{status:409});
   if(input.action==='save'){s.revision++;s.head={revision:s.revision,content:input.job?original:input.content};s.revisions.unshift({...s.head,actor:'fixture-editor',created_at:'fixture date'});}
   if(input.action==='publish'){s.previous=s.published;s.published=s.head.content;}
   if(input.action==='rollback')s.published=s.previous??null;
   s.version++;s.events.unshift({id:String(++ordinal),revision:s.revision,action:input.action,actor:'fixture-editor',notes:input.notes,created_at:'fixture date'});
   const doc=documents.find(d=>d.entity_id===id);doc.version=s.version;
 }
 return Response.json(s);
};
window.fixture={original,states};
createRoot(document.getElementById('root')).render(React.createElement(Dashboard));
`);
await new Promise((resolve,reject)=>compiler.webpack({mode:'development',devtool:false,target:'web',entry:path.join(output,'entry.cjs'),output:{path:output,filename:'bundle.js'},resolve:{modules:[path.resolve('node_modules')]},plugins:[new compiler.webpack.DefinePlugin({'process.env.NODE_ENV':JSON.stringify('development')})]},(error,stats)=>error||stats.hasErrors()?reject(error??Error(stats.toString())):resolve()));
const css=fs.readFileSync('app/admin/seo/seo.module.css','utf8');
const server=createServer((req,res)=>{
  res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'none'; img-src data:");
  res.setHeader('Content-Type',req.url==='/bundle.js'?'application/javascript':'text/html; charset=utf-8');
  res.end(req.url==='/bundle.js'?fs.readFileSync(path.join(output,'bundle.js')):`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>*{box-sizing:border-box}body{font-family:Arial;margin:0}${css}</style><div id="root"></div><script src="/bundle.js"></script></html>`);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const profile=path.join(output,'chrome');fs.mkdirSync(profile);
const env=Object.fromEntries(['SystemRoot','WINDIR','TEMP','TMP','LOCALAPPDATA','APPDATA','USERPROFILE','PATH'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
const chrome=spawn(await findChrome(),['--headless=new','--disable-gpu','--disable-gpu-compositing','--in-process-gpu','--use-gl=swiftshader','--disable-software-rasterizer','--disable-background-networking','--disable-extensions','--disable-sync','--no-first-run','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--host-resolver-rules=MAP * 0.0.0.0, EXCLUDE 127.0.0.1','about:blank'],{stdio:['ignore','ignore',fs.openSync(path.join(output,'chrome.log'),'a')],windowsHide:true,env});
let client;
let stage='devtools-discovery',browserVersion=null;
const checks=[];
try{
  const [port]=await waitForDevToolsFile(profile,30000),tabs=await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json());
  stage='websocket-connect';
  client=new CdpClient(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await client.connect();
  stage='browser-version';browserVersion=await client.send('Browser.getVersion');
  stage='page-enable';
  await client.send('Page.enable');await client.send('Runtime.enable');
  stage='fixture-interactions';
  await client.send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});
  await waitFor(client,"document.body.textContent.includes('Fixture product one')",'fixture catalogue');
  assert.equal(await evaluate(client,"document.body.textContent.includes('Restricted AI management fixture')"),false);
  const editor="document.querySelector('[aria-label=\"Édition et publication bilingue\"]')";
  const button=label=>`[...document.querySelectorAll('button')].find(b=>b.textContent.includes(${JSON.stringify(label)}))`;
  const click=async label=>{await waitFor(client,`${button(label)} !== undefined`,label);return evaluate(client,`${button(label)}.click()`);};
  const textarea=label=>`[...${editor}.querySelectorAll('label')].find(l=>l.textContent.includes(${JSON.stringify(label)})).querySelector('textarea')`;
  const fill=async(label,value)=>evaluate(client,`(()=>{const input=${textarea(label)};Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  const open=async index=>evaluate(client,`[...document.querySelectorAll('button')].filter(b=>b.textContent==='Examiner')[${index}].click()`);
  await open(0);await waitFor(client,`${editor}?.textContent.includes('Version 3')`,'editor loaded');
  assert.equal(await evaluate(client,`${editor}.querySelector('[lang=ar]').dir`),'rtl');
  assert.equal(await evaluate(client,`${textarea('Titre (ar)')}.value`),fixture.draft.ar.title);
  assert.ok(await evaluate(client,`${button('Importer la suggestion')} !== undefined`));checks.push('bilingual-fields-and-product-editor-import');
  await fill('Titre (fr)','Local French draft preserved');await fill('Notes et motif','Local review notes for this fixture.');
  await open(1);await waitFor(client,`${textarea('Titre (fr)')}.value===${JSON.stringify(fixture.draft.fr.title)}`,'second product');
  await open(0);await waitFor(client,`${textarea('Titre (fr)')}.value==='Local French draft preserved'`,'recovered product');
  await click('Fermer');assert.equal(await evaluate(client,editor),null);
  await open(0);await waitFor(client,`${textarea('Titre (fr)')}.value==='Local French draft preserved'`,'recovered after close');
  await client.send('Page.reload');await waitFor(client,`!${editor} && [...document.querySelectorAll('button')].filter(b=>b.textContent==='Examiner').length===2`,'reload catalogue');
  await open(0);await waitFor(client,`${textarea('Titre (fr)')}.value==='Local French draft preserved'`,'recovered after refresh');
  assert.equal(await evaluate(client,`${textarea('Notes et motif')}.value`),'Local review notes for this fixture.');
  checks.push('draft-switch-close-refresh-recovery');
  await evaluate(client,'window.delaySave=true');await click('Enregistrer une nouvelle révision');
  await waitFor(client,'typeof window.releaseSave === "function"','pending save');await open(1);
  await waitFor(client,"document.body.textContent.includes('opération éditoriale est en cours')",'busy navigation blocked');
  await evaluate(client,'window.releaseSave()');await waitFor(client,`${editor}.textContent.includes('Version 4')`,'saved');checks.push('pending-save-navigation-block');
  await evaluate(client,'window.remoteChange()');await fill('Titre (fr)','My conflicting French text');await click('Enregistrer une nouvelle révision');
  await waitFor(client,`${editor}.textContent.includes('Fixture conflict')`,'conflict');assert.equal(await evaluate(client,`${textarea('Titre (fr)')}.value`),'My conflicting French text');
  await click('Comparer avec');await waitFor(client,`${editor}.textContent.includes('Version serveur 5')`,'server comparison');
  await evaluate(client,'window.confirmResult=true');await click('Conserver mon texte');await click('Enregistrer une nouvelle révision');
  await waitFor(client,`${editor}.textContent.includes('Version 6')`,'rebased save');assert.equal(await evaluate(client,'window.calls.at(-1).version'),5);checks.push('conflict-compare-explicit-rebase');
  await click('Importer la suggestion');await waitFor(client,`${editor}.textContent.includes('Version 7')`,'explicit suggestion import');
  assert.equal(await evaluate(client,`${textarea('Titre (ar)')}.value`),fixture.draft.ar.title);
  await evaluate(client,`${editor}.querySelectorAll('input[type=checkbox]').forEach(c=>c.click())`);
  await waitFor(client,`!${button('Approuver cette révision')}.disabled`,'complete review');await click('Approuver cette révision');
  await waitFor(client,`!${button('Publier la révision')}.disabled`,'review saved');await evaluate(client,'window.confirmResult=false');await click('Publier la révision');
  assert.equal(await evaluate(client,"window.calls.some(c=>c.action==='publish')"),false);
  await evaluate(client,'window.confirmResult=true');await click('Publier la révision');await waitFor(client,`${editor}.textContent.includes('Version 9')`,'publication');
  assert.deepEqual(await evaluate(client,'window.fixture.states.one.published.ar'),fixture.draft.ar);
  await click('Annuler la dernière publication');await waitFor(client,`${editor}.textContent.includes('Version 10')`,'rollback');assert.equal(await evaluate(client,'window.fixture.states.one.published'),null);checks.push('review-publication-consent-and-rollback-controls');
  await open(1);await waitFor(client,`${editor}.textContent.includes('Version 3')`,'second product clean state');
  assert.equal(await evaluate(client,`${textarea('Titre (fr)')}.value`),fixture.draft.fr.title);checks.push('clean-selection-isolation');
  assert.ok(await evaluate(client,`${editor}.textContent.includes('Voir la suggestion')`));
  await fill('Notes et motif','Notes seules françaises et عربية à conserver');
  await click('Comparer avec');await waitFor(client,`${editor}.textContent.includes('Version serveur 3')`,'notes-only comparison');
  await evaluate(client,'window.confirmResult=false;window.confirmCount=0');await click('Charger le texte serveur');
  assert.equal(await evaluate(client,'window.confirmCount'),1);
  assert.equal(await evaluate(client,`${textarea('Notes et motif')}.value`),'Notes seules françaises et عربية à conserver');
  await evaluate(client,'window.confirmResult=true');await click('Charger le texte serveur');
  assert.equal(await evaluate(client,`${textarea('Notes et motif')}.value`),'');
  checks.push('notes-only-server-replacement-cancel-and-confirm');
  await evaluate(client,'window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error("fixture quota");};window.confirmResult=false');
  await fill('Titre (fr)','Storage failure must warn');await click('Fermer');
  assert.equal(await evaluate(client,`${textarea('Titre (fr)')}.value`),'Storage failure must warn');
  assert.ok(await evaluate(client,`${editor}.textContent.includes('Copie locale indisponible')`));
  assert.equal(await evaluate(client,`(()=>{const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented;})()`),true);
  await evaluate(client,'Storage.prototype.setItem=window.originalSetItem;window.confirmResult=true');
  await fill('Titre (fr)','Recovered after quota failure');checks.push('storage-failure-discard-confirmation-and-unload-warning');
  for(const width of [375,768,1440]){
    await setViewport(client,width,1000);
    assert.equal(await evaluate(client,'document.documentElement.scrollWidth<=innerWidth'),true,`no overflow at ${width}`);
    await evaluate(client,`${editor}.scrollIntoView()`);await saveScreenshot(client,output,`editorial-${width}.png`);
  }
  assert.equal(client.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);checks.push('responsive-375-768-1440-no-runtime-exception');
  const result={at:new Date().toISOString(),checks,passed:checks.length,fixtureOnly:true,realApiAuth:false,realDatabase:false,hostedAccess:false,nodeVersion:process.version,browserVersion,sourceHashes,output};
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(error){fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify({at:new Date().toISOString(),stage,checks,error:error.message,nodeVersion:process.version,browserVersion,sourceHashes,fixtureOnly:true,hostedAccess:false},null,2));console.error(JSON.stringify({output,stage,checks,error:error.message}));process.exitCode=1;}
finally{client?.close();chrome.kill();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
