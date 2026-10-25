const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const {load}=require('../scripts/inspect.cjs');
test('Q&A route enforces auth, rate limits, consent, no-evidence and source validation',async()=>{
 let owner='owner',limited=null,body={question:'returns',document:'Returns within 14 days.',consent:true},calls=0;
 let answer='{"answer":"14 days","sourceIds":["source-1"]}';
 const base='lecomax-learning-app/features/ai-university/';
 const deps={
  '@/lib/learning-mobile-auth':{mobileOwner:async()=>owner,mobileJson:(data,status=200)=>({data,status})},
  '@/lib/request-body':{readJsonLimited:async(_req,limit)=>{assert.equal(limit,60000);return body;}},
  '@/lib/sensitive-rate-limit':{sensitiveRateLimit:async()=>limited},
  '@/lib/ai-tutor-security':{assertTutorContentSafe:()=>{}},
  '@/lib/openai-server':{generateOpenAIReply:async options=>{calls++;assert.equal(options.maxOutputTokens,600);assert.equal(options.timeoutMs,20000);return answer;}},
  '@/lecomax-learning-app/features/ai-university/project-contract':load(base+'project-contract.ts'),
  '@/lecomax-learning-app/features/ai-university/retrieval':load(base+'retrieval.ts'),
 };
 // Match the application's single Error realm across isolated test modules.
 const contract=deps['@/lecomax-learning-app/features/ai-university/project-contract'];
 const parse=contract.parseGroundedAnswer;contract.parseGroundedAnswer=(...args)=>{try{return parse(...args);}catch(e){throw new Error(e.message);}};
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('../app/api/learning-mobile/ai-university/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,Error,require:n=>{assert(n in deps,n);return deps[n];}});
 owner=null;assert.equal((await exports.POST({})).status,401);assert.equal(calls,0);
 owner='owner';limited={status:429};assert.equal((await exports.POST({})).status,429);assert.equal(calls,0);
 limited=null;body.consent=false;assert.equal((await exports.POST({})).status,400);assert.equal(calls,0);
 body.consent=true;body.question='volcano';assert.equal((await exports.POST({})).data.mode,'no-evidence');assert.equal(calls,0);
 body.question='returns';assert.equal((await exports.POST({})).data.mode,'live');assert.equal(calls,1);
 answer='{"answer":"made up","sourceIds":["missing"]}';assert.equal((await exports.POST({})).data.error,'UNSUPPORTED_ANSWER');
 answer='invalid JSON';assert.equal((await exports.POST({})).status,503);
});
