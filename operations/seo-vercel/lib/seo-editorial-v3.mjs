import { editorialRequest as legacyRequest, editorialCost as legacyCost, EDITORIAL_MODELS as legacyModels } from './seo-editorial.mjs';
import { assessEditorial, EDITORIAL_PROMPT } from './seo-editorial-quality.mjs';
export const EDITORIAL_MODELS_V3 = { ...legacyModels, 'editorial-sol': { ...legacyModels['editorial-sol'], model:'gpt-6.1-sol', cached:0.1 } };
export function editorialRequestV3(source, tier='editorial-sol') {
  const request = legacyRequest(source,tier);
  request.model = EDITORIAL_MODELS_V3[tier].model;
  request.input[0].content = EDITORIAL_PROMPT;
  if (source.model) request.input[1].content = JSON.stringify({ market:'Morocco', source:{...JSON.parse(request.input[1].content).source,model:String(source.model)} });
  request.text.format.name = 'product_seo_editorial_v3';
  if (Buffer.byteLength(JSON.stringify(request),'utf8') > 20000) throw Error('SEO_EDITORIAL_INPUT_BOUND');
  return request;
}
export async function generateEditorialV3(job,{env=process.env,makeClient,fallback}={}) {
  const config=EDITORIAL_MODELS_V3[job.tier],usage=[];
  const failure=()=>({bundle:fallback(job.payload),provider:'deterministic',usage});
  if (!config || job.editorial_revision!==3 || job.paid_authorized!==true || env.SEO_EDITORIAL_ENABLED!=='true' || !env.OPENAI_API_KEY) return failure();
  let attempted=false;
  try {
    const request=editorialRequestV3(job.payload,job.tier);
    const client=await makeClient({apiKey:env.OPENAI_API_KEY,baseURL:'https://api.openai.com/v1',maxRetries:0,timeout:9000,fetch:(input,init)=>fetch(input,{...init,redirect:'error'})});
    const count=await client.responses.inputTokens.count({model:request.model,input:request.input,reasoning:request.reasoning,text:request.text},{timeout:3000});
    if (!Number.isSafeInteger(count.input_tokens)||count.input_tokens<1||count.input_tokens+256>4000) return failure();
    const maximum=((count.input_tokens+256)*config.input*1.25+request.max_output_tokens*config.output)/1e6;
    if (!Number.isFinite(Number(job.primary_reserve)) || !Number.isFinite(Number(job.authorized_usd)) || maximum>Number(job.primary_reserve)||maximum>Number(job.authorized_usd)) return failure();
    attempted=true;
    const response=await client.responses.create(request);
    const cost=legacyCost(job.tier,response.usage);
    // Legacy Sol cached pricing is higher: keep that conservative accounting.
    usage.push({provider:'openai',model:config.model,...(cost??{input:0,output:0,cached:0,usd:Number(job.primary_reserve)}),uncertain:!cost});
    if(response.model!==config.model||response.status!=='completed') return failure();
    const bundle=JSON.parse(response.output_text),quality=assessEditorial(bundle,job.payload,job.duplicate_corpus??[]);
    if(!quality.valid) return failure();
    return {bundle:{...bundle,editorialVersion:3,reviewRequired:true},provider:'openai',usage};
  } catch {
    if(attempted&&!usage.length)usage.push({provider:'openai',model:config.model,input:0,output:0,cached:0,usd:Number(job.primary_reserve),uncertain:true});
    return failure();
  }
}
