const test=require('node:test'),assert=require('node:assert/strict');
const {localPostgresProfile}=require('../scripts/seo-local-postgres-profile.cjs');
test('PG17 rehearsal selects only a fixed local binary, loopback port and matching server major',()=>{
  const p=localPostgresProfile(['--pg17']);
  assert.equal(p.bin,'C:/Program Files/PostgreSQL/17/bin');
  assert.equal(p.host,'127.0.0.1');assert.equal(p.port,55460);
  assert.match('17.11',p.versionPattern);assert.doesNotMatch('18.6',p.versionPattern);
  const previous=localPostgresProfile([]);
  assert.equal(previous.port,55459);assert.match('18.6',previous.versionPattern);
  assert.doesNotMatch('18.60',previous.versionPattern);
});
test('local compatibility profiles reject remote targets and arbitrary executable overrides',()=>{
  for(const args of [['--host=example.com'],['--pg17','--host=127.0.0.1'],['--bin=C:/custom'],['postgres://localhost/db'],['--pg18'],['--pg17','--pg17']])
    assert.throws(()=>localPostgresProfile(args),/NO_TARGET_OVERRIDES/);
});
test('portable PG17/PostgREST profile stays pinned inside the workspace',()=>{
  const p=localPostgresProfile(['--pg17-rest']);
  assert.equal(p.bin,require('node:path').resolve(__dirname,'../artifacts/seo-local-tools/pgsql/bin'));
  assert.equal(p.host,'127.0.0.1');assert.equal(p.port,55460);assert.equal(p.postgrest,true);
  assert.match('17.11',p.versionPattern);assert.doesNotMatch('17.110',p.versionPattern);
  assert.throws(()=>localPostgresProfile(['--pg17-rest','postgres://host/database']),/NO_TARGET_OVERRIDES/);
});
