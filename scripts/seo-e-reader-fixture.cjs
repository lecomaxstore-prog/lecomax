// Loopback-only runtime acceptance adapter. Never connects to a real database.
require('../artifacts/seo-fix-integration-20261021/fixture-fetch.cjs');
const fs=require('fs'),path=require('path');
const original=globalThis.fetch,file=path.resolve(__dirname,'../artifacts/seo-e-final-20261022/reader-state.json');
globalThis.fetch=async(input,init={})=>{
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url),method=(init.method||'GET').toUpperCase();
 if(url.origin!=='http://127.0.0.1:9')throw Error('LOCAL_ONLY');
 if(!url.pathname.startsWith('/rest/v1/seo_documents')&&!url.pathname.startsWith('/rest/v1/rpc/save_seo_document'))return original(input,init);
 const state=JSON.parse(fs.readFileSync(file));
 async function doc(locale){const slug='seo-fixture-'+locale,rows=await(await original('http://127.0.0.1:9/rest/v1/products?slug=eq.'+slug)).json();const p=rows[0],source=Object.fromEntries(['name','description','category','slug','brand','images'].map(k=>[k,p[k]]));return {kind:'product',entity_id:p.id,slug,active:true,version:state.version,source,published_source:state[locale]==='stale'?{...source,name:'old facts'}:source,fallback:{title:'Fallback '+locale,description:'Synthetic fallback description',imageAlt:'Synthetic image'},draft:{title:'PRIVATE_DRAFT_SENTINEL',description:'PRIVATE_DRAFT_SENTINEL',imageAlt:'PRIVATE_DRAFT_SENTINEL'},published:state[locale]==='published'||state[locale]==='stale'?{title:'APPROVED_E_'+locale,description:'Approved synthetic metadata for local acceptance',imageAlt:'Approved synthetic image'}:null};}
 if(url.pathname.endsWith('/rpc/save_seo_document')){if(method!=='POST')throw Error('METHOD');const b=JSON.parse(init.body);if(b.p_kind!=='product'||!['approve','reset'].includes(b.p_action)||b.p_entity_id!=='seo-fixture-fr')throw Error('FIXTURE_OPERATION_DENIED');state.fr=b.p_action==='approve'?'published':'draft';state.version++;fs.writeFileSync(file,JSON.stringify(state));return Response.json(await doc('fr'));}
 if(method!=='GET')throw Error('METHOD');let rows=await Promise.all(['fr','ar'].map(doc));rows=rows.filter(r=>[...url.searchParams].every(([k,v])=>!v.startsWith('eq.')||String(r[k])===v.slice(3)));
 const selection=url.searchParams.get('select');if(selection&&selection!=='*')rows=rows.map(r=>Object.fromEntries(selection.split(',').map(k=>[k,r[k]??null])));
 const headers=new Headers(init.headers);return Response.json((headers.get('accept')||'').includes('vnd.pgrst.object')?rows[0]||null:rows);
};
