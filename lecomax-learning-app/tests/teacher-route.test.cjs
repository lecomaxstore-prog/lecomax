const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');const {ts,root}=require('../scripts/inspect.cjs');
function route(overrides={}){const calls=[];const modules={
 'next/server':{},'@/lib/request-body':{readJsonLimited:async()=>({message:'checkout',language:'ar',mode:'project',history:[]})},
 '@/lib/learning-mobile-auth':{mobileOwner:async()=>'owner@example.test',mobileJson:(body,status=200)=>({body,status})},
 '@/lib/learning-mobile-validation':{validateMobileTeacher:v=>v},
 '@/lib/sensitive-rate-limit':{sensitiveRateLimit:async()=>null},
 '@/lib/ai-tutor-security':{assertTutorContentSafe:()=>{}},
 '@/lib/learning-source-context':{getLearningSourceContext:async p=>{calls.push(p);return {text:'source excerpt',sources:[{path:p}]};}},
 '@/lib/ai-tutor-course':{tutorSourcePaths:()=>['app/checkout/page.tsx','app/api/orders/route.ts','lib/extra.ts']},
 '@/lib/mobile-teacher-prompt':require('../scripts/inspect.cjs').load('lib/mobile-teacher-prompt.ts'),
 '@/lib/ai-tutor-provider':{streamTutorReply:async()=>({async *[Symbol.asyncIterator](){yield {type:'response.output_text.delta',delta:'Explanation'};yield {type:'response.completed',response:{model:'gpt-6-astra'}};}})},...overrides};const exports={};const source=fs.readFileSync(path.join(root,'app/api/learning-mobile/teacher/route.ts'),'utf8');vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:p=>modules[p],AbortSignal,Error,process:{env:{}}});return {handler:exports.POST,calls};}
