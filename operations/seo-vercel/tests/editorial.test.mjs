import test from 'node:test';
import assert from 'node:assert/strict';
import OpenAI from 'openai';
import {source,bundle} from './editorial-fixture.mjs';
import {generateBundle} from '../lib/seo-ai-provider.mjs';
import {EDITORIAL_MODELS,editorialRequest,validateEditorial,maximumEditorialCost} from '../lib/seo-editorial.mjs';
test('editorial quality accepts bilingual grounded copy and blocks factual, language, schema and duplicate failures',()=>{
  assert.deepEqual(validateEditorial(bundle(),source).errors,[]);
  for(const mutate of [b=>b.fr.title='x'.repeat(66),b=>b.ar.description=b.fr.description,b=>b.fr.productDescription+=' Cuir véritable.',b=>b.fr.productDescription+=' Poids 99 kg.',b=>b.fr.productDescription+=' Livraison gratuite.',b=>b.fr.keywords.push(b.fr.keywords[0]),b=>b.evidence[0].sourceQuote='made up evidence',b=>b.fr.extra='untrusted',b=>b.ar.productDescription=b.ar.productDescription.replace(source.name,'Translated name')]) {
    const value=bundle();mutate(value);assert.equal(validateEditorial(value,source).valid,false);
  }
  assert.equal(validateEditorial(bundle(),source,[bundle()]).valid,false);
  const near=bundle();near.fr.description+=' Ici.';
  assert.equal(validateEditorial(near,source,[bundle()]).valid,false);
});
test('comparison varies only the selected model; count bound includes output and cache-write premium',()=>{
  const sol=editorialRequest(source,'editorial-sol'),astra=editorialRequest(source,'premium');
  assert.deepEqual({...sol,model:null},{...astra,model:null});
  assert.equal(astra.reasoning.effort,'low');assert.equal(astra.max_output_tokens,2000);
  assert.equal(maximumEditorialCost('premium',569),0.1103125);
  assert.throws(()=>maximumEditorialCost('premium',4000),/TOKEN_BOUND/);
});
test('all editorial models use actual SDK, exact counted request, one generation and no retries/fallback',async()=>{
  for(const [tier,config] of Object.entries(EDITORIAL_MODELS)) {
    const calls=[];
    const result=await generateBundle({tier,payload:source,primary_reserve:config.reserve,authorized_usd:config.reserve,paid_authorized:true,duplicate_corpus:[]},
      {env:{OPENAI_API_KEY:'test-only',SEO_EDITORIAL_ENABLED:'true'},makeClient:options=>new OpenAI({...options,fetch:async(url,init)=>{
        calls.push({url:String(url),body:JSON.parse(init.body),options});
        if(String(url).endsWith('/input_tokens'))return Response.json({object:'response.input_tokens',input_tokens:1000});
        return Response.json({id:'resp_test',object:'response',created_at:1,status:'completed',model:config.model,output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(bundle()),annotations:[]}]}],usage:{input_tokens:1000,output_tokens:600,input_tokens_details:{cached_tokens:0}}});
      }})});
    assert.equal(result.provider,'openai');assert.equal(result.bundle.editorialVersion,2);assert.equal(result.bundle.reviewRequired,true);
    assert.equal(calls.length,2);assert.equal(calls[1].body.model,config.model);assert.equal(calls[1].options.maxRetries,0);
    assert.deepEqual(calls[0].body.text,calls[1].body.text);assert.deepEqual(calls[0].body.input,calls[1].body.input);
  }
});
test('unauthorized, disabled, over-token and insufficient reservations cannot generate; uncertain call never retries',async()=>{
  const base={tier:'premium',payload:source,primary_reserve:0.2,authorized_usd:0.2,paid_authorized:true};
  const env={OPENAI_API_KEY:'test',SEO_EDITORIAL_ENABLED:'true'};
  for(const override of [{paid_authorized:false},{authorized_usd:0.001}]) {
    let generated=0;
    const result=await generateBundle({...base,...override},{env,makeClient:async()=>({responses:{inputTokens:{count:async()=>({input_tokens:1000})},create:async()=>{generated++;throw Error('unexpected');}}})});
    assert.equal(generated,0);assert.equal(result.provider,'deterministic');
  }
  let calls=0;
  const result=await generateBundle(base,{env,makeClient:async()=>({responses:{inputTokens:{count:async()=>({input_tokens:1000})},create:async()=>{calls++;throw Error('secret');}}})});
  assert.equal(calls,1);assert.equal(result.usage[0].uncertain,true);assert.equal(result.usage[0].usd,0.2);
  assert.doesNotMatch(JSON.stringify(result),/secret/);
  await generateBundle(base,{env:{},makeClient:()=>{throw Error('must not load');}});
});
