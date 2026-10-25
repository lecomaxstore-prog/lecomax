const fs = require('node:fs');
const path = require('node:path');
const archive = /(?:FileIcon_colors|TabIcon_common|LANG_FLAGS|DebugSection_colors|PHASE_TR|STEP_TR|PagesSection_pages|TUTOR_COURSE|predictionIsYes|inspectSourceConnections_result|DAILY_PATH|labForLesson)$/;
function moduleKind(id) { return archive.test(id) ? 'archive' : /ref-page-tsx-(CoursSection_modules|MentorSection_curriculum)/.test(id) ? 'course' : id.startsWith('ref-') || id==='glossary' ? 'reference' : 'course'; }

function extraLessons(modules, lang, { lesson, tr, load }) {
  require('./python-mastery.cjs').addPythonMastery(modules, lang, {lesson,tr});
  require('./iptv-course.cjs').addIptv(modules, lang, {lesson,tr});
  const names={
    CoursSection_modules:['Cours de programmation','Programming courses','دروس البرمجة'],
    MentorSection_curriculum:['Penser comme un ingénieur','Think like an engineer','فكّر كمهندس'],
    PHASES:['Étapes de construction du site','How the website was built','مراحل بناء الموقع'],
    DAILY_CODE:['Lectures de code quotidiennes','Daily code readings','قراءات الكود اليومية'],
    backendPractice:['Ateliers backend','Backend workshops','ورش الخادم'],
    STARTER_PRACTICE:['Exercices pour débuter','Starter exercises','تمارين البداية'],
    TUTOR_LESSONS:['Sujets du professeur','Teacher topics','مواضيع الأستاذ'],
    SYMBOLS:['Symboles du code','Code symbols','رموز الكود'],
    HOUR_PLAN:['Atelier d’une heure','One-hour workshop','ورشة ساعة واحدة'],
    DAILY_CHALLENGES:['Défis quotidiens','Daily challenges','تحديات يومية'],
    JOURNEY:['Parcours guidé','Guided journey','رحلة موجّهة'],
    SITE_PAGES:['Pages du site','Website pages','صفحات الموقع'],
    TECH:['Technologies du projet','Project technologies','تقنيات المشروع'],
    ENV:['Configuration du serveur','Server configuration','إعداد الخادم'],
  };
  for(const m of modules)if(names[m.title])m.title=tr(names[m.title],lang);
  const site = load('lib/site-learning.ts');
  const examples = [
    ['hero', 'section', 'components/HeroBanner.tsx'],
    ['header', 'header', 'components/Header.tsx'],
    ['footer', 'footer', 'components/Footer.tsx'],
    ['link', 'a', 'components/Header.tsx'],
    ['image', 'img', 'components/CollectionProductCard.tsx'],
    ['interaction', 'button', 'app/panier/page.tsx'],
    ['structure', 'section', 'app/page.tsx'],
  ];
  modules.push({id:'site-elements', title:tr(['Comprendre les éléments du site','Understand website elements','افهم عناصر الموقع'],lang), summary:'', lessons:examples.map(([id,tag,file])=>{
    const s=site.elementLesson({path:file,tag},lang);
    return lesson('site-element-'+id,'site-elements',s.title,'lib/site-learning.ts',lang,{
      concept:s.what, why:s.why, explanation:[{text:s.what}], relatedFiles:[file],
      exercise:{task:s.challenge,hints:[s.what],solution:s.answer},summary:[s.answer],
    });
  })});
  // Tuple rows were previously flattened into separate lessons. Keep their old IDs
  // for saved notes, and provide correctly structured, localized glossary entries.
  const glossary=load('app/admin/how-it-was-built/learning/resources.ts').glossary;
  modules.push({id:'glossary',title:tr(['Glossaire','Glossary','قاموس المصطلحات'],lang),summary:'',lessons:glossary.map(([term,definition],i)=>lesson('glossary-'+i,'glossary',term,'app/admin/how-it-was-built/learning/resources.ts',lang,{concept:tr(definition,lang),explanation:[{text:tr(definition,lang)}],summary:[tr(definition,lang)]}))});
}

