// Preparation only: transport cannot call the generating /responses endpoint.
import { mkdirSync,writeFileSync,readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import OpenAI from 'openai';
import { editorialRequest,editorialSource,EDITORIAL_MODELS,maximumEditorialCost } from '../operations/seo-vercel/lib/seo-editorial.mjs';
const require=createRequire(import.meta.url);
if(process.argv.slice(2).join(' ')!=='--verify-access') throw Error('PREPARATION_ONLY_USE_VERIFY_ACCESS');
require('@next/env').loadEnvConfig(process.cwd(),false,{info(){},error(){}});
const directory=`artifacts/seo-premium/comparison-${Date.now()}`;
mkdirSync(directory,{recursive:true});
const save=(name,value)=>writeFileSync(`${directory}/${name}.json`,JSON.stringify(value,null,2),{flag:'wx'});
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const report={at:new Date().toISOString(),enabled:false,paidRequests:0,totalCeilingUsd:0.25,models:[],winner:null};
try {
  if(!process.env.OPENAI_API_KEY) throw Error('KEY_MISSING');
  const url=new URL('/rest/v1/products','https://yddqwgdgeljkzfsmtein.supabase.co');
  url.search=new URLSearchParams({select:'*',slug:'eq.c-baasploa-course-homme',limit:'2'}).toString();
  const response=await fetch(url,{headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY},redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok) throw Error('SOURCE_READ_FAILED');
  const rows=await response.json();
  if(rows.length!==1||rows[0].active!==true) throw Error('SOURCE_UNAVAILABLE');
  const source=editorialSource(rows[0]);
  save('source',{productId:rows[0].id,slug:rows[0].slug,source,sha256:hash(source),readOnly:true});
  report.sourceHash=hash(source);
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,baseURL:'https://api.openai.com/v1',maxRetries:0,timeout:15000,fetch:(url,init)=>{
    const u=new URL(String(url)),method=init?.method??'GET';
    if(u.origin!=='https://api.openai.com'||!(method==='GET'&&['/v1/models/gpt-6-astra','/v1/models/gpt-6-sol'].includes(u.pathname)||method==='POST'&&u.pathname==='/v1/responses/input_tokens')) throw Error('GENERATION_FORBIDDEN');
    return fetch(url,{...init,redirect:'error'});
  }});
  const requests=[];
  for(const tier of ['editorial-sol','premium']) {
    const request=editorialRequest(source,tier),config=EDITORIAL_MODELS[tier];
    const access=await client.models.retrieve(config.model);
    if(access.id!==config.model) throw Error('MODEL_ACCESS_UNVERIFIED');
    const count=await client.responses.inputTokens.count({model:request.model,input:request.input,reasoning:request.reasoning,text:request.text});
    const maximumUsd=maximumEditorialCost(tier,count.input_tokens);
    save(tier+'-request',request);
    requests.push(request);
    report.models.push({tier,model:config.model,accessVerified:true,requestHash:hash(request),countedInputTokens:count.input_tokens,inputAllowance:count.input_tokens+256,maxOutputTokens:request.max_output_tokens,reasoning:'low',maximumUsd,
      illustrativeUsd:(count.input_tokens*config.input*1.25+1000*config.output)/1e6,illustrativeOutputTokens:1000});
  }
  if(JSON.stringify({...requests[0],model:null})!==JSON.stringify({...requests[1],model:null})) throw Error('COMPARISON_NOT_IDENTICAL');
  report.maximumTotalUsd=report.models.reduce((sum,m)=>sum+m.maximumUsd,0);
  report.illustrativeTotalUsd=report.models.reduce((sum,m)=>sum+m.illustrativeUsd,0);
  report.knownPreviousCanaryUsd=JSON.parse(readFileSync('artifacts/seo-openai/approved-canary-one-20261019/assessment.json','utf8')).estimatedCostUsd;
  if(report.maximumTotalUsd>0.25||report.knownPreviousCanaryUsd+report.maximumTotalUsd>5) throw Error('COMPARISON_COST_BOUND');
  report.approvalRequired=true;
  report.requestCount=2;
  report.retries=0;
  report.mirai=false;
  report.publication=false;
  report.sourceAndPromptsIdentical=true;
  report.rubric={hardFailures:['invented facts','schema/length failure','French prose in Arabic outside preserved names','duplicates'],weightedScores:{factualSupport:40,languageFluency:30,searchRelevanceMorocco:20,distinctivenessAndUsefulness:10},method:'Blind A/B human review after both outputs are locally saved; do not infer winner from model name. Report incomplete/refused outputs and usage without retry.'};
  report.executionPrerequisites=['Explicit approval of this exact plan and maximum cost','Recheck source/request hashes and prices before paid execution','Isolated durable local $5 monthly/$50 cumulative budget including earlier canary and any reconciled external spend','Reserve the full combined maximum before either request; atomic single-use markers for each model','Exactly one request per model; no retries, no fallback provider; no production writes','Full output, response model, token usage, latency, quality violations and human assessment saved locally'];
} catch(error) { report.blocker=error?.status?`HTTP_${error.status}`:/^[A-Z_]+$/.test(error?.message??'')?error.message:'PREFLIGHT_UNVERIFIED';process.exitCode=1; }
save('plan',report);
console.log(JSON.stringify({directory,...report},null,2));
