import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:3102';
const get = async url => {
  const response = await fetch(url, {signal:AbortSignal.timeout(60000)});
  return {status:response.status, body:await response.text()};
};
const catalogue = await get(base+'/api/products?active=true');
if(catalogue.status!==200)throw Error('Live catalogue unavailable');
const products=JSON.parse(catalogue.body), results=[];
for(let i=0;i<products.length;i+=3){
  await Promise.all(products.slice(i,i+3).map(async product=>{
    const page=await get(base+'/produit/'+encodeURIComponent(product.slug)+'/');
    const title=/<title>(.*?)<\/title>/.exec(page.body)?.[1];
    const canonical=/<link rel="canonical" href="([^"]+)"/.exec(page.body)?.[1];
    const schemas=[...page.body.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(match=>{try{return [JSON.parse(match[1])];}catch{return [];}});
    results.push({slug:product.slug,status:page.status,title,canonical,productSchema:schemas.some(s=>s['@type']==='Product'),images:(product.images??[]).length});
  }));
}
await mkdir('out/storefront-audit',{recursive:true});
await writeFile('out/storefront-audit/catalog.json',JSON.stringify(results,null,2));
const failures=results.filter(r=>r.status!==200 || !r.title || !r.canonical?.includes('/produit/'+encodeURIComponent(r.slug)+'/') || !r.productSchema || !r.images);
console.log(JSON.stringify({products:products.length,failures},null,2));
if(failures.length)process.exitCode=1;
