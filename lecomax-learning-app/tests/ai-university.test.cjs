const {test}=require('node:test');
const assert=require('node:assert/strict');
const {load}=require('../scripts/inspect.cjs');
const base='lecomax-learning-app/features/ai-university/';
const {lessons,paths}=load(base+'curriculum.ts');
const engine=load(base+'engine.ts');
const qa=load(base+'project-contract.ts');
const retrieval=load(base+'retrieval.ts');
test('21 lessons have valid prerequisites, references, quizzes and passing exercise solutions',()=>{
 const {references}=load(base+'references.ts');
 assert.equal(paths.length,7);assert.equal(lessons.length,21);
 assert.equal(new Set(lessons.map(l=>l.id)).size,21);
 for(const l of lessons){
  assert.equal(lessons.filter(x=>x.path===l.path).length,3);
  for(const id of l.prerequisites)assert(lessons.some(x=>x.id===id&&x.id!==l.id));
  for(const id of l.references)assert(references[id]?.url.startsWith('https://'));
  assert.equal(l.quiz.length,2);
  for(const q of l.quiz){assert(q.choices[q.answer]);assert.equal(q.feedback.length,q.choices.length);}
  assert(engine.checkExercise(l.exercise,l.exercise.solution).passed,l.id);
  assert(!engine.checkExercise(l.exercise,'').passed,l.id);
 }
});
test('placement and repeated quizzes never grant delayed recall; progress survives serialization',()=>{
 const l=lessons[0],now=1000;let s=engine.freshUniversity();
 s=engine.recordAnswer(s,l.id,0,l.quiz[0].answer,'placement',now);
 assert.equal(engine.status(s,l),'new');
 s=engine.recordPractice(s,l,l.exercise.solution,now);
 for(let n=0;n<3;n++)for(let i=0;i<l.quiz.length;i++)s=engine.recordAnswer(s,l.id,i,l.quiz[i].answer,'quiz',now);
 assert.equal(engine.status(s,l),'practiced');
 assert.throws(()=>engine.recordAnswer(s,l.id,0,l.quiz[0].answer,'review',now),/REVIEW_NOT_DUE/);
 assert.equal(engine.recommendations(s,now).due.length,0);
 for(let i=0;i<l.quiz.length;i++)s=engine.recordAnswer(s,l.id,i,l.quiz[i].answer,'review',now+86400000);
 assert.equal(engine.status(engine.readUniversity(JSON.stringify(s)),l),'retained');
 s=engine.recordAnswer(s,l.id,0,(l.quiz[0].answer+1)%l.quiz[0].choices.length,'review',s.reviews[l.id+':0'].dueAt);
 assert.equal(engine.status(s,l),'practiced');assert.equal(s.reviews[l.id+':0'].box,0);
});
test('portfolio checks cannot be forged and invalid stored state is rejected',()=>{
 const l=lessons[0];let s=engine.saveProject(engine.freshUniversity(),{id:'p',lessonId:l.id,title:'Test',artifact:'wrong',updatedAt:1,checked:true});
 assert.equal(s.projects[0].checked,false);
 s=engine.saveProject(s,{...s.projects[0],artifact:l.exercise.solution});assert.equal(s.projects[0].checked,true);
 const rag=lessons.find(l=>l.id==='rag-search');
 s=engine.saveProject(s,{...s.projects[0],id:'document-qa',lessonId:rag.id,artifact:rag.exercise.solution});
 assert.equal(s.projects[1].checked,false);
 assert.throws(()=>engine.readUniversity('{broken'));
 assert.throws(()=>engine.saveProject(s,{...s.projects[0],lessonId:'missing'}),/INVALID_PROJECT/);
});
test('Q&A validates consent, limits, edited drafts and citations',()=>{
 const input={question:'Returns?',document:'Returns take 14 days.',consent:true};
 assert(qa.validateQA(input));assert.equal(qa.validateQA({...input,consent:false}),null);
 assert.equal(qa.validateQA({...input,document:'a'.repeat(12001)}),null);
 for(const artifact of ['null','{','{"question":42,"document":[]}','{"question":"","document":"x"}'])assert.equal(qa.readQADraft(artifact),null);
 assert.equal(qa.readQADraft(JSON.stringify(input)).question,'Returns?');
 assert.throws(()=>qa.parseGroundedAnswer('{"answer":"made up","sourceIds":["unknown"]}',['source-1']),/UNSUPPORTED_ANSWER/);
 assert.equal(qa.parseGroundedAnswer('{"answer":"14 days","sourceIds":["source-1"]}',['source-1']).answer,'14 days');
});
test('retrieval produces actual bounded passages and no evidence for unmatched questions',()=>{
 const docs=retrieval.chunkDocument('Returns accepted within 14 days.');
 assert.equal(retrieval.retrieve('Returns',docs)[0].id,'source-1');
 assert.equal(retrieval.retrieve('volcano',docs).length,0);
 assert.throws(()=>retrieval.chunkDocument('x'.repeat(12001)),/DOCUMENT_LIMIT/);
 assert.equal(retrieval.cosine([1,0],[0,1]),0);
 assert.equal(engine.calculate('12 / 0'),null);assert.equal(engine.calculate('6 * 7'),42);
});
