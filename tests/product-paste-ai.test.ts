import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
function load(file: string, overrides: Record<string, unknown>): any {
  const filename = path.resolve(file);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  const require = (id: string): any => {
    if (id in overrides) return overrides[id];
    if (id === "server-only") return {};
    if (id.startsWith(".")) return load(path.resolve(path.dirname(filename), id + ".ts"), overrides);
    return nativeRequire(id);
  };
  new Function("require", "module", "exports", "fetch", compiled)(require, module, module.exports, overrides.fetch ?? fetch);
  return module.exports;
}
function setup(fields: unknown[], warnings: string[] = []) {
  let sent: any;
  class MockOpenAI { responses = { create: async (request: any) => { sent = request; return {status:'completed',output_text:JSON.stringify({fields,warnings})}; } }; }
  const service = load('lib/product-paste-ai.ts', { openai: MockOpenAI });
  return { ...service, sent: () => sent };
}
test('details AI accepts cited facts and rejects invented values', async () => {
  const previous = process.env.OPENAI_API_KEY; process.env.OPENAI_API_KEY = 'test-only';
  let details = [{ key: 'Matière', value: 'coton' }];
  class MockOpenAI { responses = { create: async () => ({ status: 'completed', output_text: JSON.stringify({ details }) }) }; }
  try {
    const service = load('lib/product-paste-ai.ts', { openai: MockOpenAI });
    assert.deepEqual(await service.extractProductDetailsWithAI('Matière : coton'), { details });
    details = [{ key: 'Matière', value: 'soie' }];
    await assert.rejects(service.extractProductDetailsWithAI('Matière : coton'), /INVALID_EXTRACTION/);
  } finally { if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous; }
});
test('uses exactly GPT-6.1 Sol with supported reasoning and strict structured output', async () => {
  const previous=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test-only';
  try {
    const service=setup([{field:'name',value:'Sac Atlas'},{field:'price',value:'249 MAD'},{field:'stock',value:'3'}]);
    const result=await service.extractProductWithAI('Sac Atlas disponible pour 249 MAD. Stock : 3.');
    assert.deepEqual(result.fields,{name:'Sac Atlas',price:'249',stock:'3'});
    assert.equal(service.sent().model,'gpt-6.1-sol');assert.equal(service.sent().reasoning.effort,'low');
    assert.equal(service.sent().text.format.strict,true);assert.equal(service.sent().store,false);
  } finally { if(previous===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous; }
});
test('rejects invented extracted values and ambiguous currency', async () => {
  const previous=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test-only';
  try {
    const result=await setup([{field:'name',value:'Sac Atlas'},{field:'stock',value:'999'},{field:'price',value:'20 USD'}]).extractProductWithAI('Sac Atlas pour 20 USD.');
    assert.deepEqual(result.fields,{name:'Sac Atlas'});assert.equal(result.warnings.length,2);
  } finally { if(previous===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous; }
});
test('route blocks unauthorized and invalid requests before provider calls', async () => {
  let calls=0;let status=401;
  const route=load('app/api/admin/products/parse/route.ts',{
    '@/lib/api-security':{protectAdminMutation:async()=>status?Response.json({}, {status}):null},
    '@/lib/request-body':{readJsonLimited:(req:Request)=>req.json()},
    '@/lib/product-paste-ai':{extractProductWithAI:async()=>{calls++;return {fields:{name:'Sac'},warnings:[]};}},
    '@/lib/openai-server':{openAIErrorCode:()=> 'AI_UNAVAILABLE'},
  });
  const req=(text:unknown)=>new Request('http://localhost/api/admin/products/parse',{method:'POST',body:JSON.stringify({text})});
  assert.equal((await route.POST(req('Sac de sport'))).status,401);status=0;
  for(const text of [null,123,'short','a'.repeat(20001)])assert.equal((await route.POST(req(text))).status,400);
  assert.equal(calls,0);assert.equal((await route.POST(req('Sac de sport'))).status,200);assert.equal(calls,1);
});
test('live GPT-6.1 Sol extracts synthetic unstructured product facts', {skip:process.env.TEST_PRODUCT_PASTE_AI_LIVE!=='1'}, async()=>{
  nativeRequire('@next/env').loadEnvConfig(process.cwd());
  const service=load('lib/product-paste-ai.ts',{});
  const result=await service.extractProductWithAI('Le produit se nomme Sac Atlas. Il coûte 249 MAD et nous avons 3 unités en stock. Sa marque est Atlas.');
  assert.equal(result.model,'gpt-6.1-sol');assert.equal(result.fields.name,'Sac Atlas');assert.equal(result.fields.price,'249');assert.equal(result.fields.stock,'3');
});
