import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { CdpClient, findChrome, waitForDevToolsFile, createSessionToken, evaluate, waitFor, setViewport, assert } from './ai-tutor-browser-support.mjs';
const base = process.env.COURSE_BASE_URL || 'http://127.0.0.1:3000';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Local browser test only');
const profile = await mkdtemp(path.join(os.tmpdir(),'lecomax-ai-tutor-'));
const chrome = spawn(await findChrome(), ['--headless=new','--disable-gpu','--no-sandbox','--no-first-run','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
let client, browser;
try {
  const [port,browserPath] = await waitForDevToolsFile(profile);
  browser = new CdpClient(`ws://127.0.0.1:${port}${browserPath}`); await browser.connect();
  await browser.send('Browser.grantPermissions',{origin:base,permissions:['clipboardReadWrite','clipboardSanitizedWrite']});
  const page = (await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json())).find(p=>p.type==='page');
  client = new CdpClient(page.webSocketDebuggerUrl); await client.connect();
  await Promise.all(['Page.enable','Runtime.enable','Network.enable'].map(method=>client.send(method)));
  await client.send('Page.bringToFront');
  for(const [name,identity] of [['admin_session',undefined],['how_built_access','how-built-pin@lecomax.local']]) await client.send('Network.setCookie',{name,value:await createSessionToken(identity),url:base,path:'/',httpOnly:true,sameSite:'Strict'});
  const fixture = function () {
    const original=window.fetch.bind(window);
    const state=JSON.parse(sessionStorage.getItem('ai-tutor-test')||'{"conversations":[],"messages":[],"progress":[],"calls":[]}');
    window.__tutorFixture=state;
    const save=()=>sessionStorage.setItem('ai-tutor-test',JSON.stringify(state));
    const json=(body,status=200)=>Promise.resolve(new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}}));
    window.fetch=(input,options={})=>{
      const url=new URL(typeof input==='string'?input:input.url,location.href);
      if(!url.pathname.startsWith('/api/admin/ai-tutor'))return original(input,options);
      const method=options.method||'GET',body=options.body?JSON.parse(options.body):{};
      state.calls.push({url:url.pathname,method,body});save();
      if(method==='GET'){
        const id=url.searchParams.get('conversation');
        return json(id?{conversation:state.conversations.find(c=>c.id===id),messages:state.messages.filter(m=>m.conversation_id===id)}:{conversations:state.conversations,progress:state.progress,bookmarks:state.messages.filter(m=>m.bookmarked),configured:true});
      }
      if(method==='PATCH'){
        if(body.action==='bookmark')state.messages.find(m=>m.id===body.messageId).bookmarked=body.value;
        if(body.action==='progress'){state.progress=state.progress.filter(p=>p.topic!==body.topic);state.progress.unshift({topic:body.topic,confidence:body.confidence,difficulty:body.difficulty,needs_practice:body.needsPractice,mistake_note:body.mistakeNote,completed_exercises:body.completedExercises,attempts:1,studied_turns:1,last_studied_at:new Date().toISOString()});}
        save();return json({ok:true});
      }
      if(url.pathname.endsWith('/message')){
        if(window.__failTutor){window.__failTutor=false;return json({error:'تعذر الوصول إلى الأستاذ. حاول مجددًا.'},503);}
        const id=crypto.randomUUID(),created_at=new Date().toISOString();
        const text='## نفهم الفكرة\n\n**await** ينتظر Promise. جرّب بنفسك ثم نراجع معًا.\n\n```tsx\nconst response = await fetch("/api/products");\nconst products = await response.json();\n// '+ 'long_code_'.repeat(45)+'\n```\n\n- اقرأ Response\n- تحقق من الخطأ\n\n<script>window.__injected=true</script>\n[unsafe](javascript:alert(1))';
        state.messages.push({id:crypto.randomUUID(),conversation_id:body.conversationId,role:'user',content:body.text,status:'complete',sources:[],bookmarked:false,created_at});
        const assistant={id,conversation_id:body.conversationId,role:'assistant',content:text,status:'complete',sources:[],bookmarked:false,created_at};
        const encoder=new TextEncoder();
        return Promise.resolve(new Response(new ReadableStream({async start(controller){
          controller.enqueue(encoder.encode(JSON.stringify({type:'start',messageId:id})+'\n'));
          for(let i=0;i<text.length;i+=100){await new Promise(r=>setTimeout(r,25));controller.enqueue(encoder.encode(JSON.stringify({type:'delta',text:text.slice(i,i+100)})+'\n'));}
          state.messages.push(assistant);save();controller.enqueue(encoder.encode(JSON.stringify({type:'done',messageId:id,sources:[]})+'\n'));controller.close();
        }}),{headers:{'Content-Type':'application/x-ndjson'}}));
      }
      const conversation={id:crypto.randomUUID(),title:body.title,mode:body.mode,topic:body.topic,updated_at:new Date().toISOString()};state.conversations.unshift(conversation);save();return json({conversation},201);
    };
  };
  await client.send('Page.addScriptToEvaluateOnNewDocument',{source:`(${fixture.toString()})()`});
  await setViewport(client,390,844);
  await client.send('Page.navigate',{url:base+'/admin/how-it-was-built/ai-tutor/'});
  await waitFor(client,`!!document.querySelector('[data-ai-tutor]') && !document.querySelector('[data-ai-tutor]').innerText.includes('جارٍ تحميل دروسك')`,'tutor ready',60000);
  const click=async text=>evaluate(client,`(()=>{const b=[...document.querySelectorAll('[data-ai-tutor] button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('Missing button');b.click();return true;})()`);
  const setInput=async(selector,value)=>evaluate(client,`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`);
  assert(await evaluate(client,`document.querySelector('[data-ai-tutor] nav').children.length===5 && getComputedStyle(document.querySelector('[data-ai-tutor]')).direction==='rtl'`),'five options and RTL');
  await setInput('#tutor-question','اشرح لي await');await click('أرسل ←');
  await waitFor(client,`document.querySelector('[data-ai-tutor]').innerText.includes('الأستاذ يفكر')`,'stream starts');
  await waitFor(client,`[...document.querySelectorAll('[data-ai-tutor] button')].some(b=>b.textContent==='☆ حفظ الشرح')`,'stream saves');
  assert(await evaluate(client,`!window.__injected && !document.querySelector('[data-ai-tutor] a[href^="javascript:"]')`),'Markdown executable content blocked');
  assert(await evaluate(client,`document.querySelector('[data-ai-tutor] pre').scrollWidth>document.querySelector('[data-ai-tutor] pre').clientWidth`),'long code scrolls internally');
  for(const width of [360,390,768,1440]){
    await setViewport(client,width,900);
    const overflow=await evaluate(client,`({page:document.documentElement.scrollWidth-innerWidth,main:document.querySelector('#admin-main').scrollWidth-document.querySelector('#admin-main').clientWidth})`);
    assert(overflow.page<=2&&overflow.main<=2,`overflow at ${width}: ${JSON.stringify(overflow)}`);
  }
  await click('نسخ الكود');await waitFor(client,`[...document.querySelectorAll('[data-ai-tutor] button')].some(b=>b.textContent==='تم النسخ ✓')`,'copy code');
  await click('☆ حفظ الشرح');await waitFor(client,`[...document.querySelectorAll('[data-ai-tutor] button')].some(b=>b.textContent==='★ شرح محفوظ')`,'bookmark');
  await evaluate(client,`[...document.querySelectorAll('[data-ai-tutor] summary')].find(s=>s.textContent==='افهم الكود وجرّب بنفسك').click()`);
  await setInput('[data-ai-tutor] input[type=number]', '2');await click('اشرح لي هذا السطر');
  await waitFor(client,`window.__tutorFixture.messages.filter(m=>m.role==='assistant').length===2 && !document.querySelector('[data-ai-tutor] [aria-busy=true]')`,'selected line explanation');
  assert(await evaluate(client,`window.__tutorFixture.calls.filter(c=>c.url.endsWith('/message')).at(-1).body.code.includes('Line 2:')`),'selected line sent with context');
  await click('شرح أبسط');await waitFor(client,`window.__tutorFixture.messages.filter(m=>m.role==='assistant').length===3 && !document.querySelector('[data-ai-tutor] [aria-busy=true]')`,'anchored follow up');
  assert(await evaluate(client,`window.__tutorFixture.calls.filter(c=>c.url.endsWith('/message')).at(-1).body.action==='easier' && !!window.__tutorFixture.calls.filter(c=>c.url.endsWith('/message')).at(-1).body.targetId`),'follow up targets correct answer');
  await click('سجّل فهمي');await waitFor(client,`!!document.querySelector('dialog[open]')`,'progress modal');
  await evaluate(client,`(()=>{const e=document.querySelector('dialog select');e.value='75';e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await click('حفظ تقدّمي');await waitFor(client,`!document.querySelector('dialog[open]')`,'progress saved');
  await click('＋ درس جديد');assert(await evaluate(client,`window.__tutorFixture.progress[0].confidence===75`),'new conversation preserves progress');
  await setInput('#tutor-question','علمني API');await click('أرسل ←');await waitFor(client,`window.__tutorFixture.conversations.length===2 && !document.querySelector('[data-ai-tutor] [aria-busy=true]')`,'second conversation');
  await click('جلساتي');await click('اشرح لي awaitأساسيات Next.js · '+new Date().toLocaleDateString('ar')).catch(async()=>{
    await evaluate(client,`[...document.querySelectorAll('[data-ai-tutor] button')].find(b=>b.querySelector('strong')?.textContent==='اشرح لي await').click()`);
  });
  await waitFor(client,`document.querySelector('[data-ai-tutor] [aria-label="المحادثة"]').children.length===6`,'history restored');
  await client.send('Page.reload');await waitFor(client,`!!document.querySelector('[data-ai-tutor]') && !document.querySelector('[data-ai-tutor]').innerText.includes('جارٍ تحميل دروسك')`,'reload');
  await click('شروحات محفوظة');await waitFor(client,`document.querySelector('[data-ai-tutor]').innerText.includes('إزالة من المحفوظات')`,'bookmark after reload');
  await click('＋ درس جديد');await setInput('#tutor-question','اختبر الخطأ');await evaluate(client,'window.__failTutor=true');await click('أرسل ←');await waitFor(client,`!!document.querySelector('[data-ai-tutor] [role=alert]')`,'friendly error');
  await click('حاول مجددًا');await waitFor(client,`!document.querySelector('[data-ai-tutor] [aria-busy=true]') && !!document.querySelector('[data-ai-tutor] pre')`,'retry');
  await setViewport(client,390,844);await evaluate(client,"document.getElementById('admin-main').scrollTo(0,0)");
  await mkdir('.source-library',{recursive:true});
  const screenshot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile('.source-library/ai-tutor-mobile.png',Buffer.from(screenshot.data,'base64'));
  const errors=client.events.filter(e=>e.method==='Runtime.exceptionThrown');assert(errors.length===0,'No uncaught browser errors');
  const requests=client.events.filter(e=>e.method==='Network.requestWillBeSent');
  assert(!requests.some(e=>e.params.request.url.includes('api.openai.com')),'No browser OpenAI call');
  const env=await readFile('.env.local','utf8');const secret=/^OPENAI_API_KEY=["']?([^\r\n"']+)/m.exec(env)?.[1];
  if(secret){assert(!JSON.stringify(requests).includes(secret),'No key in browser network data');const scripts=await evaluate(client,`[...document.scripts].map(s=>s.src).filter(s=>s.startsWith(location.origin))`);for(const url of scripts){assert(!(await fetch(url).then(r=>r.text())).includes(secret),'No key in browser bundle');}}
  console.log('PASS: five options, Arabic RTL, streaming, continuity, multiple sessions, bookmarks, progress, new lesson, copy, safe Markdown, long code, retry, 360/390/768/1440px, browser network/bundle key audit.');
} finally {
  client?.close();browser?.close();chrome.kill();
  if(path.resolve(profile).startsWith(path.resolve(os.tmpdir())+path.sep))await rm(profile,{recursive:true,force:true,maxRetries:4,retryDelay:200}).catch(()=>{});
}
