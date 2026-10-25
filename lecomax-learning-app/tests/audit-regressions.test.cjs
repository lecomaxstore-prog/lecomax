const {test}=require('node:test');const assert=require('node:assert/strict');const {load}=require('../scripts/inspect.cjs');
const progress=load('lecomax-learning-app/utils/progress.ts');
const {highlight}=load('lecomax-learning-app/utils/highlight.ts');
test('code highlighting preserves exact code including escaped strings and multiline comments',()=>{
 const source='const text = "escaped \\" value";\n/* comment\n continued */\nSELECT price FROM products WHERE price > 12;';
 const output=highlight(source);assert.equal(output.map(line=>line.map(t=>t.text).join('')).join('\n'),source);assert.equal(output[2][0].color,'#9DB5A9');
});
test('legacy backups upgrade teacher storage and malformed collections are rejected',()=>{
 const legacy={...progress.initial};delete legacy.teacher;
 assert.equal(progress.readProgress(JSON.stringify(legacy)).teacher.history.length,0);
 for(const changes of [{notes:[]},{days:'today'},{answers:[]},{teacher:{draft:'',history:[{role:'system',content:'no'}]}},{answers:{x:{lessonId:'a',questionId:'b',choice:-1,attempts:0,correct:true}}}])assert.throws(()=>progress.readProgress(JSON.stringify({...progress.initial,...changes})));
});
test('restored daily and studio readings contain code and starter exercises have answer feedback',()=>{
 for(const lang of ['ar','en','fr']){
  const daily=require(`../data/lessons/${lang}/daily.json`).lessons;
  assert(daily.filter(l=>l.codeExample.length).length>=12);
  assert(require(`../data/lessons/${lang}/studio.json`).lessons.every(l=>l.codeExample.length));
  assert(require(`../data/lessons/${lang}/start.json`).lessons.every(l=>l.quiz[0].answerExplanations.length===l.quiz[0].options.length));
  assert.equal(require(`../data/lessons/${lang}/site-elements.json`).lessons.length,7);
  assert.equal(require(`../data/lessons/${lang}/glossary.json`).lessons.length,26);
 }
});
