const { vercelApiFetch } = require('./vercel-cli-api.cjs');
// Fixed synthetic staging users only. No emails, Auth configuration, passwords,
// application data writes, deployment, migration or production access.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ref='tyltharlnbxrxibuxyye',project='prj_jPniwpH4s81bhISVReUKTQN0GwvD',team='team_yFLUcpSvgQi8EQuvuorOZW7w',deployment='dpl_9PVLNqN3YRoSmDgi4T5D9o81Svcv';
const origin='https://lecomax-seo-staging-rf9rswh7q-lecomaxstore-4321s-projects.vercel.app',db=`https://${ref}.supabase.co`;
const actors=['owner','editor','viewer','revoked'];
const report={at:new Date().toISOString(),project,ref,deployment,checks:[],messagesSent:false,authConfigurationChanged:false,applicationDataWrites:false,browserTested:false};
const accessTokens=[],appCookies=[];let secret,created=false,service,anon;
async function api(route,body){const u=new URL(route,'https://api.vercel.com');u.searchParams.set('teamId',team);const r=await vercelApiFetch(u,{method:body?'PATCH':'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(30000)});assert(r.ok,`VERCEL_${r.status}`);return r.json();}
async function auth(route,body,key=service){return fetch(db+'/auth/v1'+route,{method:body?'POST':'GET',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(15000)});}
async function app(route,method='GET',body,cookie){return fetch(origin+route,{method,headers:{'x-vercel-protection-bypass':secret,Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined,redirect:'manual',signal:AbortSignal.timeout(20000)});}
function check(name,passed,detail){report.checks.push({name,passed,...detail});assert(passed,name);}
(async()=>{
 try{
  const p=await api('/v9/projects/'+project),d=await api('/v13/deployments/'+deployment);
  check('fixed_protected_target',p.id===project&&p.accountId===team&&p.ssoProtection?.deploymentType==='all'&&!p.crons?.definitions?.length&&d.projectId===project&&d.readyState==='READY'&&'https://'+d.url===origin);
  const result=cp.spawnSync('C:/Users/Ziko/AppData/Local/npm-cache/_npx/aa8e5c70f9d8d161/node_modules/@supabase/cli-windows-x64/bin/supabase.exe',['projects','api-keys','--project-ref',ref,'--output','json'],{encoding:'utf8',windowsHide:true,timeout:30000});assert(result.status===0,'STAGING_KEYS_REQUIRED');
  const keys=JSON.parse(result.stdout);service=keys.find(k=>k.name==='service_role')?.api_key;anon=keys.find(k=>k.name==='anon')?.api_key;
  for(const key of [service,anon])assert(JSON.parse(Buffer.from(key.split('.')[1],'base64url')).ref===ref,'STAGING_KEY_REQUIRED');
  const usersResponse=await auth('/admin/users?page=1&per_page=10');assert(usersResponse.ok,'USERS_READ_FAILED');const users=(await usersResponse.json()).users;
  check('existing_confirmed_synthetic_users',users.length===4&&actors.every(a=>users.some(u=>u.email===a+'@staging.invalid'&&u.email_confirmed_at)));
  // generate_link returns a link without dispatching mail. Verify it normally;
  // do not modify provider settings if the disabled provider refuses verification.
  for(const actor of actors){
   const email=actor+'@staging.invalid',known=users.find(u=>u.email===email);
   const generated=await auth('/admin/generate_link',{type:'magiclink',email});
   const link=await generated.json();check(actor+'_no_delivery_link',generated.ok,{status:generated.status,errorCode:link.error_code||link.code});
   assert(link.id===known.id&&link.hashed_token,'EXISTING_USER_LINK_REQUIRED');
   const verified=await auth('/verify',{type:'email',token_hash:link.hashed_token},anon);const session=await verified.json();
   check(actor+'_genuine_auth_session',verified.ok&&session.user?.id===known.id&&Boolean(session.access_token),{status:verified.status,errorCode:session.error_code||session.code});
   accessTokens.push({actor,email,token:session.access_token});
  }
  secret=crypto.randomBytes(16).toString('hex');const made=await api('/v1/projects/'+project+'/protection-bypass',{generate:{secret,note:'seo-real-session-'+Date.now()}});created=true;assert(made.protectionBypass?.[secret],'AUTOMATION_CREDENTIAL_REQUIRED');
  await new Promise(resolve=>setTimeout(resolve,20000));
  for(const session of accessTokens){
   const r=await app('/api/admin/auth/session','POST',{email:session.email,access_token:session.token});
   const expected=session.actor==='revoked'?403:200;check(session.actor+'_app_session',r.status===expected,{status:r.status});
   if(expected!==200)continue;
   const cookies=r.headers.getSetCookie().map(c=>c.split(';')[0]).filter(c=>!c.endsWith('=')).join('; ');assert(cookies.includes('admin_session='),'APP_SESSION_REQUIRED');appCookies.push(cookies);
   for(const route of ['/api/admin/seo','/api/admin/seo/sync']){
    const res=await app(route,'GET',undefined,cookies);const payload=await res.json();
    // Product viewers may read documents but cannot operate synchronization.
    const status=route.endsWith('/sync')&&session.actor!=='owner'?403:200;
    check(session.actor+route,res.status===status,{status:res.status});
    if(route==='/api/admin/seo'&&res.ok){check(session.actor+'_edit_permissions',payload.canEditProducts===(session.actor!=='viewer'));report.checks.push({name:session.actor+'_document_count',count:payload.documents?.length,passed:Array.isArray(payload.documents)});}
   }
   const denied=await app('/api/admin/seo/editorial','POST',{},cookies);check(session.actor+'_invalid_editorial_no_write',[400,403].includes(denied.status),{status:denied.status});
   for(const table of ['products','seo_documents','seo_events','admin_staff']){
    const res=await fetch(db+'/rest/v1/'+table+'?select=*&limit=1',{headers:{apikey:anon,Authorization:`Bearer ${session.token}`},redirect:'error',signal:AbortSignal.timeout(15000)});
    check(session.actor+'_direct_rest_denied_'+table,[401,403].includes(res.status),{status:res.status});await res.body?.cancel();
   }
  }
  report.passed=report.checks.every(c=>c.passed);
 }catch(e){report.passed=false;report.failure=/^[A-Za-z0-9_/-]+$/.test(e.message)?e.message:'SESSION_ACCEPTANCE_FAILED';}
 finally{
  report.cleanup=[];
  for(const cookie of appCookies){try{const r=await app('/api/admin/auth/session','DELETE',undefined,cookie);report.cleanup.push({kind:'app_cookie_clear',passed:r.ok});}catch{report.cleanup.push({kind:'app_cookie_clear',passed:false});}}
  for(const session of accessTokens){try{const r=await fetch(db+'/auth/v1/logout?scope=local',{method:'POST',headers:{apikey:anon,Authorization:`Bearer ${session.token}`},redirect:'error',signal:AbortSignal.timeout(15000)});report.cleanup.push({actor:session.actor,kind:'supabase_session_logout',passed:r.ok});}catch{report.cleanup.push({actor:session.actor,kind:'supabase_session_logout',passed:false});}}
  if(created){try{await api('/v1/projects/'+project+'/protection-bypass',{revoke:{secret,regenerate:false}});const p=await api('/v9/projects/'+project);report.credentialRevoked=!p.protectionBypass?.[secret]&&p.ssoProtection?.deploymentType==='all';}catch{report.credentialRevoked=false;}}
  if(report.cleanup.some(c=>!c.passed)||created&&!report.credentialRevoked)report.passed=false;
  report.finishedAt=new Date().toISOString();const file=`artifacts/seo-real-session-acceptance-${Date.now()}.json`;fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({file,...report}));if(!report.passed)process.exitCode=1;
 }
})();
