export function computerLessonLabels(language: 'en' | 'fr' | 'ar') {
  const t = (en: string, fr: string, ar: string) => ({ en, fr, ar })[language];
  return {
    understand: t('Understand', 'Comprendre', 'نفهم'), assemble: t('Assembly', 'Montage', 'التركيب'), practice: t('Try it', 'Pratiquer', 'نجرّب'),
    sections: t('Lesson sections', 'Sections du cours', 'أقسام الدرس'),
    related: t('Explore connected parts', 'Explorer les pièces associées', 'اكتشف القطع المرتبطة'),
    quiz: t('Which explanation matches this piece?', 'Quelle explication correspond à cette pièce ?', 'شنو هو الشرح المناسب لهاد القطعة؟'),
    correct: t('Exactly. ', 'Exactement. ', 'صحيح. '), wrong: t('Try again. Think about its everyday role.', 'Réessayez. Pensez à son rôle au quotidien.', 'حاول مرة أخرى وفكّر فالدور ديالها.'),
    next: t('Next piece →', 'Pièce suivante →', 'القطعة التالية ←'),
    question: t('Your question about this piece', 'Votre question sur cette pièce', 'السؤال ديالك على هاد القطعة'),
    ask: t('Ask the teacher', 'Demander au professeur', 'سول الأستاذ'),
    online: t('The lessons and quiz work offline. AI answers require Internet.', 'Cours et quiz fonctionnent hors ligne. Les réponses IA nécessitent Internet.', 'الدروس والاختبار كيخدمو بلا إنترنت. أجوبة الأستاذ الذكي كتحتاج الاتصال.'),
    note: t('General assembly principles. For real work, use your exact model’s service manual, power-isolation procedure and screw map. The generated image cannot confirm compatibility or hidden construction.', 'Principes généraux. Pour intervenir, utilisez le manuel exact, la procédure de mise hors tension et le plan des vis. L’image générée ne confirme ni compatibilité ni construction cachée.', 'هادي مبادئ عامة. فالخدمة الحقيقية استعمل دليل الموديل وطريقة فصل الطاقة وخريطة البراغي. الصورة المولّدة ما كتأكدش التوافق أو التركيب المخفي.'),
  };
}

export const computerLessonStyles = `
#piece-dialog{width:min(680px,calc(100vw - 24px));max-height:calc(100dvh - 24px);border-radius:22px;background:#fafbf7;color:#173d35}
#piece-dialog .dialog-head{background:#173d35;color:white;padding:16px 20px}#piece-dialog .dialog-head h2{font-size:21px;line-height:1.5;margin:0}#piece-close{background:#ffffff12;color:white;border-color:#ffffff35;flex:none}
.piece-tabs{display:flex;flex:none;gap:4px;padding:8px 12px;background:#eef2e9;border-bottom:1px solid #dbe3d7}.piece-tabs button{flex:1;min-width:0;background:transparent;color:#173d35;border:0;font-size:12px;padding:8px 4px}.piece-tabs button[aria-pressed=true]{background:white;color:#173d35;box-shadow:0 2px 8px #173d3515;font-weight:700}
#piece-dialog .dialog-body{padding:18px 22px;overflow:auto;min-height:0;overscroll-behavior:contain}#piece-dialog p{line-height:1.9;overflow-wrap:anywhere}#piece-dialog h3{font-size:15px;margin:20px 0 8px}.piece-related{display:flex;flex-wrap:wrap;gap:8px}.piece-related button{flex:1 1 120px;border-radius:24px;font-size:12px;background:#e8f0e2;color:#244039;border:1px solid #c9dbc9}
.piece-check{display:grid;gap:10px}.piece-check button{text-align:start;font-size:13px;line-height:1.8;background:white;color:#173d35;border:1px solid #d1dfd0;padding:14px}.piece-check button[data-result=correct]{background:#e0efdb;border-color:#538a50;opacity:1}.piece-check button[data-result=wrong]{background:#f9eee1;border-color:#b99154}
.piece-assembly-note{background:#f4eddd;border-radius:12px;padding:12px 14px;font-size:12px;color:#65563c}.piece-question{display:grid;gap:10px;margin-top:22px;background:#edf3e8;border-radius:14px;padding:14px}.piece-question label{font-size:13px}.piece-question textarea{box-sizing:border-box;width:100%;min-height:80px;border:1px solid #b0c6b4;border-radius:10px;padding:10px;font:16px/1.6 system-ui;resize:vertical;background:white;color:#173d35}.piece-question small{font-size:11px;color:#526956}
#piece-dialog .dialog-foot{display:flex;gap:8px;padding:12px 18px;background:#eef2e9}#piece-dialog .dialog-foot button{flex:1;min-width:0;font-size:12px}.piece-step{width:100%;margin:18px 0 4px;background:#173d35!important;color:white!important}#piece-feedback{font-weight:600;color:#315a43}
@media(max-width:480px){#piece-dialog{width:calc(100vw - 16px);max-height:calc(100dvh - 16px);border-radius:18px}#piece-dialog .dialog-head{padding:14px}#piece-dialog .dialog-head h2{font-size:18px}#piece-dialog .dialog-body{padding:16px}.piece-tabs{padding:7px}.piece-tabs button{font-size:11px}}
`;

