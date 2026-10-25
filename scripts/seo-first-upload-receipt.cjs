const { vercelApiFetch } = require('./vercel-cli-api.cjs');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const id='dpl_A2Zu5TrCJ787DskFvBvtXb3jU9oG',team='team_yFLUcpSvgQi8EQuvuorOZW7w';
(async()=>{
 const r=await vercelApiFetch(`https://api.vercel.com/v6/deployments/${id}/files?teamId=${team}`,{headers:{},redirect:'error'});if(!r.ok)throw Error('API_'+r.status);
 const tree=await r.json(),files=[];
 function walk(nodes,base=''){for(const n of nodes){const file=base+n.name;if(n.type==='directory')walk(n.children||[],file+'/');else files.push({file,uid:n.uid,size:n.size});}}
 if(!Array.isArray(tree))throw Error('FILE_RESPONSE');walk(tree);for(const f of files)if(f.file.startsWith('src/'))f.file=f.file.slice(4);
 const dir='artifacts/seo-staging-rc-20261020',inventory=JSON.parse(fs.readFileSync(path.join(dir,fs.readdirSync(dir).filter(x=>x.startsWith('upload-inventory-')).sort().at(-1))));
 const names=new Set(files.map(x=>x.file)),expected=new Set(inventory.files.map(x=>x.file));
 const extra=files.filter(x=>!expected.has(x.file)),missing=inventory.files.filter(x=>!names.has(x.file)).map(x=>x.file);
 const mismatches=[];for(const f of files){const local=path.resolve("../L'ecomax-seo-staging",f.file);if(fs.existsSync(local)&&/^[a-f0-9]{40}$/.test(f.uid||'')&&crypto.createHash('sha1').update(fs.readFileSync(local)).digest('hex')!==f.uid)mismatches.push(f.file);}
 const report={at:new Date().toISOString(),id,files:files.length,extra,missing,mismatches,credentialNames:files.filter(x=>/(^|\/)(\.env(?:\.|$)|\.vercel\/)|\.dpapi$/.test(x.file)),receipt:files};
 const file=`artifacts/seo-first-upload-receipt-${Date.now()}.json`;fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({...report,receipt:undefined,extra:extra.slice(0,20),missing:missing.slice(0,20),mismatches:mismatches.slice(0,20),file},null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
