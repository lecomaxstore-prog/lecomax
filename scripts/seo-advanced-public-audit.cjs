// Public GET-only catalogue audit; no Search Console or indexing submissions.
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/Ziko/.codex/tools/playwright-mcp-0.0.83/node_modules/playwright');
const out=path.resolve('artifacts/seo-advanced-final-20261022');
(async()=>{
 const {sitemapReleaseUrls}=await import(pathToFileURL(path.resolve('release/seo-advanced-d-20261022/scripts/sitemap-release-urls.mjs')));
 const urls=await sitemapReleaseUrls(),browser=await chromium.launch({channel:'chrome',headless:true});
 const report={at:new Date().toISOString(),readOnly:true,pages:[],redirects:[],issues:[],fieldCWV:'UNVERIFIED'};
 try{
 const parser=await browser.newPage();
 for(const url of urls){
  const start=Date.now(),response=await fetch(url,{signal:AbortSignal.timeout(30000)}),html=await response.text();
  const page=await parser.evaluate(({html})=>{const d=new DOMParser().parseFromString(html,'text/html'),meta=n=>d.querySelector(`meta[name="${n}"]`)?.getAttribute('content'),og=n=>d.querySelector(`meta[property="og:${n}"]`)?.getAttribute('content');const schemas=[],schemaErrors=[];for(const el of d.querySelectorAll('script[type="application/ld+json"]'))try{const v=JSON.parse(el.textContent);schemas.push(...(Array.isArray(v)?v:v['@graph']||[v]));}catch(e){schemaErrors.push(String(e));}return {title:d.title,description:meta('description'),robots:meta('robots'),canonical:d.querySelector('link[rel=canonical]')?.getAttribute('href'),og:{title:og('title'),description:og('description'),url:og('url')},twitter:meta('twitter:card'),lang:d.documentElement.lang,hreflang:[...d.querySelectorAll('link[hreflang]')].map(x=>({lang:x.getAttribute('hreflang'),href:x.getAttribute('href')})),h1:[...d.querySelectorAll('h1')].map(x=>x.textContent),schemas,schemaErrors,images:[...d.images].map(x=>({src:x.getAttribute('src'),alt:x.getAttribute('alt')})),links:[...new Set([...d.querySelectorAll('a[href]')].map(x=>x.getAttribute('href')).filter(x=>x.startsWith('/')||x.startsWith('https://lecomax.com')))]};},{html});
  report.pages.push({url,status:response.status,finalUrl:response.url,elapsedMs:Date.now()-start,bytes:Buffer.byteLength(html),xRobots:response.headers.get('x-robots-tag'),...page});
  if(response.status!==200||!page.title||!page.description||page.canonical!==url||page.schemaErrors.length||/noindex/i.test((page.robots||'')+(response.headers.get('x-robots-tag')||'')))report.issues.push({url,kind:'status/metadata/canonical/indexability',status:response.status,canonical:page.canonical});
  const product=page.schemas.find(s=>s['@type']==='Product');if(url.includes('/produit/')){const offer=product?.offers; if(!product?.name||!product?.image?.length||!offer||!Number.isFinite(Number(offer.price))||Number(offer.price)<=0||offer.priceCurrency!=='MAD')report.issues.push({url,kind:'Product required name/image/Offer/price/currency'});}
 }
 const duplicate=key=>{const map=new Map();for(const p of report.pages){const value=p[key]?.trim();if(value)map.set(value,[...(map.get(value)||[]),p.url]);}return [...map].filter(([,urls])=>urls.length>1).map(([value,urls])=>({value,urls}));};
 report.duplicates={titles:duplicate('title'),descriptions:duplicate('description')};
 for(const url of ['http://lecomax.com/','https://www.lecomax.com/','https://lecomax.com/boutique','https://lecomax.com/boutique/?page=2','https://lecomax.com/ar/','https://lecomax.com/fr/','https://lecomax.com/produit/seo-audit-missing-20261022/']){const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(30000)});report.redirects.push({url,status:r.status,location:r.headers.get('location')});await r.body?.cancel();}
 report.schemaTypes=[...new Set(report.pages.flatMap(p=>p.schemas.map(s=>s['@type'])))];report.limitations=['Bounded advertised sitemap URL crawl; not a full link graph or Google Rich Results Test.','Latency is one unthrottled server fetch per URL, not field CWV.','No authenticated Search Console data or indexing submissions.'];
 }finally{await browser.close();fs.writeFileSync(path.join(out,'public-audit-'+Date.now()+'.json'),JSON.stringify(report,null,2),{flag:'wx'});}
 console.log(JSON.stringify({pages:report.pages.length,issues:report.issues,duplicateTitles:report.duplicates?.titles.length,duplicateDescriptions:report.duplicates?.descriptions.length,types:report.schemaTypes,redirects:report.redirects}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