const request=()=>({signal:new AbortController().signal});
test('teacher browser CORS permits local development without opening production to arbitrary origins',async()=>{
 class NextResponse extends Response { static next(){return new NextResponse(null);} }
 for(const production of [false,true]) {
  const exports={};
  const source=fs.readFileSync(path.join(root,'middleware.ts'),'utf8');
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,process:{env:{NODE_ENV:production?'production':'development'}},require:name=>name==='next/server'?{NextResponse}:name.endsWith('edge-rate-limit')?{edgeRateLimit:()=>null}:{}});
  for(const endpoint of ['auth','teacher']) for(const origin of ['http://localhost:8083','https://app.lecomax.com','https://untrusted.invalid']) for(const method of ['OPTIONS','POST']) {
   const response=await exports.middleware({method,nextUrl:new URL('http://localhost:3002/api/learning-mobile/'+endpoint),cookies:{has:()=>false},headers:new Headers({origin})});
   const allowed=origin==='https://app.lecomax.com'||!production&&origin==='http://localhost:8083';
   assert.equal(response.headers.get('access-control-allow-origin'),allowed?origin:null);
   if(allowed)assert.match(response.headers.get('access-control-allow-headers'),/Authorization/);
  }
 }
});
test('teacher rejects unauthenticated requests before reading source',async()=>{const {handler,calls}=route({'@/lib/learning-mobile-auth':{mobileOwner:async()=>null,mobileJson:(body,status)=>({body,status})}});assert.equal((await handler(request())).status,401);assert.equal(calls.length,0);});
test('teacher enforces rate limits before provider calls',async()=>{const {handler,calls}=route({'@/lib/sensitive-rate-limit':{sensitiveRateLimit:async()=>({status:429})}});assert.equal((await handler(request())).status,429);assert.equal(calls.length,0);});
test('teacher only reads an explicitly selected file',async()=>{const {handler,calls}=route({'@/lib/request-body':{readJsonLimited:async()=>({message:'Explain this file',language:'en',mode:'teach',file:'app/checkout/page.tsx',history:[]})}});const result=await handler(request());assert.equal(result.status,200);assert.equal(result.body.answer,'Explanation');assert.deepEqual(calls,['app/checkout/page.tsx']);});
test('ordinary questions never trigger implicit project retrieval, even in project mode',async()=>{for(const message of ['checkout','Explain photosynthesis','Teach me French']) {const {handler,calls}=route({'@/lib/request-body':{readJsonLimited:async()=>({message,language:'en',mode:'project',topic:'nextjs',history:[]})}});const result=await handler(request());assert.equal(result.status,200);assert.equal(calls.length,0);assert.equal(result.body.sources.length,0);}});
test('provider failure returns a recoverable error without internal messages',async()=>{const {handler}=route({'@/lib/ai-tutor-provider':{streamTutorReply:async()=>{throw new Error('private provider details');}}});const result=await handler(request());assert.equal(result.status,503);assert.equal(result.body.error,'TEACHER_UNAVAILABLE');});
test('secrets in input fail closed',async()=>{const {handler,calls}=route({'@/lib/ai-tutor-security':{assertTutorContentSafe:()=>{throw new Error('SENSITIVE_CONTENT');}}});const result=await handler(request());assert.equal(result.status,400);assert.equal(calls.length,0);});
test('partial provider failures are not presented as a completed answer',async()=>{for(const type of ['response.incomplete','error']){const {handler}=route({'@/lib/ai-tutor-provider':{streamTutorReply:async()=>({async *[Symbol.asyncIterator](){yield {type:'response.output_text.delta',delta:'partial'};yield {type};}})}});assert.equal((await handler(request())).status,503);}});
test('stream closing without a completion event is rejected',async()=>{const {handler}=route({'@/lib/ai-tutor-provider':{streamTutorReply:async()=>({async *[Symbol.asyncIterator](){yield {type:'response.output_text.delta',delta:'partial'};}})}});assert.equal((await handler(request())).status,503);});
test('general teaching does not force project retrieval and uses the dedicated flagship configuration',async()=>{
 let received;
 const {handler,calls}=route({
  '@/lib/request-body':{readJsonLimited:async()=>({message:'Teach Python',language:'en',mode:'teach',topic:'python',level:'beginner',history:[]})},
  '@/lib/ai-tutor-course':{tutorSourcePaths:(message,topic,mode)=>{assert.equal(topic,'foundations');assert.equal(mode,'teach');return [];}},
  '@/lib/ai-tutor-provider':{streamTutorReply:async(instructions,messages,signal,options)=>{received={instructions,messages,options};return {async *[Symbol.asyncIterator](){yield {type:'response.output_text.delta',delta:'A Python lesson'};yield {type:'response.completed',response:{model:'gpt-6-astra'}};}};}},
 });
 const result=await handler(request());assert.equal(result.status,200);assert.equal(calls.length,0);assert.equal(result.body.model,'gpt-6-astra');assert.equal(received.options.model,'gpt-6-astra');assert.equal(received.options.reasoning,'medium');assert.match(received.instructions,/Selected topic: python/);assert.equal(received.messages.at(-1).content,'Teach Python');
});
test('production mobile rate limiting fails closed without shared storage',async()=>{
 const exports={};const source=fs.readFileSync(path.join(root,'lib/sensitive-rate-limit.ts'),'utf8');
 const modules={'server-only':{},'node:crypto':require('node:crypto'),'next/server':{NextResponse:{json:(body,options)=>({body,...options})}},'./api-security':{clientIp:()=> '127.0.0.1',enforceRateLimit:()=>null}};
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:p=>modules[p],process:{env:{NODE_ENV:'production'}}});
 assert.equal((await exports.sensitiveRateLimit({},'mobile','owner',true)).status,503);
 assert.equal(await exports.sensitiveRateLimit({},'existing','owner'),null);
});

test('teacher database outages fail closed without reporting revoked credentials',async()=>{
 const {handler,calls}=route({'@/lib/learning-mobile-auth':{mobileOwner:async()=>{throw new Error('database unavailable')},mobileJson:(body,status)=>({body,status})}});
 const response=await handler(request());assert.equal(response.status,503);assert.equal(response.body.error,'UNAVAILABLE');assert.equal(calls.length,0);
});

test('teacher instructions follow a new non-programming subject despite old context',()=>{const {mobileTeacherInstructions}=require('../scripts/inspect.cjs').load('lib/mobile-teacher-prompt.ts');const prompt=mobileTeacherInstructions({message:'Why is the sky blue?',language:'en',mode:'teach',topic:'nextjs',lesson:{title:'React',concept:'Components'},history:[]},'');assert.match(prompt,/Teach any subject/);assert.match(prompt,/latest question determines the subject/);assert.match(prompt,/follow the new subject immediately/);assert.match(prompt,/For non-programming questions, do not add code/);assert.doesNotMatch(prompt,/personal programming teacher/);});
