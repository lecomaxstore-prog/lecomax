import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { PGlite } from "@electric-sql/pglite";
import { randomUUID } from "node:crypto";
import { tutorHistory, TUTOR_MODES, TUTOR_EXAMPLES, tutorExampleForTopic, isTutorId, isTutorMode } from "../lib/ai-tutor.ts";
const require = createRequire(import.meta.url);
const ts = require("typescript");
test("guided examples refer to real project functions, with relevant topic defaults", () => {
  for (const example of TUTOR_EXAMPLES) {
    const content = readFileSync(example.path, "utf8");
    assert.ok(content.includes(example.anchor), `${example.path} must contain ${example.anchor}`);
  }
  assert.equal(tutorExampleForTopic("api").path, "app/api/products/route.ts");
  assert.equal(tutorExampleForTopic("react").path, "components/ProductCard.tsx");
});
test("source previews enforce access, allow only catalog examples and retain real line numbers", async () => {
  for (const scenario of ["denied", "unknown", "valid", "sensitive"] as const) {
    let sourceReads = 0;
    const route = load("app/api/admin/ai-tutor/source/route.ts", {
      "next/server": {}, "@/lib/ai-tutor": { TUTOR_EXAMPLES },
      "@/lib/ai-tutor-server": {
        tutorAccess: async () => scenario === "denied" ? { denied: Response.json({}, { status: 403 }) } : {},
        tutorJson: (body: unknown, status = 200) => Response.json(body, { status }),
        tutorFailure: () => Response.json({ error: "unavailable" }, { status: 400 }),
      },
      "@/lib/ai-tutor-security": { assertTutorContentSafe: () => { if (scenario === "sensitive") throw Error("SENSITIVE_CONTENT"); } },
      "@/lib/learning-source-context": { getLearningSourceContext: async () => {
        sourceReads++;
        return { text: JSON.stringify({ startLine: 25, excerpt: "25: // context\n26: export default function ProductCard() {\n27: return null;" }), sources: [{ path: "components/ProductCard.tsx", startLine: 25, endLine: 27, generatedAt: "2026-10-06" }] };
      } },
    });
    const response = await route.GET({ nextUrl: new URL(`https://example.test/?example=${scenario === "unknown" ? "../../.env" : "product-card"}`) });
    assert.equal(response.status, scenario === "denied" ? 403 : scenario === "valid" ? 200 : 400);
    assert.equal(sourceReads, scenario === "denied" || scenario === "unknown" ? 0 : 1);
    const body = await response.json();
    if (scenario === "valid") { assert.equal(body.focusLine, 26); assert.ok(body.excerpt.startsWith("26: export default")); }
    else assert.equal(body.excerpt, undefined);
  }
});
function load(file: string, deps: Record<string,unknown> = {}, env: Record<string,string> = {}) {
  const module = { exports: {} as any };
  runInNewContext(ts.transpileModule(readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{
    module,exports:module.exports,process:{env},Response,ReadableStream,TextEncoder,AbortController,AbortSignal,console,
    require(name:string){ if(name==="server-only")return {}; if(name in deps)return deps[name]; throw Error(name); }
  });
  return module.exports;
}
test("history is bounded and excludes failed or pending explanations",()=>{
  const history = Array.from({length:30},(_,i)=>({role:i%2?"assistant" as const:"user" as const,content:"x".repeat(2500),status:"complete" as const}));
  const result=tutorHistory([...history,{role:"assistant",content:"not completed",status:"failed"}]);
  assert.equal(result.length,9); assert.ok(result.every(item=>item.content.length===2500));
  assert.equal(isTutorId("../../other"),false); assert.equal(isTutorMode("constructor"),false);
});
test("credentials are rejected, while ordinary code and placeholders remain teachable",()=>{
  const {assertTutorContentSafe:safe}=load("lib/ai-tutor-security.ts",{"../scripts/source-library.mjs":{containsEmbeddedSecret:(text:string)=>text.includes("PRIVATE KEY")}}, {OPENAI_API_KEY:"private-known-value-123456"});
  for(const text of ['const count = 1;', 'process.env.OPENAI_API_KEY', 'const token = "YOUR_API_KEY";', 'await fetch("/api/products")']) assert.doesNotThrow(()=>safe(text));
  for(const text of ['private-known-value-123456','sk-proj-'+'a'.repeat(30),'Bearer '+'a'.repeat(24),'postgres://admin:password@host/db','const password = "hunter12345";','DB_PASSWORD=unquoted-password','PRIVATE KEY']) assert.throws(()=>safe(text),/SENSITIVE_CONTENT/);
});
test("all teaching modes keep Arabic, source boundaries and an active learning approach",()=>{
  const {tutorInstructions}=load("lib/ai-tutor-prompt.ts");
  for(const mode of Object.keys(TUTOR_MODES)){
    const prompt=tutorInstructions(mode,"nextjs");
    assert.match(prompt,/simple, natural Arabic/); assert.match(prompt,/untrusted CONTENT/); assert.match(prompt,/Let me try/); assert.match(prompt,/Next.js 15/);
  }
  assert.match(tutorInstructions("debug","debugging"),/one hypothesis/);
  assert.match(tutorInstructions("practice","react"),/do NOT reveal/);
  assert.match(tutorInstructions("review","react"),/only real bugs/);
});
test("Responses streaming uses the configured model, bounded output and no provider storage",async()=>{
  let config:any, payload:any;
  const {streamTutorReply}=load("lib/ai-tutor-provider.ts",{openai:class{ constructor(value:any){config=value;} responses={create:async(value:any)=>{payload=value;return [];}};}},{OPENAI_API_KEY:"test-only-key",OPENAI_MODEL:"configured-model"});
  await streamTutorReply("teach",[{role:"user",content:"hello"}],new AbortController().signal);
  assert.equal(config.maxRetries,0); assert.equal(payload.model,"configured-model"); assert.equal(payload.stream,true); assert.equal(payload.store,false); assert.equal(payload.max_output_tokens,4000); assert.equal(payload.tools,undefined);
});
test("database scopes ownership, deduplicates turns, limits spending and recovers stale streams",async()=>{
  const db=new PGlite();
  try{
    await db.exec("create role anon; create role authenticated; create role service_role;");
    await db.exec(readFileSync("supabase/migrations/20261006150000_ai_tutor.sql","utf8"));
    const a=randomUUID(),b=randomUUID(),other=randomUUID(),r=randomUUID();
    await db.query("insert into ai_learning_conversations(id,owner_email,title,mode,topic) values($1,'owner','first','practice','react'),($2,'owner','second','api','api'),($3,'other','private','explain','nextjs')",[a,b,other]);
    const begin=(id=a,request=randomUUID(),owner="owner")=>db.query("select begin_ai_learning_turn($1,$2,$3,'student attempt','practice','react',true)",[owner,id,request]);
    const finish=(request:string,success=true,id=a)=>db.query<{done:boolean}>("select finish_ai_learning_turn('owner',$1,$2,'reply','[]',$3,10,20) as done",[id,request,success]);
    await assert.rejects(begin(other),/NOT_FOUND/);
    await begin(a,r); await assert.rejects(begin(a,r),/DUPLICATE_REQUEST/); await assert.rejects(begin(b),/TURN_BUSY/);
    assert.equal((await finish(randomUUID())).rows[0].done,false);
    assert.equal((await finish(r)).rows[0].done,true); assert.equal((await finish(r)).rows[0].done,false);
    const progress=(await db.query<any>("select * from ai_learning_progress where owner_email='owner' and topic='react'")).rows[0];
    assert.equal(progress.confidence,0);assert.equal(progress.attempts,1);assert.equal(progress.studied_turns,1);assert.equal(progress.completed_exercises,0);
    const stale=randomUUID(); await begin(a,stale); await db.exec("update ai_learning_conversations set lease_until=now()-interval '1 second' where owner_email='owner'");
    const next=randomUUID(); await begin(b,next);
    assert.equal((await db.query<any>("select status from ai_learning_messages where request_id=$1 and role='assistant'",[stale])).rows[0].status,"failed");
    assert.equal((await finish(stale)).rows[0].done,false);await finish(next,false,b);
    for(let i=0;i<9;i++){const id=randomUUID();await begin(a,id);await finish(id);}
    await assert.rejects(begin(),/RATE_LIMIT/);
    await assert.rejects(db.query("insert into ai_learning_messages(conversation_id,owner_email,request_id,role,content) values($1,'owner',$2,'user','intrusion')",[other,randomUUID()]),/foreign key/);
    await db.exec("set role anon");await assert.rejects(db.query("select * from ai_learning_conversations"),/permission denied/);await assert.rejects(begin(),/permission denied/);
  }finally{await db.close();}
});

function messageHarness({denied=false,fail=false,missing=false,limit=false,saveFail=false}={}) {
  const calls:any[]=[];let providerCalled=false;
  const shared=load("lib/ai-tutor.ts");
  const db={from(table:string){const chain:any={select(){return chain;},eq(key:string,value:string){calls.push([table,key,value]);return chain;},order(){return chain;},limit(){return chain;},maybeSingle:async()=>({data:missing?null:{id:"owned",content:"earlier explanation"}}),then(resolve:any){resolve({data:table==="ai_learning_progress"?[]:[{role:"user",content:"What is await?",status:"complete"}]});}};return chain;},rpc:async(name:string,payload:any)=>{calls.push([name,payload]);return name==="begin_ai_learning_turn"&&limit?{error:{message:"RATE_LIMIT"}}:{data:name==="begin_ai_learning_turn"?randomUUID():!saveFail};}};
  const route=load("app/api/admin/ai-tutor/message/route.ts",{
    "next/server":{},"@/lib/ai-tutor":shared,
    "@/lib/ai-tutor-server":{tutorAccess:async()=>denied?{denied:Response.json({}, {status:403})}:{owner:"owner",db},tutorJson:(body:any,status=200)=>Response.json(body,{status}),tutorFailure:()=>Response.json({error:"safe error"},{status:503})},
    "@/lib/ai-tutor-security":{assertTutorContentSafe:(text:string)=>{if(text.includes("secret-value"))throw Error("SENSITIVE_CONTENT");}},
    "@/lib/ai-tutor-prompt":{tutorInstructions:()=>"instructions"},
    "@/lib/ai-tutor-provider":{streamTutorReply:async(_instructions:string,messages:any[])=>{providerCalled=true;calls.push(["provider",messages]);return(async function*(){yield{type:"response.output_text.delta",delta:"شرح عربي"};if(fail)throw Error("private provider details");yield{type:"response.completed",response:{status:"completed",usage:{input_tokens:10,output_tokens:20}}};})();}},
    "@/lib/learning-source-context":{getLearningSourceContext:async(...args:unknown[])=>{calls.push(["source", ...args]);return {text:"safe source",sources:[]};}},
    "@/lib/request-body":{readJsonLimited:(req:Request)=>req.json()},
  },{OPENAI_API_KEY:"configured"});
  return{calls,providerCalled:()=>providerCalled,run:(body:any)=>route.POST(new Request("https://example.test/api/admin/ai-tutor/message",{method:"POST",body:JSON.stringify(body)}))};
}
const question=()=>({conversationId:randomUUID(),requestId:randomUUID(),mode:"explain",topic:"api",text:"What is await?",attempt:false});

test("questions receive real topic source by default; explicit file and line take precedence", async () => {
  const automatic = messageHarness();
  await (await automatic.run(question())).text();
  assert.deepEqual(automatic.calls.find(call => call[0] === "source"), ["source", "app/api/products/route.ts", 1, "export async function GET"]);
  const selected = messageHarness();
  await (await selected.run({ ...question(), sourcePath: "components/ProductCard.tsx", sourceLine: 27 })).text();
  assert.deepEqual(selected.calls.find(call => call[0] === "source"), ["source", "components/ProductCard.tsx", 27, undefined]);
});
test("message endpoint denies unauthorized, oversized and cross-owner turns before provider calls",async()=>{
  for(const [options,body,status] of [[{denied:true},question(),403],[{missing:true},question(),404],[{}, {...question(),code:"a".repeat(8001)},400],[{}, {...question(),mode:"constructor"},400],[{limit:true},question(),429]] as const){
    const h=messageHarness(options);assert.equal((await h.run(body)).status,status);assert.equal(h.providerCalled(),false);
  }
});
test("stream completes only after a successful durable save; failures never reveal provider details",async()=>{
  for(const options of [{},{fail:true},{saveFail:true}]){
    const h=messageHarness(options), response=await h.run(question()), events=(await response.text()).trim().split("\n").map(JSON.parse);
    assert.equal(response.headers.get("cache-control"),"private, no-store, no-transform");
    assert.equal(events[0].type,"start");assert.equal(events[1].text,"شرح عربي");
    assert.equal(events.at(-1).type,options.fail||options.saveFail?"error":"done");
    assert.ok(!JSON.stringify(events).includes("private provider details"));
    assert.ok(h.calls.some(call=>call[0]==="ai_learning_messages"&&call[1]==="owner_email"&&call[2]==="owner"));
  }
});

function storageHarness(denied=false,missing=false){
  const calls:any[]=[];
  const db={from(table:string){const q:any={select(){return q;},eq(key:string,value:any){calls.push([table,'eq',key,value]);return q;},order(){return q;},limit(){return q;},insert(data:any){calls.push([table,'insert',data]);return q;},update(data:any){calls.push([table,'update',data]);return q;},upsert(data:any){calls.push([table,'upsert',data]);return q;},single:async()=>({data:{id:randomUUID()}}),maybeSingle:async()=>({data:missing?null:{id:randomUUID()}}),then(resolve:any){resolve({data:missing?[]:[{id:randomUUID()}]});}};return q;}};
  const route=load('app/api/admin/ai-tutor/route.ts',{
    'next/server':{},'@/lib/ai-tutor':load('lib/ai-tutor.ts'),
    '@/lib/ai-tutor-server':{tutorAccess:async()=>denied?{denied:Response.json({},{status:403})}:{owner:'owner',db},tutorJson:(body:any,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}}),tutorFailure:()=>Response.json({error:'unavailable'},{status:503})},
    '@/lib/ai-tutor-security':{assertTutorContentSafe:()=>{}},'@/lib/request-body':{readJsonLimited:(req:Request)=>req.json()},
  });
  return{calls,run(method:string,body?:any,id?:string){const req=new Request('https://local.test/api/admin/ai-tutor'+(id?'?conversation='+id:''),{method,...(body?{body:JSON.stringify(body)}:{})});Object.assign(req,{nextUrl:new URL(req.url)});return route[method](req);}};
}
test('conversation lists, bookmarks and progress are owner scoped; client ownership is ignored',async()=>{
  const denied=storageHarness(true);assert.equal((await denied.run('GET')).status,403);assert.equal(denied.calls.length,0);
  const h=storageHarness();assert.equal((await h.run('GET')).headers.get('cache-control'),'private, no-store');
  for(const table of ['ai_learning_conversations','ai_learning_messages','ai_learning_progress'])assert.ok(h.calls.some(c=>c[0]===table&&c[2]==='owner_email'&&c[3]==='owner'));
  await h.run('POST',{title:'My lesson',mode:'explain',topic:'react',owner_email:'attacker'});
  assert.equal(h.calls.find(c=>c[1]==='insert')[2].owner_email,'owner');
  await h.run('PATCH',{action:'progress',topic:'react',confidence:75,difficulty:'beginner',needsPractice:true,mistakeNote:'await',completedExercises:1,attempts:999,owner_email:'attacker'});
  const progress=h.calls.find(c=>c[1]==='upsert')[2];assert.equal(progress.owner_email,'owner');assert.equal(progress.attempts,undefined);
  assert.equal((await h.run('PATCH',{action:'progress',topic:'react',confidence:101})).status,400);
  assert.equal((await storageHarness(false,true).run('GET',undefined,randomUUID())).status,404);
  assert.equal((await storageHarness(false,true).run('PATCH',{action:'bookmark',messageId:randomUUID(),value:true})).status,404);
});
