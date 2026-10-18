import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authoredLesson, authoredSearch } from './course-authored.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const courseRoot = path.join(root, 'app/admin/how-it-was-built/course');
const mobileRoot = path.join(root, 'lecomax-learning-app/data');
const read = async p => JSON.parse(await readFile(p, 'utf8'));
const write = (p, value, pretty = false) => writeFile(p, JSON.stringify(value, null, pretty ? 2 : undefined) + (pretty ? '\n' : ''));
const manifest = await read(path.join(courseRoot, 'generated/manifest.json'));
const mobileIndex = await read(path.join(mobileRoot, 'index.json'));
let changed = 0;
for (const lang of ['ar', 'en', 'fr']) {
  const authoredDir = path.join(courseRoot, 'authored', lang);
  const names = await readdir(authoredDir).catch(error => { if(error.code === 'ENOENT') return []; throw error; });
  const ids = new Set(names.filter(n => n.endsWith('.json')).map(n => n.slice(0, -5)));
  const indexPath = path.join(courseRoot, 'content/index', lang + '.json');
  const webIndex = await read(indexPath);
  for (const descriptor of manifest.modules) {
    if (!descriptor.lessonIds.some(id => ids.has(id))) continue;
    const webPath = path.join(courseRoot, 'content', lang, descriptor.id + '.json');
    const mobilePath = path.join(mobileRoot, 'lessons', lang, descriptor.id + '.json');
    const module = await read(webPath);
    const mobile = await read(mobilePath);
    for (let i = 0; i < module.lessons.length; i++) {
      const old = module.lessons[i];
      if (!ids.has(old.id)) continue;
      const l = await authoredLesson(courseRoot, lang, old);
      module.lessons[i] = l;
      const blocks = l.sections.flatMap(s => s.blocks);
      const paragraphs = blocks.filter(b => b.type === 'paragraph').map(b => b.text);
      const explanation = l.sections.flatMap(s => s.blocks.filter(b => b.type !== 'code').flatMap(b => b.type === 'vocabulary' ? b.items.map(v => ({title:v.term, text:v.definition})) : [{title:b.title || s.title, text:b.text || b.items?.join('\n') || ''}]));
      explanation.push({title:{ar:'النتيجة المتوقعة',en:'Expected result',fr:'Résultat attendu'}[lang],text:l.expectedResult});
      const codeExample = blocks.filter(b => b.type === 'code').map(b => ({title:b.title,code:b.code.source,filename:b.code.filename,annotations:b.code.annotations}));
      if(l.commands.length) codeExample.push({title:'Terminal',code:l.commands.join('\n'),filename:'Terminal'});
      const position = mobile.lessons.findIndex(x => x.id === l.id);
      if(position < 0) throw new Error('Missing mobile chapter ' + l.id);
      const previous = mobile.lessons[position];
      const exercise = {task:[l.exercise.task,...l.exercise.steps].join('\n'),hints:l.exercise.hints,solution:l.exercise.solution.explanation+'\n'+l.exercise.solution.code};
      const whatIf = l.commonErrors.map(e => [e.symptom,e.cause,e.fix].join('\n')).join('\n\n');
      const concept = paragraphs[0] || l.objectives.join('\n');
      const why = paragraphs[1] || l.objectives.join('\n');
      const revised = {...previous,title:l.title,websiteLesson:l,estimatedMinutes:l.estimatedMinutes,concept,why,explanation,codeExample,exercise,quiz:l.quiz,summary:l.recap,whatIf,teaching:{what:concept,why,where:[blocks.find(b=>b.id==='lecomax')?.text,...previous.relatedFiles].filter(Boolean).join('\n'),how:[...paragraphs.slice(2),...codeExample.flatMap(b=>(b.annotations||[]).map(a=>a.label))].join('\n'),breaks:whatIf,modify:exercise.task}};
      mobile.lessons[position] = revised;
      const indexModule = webIndex.modules.find(m => m.id === module.id);
      indexModule.lessonTitles[i] = l.title;
      indexModule.lessonSearchText[i] = authoredSearch(module,l,lang);
      const indexLesson = mobileIndex.find(m=>m.id===module.id).lessons.find(x=>x.id===l.id);
      indexLesson.title[lang] = l.title;
      indexLesson.minutes = l.estimatedMinutes;
      indexLesson.search[lang] = [...new Set(JSON.stringify(revised).toLowerCase().split(/[\s"{},:;\\]+/).filter(t=>t.length>2))].join(' ');
      ids.delete(l.id);
      changed++;
    }
    await write(webPath,module,true);
    await write(mobilePath,mobile);
  }
  if(ids.size) throw new Error('Unmapped authored lessons: '+[...ids].join(', '));
  await write(indexPath,webIndex,true);
}
await write(path.join(mobileRoot,'index.json'),mobileIndex);
console.log('Applied '+changed+' authored lesson locales to web, mobile and search indexes.');
