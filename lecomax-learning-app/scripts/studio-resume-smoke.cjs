const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('fs'), assert=require('node:assert/strict');
const {initial}=require('./inspect.cjs').load('lecomax-learning-app/utils/progress.ts');
(async()=>{
const browser=await chromium.launch({headless:true,channel:'msedge'});const results=[];
try {for(const language of ['ar','en','fr']) for(const theme of ['light','dark']) {
 const context=await browser.newContext();
 await context.addInitScript(s=>{if(!localStorage.getItem('lecomax-school-v1'))localStorage.setItem('lecomax-school-v1',JSON.stringify(s))},{...initial,language,theme});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Disposable synthetic session: intercept auth locally; never contact the real API.
 await page.route('**/api/learning-mobile/**', route => route.fulfill({ json: route.request().url().endsWith('/auth') ? { challenge: 'test' } : { accessToken: 'test', refreshToken: 'test', expiresAt: Date.now()+3600000, sessionId: 'test', remembered: false }, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } }));
 await page.goto('http://localhost:8081/course/academy-foundations');
 async function login() {
 await page.getByRole('textbox').first().fill('test@example.invalid');
 await page.locator('input[type="password"]').fill('synthetic-test');
 await page.getByRole('button',{name: {ar:'تسجيل الدخول',en:'Sign in',fr:'Se connecter'}[language],exact:true}).click();
 await page.getByRole('button',{name: {ar:'لا، لهذه الجلسة فقط',en:'No, just this session',fr:'Non, cette session seulement'}[language],exact:true}).click();
 }
 await login();

 const home={en:'Enter my classroom',fr:'Entrer dans ma leçon',ar:'ادخل لدرسك'}[language];
 await page.goto('http://localhost:8081/'); await login();
 await page.getByRole('button',{name:home,exact:true}).waitFor({timeout:60000});
 fs.mkdirSync('artifacts/studio-resume',{recursive:true});
 for(const route of ['/','/path']) {
  await page.goto('http://localhost:8081'+route); await login();
  await page.getByRole('button',{name:route==='/'?home:{en:'Library',fr:'Bibliothèque',ar:'المكتبة'}[language],exact:true}).waitFor();
  for(const width of [320,390,768,1280]) {
   await page.setViewportSize({width,height:900});
   await page.waitForTimeout(250);
   const overflow=await page.evaluate(()=>[...document.querySelectorAll('div,input')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&s.position!=='absolute'&&(r.right>innerWidth+2||r.left < -2)}).slice(0,8).map(e=>({text:e.textContent.slice(0,60),width:e.getBoundingClientRect().width})));
   assert.deepEqual(overflow,[],language+'/'+theme+'/'+route+'/'+width);
   results.push({language,theme,route,width});
   if(width===390||width===1280) await page.screenshot({path:'artifacts/studio-resume/'+language+'-'+theme+'-'+(route==='/'?'home':'paths')+'-'+width+'.png'});
  }
 }
 if(language==='en') {
  await page.getByPlaceholder('Search for a topic…').fill('zzzz-no-topic');
  await page.getByText('No matching paths',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Reset filters',exact:true}).click();
  await page.getByRole('button',{name:'Start from zero',exact:true}).click();
  await page.goto('http://localhost:8081/'); await login();
  await page.getByRole('button',{name:'60 min',exact:true}).click();
  await page.reload(); await login();
  await page.getByRole('button',{name:'60 min',exact:true}).waitFor();
  assert.equal(JSON.parse(await page.evaluate(()=>localStorage.getItem('lecomax-school-v1'))).drafts['studio:minutes'],'60');
  await page.getByRole('button',{name:'Try it in your project',exact:true}).click();
  await page.getByRole('button',{name:'Open workshop',exact:true}).waitFor();
  await page.getByRole('button',{name:'Open workshop',exact:true}).click();
  await page.screenshot({path:'artifacts/studio-resume/practice-'+theme+'.png'});
  await page.goto('http://localhost:8081/'); await login();
  await page.getByRole('button',{name:home,exact:true}).click();
  await page.getByText('Find the main idea and explain it in your own words.',{exact:true}).waitFor();
  await page.getByRole('tab',{name:'3. Practice',exact:true}).click();
  await page.getByText('Try it yourself, then use the hints if you need them.',{exact:true}).waitFor();
  await page.screenshot({path:'artifacts/studio-resume/lesson-'+theme+'.png'});
 }
 assert.deepEqual(errors,[]); await context.close();
} fs.writeFileSync('artifacts/studio-resume/checks.json',JSON.stringify(results,null,2));console.log('PASS: '+results.length+' responsive checks; search reset, stored session budget, practice deep link and lesson guidance.');
} finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
