import teardown from '../data/phone-teardown-image.json';
import { phonePhotoRegions } from '../data/phone-photo-regions';

export const phoneLessonStyles = `
#piece-dialog{width:min(660px,calc(100% - 24px));background:#fafbf7;border-color:#d8e1d6;box-shadow:0 28px 100px #081d2870}
#piece-dialog .piece-header{background:#173d35;color:#fff;padding:18px 20px;border:0}
#piece-dialog .piece-header small{color:#cdddba;letter-spacing:1px}#piece-dialog .piece-header h2{color:#fff;font-size:21px}
#piece-close{background:#ffffff12;color:#fff;border-color:#ffffff35}
.piece-tabs{display:flex;flex:none;gap:4px;padding:8px 12px;background:#eef2e9;border-bottom:1px solid #dbe3d7}
.piece-tabs button{flex:1;min-width:0;padding:8px 4px;font-size:12px;background:transparent;border:0}
.piece-tabs button[aria-pressed=true]{background:#fff;color:#173d35;box-shadow:0 2px 8px #173d3512;font-weight:700}
#piece-dialog .piece-body{padding:20px 24px}#piece-dialog .piece-image{background:radial-gradient(ellipse,#314b4d,#12252c);border:1px solid #cad8cd}
#piece-dialog h3{font-size:15px;margin-top:18px}#piece-dialog p{font-size:14px;line-height:1.9;overflow-wrap:anywhere}
#piece-position{color:#536b60}.piece-connections{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 20px}
.piece-connections button{font-size:12px;border-radius:22px;background:#eaf1e6;border-color:#cddfcf;flex:1 1 120px}
.piece-continue{width:100%;margin:18px 0 4px;background:#173d35;color:#fff;border:0}
.piece-steps{list-style:none;padding:0;counter-reset:step;margin:12px 0}.piece-steps li{counter-increment:step;position:relative;border-inline-start:2px solid #d4e2d1;padding:0 0 20px 0;padding-inline-start:26px;margin-inline-start:14px}
.piece-steps li::before{content:counter(step);position:absolute;inset-inline-start:-15px;top:0;background:#dcebd6;color:#173d35;border:3px solid #fafbf7;width:28px;height:28px;text-align:center;border-radius:50%;font-size:12px;font-weight:700;line-height:22px}
.piece-steps strong{display:block;margin-bottom:8px;font-size:14px}.piece-steps li:last-child{border-color:transparent}
#piece-dialog .piece-assembly-note{padding:12px 14px;border-radius:12px;background:#f3eddd;color:#62563d;font-size:12px}
.piece-source{font-size:12px;display:inline-block;padding:8px 0}.piece-answers{display:grid;gap:10px;margin-top:14px}
.piece-answers button{text-align:start;line-height:1.8;font-size:13px;background:#fff;padding:14px}
.piece-answers button[data-result=correct]{background:#e0efdb;border-color:#538a50;color:#204e2b;opacity:1}.piece-answers button[data-result=wrong]{background:#f9eee1;border-color:#b99154}
#piece-feedback{padding-top:12px;color:#315a43;font-weight:600}.piece-teacher{margin-top:24px}
#piece-dialog .piece-footer{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 18px;background:#eef2e9}
#piece-dialog .piece-footer button{font-size:12px;min-width:0;padding:8px}
#piece-dialog .piece-footer [data-teacher]{grid-column:1/-1;background:transparent;color:#31564b;border:0;min-height:36px}
#piece-dialog #piece-next{background:#fff;color:#173d35;border-color:#cbd9ca}
@media(max-width:480px){#piece-dialog{inset:8px;width:calc(100% - 16px);height:calc(100dvh - 16px);max-height:calc(100dvh - 16px);border-radius:18px}#piece-dialog .piece-header{padding:14px}#piece-dialog .piece-body{padding:16px}#piece-dialog .piece-footer{padding:10px 14px}.piece-tabs{padding:7px}.piece-tabs button{font-size:11px}#piece-dialog .piece-header h2{font-size:18px}}
`;

