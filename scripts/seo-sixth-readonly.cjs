const { vercelApiFetch } = require('./vercel-cli-api.cjs');
// Read-only release evidence. Never persist environment values or credential maps.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const team='team_yFLUcpSvgQi8EQuvuorOZW7w',production='prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb',staging='prj_jPniwpH4s81bhISVReUKTQN0GwvD';
const report={at:new Date().toISOString(),readOnly:true,production,staging};
async function get(route){const u=new URL(route,'https://api.vercel.com');u.searchParams.set('teamId',team);const r=await vercelApiFetch(u,{headers:{},redirect:'error',signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`API_${r.status}`);return r.json();}
(async()=>{
 const s=await get('/v9/projects/'+staging);assert(s.id===staging&&s.accountId===team);
 report.staging={protection:s.ssoProtection?.deploymentType,cronCount:s.crons?.definitions?.length||0,gitConnected:Boolean(s.link),remainingAcceptanceCredentials:Object.values(s.protectionBypass||{}).filter(x=>/^seo-runtime-acceptance-/.test(x.note||'')).length};
 const p=await get('/v9/projects/'+production);assert(p.id===production&&p.accountId===team);
 const domains=await get('/v9/projects/'+production+'/domains');assert(domains.domains.some(x=>x.name==='lecomax.com'));
 const list=await get('/v6/deployments?projectId='+production+'&target=production&state=READY&limit=1');
 report.productionProject={name:p.name,productionDomainVerified:true,nodeVersion:p.nodeVersion,cronCount:p.crons?.definitions?.length||0,latestReady:list.deployments.map(x=>({id:x.uid,url:x.url,created:x.created,revision:x.meta?.githubCommitSha||null}))};
 const metadata=(await get('/v10/projects/'+production+'/env?decrypt=false')).envs;
 report.productionEnvironment={names:metadata.filter(x=>x.target?.includes('production')).map(x=>x.key).sort(),valuesVerified:false};
 const pulled=await get('/v3/env/pull/'+production+'/production?source=vercel-cli:pull');
 const e=pulled.env||{};report.productionEnvironment.databaseUrlMatchesExpected=e.NEXT_PUBLIC_SUPABASE_URL==='https://yddqwgdgeljkzfsmtein.supabase.co';
 report.productionEnvironment.databaseUrlReadable=Boolean(e.NEXT_PUBLIC_SUPABASE_URL);
 report.productionEnvironment.databaseHostname=e.NEXT_PUBLIC_SUPABASE_URL?new URL(e.NEXT_PUBLIC_SUPABASE_URL.trim()).hostname:null;
 report.productionEnvironment.databaseUrlIsStaging=e.NEXT_PUBLIC_SUPABASE_URL==='https://tyltharlnbxrxibuxyye.supabase.co';
 report.productionEnvironment.secretPresenceOnly={serviceRole:Boolean(e.SUPABASE_SERVICE_ROLE_KEY),adminSession:Boolean(e.ADMIN_SESSION_SECRET)};
 report.productionEnvironment.limitations='Withheld/absent values cannot certify stored secret bytes. No production database connection or modification performed.';
 report.completed=true;
})().catch(e=>{report.completed=false;report.failure=/^API_\d+$/.test(e.message)?e.message:'READONLY_CHECK_FAILED';process.exitCode=1;}).finally(()=>{const file=`artifacts/seo-sixth-readonly-${Date.now()}.json`;fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({file,...report}));});
