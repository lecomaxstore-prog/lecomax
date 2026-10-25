const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {inspect}=require('../scripts/check-seo-cli-target.cjs');
function fixture(t){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'seo-cli-guard-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'supabase/.temp'),{recursive:true});
  return root;
}
test('missing, empty, malformed and oversized references never pass',t=>{
  const root=fixture(t),file=path.join(root,'supabase/.temp/project-ref');
  assert.equal(inspect(root).status,'unlinked');
  for(const value of ['', 'production', 'x'.repeat(129)]){
    fs.writeFileSync(file,value);
    assert.equal(inspect(root).status,'blocked-invalid-ref-file');
  }
});
test('production denied; exact staging is only a link observation',t=>{
  const root=fixture(t),file=path.join(root,'supabase/.temp/project-ref');
  fs.writeFileSync(file,'yddqwgdgeljkzfsmtein');
  assert.equal(inspect(root).status,'blocked-wrong-or-invalid-link');
  fs.writeFileSync(file,'tyltharlnbxrxibuxyye\n');
  assert.equal(inspect(root).status,'staging-link-only-not-authorization');
  assert.equal(inspect(root).networkCalls,0);
});
test('directory in place of reference is rejected',t=>{
  const root=fixture(t);
  fs.mkdirSync(path.join(root,'supabase/.temp/project-ref'));
  assert.equal(inspect(root).status,'blocked-invalid-ref-file');
});
test('junction to another project is not followed',t=>{
  const root=fixture(t),other=fixture(t);
  fs.writeFileSync(path.join(other,'supabase/.temp/project-ref'),'tyltharlnbxrxibuxyye');
  fs.rmdirSync(path.join(root,'supabase/.temp'));
  fs.symlinkSync(path.join(other,'supabase/.temp'),path.join(root,'supabase/.temp'),'junction');
  assert.equal(inspect(root).status,'blocked-filesystem-link');
});
test('execution and target arguments are refused before inspection',()=>{
  for(const arg of ['--execute','--apply','--target=tyltharlnbxrxibuxyye']){
    const r=spawnSync(process.execPath,[path.resolve(__dirname,'../scripts/check-seo-cli-target.cjs'),arg],{encoding:'utf8',windowsHide:true});
    assert.equal(r.status,1);assert.match(r.stderr,/NO_EXECUTION_OR_TARGET_ARGUMENTS_SUPPORTED/);assert.equal(r.stdout,'');
  }
});
