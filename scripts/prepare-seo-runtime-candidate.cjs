// Local-only promotion of the validated dependency delta. Never pushes/deploys.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),target=path.resolve(root,"../L'ecomax-seo-staging");
const validated=path.join(root,'artifacts/seo-dependency-remediation-20261021');
const evidence=path.join(root,'artifacts/seo-staging-rc-20261020');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const inventory=JSON.parse(fs.readFileSync(path.join(evidence,'upload-inventory-1792537752288.json')));
for(const mode of ['application','worker','types','build']) {
 const name=fs.readdirSync(validated).filter(n=>new RegExp(`^${mode}-[0-9]+\\.json$`).test(n)).sort().at(-1);
 if(!name||JSON.parse(fs.readFileSync(path.join(validated,name))).exitCode!==0)throw Error(`VALIDATION_REQUIRED_${mode}`);
}
for(const entry of inventory.files){
 if(sha(fs.readFileSync(path.join(target,entry.file)))!==entry.sha256)throw Error(`ORIGINAL_DRIFT:${entry.file}`);
 if(!['package.json','package-lock.json'].includes(entry.file)&&sha(fs.readFileSync(path.join(validated,entry.file)))!==entry.sha256)throw Error(`VALIDATED_SOURCE_DRIFT:${entry.file}`);
}
const auditBytes=fs.readFileSync(path.join(validated,'audit-runtime-acceptance-20261021.json'));
const audit=JSON.parse((auditBytes[0]===255?auditBytes.toString('utf16le'):auditBytes.toString()).replace(/^\uFEFF/,''));
if(audit.metadata.vulnerabilities.total!==0)throw Error('RUNTIME_AUDIT_REQUIRED');
const backup=path.join(root,`artifacts/seo-runtime-candidate-${Date.now()}`);fs.mkdirSync(backup);
const entries=[];
for(const file of ['package.json','package-lock.json']){
 const before=fs.readFileSync(path.join(target,file)),after=fs.readFileSync(path.join(validated,file));
 fs.writeFileSync(path.join(backup,file+'.before'),before,{flag:'wx'});
 fs.writeFileSync(path.join(target,file),after);
 entries.push({file,before:sha(before),after:sha(after)});
}
const report={id:'seo-staging-runtime-candidate-prepared-20261021',createdAt:new Date().toISOString(),status:'needs-testing',
 relatedId:'seo-staging-dependency-remediation-prepared-20261021',title:'Validated dependency candidate prepared for protected staging',
 summary:'Promote the two tested dependency manifests into the existing staging worktree. Original manifests preserved; deployment and hosted acceptance remain pending.',
 pages:['SEO staging','Change History'],components:['Runtime dependencies','Staging release candidate'],files:['package.json','package-lock.json','scripts/prepare-seo-runtime-candidate.cjs'],
 changes:[{kind:'modified',detail:'Next 15.5.28 with matching env/ESLint, sanitize-html 2.18.1, sharp 0.35.5 and Nodemailer 10.1.7; compatible transitive resolutions. No shared node_modules changes, push or deployment.'}],
 validation:[{name:'Isolated candidate',result:'passed',detail:'161 application and 71 worker tests, TypeScript and production build passed. Every upload source file matched the original inventory except the two dependency manifests.'},
 {name:'Email compatibility and security',result:'passed',detail:'Offline MIME generation passed for original and proposed Nodemailer. Fresh runtime npm audit: zero findings. Nine development-tool findings remain; no force upgrades.'},
 {name:'Hosted candidate acceptance',result:'not-run',detail:'New dependency candidate not deployed. SMTP delivery deliberately not tested; protected browser and real-role acceptance pending.'}]};
const reportFile=path.join(backup,'prepared.json');fs.writeFileSync(reportFile,JSON.stringify(report,null,2));
for(const cwd of [root,target]){
 const parent=report.relatedId+'.json';
 if(!fs.existsSync(path.join(cwd,'lecomax-learning-app/changes',parent)))cp.execFileSync(process.execPath,['lecomax-learning-app/scripts/change-report.cjs','--append',path.join(root,'lecomax-learning-app/changes',parent)],{cwd,stdio:'inherit',windowsHide:true});
 cp.execFileSync(process.execPath,['lecomax-learning-app/scripts/change-report.cjs','--append',reportFile],{cwd,stdio:'inherit',windowsHide:true});
}
fs.writeFileSync(path.join(backup,'manifest.json'),JSON.stringify({at:new Date().toISOString(),target,source:validated,entries,deployed:false},null,2));
console.log(JSON.stringify({backup,entries,deployed:false}));