export const computerLessonRuntime = String.raw`
const piecePanels={},pieceTabs=document.createElement('nav');pieceTabs.className='piece-tabs';pieceTabs.setAttribute('aria-label',lessonUI.sections);
dialog.querySelector('.dialog-head').after(pieceTabs);
const lessonBody=dialog.querySelector('.dialog-body');
function lessonElement(tag,text,parent){const el=document.createElement(tag);if(text)el.textContent=text;parent?.appendChild(el);return el}
for(const [index,name] of ['understand','assemble','practice'].entries()){
  const button=lessonElement('button',String(index+1).padStart(2,'0')+' · '+lessonUI[name],pieceTabs);button.dataset.pieceTab=name;button.onclick=()=>showPieceSection(name);
  piecePanels[name]=lessonElement('section','',lessonBody);piecePanels[name].dataset.piecePanel=name;
}
function moveWithHeading(id,panel){const el=byId(id);if(el.previousElementSibling?.tagName==='H3')panel.appendChild(el.previousElementSibling);panel.appendChild(el)}
for(const id of ['piece-detail','piece-anatomy','piece-example','piece-connection'])moveWithHeading(id,piecePanels.understand);
for(const id of ['piece-install','piece-why'])moveWithHeading(id,piecePanels.assemble);
piecePanels.assemble.appendChild(dialog.querySelector('.underneath-panel'));
lessonElement('p',lessonUI.note,piecePanels.assemble).className='piece-assembly-note';
lessonElement('h3',lessonUI.related,piecePanels.understand);
const relatedParts=lessonElement('div','',piecePanels.understand);relatedParts.id='piece-related';relatedParts.className='piece-related';
for(const [from,to] of [['understand','assemble'],['assemble','practice']]){const button=lessonElement('button',lessonUI[to],piecePanels[from]);button.className='piece-step';button.onclick=()=>showPieceSection(to)}
lessonElement('h3',lessonUI.quiz,piecePanels.practice);
const pieceAnswers=lessonElement('div','',piecePanels.practice);pieceAnswers.id='piece-answers';pieceAnswers.className='piece-check';
const pieceFeedback=lessonElement('p','',piecePanels.practice);pieceFeedback.id='piece-feedback';pieceFeedback.setAttribute('role','status');
piecePanels.practice.appendChild(dialog.querySelector('[data-teacher="example"]'));
const questionForm=lessonElement('form','',piecePanels.practice);questionForm.className='piece-question';questionForm.id='piece-question-form';
const questionLabel=lessonElement('label',lessonUI.question,questionForm);questionLabel.htmlFor='piece-question';
const questionInput=lessonElement('textarea','',questionForm);questionInput.id='piece-question';questionInput.maxLength=600;questionInput.required=true;
lessonElement('small',lessonUI.online,questionForm);lessonElement('button',lessonUI.ask,questionForm).type='submit';
questionForm.onsubmit=e=>{e.preventDefault();const question=questionInput.value.trim();if(!question){questionInput.focus();return}send({type:'ask-pc-teacher',device,id:selected,intent:'question',question:question.slice(0,600)})};
const nextPiece=lessonElement('button',lessonUI.next,dialog.querySelector('.dialog-foot'));nextPiece.id='piece-next';nextPiece.onclick=()=>{activeRegion=null;select(topics[(topics.findIndex(t=>t.id===selected)+1)%topics.length].id,true);byId('inspect').click()};
function showPieceSection(name){for(const [id,panel] of Object.entries(piecePanels)){panel.hidden=id!==name;if(panel.hidden&&panel.contains(document.activeElement))pieceTabs.querySelector('[data-piece-tab="'+name+'"]').focus({preventScroll:true})}pieceTabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pieceTab===name)));lessonBody.scrollTop=0}
const inspectLesson=byId('inspect').onclick;
byId('inspect').onclick=()=>{
  const originalFocus=dialog.open?returnFocus:document.activeElement;
  if(dialog.open)closePiece();inspectLesson();returnFocus=originalFocus;
  const topic=topics.find(t=>t.id===selected);
  relatedParts.replaceChildren();
  topic.related.forEach(id=>{const other=topics.find(t=>t.id===id);const button=lessonElement('button',other.name,relatedParts);button.onclick=()=>{activeRegion=null;select(id,true);byId('inspect').click()}});
  const options=topics.filter(t=>t.id!==selected).slice(0,2);options.splice(topics.indexOf(topic)%3,0,topic);
  pieceAnswers.replaceChildren();pieceFeedback.textContent='';questionInput.value='';
  options.forEach(other=>{const button=lessonElement('button',other.detail.split(/[.!?]/)[0]+'.',pieceAnswers);button.onclick=()=>{const correct=other.id===selected;pieceFeedback.textContent=correct?lessonUI.correct+topic.example:lessonUI.wrong;button.dataset.result=correct?'correct':'wrong';if(correct)pieceAnswers.querySelectorAll('button').forEach(b=>b.disabled=true)}});
  showPieceSection('understand');
};
`;
