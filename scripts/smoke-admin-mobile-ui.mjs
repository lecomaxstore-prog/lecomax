import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {CdpClient,createAdminToken,evaluate,waitFor,setViewport,saveScreenshot,findChrome,waitForDevToolsFile} from './smoke-admin-dashboard-ui.mjs';

const baseUrl=process.env.ADMIN_DASHBOARD_BASE_URL || 'http://127.0.0.1:3000';
const assert=(ok,message)=>{if(!ok)throw Error(message);};
assert(['localhost','127.0.0.1'].includes(new URL(baseUrl).hostname),'Local server required');
const widths=[320,360,375,390,412,430,768,1024,1280];
const routes=(process.env.ADMIN_MOBILE_ROUTES || 'customers,products,orders,stock,coupons,newsletter,mobile-app,settings,banners,promotions').split(',').filter(Boolean);
const products=Array.from({length:55},(_,i)=>({id:`product-${i}`,slug:`chaussure-${i}`,name:`Chaussures confort longue description ${i}`,price:499+i,original_price:699,stock:i%12,active:i%3!==0,category:'chaussures',brand:i%2?'ECOMAX':'Sport',colors:['Noir'],color_stock:{Noir:i%12},sizes:['40','41'],tags:[],images:['/favicon.png'],description:'Produit de test local',created_at:new Date().toISOString()}));
const orders=Array.from({length:55},(_,i)=>({id:`order-${i}`,order_number:`ECO-${1000+i}`,customer:{name:`Client de test ${i}`,phone:`060000${String(i).padStart(4,'0')}`,email:`client-${i}@example.test`,city:'Casablanca',address:'Adresse de test'},total:499+i,status:['pending','confirmed','shipped','delivered','cancelled'][i%5],payment_method:i%2?'paypal':'cod',order_source:i%2?'website':'mobile_app',items:[{name:'Chaussures',qty:1,price:499,product_id:'product-0'}],created_at:new Date().toISOString()}));
const profile=await mkdtemp(path.join(os.tmpdir(),'lecomax-mobile-admin-'));
const chrome=spawn(await findChrome(),['--headless=new','--disable-gpu','--no-sandbox','--no-first-run','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
let client;
try {
 const [port]=await waitForDevToolsFile(profile);
 const pages=await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json());
 client=new CdpClient(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await client.connect();
 await Promise.all([client.send('Page.enable'),client.send('Runtime.enable'),client.send('Network.enable')]);
 const {token,email}=await createAdminToken();
 await client.send('Network.setCookie',{name:'admin_session',value:token,url:baseUrl,path:'/',httpOnly:true,sameSite:'Strict'});
 await client.send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{
   const original=window.fetch.bind(window),products=${JSON.stringify(products)},orders=${JSON.stringify(orders)};
   window.__blockedWrites=0;
   window.fetch=(input,init)=>{
     const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.origin);
     const p=url.pathname.endsWith('/')?url.pathname.slice(0,-1):url.pathname;
     const json=(value,status=200)=>Promise.resolve(new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}}));
     const method=init?.method || (input instanceof Request?input.method:'GET');
     if(!['GET','HEAD'].includes(method.toUpperCase())){window.__blockedWrites++;return json({error:'Test: writes disabled'},409);}
     if(p==='/api/admin/auth/verify')return json({ok:true,email:${JSON.stringify(email)}});
     if(p==='/api/admin/staff/permissions')return json({isStaff:false,permissions:[]});
     if(p==='/api/products')return json(products);
     if(p==='/api/orders')return window.__failOrders?json({error:'Test failure'},503):json(orders);
     if(p==='/api/admin/activity')return json({items:[],hasMore:false});
     const conversation={id:'conversation-1',subject:'Question de livraison avec un sujet très long',customer_name:'Client de test',customer_email:'client@example.test',status:'open',admin_unread:1,last_message:'Quand arrive ma commande ?',last_message_at:new Date().toISOString(),order_number:null};
     if(p==='/api/admin/support/conversations')return json({conversations:[conversation]});
     if(p==='/api/admin/support/conversations/conversation-1')return json({conversation,messages:[{id:'message-1',body:'Bonjour, quand arrive ma commande ?',sender_type:'customer',created_at:new Date().toISOString()}]});
     if(p==='/api/admin/roles')return json([{id:'role-1',name:'Service client',description:'Répondre aux clients',color:'#168526',permissions:['orders.view'],staff_count:1,is_system:false}]);
     if(p.startsWith('/api/'))return json([]);
     if(url.hostname.endsWith('.supabase.co'))return json([]);
     return original(input,init);
   };
 })();`});
 const navigate=async route=>{
   // Warm the compilation before CDP's short navigation timeout.
   await fetch(`${baseUrl}/admin/${route}`,{headers:{Cookie:`admin_session=${token}`}});
   await client.send('Page.navigate',{url:`${baseUrl}/admin/${route}`});
   try { await waitFor(client,`Boolean(document.querySelector('#admin-main h1'))`,'page heading '+route,15000); }
   catch(error) { console.log(await evaluate(client,`({url:location.href,text:document.body.innerText.slice(0,1600),fixture:window.fetch.toString().slice(0,100)})`)); console.log(JSON.stringify(client.events.filter(e=>e.method==='Runtime.exceptionThrown'))); throw error; }
 };
 const checkWidths=async route=>{
   for(const width of widths){
     await setViewport(client,width,844);
     const m=await evaluate(client,`(()=>{const m=document.querySelector('#admin-main');return {page:document.documentElement.scrollWidth-innerWidth,main:m.scrollWidth-m.clientWidth,over:[...m.querySelectorAll('*')].filter(el=>el.getClientRects().length && el.getBoundingClientRect().right>innerWidth+2).slice(0,5).map(el=>el.tagName+'.'+el.className)}})()`);
     assert(m.page<=2&&m.main<=2,`${route} overflow at ${width}: ${JSON.stringify(m)}`);
     if(width<=430){
       const controls=await evaluate(client,`(()=>{const main=document.querySelector('#admin-main');return [...main.querySelectorAll('button[role="switch"],.admin-mobile-fields')].filter(el=>el.getClientRects().length).map(el=>({switch:el.matches('button'),width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,columns:getComputedStyle(el).gridTemplateColumns}));})()`);
       assert(controls.every(el=>el.switch ? el.width>=44&&el.height>=44 : !el.columns.includes(' ')),`${route} has cramped mobile controls at ${width}: ${JSON.stringify(controls)}`);
     }
   }
   console.log(`${route}: ${widths.join(', ')}px passed`);
 };
 for(const route of routes){
   await navigate(route);
   if(['customers','products','orders'].includes(route))await waitFor(client,`Boolean(document.querySelector('[aria-label="Pagination"]'))`,route+' data',30000);
   await checkWidths(route);
   await setViewport(client,390,844);
   if(route==='settings'){
     const count=await evaluate(client,`document.querySelectorAll('#admin-main aside button').length`);
     for(let index=0;index<count;index++){
       await evaluate(client,`document.querySelectorAll('#admin-main aside button')[${index}].click()`);
       for(const width of [320,390]){
         await setViewport(client,width,844);
         const result=await evaluate(client,`(()=>{const m=document.querySelector('#admin-main');const switches=[...m.querySelectorAll('button[role="switch"]')].filter(el=>el.getClientRects().length);return {overflow:m.scrollWidth-m.clientWidth,switches:switches.every(el=>el.getBoundingClientRect().width>=44&&el.getBoundingClientRect().height>=44)};})()`);
         assert(result.overflow<=2&&result.switches,`Settings tab ${index} is cramped at ${width}: ${JSON.stringify(result)}`);
       }
     }
     console.log('All settings tabs: 320 and 390px passed');
   }
   if(route==='support'){
     await evaluate(client,`document.querySelector('#admin-main aside button[class*="w-full"]').click()`);
     await waitFor(client,`Boolean(document.querySelector('.admin-support-composer'))`,'support reply');
     await checkWidths('support conversation');
     await setViewport(client,320,844);
     assert(await evaluate(client,`(()=>{const c=document.querySelector('.admin-support-composer');return getComputedStyle(c).gridTemplateColumns.startsWith('48px ')&&c.querySelector('label').getBoundingClientRect().width===48&&c.querySelector('textarea').getBoundingClientRect().width>160})()`),'Support reply is cramped');
     assert(await evaluate(client,`document.querySelector('.admin-support-composer').getBoundingClientRect().bottom<=innerHeight-64`),'Support Send button falls below mobile navigation');
   }
   if(route==='roles'){
     await evaluate(client,`document.querySelector('.admin-mobile-master-detail > div > button').click()`);
     await waitFor(client,`Boolean(document.querySelector('#admin-main input'))`,'role editor');
     await checkWidths('role editor');
     await setViewport(client,390,844);
   }
   if(['products','orders'].includes(route)){
     await evaluate(client,`document.querySelector('.admin-filter-trigger').click()`);
     await waitFor(client,`document.querySelector('.admin-filter-dialog')?.open`,'open filter');
     assert(await evaluate(client,`(()=>{const d=document.querySelector('.admin-filter-dialog').getBoundingClientRect();return d.width<=innerWidth&&d.height<=innerHeight})()`),'Filter sheet exceeds viewport');
     await setViewport(client,390,360);
     await waitFor(client,`document.documentElement.style.getPropertyValue('--admin-visible-height')==='360px'`,'reduced visible viewport');
     assert(await evaluate(client,`(()=>{const d=document.querySelector('.admin-filter-dialog').getBoundingClientRect();return d.top>=-1&&d.bottom<=innerHeight+1})()`),'Filter sheet does not fit the reduced visible viewport');
     await setViewport(client,390,844);
     await evaluate(client,`document.querySelector('.admin-filter-dialog footer .admin-primary').click()`);
     await waitFor(client,`!document.querySelector('.admin-filter-dialog')?.open && document.activeElement===document.querySelector('.admin-filter-trigger')`,'filter focus return');
   }
   if(route==='customers'){
     await evaluate(client,`document.querySelector('[aria-label="Pagination"] button:last-child').click()`);
     await waitFor(client,`document.querySelector('[aria-label="Pagination"] span')?.textContent.startsWith('2 /')`,'next page');
     assert(await evaluate(client,`getComputedStyle(document.querySelector('.admin-responsive-table tbody')).display==='grid'`),'Customers are not cards');
   }
   await saveScreenshot(client,process.env.ADMIN_DASHBOARD_SCREENSHOT_DIR,`admin-${route}.png`);
 }
 if(routes.includes('products')) {
 await navigate('products?new=1');
 await waitFor(client,`Boolean(document.querySelector('#product-editor-form .admin-mobile-section'))`,'editor',30000);
 assert(await evaluate(client,`(()=>{const d=[...document.querySelectorAll('.admin-mobile-section')].find(el=>el.querySelector('summary').textContent.includes('Images'));return !d.open && !!document.querySelector('button[form="product-editor-form"]')})()`),'Editor collapse/save unavailable');
 await evaluate(client,`[...document.querySelectorAll('.admin-mobile-section summary')].find(el=>el.textContent.includes('Images')).click()`);
 await waitFor(client,`[...document.querySelectorAll('.admin-mobile-section')].some(el=>el.open&&el.querySelector('summary').textContent.includes('Images'))`,'editor accordion');
 await checkWidths('product editor');
 assert(await evaluate(client,`(()=>{const d=[...document.querySelectorAll('.admin-mobile-section')].find(el=>el.querySelector('summary').textContent.includes('Couleurs'));return d.querySelector('.admin-section-body').getBoundingClientRect().height>0})()`),'Desktop editor section is hidden');
 await setViewport(client,390,844);
 await saveScreenshot(client,process.env.ADMIN_DASHBOARD_SCREENSHOT_DIR,'admin-product-editor.png');
 }
 const exceptions=client.events.filter(e=>e.method==='Runtime.exceptionThrown');
 assert(!exceptions.length,`Runtime errors: ${JSON.stringify(exceptions.map(e=>e.params.exceptionDetails.text))}`);
 console.log('Mobile admin workflow checks passed; writes were intercepted.');
}finally{
 client?.close();chrome.kill();
 if(path.resolve(profile).startsWith(path.resolve(os.tmpdir())+path.sep))await rm(profile,{recursive:true,force:true,maxRetries:4,retryDelay:150}).catch(()=>{});
}
