import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const env = await readFile('.env.local','utf8');
const secret = /^OPENAI_API_KEY=["']?([^\r\n"']+)/m.exec(env)?.[1];
if(!secret || secret.length < 12)throw Error('Configured key unavailable for the client artifact audit');
let checked=0;
async function scan(directory,all=false){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const file=path.join(directory,entry.name);
    if(entry.isDirectory())await scan(file,all);
    else if(entry.isFile()&&(all||/\.(html|rsc)$/.test(file))){
      checked++;
      if((await readFile(file)).includes(Buffer.from(secret)))throw Error('Configured key found in client artifact: '+file);
    }
  }
}
await scan('.next/static',true);await scan('.next/server/app');
console.log(`PASS: no configured OpenAI key in ${checked} client/static/HTML/RSC artifacts.`);
