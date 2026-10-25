// Existing authorized credentials remain in process memory; no secret output.
const cp=require('node:child_process');
require('@next/env').loadEnvConfig(process.cwd(),false,{info(){},error(){}});
if(!process.env.OWNER_DATABASE_URL){console.log('OWNER_DATABASE_URL_UNAVAILABLE');process.exit(1);}
const mode=process.argv[2];if(!['check','backup'].includes(mode))throw Error('MODE');
const r=cp.spawnSync(process.execPath,['scripts/seo-encrypted-production-backup.cjs',mode],{env:{...process.env,LECOMAX_BACKUP_DATABASE_URI:process.env.OWNER_DATABASE_URL},stdio:'inherit',windowsHide:true});process.exitCode=r.status??1;
