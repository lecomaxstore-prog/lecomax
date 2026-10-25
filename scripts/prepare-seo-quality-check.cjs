// Isolated production build preparation: no old release is modified; no secrets copied.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const prior=JSON.parse(fs.readFileSync('artifacts/seo-premium/candidate.json','utf8'));
for(const e of prior.files)if(hash(path.join(prior.directory,e.file))!==e.sha256)throw Error('PRIOR_CANDIDATE_DRIFT');
const directory=`release/seo-quality-check-${Date.now()}`;
const excluded=new Set(['.next','.next-dev','.source-library','node_modules','.git','artifacts']);
fs.cpSync(prior.directory,directory,{recursive:true,force:false,errorOnExist:true,filter:src=>!src.split(path.sep).some(p=>excluded.has(p)||p.startsWith('.env'))});
const files=['app/admin/seo/SeoAiControl.tsx','app/admin/seo/EditorialReview.tsx','app/api/admin/seo/ai/route.ts','operations/seo-vercel/lib/seo-editorial-quality.mjs','operations/seo-vercel/lib/seo-editorial-quality.d.mts','lecomax-learning-app/data/change-history.json'];
for(const file of files){const target=path.join(directory,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target);}
fs.mkdirSync('artifacts/seo-quality',{recursive:true});
fs.writeFileSync('artifacts/seo-quality/build-candidate.json',JSON.stringify({at:new Date().toISOString(),directory,previousCandidate:prior.directory,files:files.map(file=>({file,sha256:hash(file)})),deployed:false,buildOnly:true},null,2),{flag:'wx'});
console.log(JSON.stringify({directory,previousCandidateVerified:true}));
