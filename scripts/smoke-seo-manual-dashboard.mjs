import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
process.env.ADMIN_DASHBOARD_BASE_URL ??= 'http://127.0.0.1:3100';
const { CdpClient, createAdminToken, evaluate, waitFor, setViewport, saveScreenshot, findChrome, waitForDevToolsFile } = await import('./smoke-admin-dashboard-ui.mjs');
const base = process.env.ADMIN_DASHBOARD_BASE_URL;
const { token, email } = await createAdminToken();
const profile = await mkdtemp(path.join(os.tmpdir(), 'lecomax-seo-manual-qa-'));
const chrome = spawn(await findChrome(), ['--headless=new','--disable-gpu','--no-sandbox','--no-first-run','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'], { stdio:'ignore',windowsHide:true });
let client;
try {
  const [port] = await waitForDevToolsFile(profile, 60000);
  const tabs = await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json());
  client = new CdpClient(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl); await client.connect();
  await Promise.all([client.send('Page.enable'),client.send('Runtime.enable'),client.send('Network.enable')]);
  await client.send('Network.setCookie',{name:'admin_session',value:token,url:base,path:'/',httpOnly:true,sameSite:'Strict'});
  // Isolated UI fixtures: no remote catalogue writes, AI calls or notifications.
  await client.send('Page.addScriptToEvaluateOnNewDocument',{source:`(() => {
    const original=fetch.bind(window); window.__seoCalls=[];window.__seoFail=false;
    window.__seoSync={reconciledAt:new Date().toISOString(),completedAt:new Date().toISOString(),pending:3,failed:1,errors:[{kind:'product',entity_id:'qa-failed',state:'retry',attempts:2,last_error:'SEO_PROCESSING_FAILED',available_at:new Date().toISOString()}]};
    const source={name:'Casque de test',slug:'casque-test',description:'Casque avec connexion Bluetooth.',category:'accessoires',images:['/photo.jpg']};
    const content={title:"Casque de test | L'ecomax Maroc",description:"Casque de test sur L'ecomax au Maroc. Casque avec connexion Bluetooth.",imageAlt:'Casque de test'};
    let doc={kind:'product',entity_id:'qa-1',slug:source.slug,active:true,source,fallback:content,draft:null,published:null,draft_source:null,published_source:null,version:1,updated_at:new Date().toISOString(),published_at:null,provider:null};
    window.__seoRemoteUpdate=()=>{doc={...doc,version:doc.version+1,draft:{...content,title:'Titre enregistrÃ© par un autre administrateur'},draft_source:source};};
    const events=[];const json=(data,status=200)=>Promise.resolve(new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}));
    window.fetch=(input,init)=>{
      const url=new URL(typeof input==='string'?input:input.url,location.origin),p=url.pathname.replace(/\\/$/,'');
      if(p==='/api/admin/auth/verify')return json({email:${JSON.stringify(email)}});
      if(p==='/api/admin/staff/permissions')return json({isStaff:false});
      if(p==='/api/admin/auth/session')return json({error:'Fixture'},503);
      if(p==='/api/admin/seo/sync'){
        if(init?.method==='POST'){
          window.__manualCalls=(window.__manualCalls||0)+1;
          if(window.__manualError)return json({error:'Échec worker simulé'},503);
          window.__manualRun={state:'running',startedAt:new Date().toISOString(),finishedAt:null,completed:0,failed:0,superseded:0};
          return new Promise(resolve=>setTimeout(()=>{window.__manualRun={...window.__manualRun,state:'completed',finishedAt:new Date().toISOString(),completed:4};resolve(new Response(JSON.stringify({ok:true}),{status:200}));},300));
        }
        return json({enabled:true,run:window.__manualRun||{state:'idle',startedAt:null,finishedAt:null,completed:0,failed:0,superseded:0}});
      }
      if(p==='/api/admin/seo'){
        if(init?.method==='POST'){
          const body=JSON.parse(init.body);window.__seoCalls.push(body.action);
          if(window.__seoFail)return json({error:'Conflit simulÃ© : actualisez.'},409);
          if(body.action==='generate'||body.action==='draft'){doc={...doc,draft:body.content||content,draft_source:source};}
          if(body.action==='approve'){doc={...doc,published:doc.draft,draft:null,published_source:source};}
          if(body.action==='reset'){doc={...doc,published:null};}
          doc.version++;events.unshift({id:events.length+1,action:body.action,actor:'QA local',content:doc.draft||doc.published,created_at:new Date().toISOString()});return json({document:doc});
        }
        if(url.searchParams.has('id'))return json({events});
        return json({documents:[doc],synchronization:window.__seoSync,canEditProducts:true,canEditCategories:window.__canSync!==false,aiConfigured:false});
      }
      if(p.startsWith('/api/')||url.hostname.endsWith('.supabase.co'))return json([]);
      return original(input,init);
    };
  })();`});
  await setViewport(client,1440,1000);
  await client.send('Page.navigate',{url:base+'/admin/seo/'});
  await waitFor(client,`document.body.textContent.includes('Casque de test')`,'SEO catalogue fixture',60000);
  const click = async text => evaluate(client,`[...document.querySelectorAll('main button')].find(b=>b.textContent===${JSON.stringify(text)}).click()`);
  await waitFor(client,`[...document.querySelectorAll('button')].some(b=>b.textContent==='Run SEO Sync'&&!b.disabled)`,'manual sync enabled');
  await click('Run SEO Sync');
  assert.equal(await evaluate(client,`document.querySelector('[aria-label="Exécution du worker SEO"] button').disabled`),true);
  await evaluate(client,`document.querySelector('[aria-label="Exécution du worker SEO"] button').click()`);
  await waitFor(client,`document.querySelector('[aria-label="Exécution du worker SEO"]').textContent.includes('4 fiches traitées')`,'durable count refreshed');
  assert.equal(await evaluate(client,`window.__manualCalls`),1);
  await evaluate(client,`window.__manualError=true`);await click('Run SEO Sync');
  await waitFor(client,`document.body.textContent.includes('Échec worker simulé')`,'manual failure feedback');
  await evaluate(client,`window.__manualError=false;window.__canSync=false`);await click('Actualiser');
  await waitFor(client,`!document.querySelector('[aria-label="Exécution du worker SEO"]')`,'read-only permissions hide manual action');
  assert.equal(await evaluate(client,`document.querySelector('[aria-label="Synchronisation SEO"]').textContent.includes('3 en attente')`),true);
  assert.equal(await evaluate(client,`document.body.textContent.includes('SEO_PROCESSING_FAILED')`),true);
  await evaluate(client,`window.__seoSync.reconciledAt='2020-01-01T00:00:00Z'`);
  await click('Actualiser');
  await waitFor(client,`document.body.textContent.includes('Synchronisation en retard')`,'stale worker warning');
  await evaluate(client,`window.__seoSync=null`);await click('Actualiser');
  await waitFor(client,`document.body.textContent.includes('Ã‰tat de synchronisation indisponible')`,'unavailable queue warning');
  await evaluate(client,`window.__seoSync={reconciledAt:new Date().toISOString(),completedAt:new Date().toISOString(),pending:0,failed:0,errors:[]}`);
  await click('Actualiser');
  await waitFor(client,`document.querySelector('[aria-label="Synchronisation SEO"]').textContent.includes('0 en attente')`,'healthy worker status');
  await click('Examiner');
  const editorTitle = `document.querySelector('section[aria-label^="Ã‰dition SEO"] input')`;
  const originalTitle = await evaluate(client,`${editorTitle}.value`);
  await evaluate(client,`window.__seoRemoteUpdate()`);
  await click('Actualiser');
  await waitFor(client,`document.body.textContent.includes('Cette fiche a changÃ© depuis son ouverture')`,'stale editor warning');
  assert.equal(await evaluate(client,`${editorTitle}.value`),originalTitle,'refresh preserves editor text');
  for(const label of ['Enregistrer le brouillon','Approuver le brouillon enregistrÃ©','Proposer un brouillon']) {
    assert.equal(await evaluate(client,`[...document.querySelectorAll('main button')].find(b=>b.textContent===${JSON.stringify(label)}).disabled`),true,'stale actions blocked');
  }
  await click('Recharger la version actuelle');
  assert.equal(await evaluate(client,`${editorTitle}.value`),'Titre enregistrÃ© par un autre administrateur');
  await click('Proposer un brouillon');
  await waitFor(client,`!document.querySelector('main button[disabled]') || document.body.textContent.includes('Ã€ approuver')`,'draft saved');
  await waitFor(client,`[...document.querySelectorAll('button')].some(b=>b.textContent==='Approuver le brouillon enregistrÃ©'&&!b.disabled)`,'approval enabled');
  await evaluate(client,`(() => { const input=${editorTitle};Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Casque Bluetooth de test | Maroc');input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await waitFor(client,`[...document.querySelectorAll('button')].find(b=>b.textContent==='Approuver le brouillon enregistrÃ©').disabled`,'unsaved editor cannot be approved');
  await click('Enregistrer le brouillon');
  await waitFor(client,`[...document.querySelectorAll('button')].some(b=>b.textContent==='Approuver le brouillon enregistrÃ©'&&!b.disabled)`,'manual draft saved');
  assert.equal(await evaluate(client,`${editorTitle}.value`),'Casque Bluetooth de test | Maroc');
  await click('Approuver le brouillon enregistrÃ©');
  await waitFor(client,`document.body.textContent.includes('MÃ©tadonnÃ©es approuvÃ©es')`,'approval saved');
  await evaluate(client,`window.__seoFail=true`);
  await click('Proposer un brouillon');
  await waitFor(client,`document.body.textContent.includes('Conflit simulÃ©')`,'conflict feedback');
  assert.equal(await evaluate(client,`document.body.textContent.includes('ApprouvÃ©')`),true);
  await evaluate(client,`window.__seoFail=false`);
  await click('Revenir aux mÃ©tadonnÃ©es automatiques');
  await waitFor(client,`!document.body.textContent.includes('Revenir aux mÃ©tadonnÃ©es automatiques')`,'reset saved');
  await click('Fermer');
  await evaluate(client,`document.querySelector('input[aria-label="SÃ©lectionner Casque de test"]').click()`);
  await click('GÃ©nÃ©rer 1 brouillons sÃ©lectionnÃ©s');
  await waitFor(client,`document.body.textContent.includes('1 / 1 traitÃ©es')`,'bulk progress');
  await click('Examiner');
  await mkdir('artifacts/seo-manual-ui',{recursive:true});
  for(const width of [375,768,1440]) {
    await setViewport(client,width,1000);
    assert.equal(await evaluate(client,`document.documentElement.scrollWidth<=innerWidth+2`),true,`overflow at ${width}`);
    await saveScreenshot(client,'artifacts/seo-manual-ui',`seo-dashboard-${width}.png`);
  }
  assert.deepEqual(await evaluate(client,'window.__seoCalls'),['generate','draft','approve','generate','reset','generate']);
  console.log('PASS: synchronization counts/errors/stale/unavailable/healthy states, desktop/mobile layout, stale editor refresh/reload, review, draft, approval, conflict, reset, bulk progress and history (isolated fixtures).');
} finally {
  client?.close();chrome.kill();
  // Only remove the exact temporary directory created above, under the system temp root.
  const resolved=path.resolve(profile),root=path.resolve(os.tmpdir())+path.sep;
  if(resolved.startsWith(root)&&path.basename(resolved).startsWith('lecomax-seo-manual-qa-')) await rm(resolved,{recursive:true,force:true,maxRetries:10,retryDelay:300}).catch(()=>{});
}
