const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { load } = require('../scripts/inspect.cjs');
const engine = load('lecomax-learning-app/services/assessment.ts');
const { valuesMission: mission } = load('lecomax-learning-app/data/missions/values.ts');
const { initial, readProgress } = load('lecomax-learning-app/utils/progress.ts');
const { getLesson } = load('lecomax-learning-app/services/content.ts');
const plain = v => JSON.parse(JSON.stringify(v));
const correct = { binding: [1], 'text-plus': '3492', subtotal: '2500', discount: '250', 'new-cart': '1350', 'half-cent': '0', blank: [1], pipeline: [1,3,4,0,2], 'valid-inputs': [0,2], fixed: [1], 'final-total': '7200', 'final-output': '12.501', 'final-limits': [0,1], 'final-copy': 'sale' };

test('authored mission validates, references real lessons and has complete translated assessment content', () => {
  engine.validateMission(mission);
  assert.equal(mission.activities.length, 6);
  assert.equal(mission.activities.flatMap(a => a.questions).length, 14);
  for (const lang of ['ar','en','fr']) assert.ok(getLesson(mission.lessonId, lang));
  for (const a of mission.activities) {
    assert.ok(engine.grade(a, correct).passed, a.id);
    for (const q of a.questions) assert.ok(correct[q.id] !== undefined);
  }
  const broken = plain(mission); broken.activities[0].questions[0].correct = 99;
  assert.throws(() => engine.validateMission(broken), /choice/);
  const duplicate = plain(mission); duplicate.activities[1].questions[0].id = 'binding';
  assert.throws(() => engine.validateMission(duplicate), /Duplicate/);
});

test('selection scoring rejects duplicates, extra choices and partial ordering', () => {
  const multiple = mission.activities[4].questions[0];
  assert.equal(engine.answerCorrect(multiple, [2,0]), true);
  for (const response of [[0], [0,2,3], [0,0,2], [-1], [1.5], ['0','2'], '0,2']) assert.equal(engine.answerCorrect(multiple, response), false);
  const order = mission.activities[3].questions[1];
  assert.equal(engine.answerCorrect(order, [1,3,4,0,2]), true);
  for (const response of [[1,3,4,0], [1,3,4,2,0], [1,3,4,0,2,2]]) assert.equal(engine.answerCorrect(order, response), false);
});

test('numeric validation accepts equivalent decimal answers but rejects coercion shortcuts', () => {
  const q = mission.activities[1].questions[0];
  for (const response of ['2500', ' 2500 ', '2500.0', '+2500']) assert.equal(engine.answerCorrect(q, response), true);
  for (const response of ['', ' ', '2500junk', '2.5e3', '0x9c4', 'Infinity', 'NaN', [], 2500]) assert.equal(engine.answerCorrect(q, response), false);
  assert.equal(engine.answerCorrect(mission.activities[2].questions[1], ''), false);
});

test('thresholds use exact fractions and critical requirements cannot be averaged away', () => {
  const base = mission.activities[0].questions[0];
  const assessment = { id:'exam',title:['a','b','c'],threshold:85,questions:Array.from({length:7},(_,i)=>({...base,id:'q'+i,critical:i===0})) };
  const responses = Object.fromEntries(assessment.questions.map(q => [q.id,[1]]));
  delete responses.q6;
  assert.equal(engine.grade(assessment,responses).passed,true); // 6/7 > 85%.
  assessment.threshold=86;
  assert.equal(engine.grade(assessment,responses).passed,false); // Rounded display would say 86%.
  assessment.threshold=80;
  responses.q6=[1]; delete responses.q0;
  assert.equal(engine.grade(assessment,responses).passed,false);
  assert.equal(engine.grade({...assessment,questions:[]},{}).passed,false);
});

test('blank submission and navigation cannot complete or unlock a mission', () => {
  const state=engine.newMission(mission,'2026-10-08');
  assert.equal(engine.missionStatus(mission,{...state,active:5}).complete,false);
  assert.throws(()=>engine.submitActivity(mission,state,5),/prerequisite/);
  const submitted=engine.submitActivity(mission,state,0);
  assert.equal(engine.missionStatus(mission,submitted).done,0);
  assert.equal(submitted.attempts.understand,1);
  assert.throws(()=>engine.submitActivity(mission,submitted,1),/prerequisite/);
});

test('retries persist answers, explicit submissions and date across a new day without modifying old progress', () => {
  let state=engine.newMission(mission,'2026-10-08');
  state=engine.submitActivity(mission,{...state,responses:{binding:[0],'text-plus':'3492'}},0);
  state={...state,responses:{...correct},goal:20};
  for(let i=0;i<6;i++) state=engine.submitActivity(mission,{...state,active:i},i);
  assert.equal(engine.missionStatus(mission,state).complete,true);
  assert.equal(state.attempts.understand,2);
  const old={...initial,completed:['existing'],drafts:{old:'retain',[engine.missionKey(mission)]:JSON.stringify(state)}};
  const restored=readProgress(JSON.stringify(old));
  const resumed=engine.readMission(mission,restored.drafts[engine.missionKey(mission)],'2026-10-09');
  assert.deepEqual(plain(resumed),plain(state));
  assert.deepEqual(plain(restored.completed),['existing']);
  assert.equal(restored.drafts.old,'retain');
  // Status is recomputed: a forged score field cannot turn a wrong answer into a pass.
  resumed.submissions.final['final-total']='1'; resumed.passed=true;
  assert.equal(engine.missionStatus(mission,resumed).complete,false);
});

test('malformed or incompatible saved missions fail without replacing data', () => {
  const state=engine.newMission(mission,'2026-10-08');
  for(const raw of ['{','null',JSON.stringify({...state,contentVersion:99}),JSON.stringify({...state,active:-1}),JSON.stringify({...state,goal:1}),JSON.stringify({...state,responses:{binding:[999]}}),JSON.stringify({...state,submissions:{unknown:{}}}),JSON.stringify({...state,attempts:{understand:-1}})]) {
    assert.throws(()=>engine.readMission(mission,raw,'2026-10-09'));
  }
});

test('authored JavaScript predictions and cart arithmetic agree with execution', () => {
  const output=[];
  const context=vm.createContext({console:{log:v=>output.push(String(v))}});
  vm.runInContext("console.log('349' + 2); console.log((12.5).toFixed(2) + 1); const item={details:{tag:'new'}}; const copy={...item}; copy.details.tag='sale'; console.log(item.details.tag);",context,{timeout:1000});
  assert.deepEqual(output,['3492','12.501','sale']);
  assert.equal(3*500-Math.round(3*500*1000/10000),1350);
  assert.equal(1-Math.round(1*5000/10000),0);
  assert.equal(4*2000-Math.round(4*2000*1000/10000),7200);
});
