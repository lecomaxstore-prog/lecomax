const fs=require('node:fs');const path=require('node:path');const esbuild=require('esbuild');
const root=path.resolve(__dirname,'..');
const assets={earth:'data:image/jpeg;base64,'+fs.readFileSync(path.join(root,'assets/world/earth-2048.jpg')).toString('base64')};
const license=fs.readFileSync(path.join(root,'node_modules/three/LICENSE'),'utf8');
function build(entry,template,output){const js=esbuild.buildSync({entryPoints:[path.join(root,'features/world',entry)],bundle:true,minify:true,format:'iife',target:['es2020'],write:false,legalComments:'inline'}).outputFiles[0].text;const html=fs.readFileSync(path.join(root,'features/world',template),'utf8').replace('<!--WORLD_SCRIPT-->',()=>'<script>window.worldAssets='+JSON.stringify(assets)+';</script><script>/*'+license+'*/\n'+js.replace(/<\/script/gi,'<\\/script')+'</script>');fs.writeFileSync(path.join(root,'data',output),JSON.stringify(html));console.log(output+': '+Buffer.byteLength(html)+' bytes');}
build('earth-runtime.ts','earth.html','world-runtime.json');
