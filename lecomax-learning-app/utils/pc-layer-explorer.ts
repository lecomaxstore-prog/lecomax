export function layerLabels(language: 'en' | 'fr' | 'ar') {
  const t = (en: string, fr: string, ar: string) => ({ en, fr, ar })[language];
  return {
    reveal: t('Reveal CPU & GPU', 'Voir CPU et GPU', 'بيّن CPU و GPU'),
    cover: t('Restore cooling assembly', 'Remettre le refroidissement', 'رجّع مجموعة التبريد'),
    photoNote: t('Illustrated Intel Core CPU and NVIDIA GPU examples. Tap a chip for details. Actual packages and layouts vary by model.', 'Exemples illustrés de CPU Intel Core et GPU NVIDIA. Touchez une puce pour les détails. Les puces et leur disposition varient selon le modèle.', 'أمثلة تعليمية لمعالج Intel Core وGPU من NVIDIA. اضغط على الشريحة للتفاصيل. الشكل والترتيب كيختلفو حسب الموديل.'),
    remove: t('Remove selected piece', 'Retirer la pièce sélectionnée', 'حيّد القطعة المختارة'),
    restore: t('Restore', 'Remettre', 'رجّع'),
    reset: t('Restore all pieces', 'Remettre toutes les pièces', 'رجّع جميع القطع'),
    note: t('Simplified teaching layer — not a photograph of hidden parts. Select a revealed part to learn about it.', 'Couche pédagogique simplifiée — pas une photo des pièces cachées. Sélectionnez une pièce révélée pour apprendre.', 'طبقة تعليمية مبسّطة، ماشي صورة حقيقية للقطع المخفية. اضغط على القطعة اللي بانت باش تتعلّم عليها.'),
    schematic: t('Diagram', 'Schéma', 'رسم تعليمي'),
    empty: t('Select a removable component, such as the battery, cooler, RAM or SSD.', 'Sélectionnez une pièce amovible : batterie, refroidisseur, RAM ou SSD.', 'اختار قطعة قابلة للإزالة فالمحاكاة بحال البطارية، المبرّد، الرام أو SSD.'),
    removed: t('Removed pieces', 'Pièces retirées', 'القطع المحيّدة'),
  };
}

