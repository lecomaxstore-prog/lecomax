// Prepare an isolated dependency review. Never mutates shared node_modules.
const fs=require('node:fs'),path=require('node:path');
const source=path.resolve("../L'ecomax-seo-staging"),target=path.resolve('artifacts/seo-dependency-remediation-20261021');
fs.mkdirSync(target,{recursive:true});
for(const name of ['package.json','package-lock.json'])fs.copyFileSync(path.join(source,name),path.join(target,name),fs.constants.COPYFILE_EXCL);
const p=JSON.parse(fs.readFileSync(path.join(target,'package.json')));
Object.assign(p.dependencies,{next:'15.5.28','@next/env':'15.5.28','sanitize-html':'2.18.1',sharp:'0.35.5',nodemailer:'10.1.7'});
p.devDependencies['eslint-config-next']='15.5.28';
fs.writeFileSync(path.join(target,'package.json'),JSON.stringify(p,null,2)+'\n');
console.log(target);
