import {randomBytes} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {createInterface,emitKeypressEvents} from 'node:readline';
import argon2 from 'argon2';
if(!process.stdin.isTTY)throw new Error('Use an interactive terminal. Never pass a password as a command argument.');
const rl=createInterface({input:process.stdin,output:process.stdout});
const email=(await new Promise(resolve=>rl.question('Owner email: ',resolve))).trim().toLowerCase();rl.close();
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Invalid email');
async function hidden(label){
 process.stdout.write(label);emitKeypressEvents(process.stdin);process.stdin.setRawMode(true);process.stdin.resume();
 return new Promise((resolve,reject)=>{let value='';const onKey=(text,key)=>{
  if(key?.ctrl&&key.name==='c'){done();reject(new Error('Cancelled'));return;}
  if(key?.name==='return'){done();resolve(value);return;}
  if(key?.name==='backspace'){value=[...value].slice(0,-1).join('');return;}
  if(text&&!key?.ctrl&&!key?.meta&&!/[\x00-\x1f\x7f]/.test(text))value+=text;
 };function done(){process.stdin.off('keypress',onKey);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');}process.stdin.on('keypress',onKey);});
}
let password=await hidden('Password (hidden, at least 14 characters): ');
let confirmation=await hidden('Repeat password (hidden): ');
if(password.length<14||password.length>1024||password!==confirmation)throw new Error('Passwords must match and contain 14–1024 characters');
const hash=await argon2.hash(password,{type:argon2.argon2id,memoryCost:65536,timeCost:3,parallelism:1});password='';confirmation='';
const file=new URL('../.env.local',import.meta.url);
let env=await readFile(file,'utf8').catch(e=>{if(e.code==='ENOENT')return '';throw e;});
// Next.js expands dollar signs even in quoted dotenv values. Escape the PHC hash.
const values={OWNER_EMAIL:email,OWNER_PASSWORD_HASH:hash.replaceAll('$','\\$'),SESSION_SECRET:randomBytes(32).toString('hex')};
for(const [key,value]of Object.entries(values)){
 const line=key+'="'+value+'"';const pattern=new RegExp('^'+key+'=.*$','m');env=pattern.test(env)?env.replace(pattern,()=>line):env+'\n'+line;
}
env=env.replace(/^OWNER_PASSWORD=.*\r?\n?/gm,'');
await writeFile(file,env.trimEnd()+'\n',{mode:0o600});
console.log('Saved OWNER_EMAIL, Argon2id OWNER_PASSWORD_HASH, and a new SESSION_SECRET in backend .env.local. Existing sessions will be invalid after restart. Add OWNER_DATABASE_URL privately. Do not copy this file into the mobile app.');
