const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {datasets}=require('./inventory.cjs');
const {root,base,load}=require('./inspect.cjs');
const dir=path.join(root,'lecomax-learning-app');
const index=JSON.parse(fs.readFileSync(path.join(dir,'data/index.json')));
const mobile=new Map(index.flatMap(m=>JSON.parse(fs.readFileSync(path.join(dir,'data/lessons/en',m.id+'.json'))).lessons.map(l=>[l.id,l])));
const rows=[];
function add(file,key,item,id){const l=mobile.get(id); rows.push({web:file+' # '+key,webLesson:(typeof item.title==='string'?item.title:item.title?.en||item.title?.[1])||item.id||key,mobileLesson:id,mobileTitle:l?.title||'',status:l?'present':'MISSING'});assert(l,'Missing web lesson: '+id);}
const manifest=JSON.parse(fs.readFileSync(path.join(root,base,'course/generated/manifest.json')));
for(const m of manifest.modules){const file=base+'course/content/en/'+m.id+'.json';const data=JSON.parse(fs.readFileSync(path.join(root,file)));for(const l of data.lessons){add(file,l.id,l,l.id);for(const lang of ['ar','en','fr']){const web=JSON.parse(fs.readFileSync(path.join(root,base,'course/content',lang,m.id+'.json'))).lessons.find(x=>x.id===l.id);const app=JSON.parse(fs.readFileSync(path.join(dir,'data/lessons',lang,m.id+'.json'))).lessons.find(x=>x.id===l.id);assert.deepEqual(app.websiteLesson,web,`Website lesson content differs: ${lang}/${l.id}`);assert.deepEqual(app.quiz,web.quiz);for(const block of web.sections.flatMap(s=>s.blocks).filter(b=>b.type==='code'))assert(app.codeExample.some(b=>b.code===block.code.source));}}}
for(const [file,key,prefix] of [['course/beginner-path.ts','STARTER_LESSONS','start-'],['course/daily-lessons.ts','DAILY_LESSONS','daily-'],['learning/lessons.ts','lessons','studio-'],['course/shop-missions.ts','SHOP_MISSIONS','build-'],['CodeCoachGame.tsx','LEVELS','quest-']])for(const item of datasets[base+file][key])add(base+file,key+'/'+item.id,item,prefix+item.id);
for(const [file,key] of [['course/backend-guides.ts','backendGuides'],['course/beginner-guides.ts','nextjsGuide'],['course/beginner-guides.ts','pythonGuide']]){let guides=datasets[base+file][key];if(!Array.isArray(guides))guides=[guides];for(const g of guides)g.chapters.forEach((c,i)=>add(base+file,key+'/'+g.id+'/'+i,c,'guide-'+g.id+'-'+i));}
for(const item of datasets['lib/micro-learning-curriculum.ts'].MICRO_LEARNING_TIPS)add('lib/micro-learning-curriculum.ts',item.id,item,'micro-'+item.id);
for(const key of ['CoursSection_modules','MentorSection_curriculum']){let i=0;for(const group of datasets[base+'page.tsx'][key])for(const item of group.lessons)add(base+'page.tsx',key+'/'+group.id+'/'+i,item,'ref-page-tsx-'+key+'-'+i++);}
datasets['lib/ai-tutor-course.ts'].TUTOR_LESSONS.forEach((l,i)=>add('lib/ai-tutor-course.ts',l.id,l,'ref-ai-tutor-course-ts-TUTOR_LESSONS-'+i));
for(const [i,id] of ['hero','header','footer','link','image','interaction','structure'].entries())add('lib/site-learning.ts','elementLesson/'+id,{title:id},'site-element-'+id);
const mapped=new Set(rows.map(r=>r.mobileLesson));
for(const [id,l] of mobile)if(!mapped.has(id))rows.push({web:l.source,webLesson:l.title,mobileLesson:id,mobileTitle:l.title,status:index.find(m=>m.id===l.moduleId).kind==='archive'?'preserved archive (not a lesson)':'preserved reference'});
for(const row of rows){const l=mobile.get(row.mobileLesson);row.teachingStatus=l.teaching?'six questions surfaced; editorial review still applies':'original material retained; teaching expansion needed';row.contentLanguage=l.contentLanguage||'localized source (may contain original examples)';}
const quality={missing:rows.filter(r=>r.status==='MISSING').length,explicitWebLessons:rows.filter(r=>r.status==='present').length,mobileRecords:mobile.size,academyLessons:manifest.lessonCount,byKind:Object.fromEntries(['course','reference','archive'].map(k=>[k,index.filter(m=>m.kind===k).reduce((n,m)=>n+m.lessons.length,0)])),sixQuestionLessons:[...mobile.values()].filter(l=>l.teaching&&Object.values(l.teaching).every(Boolean)).length,withoutQuiz:[...mobile.values()].filter(l=>!l.quiz.length).length,emptyReferences:[...mobile.values()].filter(l=>!l.explanation.some(b=>b.text)&&!l.codeExample.length).map(l=>l.id)};
fs.writeFileSync(path.join(dir,'docs/lesson-comparison.json'),JSON.stringify({scope:'All manifest lessons, exported starter/daily/studio/build/guides/quest/micro lessons, inline courses/mentor, AI curriculum topics and site element teaching cases. Remaining records are individually listed references, not claimed to be authored lessons.',quality,rows},null,2));
const escape=v=>String(v).replace(/\|/g,'\\|').replace(/[\r\n]+/g,' ');
fs.writeFileSync(path.join(dir,'docs/LESSON-COMPARISON.md'),'# Web → mobile lesson comparison\n\nGenerated from current web source definitions. `present` proves a mapped record, not teaching quality or a completed translation. Original-language material is labeled in the app. Archives preserve saved links; they do not count as authored courses.\n\n'+JSON.stringify(quality,null,2)+'\n\n| Existing web lesson (source) | Mobile lesson | Status |\n| --- | --- | --- |\n'+rows.map(r=>`| ${escape(r.webLesson)} — ${escape(r.web)} | ${escape(r.mobileLesson)} | ${r.status}; ${rowTeaching(r)} |`).join('\n')+'\n');
function rowTeaching(r){return escape(r.teachingStatus);}
console.log(JSON.stringify(quality));
