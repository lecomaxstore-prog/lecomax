import test from 'node:test';
import assert from 'node:assert/strict';
import OpenAI from 'openai';
import { generateBundle, deterministicBundle, validBundle, estimatedCost } from '../lib/seo-ai-provider.mjs';
const source={name:'Casque Atlas',brand:'Atlas',category:'audio',slug:'casque',active:true};
const job={payload:source,tier:'routine',primary_reserve:0.01,fallback_reserve:0.05,allow_fallback:false};
const env={OPENAI_API_KEY:'mock-openai-key'};
test('unsupported and inherited tier names reject before constructing a provider client',async()=>{
  for(const tier of ['toString','constructor','__proto__','hasOwnProperty','unknown',null,undefined,{},['routine']]) {
    let calls=0;
    await assert.rejects(generateBundle({...job,tier},{env,makeClient:()=>{
      calls++;throw Error('provider must not be constructed');
    }}),/SEO_TIER_INVALID/);
    assert.equal(calls,0);
  }
});
function clientFactory(mode='success',calls=[]) {
  return options=>new OpenAI({...options,fetch:async(url,init)=>{
    const body=JSON.parse(init.body);calls.push({url:String(url),body,options});
    if(mode==='timeout')throw Error('mock-openai-key');
    if(mode==='http')return Response.json({error:{message:'secret provider body'}},{status:429});
    let bundle=deterministicBundle(source);
    if(mode==='invented')bundle.fr.title='iPhone gratuit en stock';
    if(mode==='extra')bundle.ar.secret='unexpected';
    return Response.json({id:'resp_fixture',object:'response',created_at:1,status:mode==='incomplete'?'incomplete':'completed',model:body.model,
      output:mode==='refusal'?[{type:'message',role:'assistant',content:[{type:'refusal',refusal:'refused'}]}]:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(bundle),annotations:[]}]}],
      usage:{input_tokens:1000,input_tokens_details:{cached_tokens:200},output_tokens:400,total_tokens:1400}});
  }});
}
test('official SDK uses exact Luna/Sol IDs, strict JSON, official origin and no automatic retries',async()=>{
  for(const tier of ['routine','advanced']) {
    const calls=[];const result=await generateBundle({...job,tier,primary_reserve:tier==='routine'?0.01:0.1},{env,makeClient:clientFactory('success',calls)});
    assert.equal(result.provider,'openai');assert.ok(validBundle(result.bundle,source));assert.equal(calls.length,1);
    assert.equal(calls[0].url,'https://api.openai.com/v1/responses');assert.equal(calls[0].body.model,tier==='routine'?'gpt-6-luna':'gpt-6-sol');
    assert.equal(calls[0].body.text.format.strict,true);assert.equal(calls[0].body.store,false);assert.equal(calls[0].body.max_output_tokens,1200);
    assert.equal(calls[0].options.maxRetries,0);assert.equal(result.usage[0].input,1000);assert.equal(result.usage[0].cached,200);
    assert.equal(calls[0].body.reasoning.effort,tier==='routine'?'none':'low');
  }
});
test('invalid, refused, incomplete, rate-limited and uncertain outputs fall back without leaking secrets',async()=>{
  for(const mode of ['invented','extra','refusal','incomplete','http','timeout']) {
    const calls=[];const result=await generateBundle(job,{env,makeClient:clientFactory(mode,calls)});
    assert.equal(result.provider,'deterministic');assert.equal(calls.length,1);assert.ok(validBundle(result.bundle,source));
    assert.doesNotMatch(JSON.stringify(result),/mock-openai-key|secret provider|iPhone/);
    if(['http','timeout'].includes(mode))assert.equal(result.usage[0].usd,0.01);
  }
});
test('unknown keys, keywords, numbers, brands and availability cannot escape candidate allowlists',()=>{
  for(const mutate of [b=>b.fr.keywords.push('Apple'),b=>b.ar.description='متوفر بسعر 99',b=>b.fr.title='Garantie 10 ans',b=>b.extra='x']) {
    const bundle=deterministicBundle(source);mutate(bundle);assert.equal(validBundle(bundle,source),false);
  }
});
test('missing keys make no provider request; cached-token pricing is bounded and explicit',async()=>{
  const result=await generateBundle(job,{env:{},makeClient:()=>{throw Error('must not call');}});
  assert.equal(result.provider,'deterministic');assert.deepEqual(result.usage,[]);
  assert.equal(estimatedCost('routine',{input_tokens:1000,output_tokens:400,input_tokens_details:{cached_tokens:200}}).usd,0.000302);
  assert.equal(estimatedCost('advanced',{input_tokens:1000,output_tokens:400}).usd,0.0065);
  assert.equal(estimatedCost('routine',{input_tokens:1,output_tokens:1,input_tokens_details:{cached_tokens:2}}),null);
});
test('Mirai is separately opted in and reserved; invalid fallback remains deterministic',async()=>{
  for(const valid of [true,false]) {
    const calls=[];
    const result=await generateBundle({...job,allow_fallback:true},{env:{...env,SEO_MIRAI_FALLBACK_ENABLED:'true',SEO_AI_API_KEY:'mock-mirai-key',SEO_AI_BASE_URL:'https://mirai.invalid/v1',SEO_AI_MODEL:'configured-model'},makeClient:options=>new OpenAI({...options,fetch:async(url,init)=>{
      calls.push(String(url));
      if(String(url).includes('api.openai.com'))return Response.json({error:{message:'unavailable'}},{status:503});
      return Response.json({id:'fixture',object:'chat.completion',created:1,model:'configured-model',choices:[{finish_reason:'stop',message:{role:'assistant',content:JSON.stringify(valid?deterministicBundle(source):{invented:true})}}],usage:{prompt_tokens:50,completion_tokens:100}});
    }})});
    assert.equal(calls.length,2);assert.equal(result.provider,valid?'mirai':'deterministic');assert.equal(result.usage.length,2);
    assert.equal(result.usage[1].usd,0.05);assert.equal(result.usage[1].input,50);
  }
});
