const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Ziko/.codex/tools/playwright-mcp-0.0.83/node_modules/playwright');
const stage=process.argv[2];assert(['d','e'].includes(stage));const origin='http://127.0.0.1:'+(stage==='d'?'31941':'31942'),dir=path.resolve('artifacts/seo-advanced-final-20261022',stage);
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),result={at:new Date().toISOString(),stage,synthetic:true,pages:[],api:[],passed:false};try{
 const context=await browser.newContext();await context.route('**/*',route=>new URL(route.request().url()).origin===origin&&['GET','HEAD'].includes(route.request().method())?route.continue():route.abort());const page=await context.newPage();const exceptions=[];page.on('pageerror',e=>exceptions.push(e.message));
 for(const width of [390,1440]){await page.setViewportSize({width,height:900});for(const route of ['/','/boutique/','/produit/seo-fixture-fr/','/produit/seo-fixture-ar/','/seo-fixture-category-fr/','/seo-fixture-category-ar/']){
  const r=await page.goto(origin+route,{waitUntil:'domcontentloaded'});await page.waitForTimeout(500);
  const data=await page.evaluate(()=>({title:document.title,description:document.querySelector('meta[name=description]')?.content,canonical:document.querySelector('link[rel=canonical]')?.href,h1:document.querySelectorAll('h1').length,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,schemas:[...document.querySelectorAll('script[type="application/ld+json"]')].map(x=>JSON.parse(x.textContent))}));
  const p={route,status:r.status(),...data};result.pages.push(p);assert.equal(p.status,200);assert(p.title&&p.description);assert.equal(p.canonical,'https://lecomax.com'+route);assert(p.schemas.length>0);assert(p.scrollWidth<=p.width);
 }}
 for(const route of ['/sitemap.xml','/sitemaps/static/','/sitemaps/products/0/','/sitemaps/categories/0/','/robots.txt','/checkout/']){const r=await context.request.get(origin+route);assert.equal(r.status(),200,route);result.api.push({route,status:r.status()});}
 for(const route of ['/api/admin/seo','/api/admin/seo/ai','/api/admin/seo/editorial','/api/admin/seo/sync'])if(stage==='e'){const r=await context.request.get(origin+route);assert.equal(r.status(),401,route);result.api.push({route,status:r.status()});}
 const missing=await context.request.get(origin+'/produit/absent-fixture/');assert.equal(missing.status(),404);
 result.exceptions=exceptions;assert.equal(exceptions.length,0);result.passed=true;
 result.limitations=['Synthetic FR/AR product data; no real Arabic locale routes.','External browser requests and mutations blocked. No genuine owner session or hosted schema proof.','Fixture schema absence exercises fail-safe deterministic metadata, while stored/reviewed content is covered by unit and SQL tests.'];
 }catch(e){result.error=e.message;process.exitCode=1;}finally{await browser.close();fs.writeFileSync(path.join(dir,'browser-'+Date.now()+'.json'),JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({stage,passed:result.passed,pages:result.pages.length,error:result.error}));}})();
