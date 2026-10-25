const fs = require('node:fs'); const path = require('node:path'); const assert = require('node:assert/strict');
const { chromium } = require('playwright'); const { load } = require('./inspect.cjs');
const { runtimeDocument, htmlDocument } = load('lecomax-learning-app/features/interactive/runtime-document.ts');
const bundle = require('../features/interactive/worker-bundle.json');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage(); const checks=[];
  try {
    await page.setContent('<iframe id="runtime" sandbox="allow-scripts"></iframe>');
    await page.evaluate(source=> {window.messages=[];window.addEventListener('message',e=>{if(e.source===document.querySelector('iframe').contentWindow) window.messages.push(e.data);});document.querySelector('iframe').srcdoc=source;},runtimeDocument(bundle));
    await page.waitForFunction(()=>window.messages.some(m=>m.type==='ready'));
    async function run(language,code,test=false) {
      await page.evaluate(data=>{window.messages=[];document.querySelector('iframe').contentWindow.postMessage({type:'run',...data},'*');},{language,code,test});
      await page.waitForFunction(()=>window.messages.some(m=>m.type==='result'),{},{timeout:15000});
      return page.evaluate(()=>window.messages.find(m=>m.type==='result').result);
    }
    let r=await run('javascript','function square(n){return n*n;} console.log("Hello L\'ECOMAX");',true);assert.equal(r.error,'');assert.equal(r.output,"Hello L'ECOMAX\n");assert.equal(r.tests.length,4);assert(r.tests.every(t=>t.passed));checks.push('JavaScript actual output and four runtime tests');
    r=await run('javascript','function square(n){return 16;}',true);assert(r.tests.some(t=>!t.passed));checks.push('Incorrect code fails tests');
    r=await run('javascript','console.log(typeof fetch,typeof process,typeof localStorage,typeof document,typeof require);');assert.equal(r.output,'undefined undefined undefined undefined undefined\n');checks.push('No network, Node, storage or app DOM capabilities');
    r=await run('typescript','const n: number = 4; console.log(n * n);');assert.equal(r.output,'16\n',JSON.stringify(r));checks.push('TypeScript transpilation and real execution');
    r=await run('typescript','const n: = ;');assert(r.error);checks.push('TypeScript syntax errors');
    r=await run('javascript','throw new Error("actual runtime failure");');assert.match(r.error,/actual runtime failure/);checks.push('Actual runtime errors');
    r=await run('javascript','while(true){}');assert.match(r.error,/interrupted|exceeded/i);checks.push('Infinite loop interrupted');
    r=await run('javascript','const a=[];while(true){a.push(new Array(10000).fill(1));}');assert.match(r.error,/memory|interrupted|exceeded/i);checks.push('Memory growth bounded');
    r=await run('sql',"SELECT name FROM customers WHERE city='Rabat' ORDER BY id;",true);assert.equal(r.error,'');assert(r.tests[0].passed);checks.push('SQLite actual query grading');
    r=await run('sql','SELECT customers.name,SUM(orders.total) FROM customers JOIN orders ON customers.id=orders.customer_id GROUP BY customers.id HAVING SUM(orders.total)>100;');assert.deepEqual(r.tables[0].values,[['Amina',200]]);checks.push('SQL JOIN GROUP BY HAVING');
    r=await run('sql','DROP TABLE customers;');r=await run('sql','SELECT COUNT(*) FROM customers;');assert.equal(r.tables[0].values[0][0],3);checks.push('Database reset between runs');
    r=await run('sql','SELECT nope FROM customers;');assert.match(r.error,/nope/);checks.push('SQL actual errors');
    r=await run('react','function App(){return <h1>Hello React</h1>}');assert.equal(r.error,'');assert.equal(r.output,'<h1>Hello React</h1>');checks.push('Actual React isolated static render');
    await page.evaluate(()=>{window.messages=[];document.querySelector('iframe').contentWindow.postMessage({type:'run',language:'sql',code:'WITH RECURSIVE x(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM x) SELECT sum(n) FROM x;'},'*');document.querySelector('iframe').contentWindow.postMessage({type:'stop'},'*');});
    r=await run('javascript','console.log(42)');assert.equal(r.output,'42\n');checks.push('Cancellation cleanup and next run');
    await page.evaluate(source=>{const frame=document.createElement('iframe');frame.id='preview';frame.setAttribute('sandbox','');frame.srcdoc=source;document.body.appendChild(frame);},htmlDocument('<h1>Page</h1><script>parent.postMessage({escaped:true},"*")</script>'));
    assert.equal(await page.locator('#preview').getAttribute('sandbox'),'');checks.push('HTML preview scripts disabled');
    fs.mkdirSync(path.resolve(__dirname,'../artifacts/interactive'),{recursive:true});fs.writeFileSync(path.resolve(__dirname,'../artifacts/interactive/runtime-results.json'),JSON.stringify({at:new Date().toISOString(),checks},null,2));console.log(checks.join('\n'));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
