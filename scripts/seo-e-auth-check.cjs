// Real HMAC/access-policy code with synthetic staff HTTP data; no hosted identities.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve('release/seo-e-cumulative-20261022'),ts=require(path.join(root,'node_modules/typescript'));
const out={at:new Date().toISOString(),synthetic:true,checks:[],hostedAuthTested:false};
(async()=>{
 let active=true,permissions=['products.view','products.edit'];
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(req.url.startsWith('/rest/v1/admin_staff')?(active?[{role_id:'synthetic-role'}]:[]):permissions.map(permission_slug=>({permission_slug}))));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const env={ADMIN_EMAIL:'owner@example.invalid',ADMIN_SESSION_SECRET:'isolated-e-acceptance-secret-32-characters',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:'+server.address().port,SUPABASE_SERVICE_ROLE_KEY:'synthetic-service'};
 const modules={};function load(file){if(modules[file])return modules[file];const exports={};modules[file]=exports;const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('exports','require','process',code)(exports,n=>n==='server-only'?{}:load(path.posix.join(path.posix.dirname(file),n)+'.ts'),{env});return exports;}
 try{const session=load('lib/admin-session.ts'),access=load('lib/admin-access.ts'),policy=load('lib/admin-policy.ts');const req=token=>({cookies:{get:()=>({value:token})}});
 const owner=await session.createSessionToken(env.ADMIN_EMAIL),editor=await session.createSessionToken('editor@example.invalid');
 assert((await access.getAdminAccess(req(owner))).owner);out.checks.push('Real signed owner token accepted');
 let a=await access.getAdminAccess(req(editor));assert(policy.hasAdminPermission(a,'products.edit'));assert(!a.owner);out.checks.push('Signed editor gets only current database permissions');
 permissions=['products.view'];a=await access.getAdminAccess(req(editor));assert(policy.hasAdminPermission(a,'products.view'));assert(!policy.hasAdminPermission(a,'products.edit'));out.checks.push('Permission removal enforced on next request');
 active=false;assert.equal(await access.getAdminAccess(req(editor)),null);out.checks.push('Staff deactivation denies previously signed token');
 assert.equal(await session.verifySessionToken(editor.slice(0,-2)+'xx'),null);const expired=await session.createSessionToken('editor@example.invalid',1);await new Promise(r=>setTimeout(r,10));assert.equal(await session.verifySessionToken(expired),null);out.checks.push('Tampered and expired HMAC tokens rejected');
 // Explicitly record the absence of a revocation mechanism, not a passing logout claim.
 const logout=fs.readFileSync(path.join(root,'app/api/admin/auth/session/route.ts'),'utf8').split('export async function DELETE')[1];assert(logout.includes('maxAge: 0'));assert(!/revoke|\.rpc\(|\.from\(/.test(logout));assert.equal(await session.verifySessionToken(owner),env.ADMIN_EMAIL);
 out.revocation={staffRemoval:true,permissionRemoval:true,ownerServerSideSessionRevocation:false,logoutOnlyClearsBrowserCookie:true,blocker:'Copied valid owner admin_session remains accepted until expiry; upstream Auth logout is not checked by admin-access. Requires a reviewed server-side revocation design and real session acceptance.'};out.passed=true;
 }finally{await new Promise(r=>server.close(r));}
})().catch(e=>{out.passed=false;out.error=e.message;process.exitCode=1;}).finally(()=>{fs.writeFileSync('artifacts/seo-e-final-20261022/auth-'+Date.now()+'.json',JSON.stringify(out,null,2),{flag:'wx'});console.log(JSON.stringify(out));});
