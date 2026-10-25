const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),Module=require('node:module'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),target=path.join(root,'artifacts/seo-dependency-remediation-20261021');
const mode=process.argv[2],node=path.join(root,'artifacts/seo-node24/node-v24.22.0.exe');
if(mode==='copy'){
 const dir=path.join(root,'artifacts/seo-staging-rc-20261020');const inv=JSON.parse(fs.readFileSync(path.join(dir,fs.readdirSync(dir).filter(n=>/^upload-inventory-\d+\.json$/.test(n)).sort().at(-1))));
 for(const e of inv.files){if(['package.json','package-lock.json'].includes(e.file))continue;const input=path.resolve(root,"../L'ecomax-seo-staging",e.file),output=path.join(target,e.file);if(crypto.createHash('sha256').update(fs.readFileSync(input)).digest('hex')!==e.sha256)throw Error('SOURCE_DRIFT');fs.mkdirSync(path.dirname(output),{recursive:true});fs.copyFileSync(input,output,fs.constants.COPYFILE_EXCL);}
 console.log('Copied reviewed source to isolated dependency validation directory.');
}else if(mode==='fixtures'){
 // Deployment exclusions omit these test-only entry points. Preserve the upload
 // inventory; add explicit, hash-recorded inputs only to the isolated test copy.
 const files=['operations/seo-vercel/node-server.mjs','operations/seo/worker/scripts/seo-sync-worker.mjs'];
 const entries=[];
 for(const file of files){
  const input=path.join(root,file),output=path.join(target,file),bytes=fs.readFileSync(input);
  fs.mkdirSync(path.dirname(output),{recursive:true});
  if(fs.existsSync(output)&&!fs.readFileSync(output).equals(bytes))throw Error('TEST_FIXTURE_DRIFT');
  if(!fs.existsSync(output))fs.writeFileSync(output,bytes,{flag:'wx'});
  entries.push({file,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),testOnly:true});
 }
 const evidence=path.join(target,`test-fixtures-${Date.now()}.json`);
 fs.writeFileSync(evidence,JSON.stringify({at:new Date().toISOString(),entries,deployed:false},null,2),{flag:'wx'});
 console.log(evidence);
}else if(mode==='install'){
 const env={};for(const[k,v]of Object.entries(process.env))if(/^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|ProgramFiles|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k))env[k]=v;
 const log=path.join(target,`clean-install-${Date.now()}.log`),fd=fs.openSync(log,'wx');
 const result=cp.spawnSync(node,[path.join(process.env.ProgramFiles,'nodejs/node_modules/npm/bin/npm-cli.js'),'ci','--no-fund'],{cwd:target,env,windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);console.log(JSON.stringify({log,exitCode:result.status}));process.exitCode=result.status||0;
}else{
 const file=path.join(root,'scripts/validate-seo-staging-rc.cjs');
 let source=fs.readFileSync(file,'utf8').replace('const target = path.resolve(root, "../L\'ecomax-seo-staging");',`const target = ${JSON.stringify(target)};`).replaceAll("path.join(root, 'node_modules/","path.join(target, 'node_modules/");
 // Keep evidence in the new directory; its build guard is independent.
 source=source.replace("const evidence = path.join(root, 'artifacts/seo-staging-rc-20261020');",`const evidence = ${JSON.stringify(target)};`);
 const harness=new Module(file,module);harness.filename=file;harness.paths=Module._nodeModulePaths(path.dirname(file));harness._compile(source,file);
}
