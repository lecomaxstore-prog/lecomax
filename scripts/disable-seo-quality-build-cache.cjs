// Only modifies this task's disposable build check, never application config.
const fs=require('node:fs'),path=require('node:path');
const {directory}=JSON.parse(fs.readFileSync('artifacts/seo-quality/build-candidate.json','utf8'));
if(!/^release\/seo-quality-check-\d+$/.test(directory))throw Error('UNEXPECTED_BUILD_DIRECTORY');
const config=path.join(directory,'next.config.js');
if(fs.readFileSync(config,'utf8').includes('qualityCheckOriginalConfig'))throw Error('ALREADY_DISABLED');
fs.appendFileSync(config,`\n// Disposable local build check: avoid filesystem cache on a full disk.\nconst qualityCheckOriginalConfig=module.exports;\nmodule.exports=async(...args)=>{const config=await qualityCheckOriginalConfig(...args);const originalWebpack=config.webpack;return {...config,webpack:(value,...rest)=>{const result=originalWebpack?originalWebpack(value,...rest):value;result.cache=false;return result;}};};\n`);
fs.writeFileSync('artifacts/seo-quality/build-cache-adjustment.json',JSON.stringify({at:new Date().toISOString(),directory,reason:'ENOSPC: disabled webpack cache for disposable build check only',applicationConfigChanged:false,previousCandidatesChanged:false},null,2),{flag:'wx'});
