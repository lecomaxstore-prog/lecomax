import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
const base=path.resolve('lecomax-learning-app');
const secrets=Object.entries(process.env).filter(([key,value])=>!key.startsWith('EXPO_PUBLIC_')&&!key.startsWith('NEXT_PUBLIC_')&&/(SECRET|PASSWORD|SERVICE_ROLE|PRIVATE_KEY|API_KEY|ACCESS_TOKEN|DATABASE_URL)/.test(key)&&value&&value.length>=16);
let count=0;const errors=[];
async function scan(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())await scan(file);else if(/\.(js|ts|tsx|json|hbc)$/.test(file)){
 count++;const source=await readFile(file,'utf8');for(const [key,value]of secrets)if(source.includes(value))errors.push(path.relative(base,file)+': contains '+key);
 if(/\.(ts|tsx)$/.test(file)&&!file.includes(path.sep+'data'+path.sep))for(const match of source.matchAll(/process\.env\.([A-Z_]+)/g))if(!['EXPO_PUBLIC_LEARNING_API_URL','NODE_ENV'].includes(match[1]))errors.push(path.relative(base,file)+': unexpected environment reference '+match[1]);
}}}
for(const folder of ['app','components','features','services','store','utils','data',...process.argv.slice(2)])await scan(path.join(base,folder));
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('PASS: '+count+' learning app source/content/bundle files scanned; no configured backend secret values or unexpected client environment references.');