function enrich(l, lang, {get,tr,flatten,root}) {
  const t=(fr,en,ar)=>tr([fr,en,ar],lang);
  if(l.moduleId==='daily') {
    const c=get('course/daily-code.ts','DAILY_CODE')[l.id.slice(6)];
    if(c) {
      l.explanation.push(...c.vocabulary.map(([title,text])=>({title,text:tr(text,lang)})));
      const file=l.relatedFiles[0], full=fs.readFileSync(path.join(root,file),'utf8').split('\n');
      const start=full.findIndex(line=>line.includes(c.anchor));
      if(start>=0) l.codeExample.push({filename:file,code:full.slice(start,start+c.count).join('\n'),annotations:[{lines:`1-${c.count}`,label:l.why}]});
      else l.explanation.push({title:t('Repère à retrouver','Locate the changed code','ابحث عن الكود المعدّل'),text:c.anchor});
    }
  }
  if(l.moduleId==='studio') {
    const id=l.id.slice(7), reading=get('learning/reading.ts','readings')[id];
    if(reading) l.codeExample.push({filename:reading.file,code:reading.lines.map(x=>x.code).join('\n'),annotations:reading.lines.map((x,i)=>({lines:String(i+1),label:tr(x.explanation,lang)}))});
    const analogy=get('learning/coaching.ts','analogies')[id];
    if(analogy)l.explanation.push(...flatten(analogy,lang));
    const removal=get('learning/coaching.ts','removalNotes')[id];
    if(removal)l.whatIf=flatten(removal,lang).map(b=>b.text).join('\n');
  }
  if(l.moduleId==='start') {
    const p=get('course/beginner-practice.ts','STARTER_PRACTICE')[l.id.slice(6)];
    if(p){
      l.exercise={task:tr(p.prompt,lang)+'\n'+p.before+'____'+p.after,hints:[tr(p.hint,lang)],solution:p.before+p.answer+p.after+'\n\n'+tr(p.explanation,lang)};
      l.quiz[0].answerExplanations=p.answerFeedback.map(x=>tr(x,lang));
    }
  }
  if(l.moduleId.startsWith('ref-')) {
    // Promote original exercises/why out of generic property dumps into the actual teaching flow.
    const r=l.raw?.content && typeof l.raw.content==='object'?l.raw.content:l.raw;
    if(r&&typeof r==='object'){
      l.why=tr(r.why,lang)||l.why;
      l.exercise.task=tr(r.exercise||r.task||r.challenge,lang)||l.exercise.task;
      const candidates=[r.file,r.source,r.path,...(Array.isArray(r.files)?r.files:[])];
      l.relatedFiles=[...new Set(candidates.filter(x=>typeof x==='string'&&/^(app|components|lib)\/.+\.(tsx?|jsx?)$/.test(x)&&fs.existsSync(path.join(root,x))))];
    }
    // Never expose the correct quiz answer in the reading stage.
    const q=l.raw?.quiz;
    if(q) {
      const quizText=new Set(flatten(q,lang).map(b=>b.text));
      l.explanation=l.explanation.filter(b=>!quizText.has(b.text));
    }
  }
  if(l.moduleId==='micro')l.contentLanguage='ar';
  if(l.moduleId.startsWith('ref-page-tsx-'))l.contentLanguage='fr';
  if(l.moduleId.startsWith('guide-')){
    const paragraphs=l.explanation.map(b=>b.text).filter(Boolean);
    l.teaching={what:l.concept||paragraphs[0],why:paragraphs[1]||paragraphs[0],where:l.relatedFiles.join('\n')||t('Atelier autonome. Cet exemple n’est pas une fonctionnalité exécutée par L’ECOMAX. Compare son idée aux fichiers du projet dans l’explorateur.','Standalone workshop. This example is not a feature running in L’ECOMAX. Compare the idea with project files in the explorer.','ورشة مستقلة. هذا المثال ليس ميزة تعمل داخل L’ECOMAX. قارن الفكرة بملفات المشروع في المستكشف.'),how:paragraphs.slice(1).join('\n')||paragraphs[0],breaks:t('Résultat à vérifier :\n','Result to verify:\n','النتيجة المطلوب التحقق منها:\n')+l.exercise.solution+'\n'+t('Si le résultat diffère, relève le premier message d’erreur et vérifie les entrées de l’exemple avant de recommencer.','If your result differs, record the first error and check the example inputs before retrying.','إذا اختلفت النتيجة، سجّل أول خطأ وتحقق من مدخلات المثال قبل إعادة المحاولة.'),modify:l.exercise.task};
  }
  // The academy already supplies topic-specific teaching, errors and modification
  // exercises. Surface those six answers explicitly instead of generic objectives.
  if(l.source.includes('/course/content/')) {
    const original=JSON.parse(fs.readFileSync(path.join(root,l.source),'utf8')).lessons.find(x=>x.id===l.id);
    const blocks=original.sections.flatMap(s=>s.blocks);
    const paragraphs=blocks.filter(b=>b.type==='paragraph').map(b=>b.text);
    const application=blocks.find(b=>b.id==='lecomax');
    l.concept=paragraphs[0]||l.concept;
    l.why=paragraphs[1]||l.why;
    l.teaching={what:l.concept,why:l.why,where:[application?.text,...l.relatedFiles].filter(Boolean).join('\n'),how:[...paragraphs.slice(2),...l.codeExample.flatMap(b=>(b.annotations||[]).map(a=>a.label))].join('\n'),breaks:l.whatIf,modify:l.exercise.task};
  } else if(['daily','studio','start','build','site-elements'].includes(l.moduleId)) {
    l.teaching={what:l.concept||l.explanation[0]?.text||l.title,why:l.why||l.explanation.map(b=>b.text).filter(Boolean).join('\n'),where:l.relatedFiles.join('\n'),how:l.codeExample.flatMap(b=>(b.annotations||[]).map(a=>a.label)).join('\n')||l.explanation.map(b=>b.text).filter(Boolean).join('\n'),breaks:l.whatIf||t('Repère la sortie attendue ci-dessous. Si elle diffère, remonte aux entrées et au premier message d’erreur dans le fichier lié.','Compare the result with the expected behavior below. If it differs, trace the inputs and first error in the linked file.','قارن النتيجة بالسلوك المتوقع أدناه. إذا اختلفت، تتبع المدخلات وأول خطأ في الملف المرتبط.'),modify:l.exercise.task};
  }
  l.explanation=l.explanation.filter((b,i,a)=>!b.text||a.findIndex(x=>x.text===b.text)===i);
}
module.exports={enrich,extraLessons,moduleKind};
