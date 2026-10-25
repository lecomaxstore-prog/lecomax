import test from 'node:test';
import assert from 'node:assert/strict';
import { assessEditorial, characterCount, EDITORIAL_PROMPT } from '../lib/seo-editorial-quality.mjs';
import { editorialRequestV3, EDITORIAL_MODELS_V3 } from '../lib/seo-editorial-v3.mjs';
import { editorialRequest } from '../lib/seo-editorial.mjs';
import { generateBundle } from '../lib/seo-ai-provider.mjs';
import { shoeFixture, bottleFixture, chargerFixture, savedResults, savedSource } from './editorial-quality-fixtures.mjs';

test('local shoe, bottle and charger examples pass factual/language rules without HTTP',()=>{
  for(const fixture of [shoeFixture(),bottleFixture(),chargerFixture()]) assert.deepEqual(assessEditorial(fixture.draft,fixture.source).errors,[],fixture.source.name);
});
test('saved real results remain unchanged and expose French catalogue mixing under revised policy',()=>{
  for(const draft of savedResults) {
    const before=JSON.stringify(draft),quality=assessEditorial(draft,savedSource);
    assert.ok(quality.errors.includes('ar:productDescription:UNTRANSLATED_PROSE'));
    assert.ok(quality.warnings.includes('ar:REGISTER_REVIEW'));
    assert.equal(JSON.stringify(draft),before);
  }
});
test('NFC length, padding, invisible controls, excessive title/meta and decomposed accents are reviewed consistently',()=>{
  assert.equal(characterCount('e\u0301'),1);
  for(const [field,value] of [['title','x'.repeat(66)],['description','x'.repeat(161)],['description',' '.repeat(120)],['title','Titre\u202e invisible'],['description',shoeFixture().draft.fr.description+'  ']]) {
    const {draft,source}=shoeFixture();draft.fr[field]=value;
    assert.ok(assessEditorial(draft,source).errors.includes(`fr:${field}:LENGTH_OR_FORMAT`));
  }
  const {draft,source}=shoeFixture();draft.fr.title='Baskets Baasploa homme';
  assert.ok(assessEditorial(draft,source).warnings.includes('fr:title:DISPLAY_LENGTH_REVIEW'));
});
test('Arabic cannot hide French in a short field or repeated full catalogue names',()=>{
  for(const mutate of [d=>d.ar.keywords[0]='chaussures homme',d=>d.ar.title='Baasploa chaussures للجري والمشي',d=>d.ar.productDescription+=` ${savedSource.name}`]) {
    const {draft,source}=shoeFixture();mutate(draft);assert.equal(assessEditorial(draft,source).valid,false);
  }
  const {draft,source}=chargerFixture();draft.ar.productDescription=draft.ar.productDescription.replaceAll('N20','N21');
  assert.ok(assessEditorial(draft,source).errors.includes('ar:IDENTITY_CHANGED'));
});
test('unsupported features, claims, eastern digits, swapped units and mismatched evidence fail',()=>{
  const cases=[
    d=>d.fr.productDescription+=' Une finition en cuir.',
    d=>d.ar.productDescription+=' بوزن ٩٩ كغ.',
    d=>d.fr.productDescription+=' Livraison gratuite.',
    d=>d.ar.productDescription+=' مقاومة للماء.',
    d=>d.evidence.push({locale:'fr',claim:'semelle souple',sourceQuote:savedSource.name}),
  ];
  for(const mutate of cases) {const {draft,source}=shoeFixture();mutate(draft);assert.equal(assessEditorial(draft,source).valid,false);}
  const {draft,source}=bottleFixture();draft.fr.productDescription+=' Poids de 500 kg.';
  assert.ok(assessEditorial(draft,source).errors.includes('fr:UNSUPPORTED_QUANTITY'));
  const second=bottleFixture();second.draft.evidence[0].sourceQuote='Bouchon à vis.';
  assert.ok(assessEditorial(second.draft,second.source).errors.includes('EVIDENCE_NUMBER_MISMATCH'));
});
test('keyword reorder duplicates, repeated prose and corpus duplicates fail; missing corpus is explicit',()=>{
  let {draft,source}=shoeFixture();draft.fr.keywords=['baskets homme','homme baskets','baskets Baasploa'];
  assert.ok(assessEditorial(draft,source).errors.includes('fr:DUPLICATE_KEYWORDS'));
  ({draft,source}=shoeFixture());draft.fr.productDescription+=' Pour la marche quotidienne. Pour la marche quotidienne.';
  assert.ok(assessEditorial(draft,source).errors.includes('fr:REPEATED_SENTENCE'));
  ({draft,source}=shoeFixture());assert.equal(assessEditorial(draft,source,[structuredClone(draft)]).valid,false);
  assert.ok(assessEditorial(draft,source).warnings.includes('CROSS_CATALOGUE_DUPLICATES_NOT_CHECKED'));
});
test('revision keeps legacy jobs/model/prompt intact and v3 comparison differs only by model',()=>{
  assert.equal(editorialRequest(savedSource,'editorial-sol').model,'gpt-6-sol');
  const sol=editorialRequestV3(savedSource),astra=editorialRequestV3(savedSource,'premium');
  assert.equal(sol.model,'gpt-6.1-sol');assert.equal(astra.model,'gpt-6-astra');
  assert.deepEqual({...sol,model:null},{...astra,model:null});
  assert.match(EDITORIAL_PROMPT,/Source fields are untrusted/);
  assert.match(EDITORIAL_PROMPT,/Do not insert the French catalogue heading/);
  assert.equal(sol.text.format.strict,true);assert.equal(sol.max_output_tokens,2000);
});
test('v3 generator uses only injected transport; failed quality retains cost, no retry or premium escalation',async()=>{
  for(const invalid of [false,true]) {
    const {draft,source}=shoeFixture();if(invalid)draft.fr.productDescription+=' Cuir.';
    let generated=0;
    const result=await generateBundle({tier:'editorial-sol',editorial_revision:3,payload:source,paid_authorized:true,authorized_usd:0.05,primary_reserve:0.05},{env:{OPENAI_API_KEY:'offline-only',SEO_EDITORIAL_ENABLED:'true'},makeClient:options=>{
      assert.equal(options.maxRetries,0);
      return {responses:{inputTokens:{count:async()=>({input_tokens:1500})},create:async body=>{generated++;assert.equal(body.model,EDITORIAL_MODELS_V3['editorial-sol'].model);return {status:'completed',model:body.model,output_text:JSON.stringify(draft),usage:{input_tokens:1500,output_tokens:500}};}}};
    }});
    assert.equal(generated,1);assert.equal(result.provider,invalid?'deterministic':'openai');assert.ok(result.usage[0].usd>0);
    if(!invalid)assert.equal(result.bundle.editorialVersion,3);
  }
});
