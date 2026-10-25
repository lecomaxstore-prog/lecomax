const {test}=require('node:test');
const assert=require('node:assert/strict');
const plan=require('../operations/seo/staging-isolated-plan.json');
test('isolated staging proposal remains inert and contains no copied credentials or production rows',()=>{
  assert.equal(plan.projectRef,'tyltharlnbxrxibuxyye');
  assert.notEqual(plan.projectRef,plan.productionRef);
  for(const key of ['executionAllowed','workerEnabled','aiEnabled','editorialEnabled','schedulerEnabled','cliLinked']) assert.equal(plan[key],false,key);
  assert.equal(plan.initialBudgetUsd,0);assert.equal(plan.productionRows,0);
  assert.deepEqual(plan.credentials,[]);assert.deepEqual(plan.schedules,[]);
  assert.equal(plan.requiredEvidence.length,6);
});