export const pcLayerRuntime = String.raw`
const layerLinks={laptop:{battery:['cables','case'],cooler:['cpu','gpu'],ram:['motherboard'],ssd:['motherboard'],fans:['case'],wifi:['motherboard'],speakers:['cables'],cables:['case']},desktop:{cooler:['cpu'],ram:['motherboard'],ssd:['motherboard'],gpu:['motherboard'],fans:['case'],hdd:['case']}};
const removedLayers={desktop:new Map(),laptop:new Map()};
const revealedChips=[{id:'cpu',box:[37,31,9,6]},{id:'gpu',box:[51,30,10,7]}];
function currentRegions(){return device==='laptop'&&removedLayers.laptop.has('cooler')?[...regions.laptop,...revealedChips]:regions[device]}
function pickableRegions(){return currentRegions().filter(r=>!removedLayers[device].has(r.id))}
const revealButton=document.createElement('button');revealButton.id='reveal-chips';document.querySelector('.photo-tools').prepend(revealButton);
revealButton.onclick=()=>{if(removedLayers.laptop.has('cooler')){removedLayers.laptop.delete('cooler');activeRegion=null;select('cooler')}else{removedLayers.laptop.set('cooler',regions.laptop.find(r=>r.id==='cooler'));activeRegion=null;select('cpu',true)}};
const layerHost=document.createElement('div');layerHost.id='layer-host';surface.appendChild(layerHost);
const layerPanel=document.createElement('section');layerPanel.className='layer-panel';
layerPanel.innerHTML='<button id="layer-remove"></button><button id="layer-reset"></button><p id="layer-note" role="status"></p><div id="layer-tray"></div>';
document.querySelector('.photo-tools').after(layerPanel);
byId('layer-reset').textContent=layerUI.reset;
function syncLayers(){
  const removed=removedLayers[device],allowed=layerLinks[device][selected];
  revealButton.hidden=device!=='laptop'||diagram;revealButton.textContent=removedLayers.laptop.has('cooler')?layerUI.cover:layerUI.reveal;revealButton.setAttribute('aria-pressed',String(removedLayers.laptop.has('cooler')));
  for(const id of ['layer-remove','piece-remove']){const button=byId(id);button.disabled=diagram||!allowed||!region();button.textContent=removed.has(selected)?layerUI.restore:layerUI.remove;button.setAttribute('aria-pressed',String(removed.has(selected)))}
  byId('layer-reset').disabled=!removed.size;byId('layer-note').textContent=removed.size?(device==='laptop'&&[...removed.keys()].every(id=>['cooler','battery'].includes(id))?layerUI.photoNote:layerUI.note):layerUI.empty;
  layerHost.replaceChildren();byId('layer-tray').replaceChildren();
  for(const [id,r] of removed){
    const topic=topics.find(t=>t.id===id),tile=document.createElement('div');tile.className='layer-tile';tile.dataset.removed=id;
    const realistic=device==='laptop'&&['cooler','battery'].includes(id);
    const [x,y,w,h]=realistic&&id==='cooler'?[6,22,87,16]:r.box;Object.assign(tile.style,{left:x+'%',top:(device==='laptop'?(y*15.36-300)/9:y)+'%',width:w+'%',height:(device==='laptop'?h*15.36/9:h)+'%'});
    if(realistic){tile.classList.add('layer-photo');const image=document.createElement('img');image.src=revealedLaptop;image.alt='';image.draggable=false;Object.assign(image.style,{width:(10000/w)+'%',left:(-x/w*100)+'%',top:(-y/h*100)+'%'});tile.appendChild(image)}
    else{const caption=document.createElement('small');caption.textContent=layerUI.schematic;tile.appendChild(caption)}
    for(const target of layerLinks[device][id]){const item=topics.find(t=>t.id===target);if(!item)continue;const button=document.createElement('button');button.textContent=item.name;button.dataset.revealed=target;if(realistic&&id==='cooler'){const chip=revealedChips.find(c=>c.id===target);button.className='chip-target';button.textContent=target.toUpperCase();Object.assign(button.style,{left:((chip.box[0]-x)/w*100)+'%',top:((chip.box[1]-y)/h*100)+'%',width:(chip.box[2]/w*100)+'%',height:(chip.box[3]/h*100)+'%'})}button.onclick=()=>{activeRegion=null;select(target);byId('inspect').click()};tile.appendChild(button)}
    layerHost.appendChild(tile);
    const restore=document.createElement('button');restore.textContent=layerUI.restore+' · '+topic.name;restore.onclick=()=>{removed.delete(id);activeRegion=null;if(id==='cooler'&&['cpu','gpu'].includes(selected))select('cooler');else{outline();syncLayers()}};byId('layer-tray').appendChild(restore);
  }
}
function toggleLayer(){const r=region();if(diagram||!r||!layerLinks[device][selected])return;const removed=removedLayers[device];if(removed.has(selected))removed.delete(selected);else removed.set(selected,{id:selected,box:[...r.box]});if(dialog.open)closePiece();syncLayers()}
byId('layer-remove').onclick=toggleLayer;byId('piece-remove').onclick=toggleLayer;
byId('layer-reset').onclick=()=>{removedLayers[device].clear();activeRegion=null;if(device==='laptop'&&['cpu','gpu'].includes(selected))select('cooler');else{outline();syncLayers()}};
const selectBeforeLayers=select;select=function(id,reveal=false){if(device==='laptop'&&['cpu','gpu'].includes(id)){removedLayers.laptop.set('cooler',regions.laptop.find(r=>r.id==='cooler'))}selectBeforeLayers(id,reveal);syncLayers()};
const modeBeforeLayers=mode;mode=function(value){modeBeforeLayers(value);syncLayers()};
const inspectBeforeLayers=byId('inspect').onclick;byId('inspect').onclick=()=>{inspectBeforeLayers();syncLayers()};
`;

export const pcLayerStyles = `
.layer-panel{padding:12px 14px;background:#19323d;display:flex;gap:8px;flex-wrap:wrap}.layer-panel>button{flex:1;min-width:130px}.layer-panel p{width:100%;font-size:12px;line-height:1.7;margin:4px 0;color:#d4e2e5}#layer-tray{display:flex;gap:8px;flex-wrap:wrap}#layer-host{position:absolute;inset:0;pointer-events:none}.layer-tile{position:absolute;pointer-events:auto;border:2px dashed #edcf8e;border-radius:6px;background:#19323df2;display:flex;align-items:center;justify-content:center;gap:5px;flex-wrap:wrap;overflow:auto;padding:3px}.layer-tile small{color:#fff3d0;font-size:9px}.layer-tile button{background:#123129;color:#fff;border:1px solid #afc9ad;min-height:32px;padding:3px 6px;font-size:11px}.layer-tile button:focus-visible{outline:3px solid white}#layer-remove{background:#debc7b;color:#24343b}.layer-tile.layer-photo{border:0;border-radius:0;background:none;overflow:hidden;padding:0;pointer-events:none}.layer-photo>img{position:absolute!important;max-width:none;height:auto;user-select:none;pointer-events:none}.layer-photo>button{position:relative;pointer-events:auto;z-index:1}.layer-photo .chip-target{position:absolute;background:transparent!important;border:1px solid #f2d68e!important;border-radius:5px;min-height:0;padding:0;color:#fff;font-size:11px;align-items:flex-end;display:flex;justify-content:center;text-shadow:0 1px 3px #000;box-shadow:0 0 0 1px #0004}.chip-target:after{content:'';position:absolute;inset:0;pointer-events:none}#reveal-chips{flex-basis:100%;background:#debc7b;color:#24343b;font-weight:650}.underneath-panel{margin:14px 0}
`;
