const fs=require('node:fs');
const path=require('node:path');
const {load}=require('./inspect.cjs');
const root=path.resolve(__dirname,'..');
const content=load('lecomax-learning-app/services/content.ts');
const {courses}=load('lecomax-learning-app/constants/courses.ts');
const {curriculum}=load('lecomax-learning-app/data/university/curriculum.ts');
const reviews=require('../docs/quality-audit/reviews.json').reviews;
const wc=text=>String(text||'').trim().split(/\s+/u).filter(Boolean).length;
const folder=path.join(root,'docs/quality-audit');
const records=[];const errors=[];const seen=new Set();
for(const module of content.index){
 for(const entry of module.lessons){
  if(seen.has(entry.id))errors.push('duplicate runtime ID '+entry.id);seen.add(entry.id);
  const record={id:entry.id,moduleId:module.id,kind:module.kind||'unclassified',title:entry.title,courses:courses.filter(course=>course.modules.includes(module.id)).map(course=>course.id),learningPaths:curriculum.filter(item=>item.modules.includes(module.id)).map(item=>item.id),locales:{},overallStatus:'substantive-review-pending'};
  for(const language of ['ar','en','fr']){
   let lesson;try{lesson=content.getLesson(entry.id,language);}catch(error){errors.push(entry.id+': '+error.message);}
   if(!lesson){errors.push('unresolved '+entry.id+'/'+language);record.locales[language]={resolved:false};continue;}
   const paragraphs=lesson.explanation.map(block=>block.text||'').filter(Boolean);
   const code=lesson.codeExample.filter(block=>block.code?.trim());
   const words=wc(paragraphs.join(' '));
   const flags=[];
   const shortForm=['micro','quest'].includes(module.id);
   if(module.kind==='course'&&!shortForm&&words<1500)flags.push('below-long-form-depth-screen');
   if(shortForm)flags.push('micro-practice-not-a-substitute-for-a-chapter');
   if(!code.length)flags.push('no-code-example');
   if(code.some(block=>!block.annotations?.length))flags.push('some-code-without-line-explanations');
   if(!lesson.exercise.task?.trim())flags.push('missing-exercise');
   if(!lesson.exercise.solution?.trim())flags.push('missing-worked-solution');
   if(!lesson.exercise.hints?.length)flags.push('missing-hints');
   if(!lesson.quiz.length)flags.push('no-quiz');
   if(lesson.quiz.some(q=>!q.answerExplanations||q.answerExplanations.length!==q.options.length))flags.push('missing-per-option-feedback');
   if(lesson.quiz.some(q=>q.correctIndex<0||q.correctIndex>=q.options.length))flags.push('invalid-answer-index');
   if(new Set(paragraphs).size<paragraphs.length)flags.push('exact-repeated-paragraphs');
   if(!lesson.whatIf?.trim()&&!lesson.academy)flags.push('no-dedicated-troubleshooting-field');
   const review=reviews.find(review=>review.id===entry.id&&review.locale===language);
   const assessments={
    completeness:{status:'not-established',evidence:'Requires topic-by-topic review; titles and length are not completion.'},
    educationalDepth:{status:words<1500&&!shortForm?'expansion-review-needed':'substantive-review-needed',evidence:words+' explanation words; '+paragraphs.length+' text blocks.'},
    beginnerAccessibility:{status:'review-required',evidence:'Prerequisite ordering and first-use terminology need human-level review.'},
    accuracy:{status:review?.findings.some(f=>f.includes('Unconditional INSERT'))?'confirmed-defect':'not-verified',evidence:'No correctness claim from automated text metrics.'},
    codeExamples:{status:'review-required',evidence:code.length+' blocks; '+code.filter(block=>block.annotations?.length).length+' annotated. Execution status belongs in reviewed findings.'},
    missingFundamentals:{status:'review-required',items:review?.missingFundamentals||[]},
    missingAdvanced:{status:'review-required',items:review?.missingAdvanced||[]},
    practicalExercises:{status:lesson.exercise.task?'present-review-required':'missing',evidence:lesson.academy?.exercises.length||Number(!!lesson.exercise.task)},
    detailedSolutions:{status:lesson.exercise.solution?'present-review-required':'missing',evidence:wc(lesson.exercise.solution)+' words/code tokens; presence does not establish that the solution solves the task.'},
    realWorldRelevance:{status:'review-required',evidence:lesson.relatedFiles.length+' file references; reference count does not establish a correct explanation.'},
    commonMistakes:{status:'review-required',evidence:lesson.websiteLesson?.commonErrors?.length||lesson.raw?.commonErrors?.length||0},
    debuggingGuidance:{status:lesson.whatIf||lesson.academy?'present-review-required':'not-explicitly-structured',evidence:'Requires symptom -> cause -> diagnostic test -> repair assessment.'}
   };
   record.locales[language]={resolved:true,source:lesson.source,contentLanguage:lesson.contentLanguage||language,explanationWords:words,codeBlocks:code.length,quizzes:lesson.quiz.length,flags,assessments:{...assessments,...(review?.assessments||{})},review:review||null};
   if(review)record.overallStatus=review.status;
  }
  records.push(record);
 }
}
const diskOrphans=[];
for(const language of ['ar','en','fr'])for(const filename of fs.readdirSync(path.join(root,'data/lessons',language)).filter(file=>file.endsWith('.json'))){
 const module=JSON.parse(fs.readFileSync(path.join(root,'data/lessons',language,filename),'utf8'));
 for(const lesson of module.lessons||[])if(!seen.has(lesson.id))diskOrphans.push({language,file:filename,id:lesson.id});
}
const summary={date:'2026-10-08',method:'Complete structural/content inventory, not a claim of complete substantive or accuracy review.',courses:courses.length,learningPaths:curriculum.length,modules:content.index.length,lessons:records.length,localeResolutions:records.reduce((n,r)=>n+Object.values(r.locales).filter(l=>l.resolved).length,0),kinds:records.reduce((a,r)=>(a[r.kind]=(a[r.kind]||0)+1,a),{}),arabicLongFormCandidates:records.filter(r=>r.kind==='course'&&r.locales.ar.explanationWords>=1500).length,substantivelyReviewedLessonLocales:reviews.length,flags:records.reduce((a,r)=>{for(const flag of r.locales.ar.flags||[])a[flag]=(a[flag]||0)+1;return a;},{}),diskOrphans,errors};
fs.mkdirSync(folder,{recursive:true});
fs.writeFileSync(path.join(folder,'lesson-audit.json'),JSON.stringify({summary,records},null,2)+'\n');
let md='# Academy educational quality coverage report\n\n'+summary.method+'\n\n';
md+='Inventory: '+summary.courses+' courses, '+summary.learningPaths+' learning paths, '+summary.modules+' modules, '+summary.lessons+' unique lessons, '+summary.localeResolutions+' locale resolutions. Archives and reference entries are included rather than silently excluded.\n\n';
md+='## Findings requiring implementation\n\n';for(const review of reviews)md+='### '+review.id+' ('+review.locale+')\n\nStatus: '+review.status+'\n\n'+review.findings.map(f=>'- '+f).join('\n')+'\n\nNext: '+review.nextAction+'\n\n';
md+='## Content expanded, examples and exercises added\n\n';for(const review of reviews.filter(r=>r.contentExpanded))md+='### '+review.id+' ('+review.locale+')\n\n'+review.contentExpanded.map(x=>'- '+x).join('\n')+'\n\nValidation: '+review.validation.join(' ')+'\n\n';
md+='## Every course and module\n\n';for(const course of courses){md+='### '+course.id+'\n\n';for(const id of course.modules){const module=content.index.find(m=>m.id===id);md+='- '+id+': '+(module?.lessons.length||0)+' lessons; substantive completion not established.\n';}md+='\n';}
md+='## Every lesson\n\nWord counts and flags are screening evidence, not grades. Each locale has all twelve requested assessment dimensions in lesson-audit.json. Blank missing-topic lists mean not yet reviewed, never that no topics are missing.\n\n| Lesson | Module / role | AR words | EN words | FR words | Review status | Arabic screening flags |\n|---|---|---:|---:|---:|---|---|\n';for(const r of records)md+='| '+r.id+' | '+r.moduleId+' / '+r.kind+' | '+r.locales.ar.explanationWords+' | '+r.locales.en.explanationWords+' | '+r.locales.fr.explanationWords+' | '+r.overallStatus+' | '+(r.locales.ar.flags||[]).join(', ')+' |\n';
md+='\n## Outstanding quality problems and remaining work\n\n- Substantively review every unreviewed locale. Automated inventory is complete; educational and technical review is not.\n- Replace boilerplate, non-discriminating distractors and tasks without actual worked implementations.\n- Expand priority JavaScript, TypeScript, React, Next.js, API, database and Expo chapters in their durable authoring sources.\n- Preserve micro exercises as revision material and avoid presenting them as full courses.\n- Test snippets according to their actual runtime and version; a schema check does not execute SQL or UI code.\n- Reconcile full coverage against the 16-track checklist and add missing React Native material; a catalog title is not evidence of coverage.\n- Repeat browser/native/offline verification when a browser provider and working Hermes execution are available.\n';
fs.writeFileSync(path.join(folder,'COURSE_COVERAGE_REPORT.md'),md);
console.log(JSON.stringify(summary,null,2));
process.exitCode=errors.length?1:0;
