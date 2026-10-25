const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {root,base,load,ts}=require('./inspect.cjs');
const {datasets}=require('./inventory.cjs');
const {enrich, extraLessons, moduleKind}=require('./teaching.cjs');
const out=path.join(root,'lecomax-learning-app/data');
const langs=['ar','en','fr'];
fs.writeFileSync(path.join(root,'lecomax-learning-app/types/website-course.ts'), '/* eslint-disable @typescript-eslint/array-type */\n// Generated from the website course types by scripts/migrate.cjs.\n'+fs.readFileSync(path.join(root,base,'course/types.ts'),'utf8'));
const tr=(v,lang)=>typeof v==='string'?v:Array.isArray(v)&&v.length===3&&v.every(x=>typeof x==='string')?v[{fr:0,en:1,ar:2}[lang]]:v&&typeof v==='object'&&!Array.isArray(v)?v[lang]||v.fr||v.en||'':'';
const get=(p,k)=>datasets[base+p][k];
function redact(value){
 if(typeof value==='string')return value.replace(/((?:password|api[_-]?key|access[_-]?token|service[_-]?role[_-]?key|client[_-]?secret)\s*["']?\s*[:=]\s*["'])[^"'\r\n]{16,}(["'])/gi,'$1REDACTED$2').replace(/\b(?:sk_(?:live|test)_[A-Za-z0-9]{16,}|sk-proj-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{15,})\b/g,'REDACTED');
 if(Array.isArray(value))return value.map(redact);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,redact(v)]));
 return value;
}
function flatten(value,lang,label='',blocks=[]) {
 if(value==null || typeof value==='boolean' || typeof value==='number') return blocks;
 const translated=tr(value,lang);
 if(translated) { blocks.push(/^(code|before|after|source|original|solution)$/i.test(label)?{title:label,code:translated,filename:'Teaching example'}:{title:label,text:translated}); return blocks; }
 if(Array.isArray(value)) value.forEach(v=>flatten(v,lang,label,blocks));
 else if(typeof value==='object') for(const [k,v] of Object.entries(value)) if(!['id','color','icon','correctIndex','correct','order','answer','mode'].includes(k)) flatten(v,lang,k,blocks);
 return blocks;
}
function lesson(id,moduleId,title,source,lang,extra={}) {return {id,moduleId,title,subtitle:'',language:lang,estimatedMinutes:10,difficulty:1,source,relatedFiles:[],relatedRoutes:[],realProjectExample:[],tags:[moduleId],concept:title,explanation:[],codeExample:[],exercise:{task:'',hints:[],solution:''},quiz:[],summary:[],why:'',whatIf:'',nextLesson:'',...extra};}
function quiz(q,id,lang) {return {id,question:tr(q.question,lang),options:q.options.map(o=>tr(o,lang)),correctIndex:q.correctIndex??q.correct,explanation:tr(q.explanation??q.feedback??q.outcome,lang),answerExplanations:q.answerExplanations?.map(o=>tr(o,lang))};}
const all={ar:[],en:[],fr:[]};
const report={academyLessons:192,byModule:[],sourceOmissions:[],sourceVersion:1};
for(const lang of langs) {
 const add=(id,title,lessons,summary='')=>all[lang].push({id,title,summary,lessons});
 const modules=JSON.parse(fs.readFileSync(path.join(root,base,'course/generated/manifest.json'),'utf8')).modules;
 for(const m of modules) {
  const p=base+'course/content/'+lang+'/'+m.id+'.json'; const data=JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
  add(m.id,data.title,data.lessons.map(l=>lesson(l.id,m.id,l.title,p,lang,{
   websiteLesson:l,estimatedMinutes:l.estimatedMinutes,difficulty:m.order<12?1:m.order<28?2:3,concept:l.objectives.join('\n'),
   relatedFiles:data.files.filter(f=>f.mode==='existing').map(f=>f.path),
   explanation:[...l.sections.flatMap(s=>s.blocks.filter(b=>b.type!=='code').flatMap(b=>b.type==='vocabulary'?b.items.map(i=>({title:i.term,text:i.definition})):[{title:b.title||s.title,text:b.text||b.items?.join('\n')||''}])),{title:tr(['Résultat attendu','Expected result','النتيجة المتوقعة'],lang),text:l.expectedResult}],
   codeExample:[...l.sections.flatMap(s=>s.blocks.filter(b=>b.type==='code').map(b=>({title:b.title,code:b.code.source,filename:b.code.filename,annotations:b.code.annotations}))),...(l.commands.length?[{title:'Terminal',code:l.commands.join('\n'),filename:'Terminal'}]:[])],
   exercise:{task:[l.exercise.task,...l.exercise.steps].join('\n'),hints:l.exercise.hints,solution:l.exercise.solution.explanation+'\n'+l.exercise.solution.code},
   quiz:l.quiz,summary:l.recap,why:l.objectives.join('\n'),whatIf:l.commonErrors.map(e=>[e.symptom,e.cause,e.fix].join('\n')).join('\n\n'),raw:{commands:l.commands,expectedResult:l.expectedResult,commonErrors:l.commonErrors}
  })),data.summary);
 }
 const starters=get('course/beginner-path.ts','STARTER_LESSONS');
 add('start',tr(['Commencer ici','Start here','ابدأ من هنا'],lang),starters.map(l=>lesson('start-'+l.id,'start',tr(l.title,lang),base+'course/beginner-path.ts',lang,{relatedFiles:[l.file],concept:tr(l.goal,lang),explanation:[{text:tr(l.idea,lang)},{text:tr(l.analogy,lang)}],codeExample:[{code:l.code,filename:'Teaching example',annotations:l.lines.map((x,i)=>({lines:String(i+1),label:tr(x,lang)}))}],exercise:{task:tr(l.task,lang),hints:[tr(l.observe,lang)],solution:l.code},quiz:[quiz(l,'q',lang)],summary:[tr(l.definition,lang)],why:tr(l.analogy,lang),whatIf:tr(l.observe,lang),raw:get('course/beginner-practice.ts','STARTER_PRACTICE')[l.id]})));
 const practice=get('course/backend-practice.ts','backendPractice');
 for(const g of [...get('course/backend-guides.ts','backendGuides'),get('course/beginner-guides.ts','nextjsGuide'),get('course/beginner-guides.ts','pythonGuide')]) {
  add('guide-'+g.id,tr(g.title,lang),g.chapters.map((c,i)=>{const p=practice[g.id]?.[i]||c;return lesson('guide-'+g.id+'-'+i,'guide-'+g.id,tr(c.title,lang),base+'course/'+(['nextjs-start','python'].includes(g.id)?'beginner':'backend')+'-guides.ts',lang,{relatedFiles:c.files||[],concept:tr(p.idea,lang),explanation:[...c.paragraphs.map(x=>({text:tr(x,lang)})),...(c.links||[]).map(([title,url])=>({title,text:url}))],codeExample:c.code?[{code:c.code,filename:c.filename}]:[],exercise:{task:tr(p.task,lang),hints:[tr(p.idea,lang)],solution:tr(p.result,lang)},summary:[tr(p.result,lang)],raw:c.links});}),tr(g.summary,lang));
 }
 add('daily',tr(['Leçons quotidiennes','Daily lessons','دروس يومية'],lang),get('course/daily-lessons.ts','DAILY_LESSONS').map(l=>{const code=get('course/daily-code.ts','DAILY_CODE')[l.id];return lesson('daily-'+l.id,'daily',tr(l.title,lang),base+'course/daily-lessons.ts',lang,{relatedFiles:[l.file],explanation:[{text:tr(l.idea,lang)},{text:tr(l.example,lang)}],exercise:{task:tr(l.task,lang),hints:[tr(l.question,lang)],solution:tr(l.answer,lang)},quiz:get('course/daily-tests.ts','DAILY_TESTS')[l.id].map((q,i)=>quiz(q,String(i),lang)),summary:[tr(l.answer,lang)],why:tr(code?.why,lang),whatIf:tr(code?.without,lang),raw:code});}));
 add('studio',tr(['Comprendre mon code','Understand my code','افهم كودي'],lang),get('learning/lessons.ts','lessons').map(l=>lesson('studio-'+l.id,'studio',tr(l.title,lang),base+'learning/lessons.ts',lang,{difficulty:l.level,estimatedMinutes:l.minutes,relatedFiles:[l.file],concept:tr(l.goal,lang),explanation:[{text:tr(l.simple,lang)},{text:tr(l.transfer,lang)}],exercise:{task:tr(l.task,lang),hints:[tr(l.hint,lang)],solution:l.answer.join('\n')},quiz:[quiz(l,'q',lang)],why:tr(l.why,lang),whatIf:tr(l.prediction,lang)+'\n'+tr(l.outcome,lang),summary:[tr(l.outcome,lang)],raw:{reading:get('learning/reading.ts','readings')[l.id],coaching:Object.fromEntries(Object.entries(datasets[base+'learning/coaching.ts']).map(([k,v])=>[k,v[l.id]]))}})));
 add('build',tr(['Construire ma boutique','Build my shop','ابنِ متجرك'],lang),get('course/shop-missions.ts','SHOP_MISSIONS').map(l=>lesson('build-'+l.id,'build',tr(l.title,lang),base+'course/shop-missions.ts',lang,{relatedFiles:[l.source],concept:tr(l.idea,lang),explanation:[{text:tr(l.transfer,lang)}],codeExample:[{filename:l.filename,code:l.before}],exercise:{task:tr(l.task,lang),hints:[tr(l.idea,lang)],solution:l.after},quiz:[{id:'q',question:tr(l.task,lang),options:l.options,correctIndex:l.answer,explanation:tr(l.explanations[l.answer],lang),answerExplanations:l.explanations.map(x=>tr(x,lang))}],summary:[tr(l.transfer,lang)]})));
 add('quest','Code Quest',get('CodeCoachGame.tsx','LEVELS').map(l=>lesson('quest-'+l.id,'quest',tr(l.title,lang),base+'CodeCoachGame.tsx',lang,{concept:tr(l.goal,lang),explanation:[{text:tr(l.goal,lang)}],codeExample:[{filename:l.filename,code:l.lines.map(x=>x.code).join('\n'),annotations:l.lines.map((x,i)=>({lines:String(i+1),label:tr(x.meaning,lang)}))}],exercise:{task:tr(l.goal,lang),hints:[tr(l.hint,lang)],solution:l.lines.map(x=>x.code).join('\n'),checks:l.checks.map(x=>x.token)},summary:[tr(l.hint,lang)]})));
 add('micro',tr(['Microleçons (arabe)','Micro lessons (Arabic)','معلومة اليوم'],lang),datasets['lib/micro-learning-curriculum.ts'].MICRO_LEARNING_TIPS.map(l=>lesson('micro-'+l.id,'micro',l.title,'lib/micro-learning-curriculum.ts',lang,{estimatedMinutes:2,relatedFiles:[l.source_path],concept:l.topic,explanation:[{text:l.content}],codeExample:l.code?[{code:l.code,filename:'Teaching example'}]:[],summary:[l.remember]})));
 // Preserve every other educational dataset as navigable, localized reference lessons.
 for(const [file,data] of Object.entries(datasets)) for(const [key,value] of Object.entries(data)) {
  if(['UI','TEXT','EXT_BG','BC','TB','ITEMS','TAB_IDS','TAB_GROUPS','STARTER_KEY','emptySession','EMPTY_WORKBOOK','TUTOR_LANGUAGES','BASE_LEVELS','EXTENDED_TOPICS','LEVELS','lessons','DAILY_LESSONS','DAILY_TESTS','STARTER_LESSONS','backendGuides','nextjsGuide','pythonGuide','SHOP_MISSIONS','MICRO_LEARNING_TIPS'].includes(key)||!value||typeof value!=='object') continue;
  const id='ref-'+path.basename(file).replace(/\W/g,'-')+'-'+key;
  const entries=(Array.isArray(value)?value:Object.entries(value).map(([id,v])=>({id,content:v}))).flatMap(v=>v.lessons?v.lessons.map(l=>({...l,parentTitle:v.title})):v.steps&&key==='PHASES'?v.steps.map(l=>({...l,parentTitle:v.label})):v);
  add(id,key,entries.map((v,i)=>{const blocks=flatten(v,lang);const title=tr(v.title||v.label||v.name,lang)||v.id||`${key} ${i+1}`;const q=v.quiz;return lesson(id+'-'+i,id,title,file,lang,{explanation:blocks.filter(x=>!x.code),codeExample:blocks.filter(x=>x.code),quiz:q&&q.options&&Number.isInteger(q.correct??q.correctIndex??q.answer)?[{id:'q',question:q.question||q.q||title,options:q.options,correctIndex:q.correct??q.correctIndex??q.answer,explanation:q.explanation||q.exp||''}]:[],raw:v});}));
 }
 // The start path is the first destination, followed by the original academy order.
 all[lang].sort((a,b)=>a.id==='start'?-1:b.id==='start'?1:0);
 extraLessons(all[lang],lang,{lesson,tr,load});
 for(const m of all[lang]) for(const l of m.lessons) enrich(l,lang,{datasets,get,tr,flatten,root,base});
 const chain=all[lang].filter(m=>moduleKind(m.id)!=='archive').flatMap(m=>m.lessons);
 chain.forEach((l,i)=>l.nextLesson=chain[i+1]?.id||'');
 fs.mkdirSync(path.join(out,'lessons',lang),{recursive:true});
 all[lang]=redact(all[lang]);
 for(const m of all[lang])for(const l of m.lessons)delete l.raw;
 for(const m of all[lang]) fs.writeFileSync(path.join(out,'lessons',lang,m.id+'.json'),JSON.stringify(m));
}
(async()=>{
 const {collectSourceLibrary,containsEmbeddedSecret}=await import(pathToFileURL(path.join(root,'scripts/source-library.mjs')));
 const source=await collectSourceLibrary(root);
 const guide=load('lib/source-code-guide.ts');
 const files=source.files.filter(f=>(/^(app|components|lib|supabase)\//.test(f.path)||!f.path.includes('/'))&&!f.path.startsWith(base)&&!f.path.includes('/generated/')&&!f.path.includes('content/'));
 const project=[];const sourceLoaders=[];
 fs.mkdirSync(path.join(out,'source'),{recursive:true});
 for(const f of files){
  const hash=crypto.createHash('sha256').update(f.content).digest('hex');
  const imports=[...f.content.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)].map(x=>x[1]);
  fs.writeFileSync(path.join(out,'source',hash+'.json'),JSON.stringify({content:f.content}));
  sourceLoaders.push(`${JSON.stringify(f.path)}:()=>require('./source/${hash}.json')`);
  project.push({path:f.path,hash,lines:f.lines,imports,importedBy:[],description:Object.fromEntries(langs.map(l=>[l,guide.describeSourceFile(f.path,l)])),route:/\/(page|route)\.tsx?$/.test(f.path)?'/'+f.path.replace(/^app\//,'').replace(/\/?(page|route)\.tsx?$/,''):null});
 }
 const paths=new Set(project.map(f=>f.path));
 for(const f of project) for(const imp of f.imports){const p=imp.startsWith('@/')?imp.slice(2):imp.startsWith('.')?path.posix.normalize(path.posix.join(path.posix.dirname(f.path),imp)):'';const resolved=[p,p+'.ts',p+'.tsx',p+'/index.ts',p+'/index.tsx'].find(v=>paths.has(v));if(resolved)project.find(v=>v.path===resolved).importedBy.push(f.path);}
 fs.writeFileSync(path.join(out,'project.json'),JSON.stringify(project));
 for(const lang of langs)for(const m of all[lang]){
  for(const l of m.lessons){l.realProjectExample=l.relatedFiles.flatMap(file=>{const f=project.find(p=>p.path===file);return f?[{file,hash:f.hash}]:[];});l.relatedRoutes=l.relatedFiles.flatMap(file=>{const f=project.find(p=>p.path===file);return f?.route?[f.route]:[];});}
  fs.writeFileSync(path.join(out,'lessons',lang,m.id+'.json'),JSON.stringify(m));
 }
 const index=all.ar.map((m,i)=>({id:m.id,title:Object.fromEntries(langs.map(l=>[l,all[l][i].title])),summary:Object.fromEntries(langs.map(l=>[l,all[l][i].summary])),lessons:m.lessons.map((v,j)=>({id:v.id,minutes:v.estimatedMinutes,difficulty:v.difficulty,title:Object.fromEntries(langs.map(l=>[l,all[l][i].lessons[j].title])),search:Object.fromEntries(langs.map(l=>[l,[...new Set(JSON.stringify(all[l][i].lessons[j]).toLowerCase().split(/[\s"{},:;\\]+/).filter(t=>t.length>2))].join(' ')]))}))}));
 const academyIds=new Set(JSON.parse(fs.readFileSync(path.join(root,base,'course/generated/manifest.json'),'utf8')).modules.map(m=>m.id));
 for(const m of index){m.kind=moduleKind(m.id);m.academy=academyIds.has(m.id);}
 fs.writeFileSync(path.join(out,'index.json'),JSON.stringify(index));
 fs.writeFileSync(path.join(out,'loaders.ts'),`import type {Module,Language} from '../types/content';\nexport const modules:Record<Language,Record<string,()=>Module>>={${langs.map(l=>`${l}:{${all[l].map(m=>`${JSON.stringify(m.id)}:()=>require('./lessons/${l}/${m.id}.json')`).join(',')}}`).join(',')}};\nexport const sources:Record<string,()=>{content:string}>={${sourceLoaders.join(',')}};\n`);
 fs.writeFileSync(path.join(root,'lecomax-learning-app/services/source-guide.js'),ts.transpileModule(fs.readFileSync(path.join(root,'lib/source-code-guide.ts'),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
 fs.writeFileSync(path.join(out,'glossary.json'),JSON.stringify(get('learning/resources.ts','glossary')));
 for(const lang of langs) for(const m of all[lang]) for(const l of m.lessons) if(containsEmbeddedSecret(JSON.stringify(l))) throw new Error('Sensitive pattern in '+l.id);
 report.byModule=all.ar.map(m=>({id:m.id,lessons:m.lessons.length,quizzes:m.lessons.reduce((n,l)=>n+l.quiz.length,0)}));
 report.modules=all.ar.length;report.lessons=index.reduce((n,m)=>n+m.lessons.length,0);report.quizzes=report.byModule.reduce((n,m)=>n+m.quizzes,0);report.projectFiles=project.length;report.omittedBySourceScanner=source.omitted;
 fs.writeFileSync(path.join(root,'lecomax-learning-app/docs/migration-report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({modules:report.modules,lessons:report.lessons,quizzes:report.quizzes,files:project.length}));
})();
