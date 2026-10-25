export function computerFocusLabels(language: 'en' | 'fr' | 'ar') {
  const t = (en: string, fr: string, ar: string) => ({ en, fr, ar })[language];
  return {
    markers: t('Component markers', 'Repères des pièces', 'علامات القطع'),
    zoom: t('Magnification', 'Grossissement', 'التكبير'),
    focus: t('Focus selected part', 'Centrer la pièce', 'ركّز على القطعة'),
    removed: t('Removed in this simulation. Restore the part to see it in place.', 'Retirée dans cette simulation. Remettez la pièce pour la voir en place.', 'القطعة محيّدة فالمحاكاة. رجّعها باش تشوفها فبلاصتها.'),
    hint: t('Markers select a part. Open its details to study it. Zoom in, then drag or use arrow keys to move around.', 'Les repères sélectionnent une pièce. Ouvrez ses détails pour l’étudier. Agrandissez puis glissez ou utilisez les flèches pour vous déplacer.', 'العلامات كتختار القطعة. افتح التفاصيل باش تتعلّم عليها. كبّر واسحب أو استعمل الأسهم باش تتحرّك.'),
  };
}

export const computerFocusStyles = `
.focus-tools{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 14px;border-top:1px solid #ffffff18;background:#122b36}.focus-tools label{display:flex;align-items:center;gap:10px;flex:1 1 240px;font-size:12px}.focus-tools input{min-width:80px;width:100%;accent-color:#debc7b}.focus-tools output{font-variant-numeric:tabular-nums;min-width:42px}.focus-tools button{flex:1 1 140px}#component-markers{position:absolute;inset:0;pointer-events:none}.viewer .component-marker{position:absolute;transform:translate(-50%,-50%);border:1px solid #ffe5ae;border-radius:50%;width:28px;height:28px;min-height:28px;padding:0;background:#10222ee8;color:#fff;font-size:10px;box-shadow:0 2px 8px #0008;pointer-events:auto;line-height:1}.viewer .component-marker[aria-pressed=true]{background:#f1d59c;color:#152c30;box-shadow:0 0 0 4px #f1d59c44}.component-marker:hover,.component-marker:focus-visible{z-index:3;outline:3px solid #fff;outline-offset:3px}.photo-outline{box-shadow:0 0 0 1px #0008,0 0 22px #e1bd7930}.parts button[aria-pressed=true]{box-shadow:inset 3px 0 #dfbd7f}.workspace>section{min-width:0}.viewer-head .badge{max-width:100%;overflow-wrap:anywhere}.photo-viewport.zoomed .photo-surface{width:var(--photo-scale,200%)}
@media(min-width:1000px){header,.workspace{max-width:1440px}.workspace{grid-template-columns:minmax(0,1.45fr) minmax(340px,1fr);gap:28px}.viewer{max-width:760px}.photo-surface{max-width:540px}.workspace>.lesson{position:sticky;top:20px;max-height:calc(100dvh - 40px);overflow:auto;scrollbar-width:thin;scrollbar-color:#a2b5a4 transparent}.lesson::-webkit-scrollbar{width:6px}.lesson::-webkit-scrollbar-thumb{background:#a2b5a4;border-radius:6px}.parts{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(min-width:1100px){#piece-dialog{width:min(960px,calc(100vw - 48px))}#piece-dialog .dialog-body{display:grid;grid-template-columns:minmax(220px,.85fr) minmax(0,1.15fr);gap:0 28px;align-content:start}.piece-photo{grid-column:1;grid-row:1;margin-top:0;position:sticky;top:0}.piece-note{grid-column:1}.dialog-body>[data-piece-panel]{grid-column:2;grid-row:1 / span 3}.dialog-body>[data-piece-panel] h3:first-child{margin-top:0}}
@media(pointer:coarse){.viewer .component-marker{width:36px;height:36px;min-height:36px}}
`;

export const computerFocusRuntime = String.raw`
const markerHost=document.createElement('div');markerHost.id='component-markers';surface.appendChild(markerHost);
const focusTools=document.createElement('div');focusTools.className='focus-tools';
focusTools.innerHTML='<label for="photo-scale"><span></span><input id="photo-scale" type="range" min="100" max="400" step="25" value="100"><output id="photo-scale-value" for="photo-scale">100%</output></label><button id="focus-selected"></button><button id="toggle-markers" aria-pressed="false"></button>';
document.querySelector('.photo-tools').before(focusTools);
focusTools.querySelector('label span').textContent=focusUI.zoom;
byId('focus-selected').textContent=focusUI.focus;byId('toggle-markers').textContent=focusUI.markers;
document.querySelector('.photo-caption').textContent=focusUI.hint;
let markersVisible=false;
function setPhotoScale(value){const scale=Math.max(100,Math.min(400,Number(value)||100));surface.style.setProperty('--photo-scale',scale+'%');viewport.classList.toggle('zoomed',scale>100);byId('photo-zoom').setAttribute('aria-pressed',String(scale>100));byId('photo-scale').value=String(scale);byId('photo-scale-value').textContent=scale+'%';if(scale===100){viewport.scrollLeft=0;viewport.scrollTop=0}else center()}
const fitBeforeFocus=fit;fit=function(){fitBeforeFocus();setPhotoScale(100)};
byId('photo-scale').oninput=e=>setPhotoScale(e.target.value);
byId('photo-zoom').onclick=()=>setPhotoScale(viewport.classList.contains('zoomed')?100:200);
byId('photo-fit').onclick=()=>fit();
byId('focus-selected').onclick=()=>{setPhotoScale(Math.max(200,Number(byId('photo-scale').value)));center();viewport.focus({preventScroll:true})};
byId('toggle-markers').onclick=()=>{markersVisible=!markersVisible;syncFocus()};
function syncFocus(){
  focusTools.hidden=diagram;
  const removed=removedLayers[device].has(selected),r=region();
  byId('focus-selected').disabled=!r||removed;
  byId('toggle-markers').setAttribute('aria-pressed',String(markersVisible));
  byId('location-note').textContent=removed?focusUI.removed:r?labels.visible:labels.hidden;
  document.querySelector('.photo-outline').hidden=!r||removed;
  markerHost.hidden=!markersVisible||diagram;
  const focusedMarker=markerHost.contains(document.activeElement)?document.activeElement.dataset.marker:null;
  markerHost.replaceChildren();
  if(!markersVisible||diagram)return;
  pickableRegions().filter(r=>!['case','motherboard'].includes(r.id)).forEach((r,index)=>{
    const topic=topics.find(t=>t.id===r.id);if(!topic)return;
    const button=document.createElement('button'),[x,y,w,h]=r.box;button.className='component-marker';button.dataset.marker=r.id+'-'+index;button.textContent=String(topics.indexOf(topic)+1).padStart(2,'0');button.title=topic.name;button.setAttribute('aria-label',topic.name);button.setAttribute('aria-pressed',String(selected===r.id));
    Object.assign(button.style,{left:(x+w/2)+'%',top:(device==='laptop'?((y+h/2)*15.36-300)/9:y+h/2)+'%'});
    button.onclick=()=>{activeRegion=r;select(r.id,true)};markerHost.appendChild(button);
    if(button.dataset.marker===focusedMarker)button.focus({preventScroll:true});
  });
}
const syncBeforeFocus=syncLayers;syncLayers=function(){syncBeforeFocus();syncFocus()};
const inspectBeforeFocus=byId('inspect').onclick;byId('inspect').onclick=()=>{inspectBeforeFocus();if(removedLayers[device].has(selected)){document.querySelector('.piece-photo').hidden=true;byId('piece-location').textContent=focusUI.removed}};
`;