export function phonePhotoNote(language: 'en' | 'fr' | 'ar') {
  return {
    en: 'AI-generated interior for learning, not a photograph of a specific phone. Tap an area to learn about that component family. Exact chip identities and layouts vary. Use the 3D model to rotate and separate layers.',
    fr: 'Intérieur généré par IA pour apprendre, pas la photo d’un téléphone précis. Touchez une zone pour découvrir cette famille de composants. Les puces et leur disposition varient. Le modèle 3D permet de tourner et séparer les couches.',
    ar: 'تصوّر داخلي مولّد بالذكاء الاصطناعي للتعلّم، ماشي صورة لهاتف معيّن. اضغط على منطقة باش تتعلّم دور هاد النوع من القطع. هوية الشرائح وترتيبها كيختلفو. النموذج ثلاثي الأبعاد كيخليك تدوّر الهاتف وتفصل الطبقات.',
  }[language];
}

export function phonePhotoMarkup(language: 'en' | 'fr' | 'ar') {
  const t = (en: string, fr: string, ar: string) => language === 'ar' ? ar : language === 'fr' ? fr : en;
  return `<div id="photo-view" hidden>
    <div class="photo-tools"><label for="photo-picker">${t('Explore a piece', 'Explorer une pièce', 'اكتشف قطعة')}</label><select id="photo-picker"></select><button id="photo-zoom" aria-pressed="false" data-zoom-in="${t('Zoom selected ×2', 'Agrandir la sélection ×2', 'كبّر القطعة المختارة ×2')}" data-zoom-out="${t('Show full phone', 'Voir le téléphone entier', 'شوف الهاتف كامل')}">${t('Zoom selected ×2', 'Agrandir la sélection ×2', 'كبّر القطعة المختارة ×2')}</button></div>
    <div class="photo-viewport"><div class="photo-surface"><img id="teardown-image" draggable="false" src="${teardown.uri}" alt="${t('Photorealistic educational phone interior. Choose a component from the list to learn its role.', 'Intérieur pédagogique photoréaliste. Choisissez une pièce dans la liste pour découvrir son rôle.', 'تصوّر تعليمي واقعي لداخل الهاتف. اختار أي قطعة من اللائحة باش تتعلّم دورها.')}"><div id="photo-outline" hidden></div></div></div>
    <p class="photo-caption">${t('One tap, one discovery. Choose a piece to learn its role, connections and assembly.', 'Un toucher, une découverte. Choisissez une pièce pour comprendre son rôle, ses liens et son montage.', 'ضغطة وحدة، معلومة جديدة. اضغط على قطعة باش تفهم دورها، التوصيلات ديالها وكيفاش كتركب.')}</p>
    <section class="photo-inspector" aria-live="polite" aria-atomic="true"><small>${t('WHAT THIS PIECE DOES', 'LE RÔLE DE CETTE PIÈCE', 'دور هاد القطعة')}</small><h2 id="photo-title"></h2><p id="photo-role"></p><p class="photo-example" id="photo-example"></p><p class="photo-location">${t('Illustrative location in an AI-generated image; exact parts vary by model.', 'Zone illustrative dans une image générée par IA ; les pièces exactes varient selon le modèle.', 'بلاصة توضيحية فصورة مولّدة بالذكاء الاصطناعي؛ القطع الحقيقية كتختلف حسب الموديل.')}</p><button id="photo-lesson">${t('Full lesson & learning checklist', 'Leçon complète et progression', 'الدرس الكامل وتتبع التعلّم')}</button></section>
    <button id="piece-open">${t('Open selected piece', 'Ouvrir la pièce sélectionnée', 'افتح القطعة المختارة')}</button>
    <dialog id="piece-dialog" aria-labelledby="piece-title">
      <header class="piece-header"><div><small>${t('EXPLORE & LEARN', 'EXPLORER ET APPRENDRE', 'اكتشف وتعلّم')}</small><h2 id="piece-title"></h2></div><button id="piece-close" autofocus>${t('Close', 'Fermer', 'إغلاق')}</button></header>
      <nav class="piece-tabs" aria-label="${t('Lesson sections', 'Sections du cours', 'أقسام الدرس')}"><button data-piece-tab="understand" aria-pressed="true">01 · ${t('Understand', 'Comprendre', 'نفهم')}</button><button data-piece-tab="assemble" aria-pressed="false">02 · ${t('Assembly', 'Montage', 'التركيب')}</button><button data-piece-tab="practice" aria-pressed="false">03 · ${t('Try it', 'Pratiquer', 'نجرّب')}</button></nav>
      <div class="piece-body"><div class="piece-image" aria-hidden="true"><div class="piece-crop"><img id="piece-image" alt="" draggable="false"></div></div>
        <div class="piece-zoom" role="group" aria-label="${t('Close-up zoom', 'Zoom du gros plan', 'تكبير القطعة')}"><span>${t('Zoom', 'Zoom', 'التكبير')}</span><button data-piece-zoom="1" aria-pressed="true">1×</button><button data-piece-zoom="2" aria-pressed="false">2×</button><button data-piece-zoom="3" aria-pressed="false">3×</button></div>
        <small class="piece-image-note">${t('Selected area · educational illustration', 'Zone sélectionnée · illustration pédagogique', 'المنطقة المختارة · صورة تعليمية')}</small>
        <section data-piece-panel="understand">
        <h3>${t('What it does', 'Son rôle', 'شنو هو الدور ديالها')}</h3><p id="piece-role"></p>
        <h3>${t('An everyday example', 'Un exemple du quotidien', 'مثال من الحياة اليومية')}</h3><p id="piece-example"></p>
        <h3>${t('Where it belongs', 'Sa place dans le téléphone', 'فين كتركب')}</h3><p id="piece-position"></p>
        <h3>${t('Explore the parts it works with', 'Explorer les pièces associées', 'اكتشف القطع اللي كتخدم معاها')}</h3><div id="piece-connections" class="piece-connections"></div>
        <button class="piece-continue" data-piece-tab="assemble">${t('How does it fit together? →', 'Comment se monte-t-elle ? →', 'كيفاش كتركب؟ ←')}</button>
        </section>
        <section data-piece-panel="assemble" hidden>
          <h3>${t('From position to connection', 'De la place à la connexion', 'من البلاصة للتوصيل')}</h3>
          <ol class="piece-steps"><li><strong>${t('Locate', 'Repérer', 'حدّد البلاصة')}</strong><p id="piece-fit-position"></p></li><li><strong>${t('Understand the mounting', 'Comprendre la fixation', 'فهم التثبيت')}</strong><p id="piece-fitting"></p></li><li><strong>${t('Trace the relationship', 'Suivre les liens', 'تبع العلاقة')}</strong><p>${t('Return to the connected parts and follow how energy, information or mechanical support reaches this piece.', 'Revenez aux pièces associées pour suivre l’énergie, les informations ou le support mécanique.', 'رجع للقطع المرتبطة وتبع كيفاش كتوصل الطاقة أو المعلومات أو الدعم الميكانيكي لهاد القطعة.')}</p></li></ol>
          <p class="piece-assembly-note">${t('These are assembly principles for an illustrative phone. Real repairs use the exact model manual, battery precautions, specified tools and screw map. Never bend or puncture a battery.', 'Principes pour un téléphone illustratif. Une réparation suit le manuel exact, les précautions batterie, les outils et le plan des vis. Ne pliez et ne percez jamais une batterie.', 'هاد مبادئ التركيب فهاتف توضيحي. الإصلاح الحقيقي كيتبع دليل الموديل واحتياطات البطارية والأدوات وخريطة البراغي. ما تعوّجش وما تثقبش البطارية.')}</p>
          <a class="piece-source" href="https://support.apple.com/en-ph/104900" target="_blank" rel="noopener noreferrer">${t('Example: Apple iPhone 15 repair manual ↗', 'Exemple : manuel de réparation iPhone 15 ↗', 'مثال: دليل إصلاح iPhone 15 من Apple ↗')}</a>
          <button class="piece-continue" data-piece-tab="practice">${t('Check my understanding →', 'Vérifier ma compréhension →', 'نختبر الفهم ديالي ←')}</button>
        </section>
        <section data-piece-panel="practice" hidden>
          <h3>${t('Which explanation belongs to this piece?', 'Quelle explication correspond à cette pièce ?', 'شنو هو الشرح اللي كيناسب هاد القطعة؟')}</h3>
          <div id="piece-answers" class="piece-answers"></div><p id="piece-feedback" role="status" aria-live="polite" data-correct="${t('Exactly. ', 'Exactement. ', 'صحيح. ')}" data-wrong="${t('Try again. Think about what this piece does in everyday use.', 'Réessayez. Pensez au rôle de cette pièce au quotidien.', 'حاول مرة أخرى. فكّر فدور هاد القطعة فالاستعمال اليومي.')}"></p>
        <section class="piece-teacher"><h3>${t('Learn more with your AI teacher', 'Approfondir avec le professeur IA', 'تعلّم أكثر مع المعلّم الذكي')}</h3><p>${t('Continue in AI Teacher with this piece’s context. Internet required.', 'Continuez dans le professeur IA avec le contexte de cette pièce. Internet requis.', 'كمّل مع المعلّم الذكي وهو عارف القطعة اللي كتتعلّم عليها. خاص الاتصال بالإنترنت.')}</p>
          <div class="piece-teacher-actions"><button data-teacher="example">${t('Give an example', 'Donner un exemple', 'عطيني مثال')}</button><button data-teacher="quiz">${t('Quiz me', 'Me poser une question', 'اختبر فهمي')}</button></div>
          <form id="piece-question-form"><label for="piece-question">${t('Your question about this piece', 'Votre question sur cette pièce', 'سؤالك على هاد القطعة')}</label><textarea id="piece-question" maxlength="600" rows="2" required></textarea><button type="submit">${t('Ask my question', 'Poser ma question', 'اسأل المعلّم')}</button></form>
        </section>
        </section>
      </div>
      <footer class="piece-footer"><button id="piece-understood">${t('Mark as understood', 'J’ai compris', 'فهمت هاد القطعة')}</button><button id="piece-next">${t('Next piece →', 'Pièce suivante →', 'القطعة التالية ←')}</button><button data-teacher="explain">${t('Ask the teacher', 'Demander au professeur', 'سول المعلّم')}</button></footer>
    </dialog>
  </div>`;
}

