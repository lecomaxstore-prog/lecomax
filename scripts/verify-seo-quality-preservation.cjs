const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const results=[];
for(const manifest of ['artifacts/seo-openai/candidate.json','artifacts/seo-openai/worker-package.json','artifacts/seo-premium/candidate.json','artifacts/seo-premium/worker-package.json']) {
  const m=JSON.parse(fs.readFileSync(manifest,'utf8'));
  const changed=m.files.filter(e=>sha(path.join(m.directory,e.file))!==e.sha256).map(e=>e.file);
  results.push({manifest,checked:m.files.length,changed});
}
const snapshot=fs.readdirSync('artifacts/seo-quality').filter(n=>n.startsWith('comparison-integrity-')).sort()[0];
const paid=JSON.parse(fs.readFileSync(path.join('artifacts/seo-quality',snapshot),'utf8'));
results.push({manifest:snapshot,checked:paid.length,changed:paid.filter(e=>sha(path.join('artifacts/seo-premium/approved-sol61-astra-20261019',e.file))!==e.sha256).map(e=>e.file)});
const result={at:new Date().toISOString(),results,passed:results.every(r=>r.changed.length===0)};
fs.writeFileSync(`artifacts/seo-quality/preservation-${Date.now()}.json`,JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify(result));if(!result.passed)process.exitCode=1;
