const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {load} = require('./inspect.cjs');
const {initial} = load('lecomax-learning-app/utils/progress.ts');
const engine = load('lecomax-learning-app/features/wellness/engine.ts');
const {lessons} = load('lecomax-learning-app/features/wellness/data.ts');
const {lessonGuides} = load('lecomax-learning-app/features/wellness/lesson-guides.ts');
async function main(){
 const browser = await chromium.launch({headless:true,channel:'msedge'});
 fs.mkdirSync('artifacts/wellness-lessons',{recursive:true});
 try{
  for(const language of ['en','ar','fr']){
   const context=await browser.newContext({viewport:{width:390,height:844}});
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   let journey=engine.ensureDay(engine.initialJourney(),engine.dateKey());
   journey.preferences.onboarded=true;
   await context.addInitScript(({school,journey})=>{if(!localStorage.getItem('lecomax-school-v1'))localStorage.setItem('lecomax-school-v1',JSON.stringify(school));if(!localStorage.getItem('lecomax.wellness.v1'))localStorage.setItem('lecomax.wellness.v1',JSON.stringify(journey));},{school:{...initial,language,theme:language==='ar'?'dark':'light'},journey});
   for(const lesson of lessons){
    await page.goto((process.env.WELLNESS_URL||'http://localhost:8083')+'/wellness');
    await page.getByRole('heading').first().waitFor();
    await page.evaluate(({id,key})=>{const s=JSON.parse(localStorage.getItem('lecomax.wellness.v1'));s.days[key].plan.lesson=id;localStorage.setItem('lecomax.wellness.v1',JSON.stringify(s));},{id:lesson.id,key:engine.dateKey()});
    await page.reload();
    await page.getByRole('button',{name:{en:'⌘ Learn something today',ar:'⌘ تعلم شيئاً اليوم',fr:'⌘ Apprendre aujourd’hui'}[language],exact:true}).click();
    const guide=lessonGuides[lesson.category];
    await page.getByText(guide.simple[language],{exact:true}).waitFor();
    await page.getByRole('button',{name:{en:'Make it even simpler',ar:'اشرحها ببساطة أكثر',fr:'Encore plus simple'}[language],exact:true}).click();
    await page.getByText(guide.takeaway[language],{exact:true}).waitFor();
    await page.getByRole('button',{name:/^2\. /}).click();
    await page.getByText(guide.example[language],{exact:true}).waitFor();
    if(lesson.id==='habits'){await page.getByText(guide.example[language],{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:`artifacts/wellness-lessons/${language}-example.png`});}
    await page.getByRole('button',{name:/^3\. /}).click();
    const task=page.getByRole('checkbox',{name:`1. ${guide.steps[0][language]}`,exact:true});await task.click();assert.equal(await task.getAttribute('aria-checked'),'true');
    await page.getByRole('button',{name:/^4\. /}).click();
    const wrong=(guide.correct+1)%guide.choices.length;
    await page.getByRole('radio',{name:guide.choices[wrong].text[language],exact:true}).click();await page.getByText(guide.choices[wrong].feedback[language],{exact:true}).waitFor();
    await page.getByRole('radio',{name:guide.choices[guide.correct].text[language],exact:true}).click();await page.getByText(guide.choices[guide.correct].feedback[language],{exact:true}).waitFor();
    for(const width of [320,768]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
    await page.setViewportSize({width:390,height:844});
   }
   assert.deepEqual(errors,[]);await context.close();console.log(`PASS: all 8 guided lessons, ${language}: simplification, example, practice, incorrect/correct feedback and narrow/wide layouts.`);
  }
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
