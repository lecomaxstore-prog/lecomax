// Local source provenance check only. Does not edit a release candidate or deploy.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifest=JSON.parse(fs.readFileSync(process.argv[2]||'artifacts/seo-manual-candidate.json','utf8'));
const archive=path.resolve('artifacts/seo-migration/production-source-for-seo-20261018.tar');
const output=path.resolve('artifacts/seo-final-preparation',`scope-${Date.now()}`),baseline=process.argv[3]?path.resolve(process.argv[3]):path.join(output,'baseline');
fs.mkdirSync(output,{recursive:true});
const tar='C:/Windows/System32/tar.exe';
const names=cp.execFileSync(tar,['-tf',archive],{encoding:'utf8',windowsHide:true}).split(/\r?\n/).filter(Boolean);
if(names.some(n=>path.isAbsolute(n)||n.split(/[\\/]/).includes('..')))throw Error('UNSAFE_ARCHIVE_PATH');
if(!process.argv[3]){fs.mkdirSync(baseline);cp.execFileSync(tar,['-xf',archive,'-C',baseline],{windowsHide:true});}
const ignored=new Set(['.next','.source-library','node_modules','.git','.vercel']);
const walk=(root,relative='')=>fs.readdirSync(path.join(root,relative),{withFileTypes:true}).flatMap(e=>{
 const file=path.posix.join(relative,e.name);if((!relative&&ignored.has(e.name))||file.endsWith('.tsbuildinfo'))return [];
 if(e.isSymbolicLink())throw Error('UNEXPECTED_SOURCE_LINK');
 return e.isDirectory()?walk(root,file):[file];
});
const before=new Map(walk(baseline).map(file=>[file,hash(path.join(baseline,file))]));
const after=new Map(walk(manifest.directory).map(file=>[file,hash(path.join(manifest.directory,file))]));
const allowed=new Map(manifest.files.map(e=>[e.file,e.sha256]));
const differences=[...new Set([...before.keys(),...after.keys()])].filter(f=>before.get(f)!==after.get(f)).map(file=>({file,kind:!before.has(file)?'added':!after.has(file)?'removed':'modified',pinned:allowed.get(file)===after.get(file)}));
const unexpected=differences.filter(e=>!e.pinned);
const mismatches=manifest.files.filter(e=>after.get(e.file)!==e.sha256).map(e=>e.file);
const result={at:new Date().toISOString(),baseCommit:manifest.baseCommit,baselineArchiveSha256:hash(archive),candidate:manifest.directory,baselineFiles:before.size,candidateFiles:after.size,ignoredGeneratedDirectories:[...ignored],differences,unexpected,pinnedMismatches:mismatches,passed:!unexpected.length&&!mismatches.length,productionWrites:false};
fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({directory:output,...result}));if(!result.passed)process.exitCode=1;
