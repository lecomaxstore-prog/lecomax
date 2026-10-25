import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { assessEditorial } from '../operations/seo-vercel/lib/seo-editorial-quality.mjs';
import { editorialRequestV3 } from '../operations/seo-vercel/lib/seo-editorial-v3.mjs';
import { shoeFixture,bottleFixture,chargerFixture,savedSource,savedResults } from '../operations/seo-vercel/tests/editorial-quality-fixtures.mjs';
// No SDK/client/env loading. This evaluates rules and prompt snapshots, not new model outputs.
globalThis.fetch=()=>{throw Error('OFFLINE_ONLY');};
const dir='artifacts/seo-quality';mkdirSync(dir,{recursive:true});
const saved=savedResults.map((draft,i)=>({label:i?'saved-astra':'saved-sol61',source:savedSource,draft,kind:'historical-model-output'}));
const fixtures=[shoeFixture(),bottleFixture(),chargerFixture()].map((f,i)=>({...f,label:['hand-authored-shoe','hand-authored-bottle','hand-authored-charger'][i],kind:'hand-authored-local-fixture'}));
const results=[...saved,...fixtures].map(f=>({label:f.label,kind:f.kind,quality:assessEditorial(f.draft,f.source)}));
const request=editorialRequestV3(savedSource);
const report={at:new Date().toISOString(),paidRequests:0,networkRequests:0,results,promptSha256:createHash('sha256').update(request.input[0].content).digest('hex'),promptBytes:Buffer.byteLength(JSON.stringify(request),'utf8'),tokenCount:null,limitation:'No revised-prompt generation was performed. Passing handcrafted fixtures establishes rule behavior, not improved model quality. Runtime must count the longer prompt and reserve funds before any separately approved generation.'};
const stamp=Date.now();writeFileSync(`${dir}/offline-evaluation-${stamp}.json`,JSON.stringify(report,null,2),{flag:'wx'});
writeFileSync(`${dir}/prompt-snapshot-${stamp}.json`,JSON.stringify(request,null,2),{flag:'wx'});
// Preserve hashes of actual paid results; never rewrite them.
const files=['source','result-0','result-1','response-0','response-1','assessment','reservation','settlement'];
writeFileSync(`${dir}/comparison-integrity-${stamp}.json`,JSON.stringify(files.map(name=>({file:`${name}.json`,sha256:createHash('sha256').update(readFileSync(`artifacts/seo-premium/approved-sol61-astra-20261019/${name}.json`)).digest('hex')})),null,2),{flag:'wx'});
console.log(JSON.stringify(report,null,2));
