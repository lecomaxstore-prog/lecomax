// Offline guard only. Never launches a CLI, loads dotenv, or reads credential values.
const fs=require('node:fs');
const path=require('node:path');
function inspect(root=path.resolve(__dirname,'..')) {
  const file=path.join(root,'supabase/.temp/project-ref');
  let linked=null;
  let blocked=null;
  try {
    for(const part of ['supabase','supabase/.temp','supabase/.temp/project-ref']) {
      const candidate=path.join(root,part);
      let stat;
      try {stat=fs.lstatSync(candidate);} catch(error) {if(error.code==='ENOENT') break;throw error;}
      if(stat.isSymbolicLink()) {blocked='blocked-filesystem-link';break;}
      if(part.endsWith('project-ref')) {
        if(!stat.isFile()||stat.size>128) {blocked='blocked-invalid-ref-file';break;}
        linked=fs.readFileSync(file,'utf8').trim();
        if(!/^[a-z]{20}$/.test(linked)) blocked='blocked-invalid-ref-file';
      } else if(!stat.isDirectory()) {blocked='blocked-invalid-ref-path';break;}
    }
  } catch {blocked='blocked-unreadable-ref';}
  const expected='tyltharlnbxrxibuxyye';
  return {readOnly:true,networkCalls:0,expectedStaging:expected,
    linkedProject:linked&&/^[a-z]{20}$/.test(linked)?linked:null,
    status:blocked||(linked===expected?'staging-link-only-not-authorization':linked?'blocked-wrong-or-invalid-link':'unlinked'),
    credentialValuesRead:false,
    warning:'A project-ref file proves neither login nor ownership. Never run linked database commands for this audit.'};
}
module.exports={inspect};
if(require.main===module){
  if(process.argv.length!==2){console.error('NO_EXECUTION_OR_TARGET_ARGUMENTS_SUPPORTED');process.exitCode=1;}
  else {const result=inspect();console.log(JSON.stringify(result,null,2));if(result.status!=='staging-link-only-not-authorization')process.exitCode=1;}
}
