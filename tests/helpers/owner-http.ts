import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
import {randomBytes} from 'node:crypto';
import argon2 from 'argon2';
import * as core from '../../lib/owner-auth-core.ts';
const require=createRequire(import.meta.url);
export async function ownerHttpFixture(port=0){
 const db=new PGlite();await db.exec(await readFile(new URL('../../supabase/migrations/202610080001_learning_owner_sessions.sql',import.meta.url),'utf8'));
 const wrap=(client:any):core.Database=>({query:(q,v)=>client.query(q,v),transaction:fn=>client.transaction((tx:any)=>fn(wrap(tx)))});
 const email='owner@example.test',password=randomBytes(24).toString('hex');
 const env={OWNER_EMAIL:email,OWNER_PASSWORD_HASH:await argon2.hash(password,{type:argon2.argon2id,memoryCost:19456,timeCost:2,parallelism:1}),SESSION_SECRET:randomBytes(32).toString('hex'),NODE_ENV:'test' as const};
 const dependencies:Record<string,any>={'server-only':{},'next/server':require('next/server'),'./owner-auth-core':{...core,ownerConfig:()=>core.ownerConfig(env)},'./owner-auth-database.mjs':{ownerDatabase:()=>wrap(db)}};
 const load=async(path:string)=>{const exports:any={};const code=ts.transpileModule(await readFile(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','exports','process',code)((id:string)=>{if(!(id in dependencies))throw Error('Unexpected test import '+id);return dependencies[id];},exports,{env});return exports;};
 dependencies['./request-body']=await load('../../lib/request-body.ts');
 const serverModule=await load('../../lib/owner-auth-server.ts');dependencies['./owner-auth-server']=serverModule;dependencies['@/lib/owner-auth-server']=serverModule;
 const guard=await load('../../lib/learning-mobile-auth.ts');
 const routes:Record<string,any>={};for(const action of ['','confirm','refresh','logout','sessions'])routes['/api/learning-mobile/auth'+(action?'/'+action:'')]=await load('../../app/api/learning-mobile/auth/'+(action?action+'/':'')+'route.ts');
 const server=createServer(async(req,res)=>{
  try{
   const chunks:Buffer[]=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>8192){res.writeHead(413);res.end();return;}chunks.push(chunk);}
   const {NextRequest}=dependencies['next/server'];const request=new NextRequest('http://127.0.0.1'+req.url,{method:req.method,headers:req.headers,...(chunks.length?{body:Buffer.concat(chunks)}:{})});
   let response;
   if(req.url==='/api/learning-mobile/teacher')response=guard.mobileJson({authorized:!!await guard.mobileOwner(request)},await guard.mobileOwner(request)?200:401);
   else if(routes[req.url||'']?.[req.method||''])response=await routes[req.url||''][req.method||''](request);
   else response=new Response(null,{status:404});
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());
  }catch{res.writeHead(500);res.end();}
 });
 await new Promise<void>(resolve=>server.listen(port,'127.0.0.1',resolve));const address=server.address() as {port:number};
 return {email,password,db,disable:()=>{env.OWNER_PASSWORD_HASH='';},url:'http://127.0.0.1:'+address.port,close:async()=>{await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));await db.close();}};
}
