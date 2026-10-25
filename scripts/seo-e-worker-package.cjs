// Source-only standalone worker package; never deploys or enables scheduling.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve('release/seo-e-cumulative-20261022/operations/seo-vercel'),out=path.resolve('artifacts/seo-e-final-20261022/worker-runtime');
fs.mkdirSync(out);const files=['package.json','package-lock.json','node-server.mjs','api/sync.mjs','vercel.json',...fs.readdirSync(path.join(root,'lib')).map(x=>'lib/'+x)];
const manifest=[];for(const file of files){const b=fs.readFileSync(path.join(root,file)),dest=path.join(out,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,b,{flag:'wx'});manifest.push({file,sha256:crypto.createHash('sha256').update(b).digest('hex')});}
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(out,'vercel.json'))).crons,[]);
fs.writeFileSync('artifacts/seo-e-final-20261022/worker-package.json',JSON.stringify({at:new Date().toISOString(),source:root,output:out,files:manifest,scheduled:false,deployed:false},null,2),{flag:'wx'});console.log(JSON.stringify({files:manifest.length,output:out}));
