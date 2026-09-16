import { spawn } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { CdpClient, createAdminToken, evaluate, waitFor, setViewport, saveScreenshot, findChrome, waitForDevToolsFile } from './smoke-admin-dashboard-ui.mjs';
const base='http://127.0.0.1:3000';
const profile=await mkdtemp(path.join(os.tmpdir(),'lecomax-commerce-qa-'));
const chrome=spawn(await findChrome(),['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
let client;
try {
  const [port]=await waitForDevToolsFile(profile);
  const pages=await fetch(`http://127.0.0.1:${port}/json/list`).then(response=>response.json());
  client=new CdpClient(pages.find(page=>page.type==='page').webSocketDebuggerUrl); await client.connect();
  await client.send('Page.enable'); await client.send('Runtime.enable'); await client.send('Network.enable');
  const {token,email}=await createAdminToken();
  await client.send('Network.setCookie',{name:'admin_session',value:token,url:base,path:'/',httpOnly:true,sameSite:'Strict'});
  const product={id:'00000000-0000-0000-0000-000000000001',name:'ASICS GEL-KAYANO 32',slug:'asics-kayano',brand:'ASICS',category:'chaussures',price:200,original_price:250,stock:9,active:true,colors:['Black','White'],sizes:['42','42.5','43','43.5','44','44.5','45','45.5'],images:[],tags:['__guide:shoes','__vstock:["Black",{"42":0,"42.5":0,"43":0,"43.5":0,"44":0,"44.5":2,"45":0,"45.5":0}]','__vstock:["White",{"42":0,"42.5":0,"43":0,"43.5":0,"44":0,"44.5":7,"45":0,"45.5":0}]'],color_stock:{Black:2,White:7},created_at:new Date().toISOString()};
  await client.send('Page.addScriptToEvaluateOnNewDocument',{source:`(() => {
    const original=window.fetch.bind(window), product=${JSON.stringify(product)};
    window.__qaWrites=[];
    window.fetch=(input,init)=>{
      const url=new URL(typeof input==='string'?input:input.url,location.origin), pathname=url.pathname.endsWith('/')?url.pathname.slice(0,-1):url.pathname;
      if(!pathname.startsWith('/api/')) return original(input,init);
      const method=init?.method||'GET';
      const json=value=>Promise.resolve(new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json'}}));
      if(method!=='GET') {
        window.__qaWrites.push({pathname,method,body:init?.body});
        if(pathname==='/api/admin/products/bulk') return json({results:JSON.parse(init.body).ids.map(id=>({id,ok:true}))});
        return json({success:true});
      }
      if(pathname==='/api/admin/auth/verify') return json({ok:true,email:${JSON.stringify(email)}});
      if(pathname==='/api/admin/staff/permissions') return json({isStaff:false,permissions:[]});
      if(pathname==='/api/products') return json([product]);
      if(pathname.startsWith('/api/products/')) return json(product);
      if(pathname==='/api/settings') return json([{key:'shipping_cost',value:'45'},{key:'store_name',value:'LECOMAX QA'},{key:'maintenance_mode',value:'false'}]);
      if(pathname==='/api/orders') return json([{id:'00000000-0000-0000-0000-000000000002',order_number:'QA-1',customer:{name:'QA Customer',city:'Rabat',phone:'0600000000',email:'qa@example.test',address:'QA'},items:[],total:245,status:'pending',created_at:new Date().toISOString()}]);
      return json([]);
    };
  })();`});
  const results=[];
  for (const route of ['/admin/products','/admin/products?id='+product.id,'/admin/stock','/admin/orders','/admin/settings']) {
    await client.send('Page.navigate',{url:base+route});
    await waitFor(client,`Boolean(window.__qaWrites && document.querySelector('#admin-main') && document.querySelector('#admin-main').innerText.length>100)`,'admin content',30000);
    if(route.startsWith('/admin/products') || route==='/admin/stock') await waitFor(client,`document.querySelector('#admin-main').textContent.includes('ASICS') || document.querySelector('input[value="ASICS GEL-KAYANO 32"]')`,'loaded catalog fixture');
    await new Promise(resolve=>setTimeout(resolve,500));
    for (const width of [320,360,375,390,412,430,768,1024,1440]) {
      await setViewport(client,width,900);
      const layout=await evaluate(client,`(() => { const main=document.querySelector('#admin-main'); return { pageOverflow:document.documentElement.scrollWidth-innerWidth,mainOverflow:main.scrollWidth-main.clientWidth,text:main.innerText.slice(0,80) }; })()`);
      results.push({route,width,...layout});
      if(layout.pageOverflow>2||layout.mainOverflow>2) await saveScreenshot(client,'out/commerce-qa',route.split('?')[0].replaceAll('/','-')+'-'+width+'-overflow.png');
    }
    await saveScreenshot(client,'out/commerce-qa',route.replaceAll('/','-').replaceAll('?','-').replaceAll('=','-')+'-1440.png');
  }
  await writeFile('out/commerce-qa/layout-results.json',JSON.stringify(results,null,2));
  await client.send('Page.navigate',{url:base+'/admin/products'});
  await setViewport(client,320,700);
  await waitFor(client,`Boolean(document.querySelector('[aria-label="Actions groupées"]'))`,'bulk controls');
  await evaluate(client,`[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Sélectionner les'))?.click()`);
  await waitFor(client,`[...document.querySelectorAll('button')].some(button=>button.textContent.includes('Appliquer (1)'))`,'selected product');
  await evaluate(client,`[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Appliquer (1)'))?.click()`);
  await waitFor(client,`Boolean(document.querySelector('dialog[open]'))`,'confirmation');
  const modal=await evaluate(client,`(() => { const d=document.querySelector('dialog[open]'),r=d.getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom,top:r.top,focus:document.activeElement.textContent,writes:window.__qaWrites.length}; })()`);
  assert.ok(modal.left>=0&&modal.right<=320&&modal.top>=0&&modal.bottom<=700,JSON.stringify(modal));
  assert.equal(modal.focus,'Annuler'); assert.equal(modal.writes,0);
  await saveScreenshot(client,'out/commerce-qa','bulk-confirmation-320.png');
  await evaluate(client,`document.querySelector('dialog[open] button').click()`);
  await waitFor(client,`!document.querySelector('dialog[open]') && ![...document.querySelectorAll('button')].find(button=>button.textContent.includes('Appliquer (1)'))?.disabled`,'cancelled confirmation');
  assert.equal(await evaluate(client,'window.__qaWrites.length'),0);
  await evaluate(client,`[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Appliquer (1)'))?.click()`);
  await waitFor(client,`Boolean(document.querySelector('dialog[open]'))`,'second confirmation');
  await evaluate(client,`[...document.querySelectorAll('dialog[open] button')].find(button=>button.textContent==='Confirmer').click()`);
  await waitFor(client,`document.querySelector('[aria-label="Actions groupées"]').textContent.includes('1 réussi')`,'bulk result');
  assert.equal(await evaluate(client,`window.__qaWrites.filter(write=>write.pathname==='/api/admin/products/bulk').length`),1);
  const exceptions=client.events.filter(event=>event.method==='Runtime.exceptionThrown');
  await writeFile('out/commerce-qa/results.json',JSON.stringify({results,modal,exceptions},null,2));
  assert.equal(exceptions.length,0,JSON.stringify(exceptions));
  assert.ok(results.every(result=>result.pageOverflow<=2&&result.mainOverflow<=2),JSON.stringify(results.filter(result=>result.pageOverflow>2||result.mainOverflow>2)));
  console.log('Commerce admin QA passed: five screens × nine widths, bounded confirmation at 320px, cancel without mutation, and one confirmed request. All APIs were browser-local fixtures.');
} finally { client?.close();chrome.kill(); }
