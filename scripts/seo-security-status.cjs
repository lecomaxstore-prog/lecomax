const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {vercelApiFetch}=require('./vercel-cli-api.cjs');
const dir=path.resolve(__dirname,'../artifacts/seo-security-resume-20261021'),id='dpl_4VCPk44FjpUmadAZKJyNFUKRHMyf',project='prj_jPniwpH4s81bhISVReUKTQN0GwvD',team='team_yFLUcpSvgQi8EQuvuorOZW7w';
async function get(route){const u=new URL(route,'https://api.vercel.com');u.searchParams.set('teamId',team);const r=await vercelApiFetch(u);assert(r.ok);return r.json();}
(async()=>{
 const [d,p,a]=await Promise.all([get('/v13/deployments/'+id),get('/v9/projects/'+project),get('/v4/aliases/lecomax-seo-staging.vercel.app')]);
 assert(d.projectId===project&&p.accountId===team);
 const report={at:new Date().toISOString(),id,url:d.url,state:d.readyState,project,aliasDeployment:a.deploymentId||a.deployment?.id,protection:p.ssoProtection?.deploymentType,crons:p.crons?.definitions||[],errorCode:d.errorCode};
 if(process.argv[2]==='files'){
  const tree=await get('/v6/deployments/'+id+'/files'),files=[];
  function walk(nodes,base=''){for(const n of nodes){const name=base+n.name;if(n.type==='directory')walk(n.children||[],name+'/');else files.push({file:name.replace(/^src\//,''),uid:n.uid});}}walk(tree);
  const manifest=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../artifacts/seo-write-guard-20261021/release-manifest.json'))),expected=new Set(manifest.files.map(f=>f.file)),actual=new Set(files.map(f=>f.file));
  report.upload={count:files.length,extra:files.filter(f=>!expected.has(f.file)).map(f=>f.file),missing:[...expected].filter(f=>!actual.has(f)),mismatches:files.filter(f=>expected.has(f.file)&&crypto.createHash('sha1').update(fs.readFileSync(path.join(dir,'source',f.file))).digest('hex')!==f.uid).map(f=>f.file)};
  fs.writeFileSync(path.join(dir,'upload-receipt-'+Date.now()+'.json'),JSON.stringify(files,null,2),{flag:'wx'});
 }
 const file=path.join(dir,'status-'+Date.now()+'.json');fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({file,...report}));
})().catch(()=>{console.error('STATUS_FAILED');process.exitCode=1;});
