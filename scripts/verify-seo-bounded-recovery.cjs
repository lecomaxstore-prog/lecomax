// Local-only failure-path rehearsal. No .env loading or remote target option.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { Client } = require('pg');
const root = 'C:/Users/Ziko/Backups/LECOMAX/restore-test-20261018';
const database = 'lecomax_restore_test_20261018';
const file = 'supabase/rollback/20261018_seo_engine_disable_bounded.sql';
const output = `artifacts/seo-migration/bounded-recovery-failure-path-${Date.now()}.json`;
async function connect() {
  const client = new Client({ host: 'localhost', port: 55439, database, user: 'postgres',
    password: fs.readFileSync(path.join(root, 'password.txt'), 'utf8').trim(),
    ssl: { rejectUnauthorized: true, ca: fs.readFileSync(path.join(root, 'localhost.crt'), 'utf8') },
    connectionTimeoutMillis: 10000, query_timeout: 15000 });
  await client.connect();
  try {
    const r = (await client.query("select current_database() db, host(inet_server_addr()) host, current_setting('data_directory') dir")).rows[0];
    assert.equal(r.db, database);
    assert.equal(r.host, '127.0.0.1');
    assert.equal(path.resolve(r.dir).toLowerCase(), path.resolve(root, 'data').toLowerCase());
    return client;
  } catch (e) { await client.end(); throw e; }
}
async function state(c) {
  return (await c.query("select tgname,tgenabled,has_function_privilege('service_role','public.save_seo_document(text,text,integer,text,jsonb,text,text,text)','EXECUTE') rpc from pg_trigger where tgname in ('products_seo_sync','categories_seo_sync') order by tgname")).rows;
}
(async () => {
  const sql = fs.readFileSync(file, 'utf8');
  assert.match(sql, /set local lock_timeout = '5s';/);
  assert.match(sql, /set local statement_timeout = '60s';/);
  const c = await connect(); let blocker;
  try {
    blocker = await connect();
    const before = await state(c);
    assert.equal(before.length, 2);
    assert.ok(before.every(r => r.tgenabled === 'O' && r.rpc));
    await blocker.query('begin');
    // Block the SECOND ALTER: the first disable must roll back after timeout.
    await blocker.query('lock table public.categories in row exclusive mode');
    const start = Date.now();
    let errorCode;
    try { await c.query(sql); } catch (e) { errorCode = e.code; }
    const elapsedMs = Date.now() - start;
    assert.equal(errorCode, '55P03');
    assert.ok(elapsedMs >= 4500 && elapsedMs < 14000);
    await c.query('rollback');
    await blocker.query('rollback');
    assert.deepEqual(await state(c), before);
    const report = { at: new Date().toISOString(), localOnly: true, file,
      sha256: crypto.createHash('sha256').update(sql).digest('hex'),
      secondTableLockTimeout: { passed: true, errorCode, elapsedMs },
      partialDisableRolledBack: true, originalTriggerAndRpcStatePreserved: true,
      limitations: ['PostgreSQL 18 localhost only; hosted PostgreSQL 17.6 untested.',
        '60-second statement timeout inspected; not an overall transaction deadline.',
        'Prior successful disable/revoke rehearsal retained, not repeated.'] };
    fs.writeFileSync(output, JSON.stringify(report, null, 2), { flag: 'wx' });
    console.log(JSON.stringify({ output, ...report }));
  } finally {
    await c.query('rollback').catch(() => {}); await c.end();
    if (blocker) { await blocker.query('rollback').catch(() => {}); await blocker.end(); }
  }
})().catch(e => { console.error('Local recovery validation failed:', e.code || e.name); process.exitCode = 1; });
