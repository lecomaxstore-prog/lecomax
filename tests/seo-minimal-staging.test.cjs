const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {prepare} = require('../scripts/prepare-seo-minimal-staging.cjs');
const root = path.resolve(__dirname,'..');
test('pinned plan excludes production rows and preserves all five ordered migrations',()=>{
  const plan=prepare();
  assert.deepEqual(plan.externalPublicTables,['categories','products']);
  assert.equal(plan.migrations.length,5);
  assert.equal(plan.createsSeoTables.length,11);
  assert.equal(plan.restoreManifest.productionRows,0);
  assert.deepEqual(plan.restoreManifest.archiveEntries,[]);
  assert.equal(plan.applied,false);
  assert.equal(plan.executable,false);
  assert.notEqual(plan.productionRef,plan.stagingRef);
  for(const schema of ['auth.*','vault.*','cron.*','net.*']) assert.ok(plan.restoreManifest.excludes.includes(schema));
});
test('any migration drift requires renewed review rather than silently regenerating trust',()=>{
  for(let changed=0;changed<5;changed++){
    let index=0;
    assert.throws(()=>prepare(file=>fs.readFileSync(path.join(root,file),'utf8')+(index++===changed?'\n-- drift':'')),/MIGRATION_DRIFT/);
  }
});
test('execution and target overrides fail closed',()=>{
  for(const arg of ['--execute','--apply','--target=production']){
    const result=spawnSync(process.execPath,[path.join(root,'scripts/prepare-seo-minimal-staging.cjs'),arg],{encoding:'utf8',windowsHide:true});
    assert.equal(result.status,1);
    assert.match(result.stderr,/NO_EXECUTION_OR_TARGET_ARGUMENTS_SUPPORTED/);
  }
});
