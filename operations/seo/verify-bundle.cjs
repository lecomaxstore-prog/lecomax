// Read-only integrity gate. Never connects to a database or starts a scheduler.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'),'utf8'));
for(const item of manifest.files){
  const file=path.resolve(__dirname,item.file);
  if(!file.startsWith(path.resolve(__dirname)+path.sep)||sha(fs.readFileSync(file))!==item.sha256)throw Error('Bundle integrity failure: '+item.file);
}
if(sha(fs.readFileSync(path.join(__dirname,'migration.sql')))!=='1f084348a0702a9ae6f5a2a52a59537c544d8b8aa2dc7e86e6fe38c33a725445')throw Error('Wrong migration');
const wrapper=fs.readFileSync(path.join(__dirname,'apply.psql'),'utf8');
if((wrapper.match(/\\ir\s+\S+/g)||[]).join('\n')!=='\\ir migration.sql')throw Error('Unexpected SQL include');
console.log(JSON.stringify({verified:true,migration:'202610180002 standalone alternative',files:manifest.files.length,networkCalls:0,applied:false}));
