const sharp=require('../../node_modules/sharp');
const fs=require('node:fs');const path=require('node:path');
const out=path.join(__dirname,'../assets');fs.mkdirSync(out,{recursive:true});
const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" rx="220" fill="#163F35"/><path d="M280 335 Q395 295 512 352 Q629 295 744 335 V662 Q630 623 512 684 Q394 623 280 662 Z" fill="#E6F0E5"/><path d="M512 355 V677" stroke="#163F35" stroke-width="18"/><path d="m355 417-45 45 45 45m314-90 45 45-45 45m-87-67-32 110" fill="none" stroke="#1F644C" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/><circle cx="720" cy="278" r="38" fill="#EDBC63"/></svg>`);
Promise.all(['icon.png','adaptive-icon.png'].map(name=>sharp(svg).png().toFile(path.join(out,name)))).then(()=>console.log('Brand assets generated'));
