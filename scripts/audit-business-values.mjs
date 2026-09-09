import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const groups = {
  delivery: /shipping|deliveryFee|deliveryPrice|livraison|free.?shipping/i,
  pricing: /\bprice\b|original_price|discount|promotion|coupon|\bVAT\b|tax_rate|payment_.*fee/i,
  inventory: /low_stock|preorder|variant_stock|color_stock|__vstock/i,
  contact: /supportEmail|store_email|store_phone|whatsapp|business_hours|contact@lecomax|699289568/i,
  configuration: /STORE_SETTINGS|APP_SETTINGS|feature.?flag|maintenance_mode|announcement_|hero_image/i,
  currency: /\bMAD\b|\bDH\b|currency/,
};
const findings=[];
async function walk(directory) {
  for(const entry of await readdir(path.join(root,directory),{withFileTypes:true})) {
    if(['node_modules','.next','assets','generated','how-it-was-built'].includes(entry.name)) continue;
    const relative=path.join(directory,entry.name);
    if(entry.isDirectory()) { await walk(relative); continue; }
    if(!/\.(tsx?|sql|json)$/.test(entry.name) || /lock|snapshot/.test(entry.name)) continue;
    const lines=(await readFile(path.join(root,relative),'utf8')).split(/\r?\n/);
    lines.forEach((line,index)=>{
      const categories=Object.entries(groups).filter(([,pattern])=>pattern.test(line)).map(([group])=>group);
      if(categories.length) findings.push({file:relative.replaceAll('\\','/'),line:index+1,categories,excerpt:line.trim().slice(0,350),review:relative.startsWith('supabase')?'historical schema / migration':'review consumer; match is not proof of a duplicate'});
    });
  }
}
for(const directory of ['app','components','lib','mobile/src','supabase']) await walk(directory);
await writeFile(path.join(root,'docs/business-value-inventory.json'),JSON.stringify({note:'Candidate inventory, not a claim that every match is a defect. Excludes credentials, compiled outputs, assets, tutorials and offline catalog snapshots.',findings},null,2)+'\n');
console.log(`Recorded ${findings.length} contextual candidates in docs/business-value-inventory.json`);
