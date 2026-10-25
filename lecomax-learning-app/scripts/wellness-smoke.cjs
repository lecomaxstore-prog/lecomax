const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
const {load}=require('./inspect.cjs');const {initial}=load('lecomax-learning-app/utils/progress.ts');
const base=process.env.WELLNESS_URL||'http://localhost:8084';
async function main(){
 fs.mkdirSync('artifacts/wellness',{recursive:true});
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(s=>{if(!localStorage.getItem('lecomax-school-v1'))localStorage.setItem('lecomax-school-v1',JSON.stringify(s));},{...initial,language:'en',theme:'light'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/more');await page.getByRole('button',{name:'My Health Journey',exact:true}).click();
  await page.getByRole('checkbox',{name:'Drink water throughout the day'}).click();await page.getByRole('checkbox',{name:'Drink water throughout the day',checked:true}).waitFor();
  await page.reload();await page.getByRole('checkbox',{name:'Drink water throughout the day',checked:true}).waitFor();
  await page.getByRole('button',{name:'My daily check-in',exact:true}).click();await page.getByRole('button',{name:'🙂 Good',exact:true}).click();await page.getByRole('textbox',{name:'One thing that felt good… (optional)'}).fill('A quiet walk.');await page.getByRole('button',{name:'Save check-in',exact:true}).click();await page.getByText('Check-in saved.').waitFor();
  await page.getByRole('button',{name:'Preferences',exact:true}).click();await page.getByRole('button',{name:'Vegan',exact:true}).click();await page.getByRole('button',{name:'Save my preferences',exact:true}).click();
  await page.getByRole('button',{name:'◌ Food for today',exact:true}).click();const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('lecomax.wellness.v1')).days);await page.getByRole('button',{name:'Try an alternative',exact:true}).first().click();await page.waitForFunction(old=>JSON.stringify(JSON.parse(localStorage.getItem('lecomax.wellness.v1')).days)!==JSON.stringify(old),before);
  for(const name of ['↗ Body & movement','✦ Mind & memory','⌘ Learn something today','☾ Evening'])await page.getByRole('button',{name:new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))}).click();
  const boxes=page.getByRole('checkbox');for(let i=0;i<await boxes.count();i++)if(!await boxes.nth(i).isChecked())await boxes.nth(i).click();
  await page.getByText('100%',{exact:true}).waitFor();await page.getByText('🏆 First day',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Progress',exact:true}).click();await page.getByText('A quiet walk.',{exact:true}).waitFor();
  await page.goto(base+'/wellness/notifications');await page.getByRole('textbox').first().fill('99:00');await page.getByRole('button',{name:'Save reminders',exact:true}).click();await page.getByText('Use HH:MM, from 00:00 to 23:59.').waitFor();await page.getByRole('textbox').first().fill('09:10');await page.getByRole('button',{name:'Save reminders',exact:true}).click();await page.getByText('Preferences saved.',{exact:true}).waitFor();
  for(const language of ['en','ar','fr'])for(const theme of ['light','dark']){
   await page.evaluate(({language,theme})=>{const s=JSON.parse(localStorage.getItem('lecomax-school-v1'));localStorage.setItem('lecomax-school-v1',JSON.stringify({...s,language,theme}));},{language,theme});
   for(const route of ['/wellness','/wellness/preferences','/wellness/progress','/wellness/notifications','/more']){
    await page.goto(base+route);await page.getByRole('heading').first().waitFor();await page.getByRole('button').first().waitFor();
    for(const width of [320,390,768]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${language}/${theme}/${route}/${width}`);}
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:`artifacts/wellness/${language}-${theme}-${route.replaceAll('/','_')}.png`});
   }
  }
  assert.deepEqual(errors,[]);console.log('PASS: navigation, restart persistence, check-in, personalization, meal alternatives, 100% completion, achievement, progress history, reminder validation; 90 layout checks across 3 languages and 2 themes; no page errors.');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
