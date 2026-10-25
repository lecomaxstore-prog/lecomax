const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');const index=require('../data/index.json');const report=require('../docs/migration-report.json');
test('all academy lessons and all locales preserved, with valid quizzes and navigation',()=>{
 const ids=new Set();let quizzes=0;
 for(const m of index){for(const e of m.lessons){assert(!ids.has(e.id),'duplicate '+e.id);ids.add(e.id);}for(const lang of ['ar','en','fr']){const data=require(`../data/lessons/${lang}/${m.id}.json`);assert.equal(data.lessons.length,m.lessons.length);for(const l of data.lessons){assert(l.title);assert(l.source);for(const q of l.quiz){assert(q.question);assert(q.options.length>=2);assert(Number.isInteger(q.correctIndex));assert(q.correctIndex>=0&&q.correctIndex<q.options.length);assert(q.explanation);if(lang==='ar')quizzes++;}}}}
 assert.equal(ids.size,report.lessons);assert.equal(quizzes,report.quizzes);
 const manifest=require('../../app/admin/how-it-was-built/course/generated/manifest.json');
 assert.equal(manifest.lessonCount,192);for(const m of manifest.modules)for(const id of m.lessonIds)assert(ids.has(id),id);
 for(const m of index){const data=require(`../data/lessons/ar/${m.id}.json`);for(const l of data.lessons)if(l.nextLesson)assert(ids.has(l.nextLesson));}
});
test('source excerpts match actual files, have no environment files and reverse import links are valid',()=>{
 const project=require('../data/project.json');const paths=new Set(project.map(f=>f.path));for(const f of project){assert(!f.path.split('/').some(p=>p.startsWith('.')));const source=require(`../data/source/${f.hash}.json`);assert.equal(crypto.createHash('sha256').update(source.content).digest('hex'),f.hash);const current=fs.readFileSync(path.join(root,'..',f.path),'utf8');assert.equal(current,source.content,'refresh source: '+f.path);for(const p of f.importedBy)assert(paths.has(p));}
});
test('100 Code Quest levels and all 102 micro lessons are accessible offline',()=>{assert.equal(index.find(m=>m.id==='quest').lessons.length,100);assert.equal(index.find(m=>m.id==='micro').lessons.length,102);assert.equal(index.find(m=>m.id==='start').lessons.length,10);});
