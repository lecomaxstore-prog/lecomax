const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path');
const cli=path.join(process.env.APPDATA,'npm/node_modules/vercel/dist/index.js');
const stage='d';const dir=path.resolve('artifacts/seo-release-d-production-20261022');const receipt=JSON.parse(fs.readFileSync(path.join(dir,'receipt.json')));const submission=JSON.parse(fs.readFileSync(path.join(dir,'submission.json')));const out={at:new Date().toISOString(),since:submission.at,deployment:receipt.deployment,queries:[]};
for(const filter of [['--status-code','5xx'],['--level','error']]){
 const r=cp.spawnSync(process.execPath,[cli,'logs',out.deployment,'--no-follow','--no-branch','--project','prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb','--scope','team_yFLUcpSvgQi8EQuvuorOZW7w','--since',out.since,'--limit','100','--json',...filter],{encoding:'utf8',timeout:60000,windowsHide:true,env:{...process.env,NO_UPDATE_NOTIFIER:'1',VERCEL_TELEMETRY_DISABLED:'1'}});
 const lines=(r.stdout||'').split('\n').filter(Boolean),parsed=lines.flatMap(l=>{try{return [JSON.parse(l)]}catch{return []}});
 // Do not retain message contents, headers, request bodies, or customer details.
 out.queries.push({filter,exitCode:r.status,parsedRecords:parsed.length,unparsedLines:lines.length-parsed.length,records:parsed.map(x=>({statusCode:x.statusCode,level:x.level,source:x.source,timestamp:x.timestamp})),accessDenied:/forbidden|not authorized|unauthorized/i.test(r.stderr||''),timedOut:r.error?.code==='ETIMEDOUT'});
}
fs.writeFileSync(dir+'/runtime-summary-'+Date.now()+'.json',JSON.stringify(out,null,2),{flag:'wx'});console.log(JSON.stringify(out));
