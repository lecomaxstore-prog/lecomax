const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('fs'), assert=require('node:assert/strict');
const {initial}=require('./inspect.cjs').load('lecomax-learning-app/utils/progress.ts');
(async()=>{
const browser=await chromium.launch({headless:true,channel:'msedge'});const results=[];
try {for(const language of ['ar','en','fr']) for(const theme of ['light','dark']) {
 const context=await browser.newContext();
 await context.addInitScript(s=>localStorage.setItem('lecomax-school-v1',JSON.stringify(s)),{...initial,language,theme});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Disposable synthetic session: intercept auth locally; never contact the real API.
 await page.route('**/api/learning-mobile/**', route => route.fulfill({ json: route.request().url().endsWith('/auth') ? { challenge: 'test' } : { accessToken: 'test', refreshToken: 'test', expiresAt: Date.now()+3600000, sessionId: 'test', remembered: false }, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } }));
 await page.goto('http://localhost:8081/course/academy-foundations');
 await page.getByRole('textbox').first().fill('test@example.invalid');
 await page.locator('input[type="password"]').fill('synthetic-test');
 await page.getByRole('button',{name: {ar:'تسجيل الدخول',en:'Sign in',fr:'Se connecter'}[language],exact:true}).click();
 await page.getByRole('button',{name: {ar:'لا، لهذه الجلسة فقط',en:'No, just this session',fr:'Non, cette session seulement'}[language],exact:true}).click();
 const labels={en:['Lessons','Practice','Preparation','Before you start','Open workshop','All course lessons'],fr:['Leçons','Pratique','Préparation','Avant de commencer','Ouvrir l’atelier','Toutes les leçons'],ar:['الدروس','التطبيق','الاستعداد','قبل ما تبدا','حل الورشة','جميع دروس الدورة']}[language];
 await page.getByRole('button',{name:labels[0],exact:true}).waitFor({timeout:60000});
 for(const width of [320,390,768,1280]) {
 await page.setViewportSize({width,height:900});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${language}/${theme}/${width}`);results.push({language,theme,width});
 }
 await page.setViewportSize({width:390,height:844});fs.mkdirSync('artifacts/academy-workspace',{recursive:true});
 await page.screenshot({path:`artifacts/academy-workspace/${language}-${theme}.png`,fullPage:true});
 await page.getByRole('button',{name:labels[2],exact:true}).click();assert(await page.getByText(labels[3],{exact:true}).isVisible());
 await page.getByRole('button',{name:labels[1],exact:true}).click();await page.getByRole('button',{name:labels[4],exact:true}).click();
 await page.getByRole('button',{name:labels[0],exact:true}).click();assert(await page.getByText(labels[5],{exact:true}).isVisible());
 await page.getByRole('button',{name:labels[1],exact:true}).click();assert.equal(await page.getByRole('button',{name:labels[4],exact:true}).count(),0);
 await page.screenshot({path:`artifacts/academy-workspace/${language}-${theme}-practice.png`});
 await page.getByRole('button',{name:labels[0],exact:true}).click();
 await page.getByText(labels[5],{exact:true}).scrollIntoViewIfNeeded();
 await page.screenshot({path:`artifacts/academy-workspace/${language}-${theme}-lessons.png`});
 if(language==='en') {
   await page.getByRole('button',{name:'Completed · 0',exact:true}).click();
   assert(await page.getByText('No matching lessons.',{exact:true}).isVisible());
   await page.getByRole('button',{name:'Clear search',exact:true}).last().click();
   const search=page.getByPlaceholder('Search course lessons…');
   await search.fill('not-a-real-lesson');
   await page.getByRole('button',{name:labels[2],exact:true}).click();
   await page.getByRole('button',{name:labels[0],exact:true}).click();
   assert.equal(await search.inputValue(),'not-a-real-lesson');
   await page.getByRole('button',{name:'Clear search',exact:true}).last().click();
   await page.getByRole('button',{name:'Start this course',exact:true}).click();
   await page.waitForURL('**/lesson/academy-computer?course=academy-foundations');
 }
 assert.deepEqual(errors,[]);await context.close();
 }fs.writeFileSync('artifacts/academy-workspace/checks.json',JSON.stringify(results,null,2));console.log('PASS: 24 responsive checks, 3 languages, 2 themes, section navigation, preserved workshop expansion, no page errors.');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