export const phonePhotoScript = `const photoRegions=${JSON.stringify(phonePhotoRegions)};` + String.raw`
let photoMode=true,activePhotoRegion=null;
const photoView=document.getElementById('photo-view');
const photoButton=document.createElement('button');photoButton.id='photo-mode';
photoButton.textContent=photoLabels.mode;document.querySelector('.toolbar').appendChild(photoButton);
function pickPhoto(id,region,reveal=true){cancelTap();activePhotoRegion=region||photoRegions.find(r=>r.id===id)||null;select(id);if(reveal&&document.querySelector('.photo-viewport').classList.contains('zoomed'))centerPhotoSelection()}
function photoClick(e,id,region){
  pickPhoto(id,region,false);openPiece();
}
const photoPicker=document.getElementById('photo-picker');
const pieceDialog=document.getElementById('piece-dialog');let pieceReturnFocus=null;
function openPiece(){
  cancelTap();const region=activePhotoRegion?.id===selected?activePhotoRegion:photoRegions.find(r=>r.id===selected);
  const item=topics.find(t=>t.id===selected);if(!item?.assembly)return;
  document.getElementById('piece-title').textContent=item.name;
  document.getElementById('piece-role').textContent=item.detail;
  document.getElementById('piece-example').textContent=item.example;
  document.getElementById('piece-position').textContent=item.assembly.position;
  document.getElementById('piece-fit-position').textContent=item.assembly.position;
  document.getElementById('piece-fitting').textContent=item.assembly.fitting;
  const connections=document.getElementById('piece-connections');connections.replaceChildren();
  item.assembly.related.forEach(id=>{const related=topics.find(t=>t.id===id);const button=document.createElement('button');button.textContent=related.name;button.onclick=()=>{pickPhoto(id);openPiece()};connections.appendChild(button)});
  const feedback=document.getElementById('piece-feedback');feedback.textContent='';
  const answers=document.getElementById('piece-answers');answers.replaceChildren();
  const choices=topics.filter(t=>t.assembly&&t.id!==selected).slice(0,2);choices.splice(topics.indexOf(item)%3,0,item);
  choices.forEach(choice=>{const button=document.createElement('button');button.textContent=choice.detail.split(/[.!?。]/)[0]+'.';button.onclick=()=>{const correct=choice.id===selected;feedback.textContent=correct?feedback.dataset.correct+item.example:feedback.dataset.wrong;button.dataset.result=correct?'correct':'wrong';if(correct)answers.querySelectorAll('button').forEach(b=>b.disabled=true)};answers.appendChild(button)});
  syncPieceProgress();setPieceTab('understand');
  pieceDialog.querySelector('.piece-image').hidden=!region;
  pieceDialog.querySelector('.piece-zoom').hidden=!region;
  pieceDialog.querySelector('.piece-image-note').hidden=!region;
  if(region){const [x,y,w,h]=region.box;
  const source=document.getElementById('teardown-image');const ratio=(source.naturalWidth||1024)/(source.naturalHeight||1536);const aspect=w/h*ratio;
  const frame=pieceDialog.querySelector('.piece-image');frame.style.width=Math.min(300,180*aspect,(source.naturalWidth||1024)*w/100*1.8)+'px';frame.style.aspectRatio=String(aspect);
  const image=document.getElementById('piece-image');if(image.getAttribute('src')!==source.getAttribute('src'))image.src=source.src;
  Object.assign(image.style,{width:(10000/w)+'%',left:(-x/w*100)+'%',top:(-y/h*100)+'%'});
  setPieceZoom(1);
  }
  if(!pieceDialog.open)pieceReturnFocus=document.activeElement;
  document.documentElement.classList.add('piece-modal-open');
  if(!pieceDialog.open){if(pieceDialog.showModal)pieceDialog.showModal();else pieceDialog.setAttribute('open','')}
  pieceDialog.querySelector('.piece-body').scrollTop=0;
  document.getElementById('piece-question').value='';
  document.getElementById('piece-close').focus({preventScroll:true});
}
function setPieceTab(name){pieceDialog.querySelectorAll('[data-piece-panel]').forEach(panel=>{panel.hidden=panel.dataset.piecePanel!==name;if(panel.hidden&&panel.contains(document.activeElement))pieceDialog.querySelector('.piece-tabs [data-piece-tab="'+name+'"]').focus({preventScroll:true})});pieceDialog.querySelectorAll('[data-piece-tab]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pieceTab===name)));pieceDialog.querySelector('.piece-body').scrollTop=0}
pieceDialog.querySelectorAll('[data-piece-tab]').forEach(button=>button.onclick=()=>setPieceTab(button.dataset.pieceTab));
function syncPieceProgress(){const button=document.getElementById('piece-understood');button.textContent=learned.has(selected)?labels.learned:labels.mark;button.disabled=learned.has(selected)}
document.getElementById('piece-understood').onclick=()=>{document.getElementById('learned').click();syncPieceProgress()};
document.getElementById('piece-next').onclick=()=>{const list=topics.filter(t=>t.assembly);pickPhoto(list[(list.findIndex(t=>t.id===selected)+1)%list.length].id);openPiece()};
function setPieceZoom(level){pieceDialog.querySelector('.piece-crop').style.transform='scale('+level+')';pieceDialog.querySelectorAll('[data-piece-zoom]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.pieceZoom)===level)))}
pieceDialog.querySelectorAll('[data-piece-zoom]').forEach(button=>button.onclick=()=>setPieceZoom(Number(button.dataset.pieceZoom)));
function restorePieceFocus(){document.documentElement.classList.remove('piece-modal-open');pieceReturnFocus?.focus?.({preventScroll:true})}
function closePiece(){if(pieceDialog.close)pieceDialog.close();else pieceDialog.removeAttribute('open');restorePieceFocus()}
pieceDialog.onclose=restorePieceFocus;
pieceDialog.oncancel=e=>{e.preventDefault();closePiece()};
pieceDialog.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();closePiece()}};
pieceDialog.onclick=e=>{if(e.target===pieceDialog)closePiece()};
document.getElementById('piece-close').onclick=closePiece;
document.getElementById('piece-open').onclick=openPiece;
function askPhoneTeacher(intent,question){cancelTap();send({type:'ask-phone-teacher',id:selected,intent,...(question?{question}:{})})}
pieceDialog.querySelectorAll('[data-teacher]').forEach(button=>button.onclick=()=>askPhoneTeacher(button.dataset.teacher));
document.getElementById('piece-question-form').onsubmit=e=>{e.preventDefault();const input=document.getElementById('piece-question');const question=input.value.trim();if(!question){input.focus();return}askPhoneTeacher('question',question.slice(0,600))};
topics.filter(t=>photoRegions.some(r=>r.id===t.id)).forEach(item=>{const option=document.createElement('option');option.value=item.id;option.textContent=item.name;photoPicker.appendChild(option)});
photoPicker.onchange=()=>{pickPhoto(photoPicker.value);openPiece()};
document.getElementById('photo-lesson').onclick=()=>document.getElementById('lesson').scrollIntoView?.({block:'start'});
function centerPhotoSelection(){
  const viewport=document.querySelector('.photo-viewport');if(!viewport.classList.contains('zoomed'))return;
  const region=activePhotoRegion?.id===selected?activePhotoRegion:photoRegions.find(r=>r.id===selected);if(!region)return;
  const imageRect=document.getElementById('teardown-image').getBoundingClientRect(),viewRect=viewport.getBoundingClientRect();if(!imageRect.width||!imageRect.height)return;
  const [x,y,w,h]=region.box;
  const left=viewport.scrollLeft+imageRect.left-viewRect.left-viewport.clientLeft+(x+w/2)/100*imageRect.width-viewport.clientWidth/2;
  const top=viewport.scrollTop+imageRect.top-viewRect.top-viewport.clientTop+(y+h/2)/100*imageRect.height-viewport.clientHeight/2;
  viewport.scrollLeft=Math.max(0,Math.min(left,viewport.scrollWidth-viewport.clientWidth));
  viewport.scrollTop=Math.max(0,Math.min(top,viewport.scrollHeight-viewport.clientHeight));
}
document.getElementById('photo-zoom').onclick=()=>{cancelTap();const viewport=document.querySelector('.photo-viewport');const zoomed=viewport.classList.toggle('zoomed');const button=document.getElementById('photo-zoom');button.setAttribute('aria-pressed',String(zoomed));button.textContent=zoomed?button.dataset.zoomOut:button.dataset.zoomIn;if(zoomed)centerPhotoSelection();else{viewport.scrollLeft=0;viewport.scrollTop=0}};
document.getElementById('teardown-image').addEventListener('load',centerPhotoSelection);
function syncPhoto(){
  const showing=photoMode&&coverOpen&&group==='hardware'&&!exploded;
  photoView.hidden=!showing;canvas.hidden=showing;
  document.querySelector('.controls').hidden=showing;
  photoButton.setAttribute('aria-pressed',String(showing));photoButton.textContent=showing?photoLabels.model:photoLabels.realistic;
  document.querySelector('.stage-label>span:first-child').textContent=showing?photoLabels.detail:'3D / iPhone + Android';
  const item=topics.find(t=>t.id===selected);
  document.getElementById('photo-title').textContent=item.name;
  document.getElementById('photo-role').textContent=item.detail;
  document.getElementById('photo-example').textContent=item.example;
  photoPicker.value=selected;
  const region=activePhotoRegion?.id===selected?activePhotoRegion:photoRegions.find(r=>r.id===selected);
  document.getElementById('piece-open').disabled=!item.assembly;
  syncPieceProgress();
  if(!showing&&pieceDialog.open)closePiece();
  const outline=document.getElementById('photo-outline');outline.hidden=!region;
  if(region){const [x,y,w,h]=region.box;Object.assign(outline.style,{left:x+'%',top:y+'%',width:w+'%',height:h+'%'})}
}
photoButton.onclick=()=>{cancelTap();if(photoMode&&coverOpen&&group==='hardware'){photoMode=false;syncPhoto();draw()}else{photoMode=true;coverOpen=true;exploded=false;setGroup('hardware');syncCover();select('battery')}};
const photoHitRegions=[...photoRegions].sort((a,b)=>a.box[2]*a.box[3]-b.box[2]*b.box[3]);
function photoRegionAt(x,y){return photoHitRegions.find(r=>{const [left,top,w,h]=r.box;return x>=left&&x<=left+w&&y>=top&&y<=top+h})||null}
const photoViewport=document.querySelector('.photo-viewport');
let photoGesture=null,photoDragged=false;
photoViewport.addEventListener('pointerdown',e=>{photoGesture={x:e.clientX,y:e.clientY};photoDragged=false},{passive:true});
photoViewport.addEventListener('pointermove',e=>{if(photoGesture&&Math.hypot(e.clientX-photoGesture.x,e.clientY-photoGesture.y)>6){photoDragged=true;cancelTap()}},{passive:true});
photoViewport.addEventListener('pointerup',()=>{photoGesture=null},{passive:true});
photoViewport.addEventListener('pointercancel',()=>{photoGesture=null;photoDragged=true;cancelTap()},{passive:true});
document.getElementById('teardown-image').onclick=e=>{
  if(photoDragged&&e.detail!==0){photoDragged=false;return}
  const rect=e.currentTarget.getBoundingClientRect();if(!rect.width||!rect.height)return;
  const region=photoRegionAt((e.clientX-rect.left)/rect.width*100,(e.clientY-rect.top)/rect.height*100);
  if(region)photoClick(e,region.id,region);else cancelTap();
};
photoViewport.addEventListener('scroll',cancelTap,{passive:true});
document.getElementById('teardown-image').onerror=()=>{photoMode=false;photoButton.hidden=true;syncPhoto();draw()};
`;
