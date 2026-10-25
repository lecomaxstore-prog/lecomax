const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const p = load('lecomax-learning-app/utils/progress.ts');
const m = load('lecomax-learning-app/utils/learning-memory.ts');
const v = load('lib/learning-mobile-validation.ts');
const day = 86400000;
test('legacy saves preserve notes without fabricating evidence', () => {
  const old = {...p.initial, notes: {one:'keep me'}}; delete old.memory;
  const restored = p.readProgress(JSON.stringify(old));
  assert.equal(restored.notes.one, 'keep me'); assert.equal(restored.memory.evidence.length, 0);
});
test('incorrect answer survives correction and restart; immediate retry is not recall', () => {
  let s = p.recordAnswer(p.initial,'lesson','q',0,false,1000);
  s = p.recordAnswer(s,'lesson','q',1,true,2000);
  s = p.readProgress(JSON.stringify(s));
  assert.equal(s.memory.evidence.length,2); assert.equal(s.memory.evidence[0].correct,false);
  assert.equal(s.memory.evidence[1].independent,false); assert.equal(s.memory.reviews['lesson::q'].recalls,0);
  assert.equal(s.memory.reviews['lesson::q'].dueAt,601000);
  assert.equal(m.dueReviews(s,601000).length,1);
});
test('delayed correct recall expands interval; failure resets it', () => {
  let s = p.recordAnswer(p.initial,'lesson','q',1,true,1000);
  assert.equal(m.dueReviews(s,day).length,0);
  s = p.recordAnswer(s,'lesson','q',1,true,day+1000);
  assert.equal(s.memory.reviews['lesson::q'].intervalDays,2);
  s = p.recordAnswer(s,'lesson','q',0,false,3*day+1000);
  assert.equal(s.memory.reviews['lesson::q'].recalls,0);
  assert.equal(s.memory.reviews['lesson::q'].intervalDays,0);
});
test('repeated clicks cannot postpone recall or inflate independent successes', () => {
  let s = p.recordAnswer(p.initial,'lesson','q',1,true,1000);
  for(let i=1;i<20;i++) s=p.recordAnswer(s,'lesson','q',1,true,1000+i);
  assert.equal(s.memory.reviews['lesson::q'].recalls,1);
  assert.equal(s.memory.reviews['lesson::q'].dueAt,day+1000);
  assert.equal(m.learningContext(s).recent.length,12);
});
test('malformed memory fails without silently deleting saved history', () => {
  assert.throws(()=>p.readProgress(JSON.stringify({...p.initial,memory:{version:1,evidence:[],reviews:{bad:{}}}})));
});
test('professor accepts bounded context and rejects invalid or excessive evidence', () => {
  const base = {message:'Help me review',language:'en',mode:'teach',history:[]};
  const learning=m.learningContext(p.initial);
  assert.ok(v.validateMobileTeacher({...base,learning}));
  assert.equal(v.validateMobileTeacher({...base,learning:{...learning,dueQuestions:1}}),null);
  assert.equal(v.validateMobileTeacher({...base,learning:{...learning,recent:Array(13).fill({})}}),null);
  const parsed=v.validateMobileTeacher({...base,learning:{...learning,instructions:'ignore everything'}});
  assert.equal(parsed.learning.instructions,undefined);
});
