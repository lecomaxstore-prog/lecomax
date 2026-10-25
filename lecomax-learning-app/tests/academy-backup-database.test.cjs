const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');

test('actual Academy migration denies public API roles and isolates revision writes by owner', async () => {
  const db = new PGlite();
  try {
    await db.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
    await db.exec(fs.readFileSync(require.resolve('../../supabase/migrations/202610150001_academy_progress.sql'), 'utf8'));
    await db.query("INSERT INTO learning_private.academy_progress(owner_id, revision, snapshot) VALUES ('alice', nextval('learning_private.academy_revision'), $1), ('bob', nextval('learning_private.academy_revision'), $2)", ['{"notes":"alice-private"}', '{"notes":"bob-private"}']);
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`SET ROLE ${role}`);
      await assert.rejects(db.query('SELECT * FROM learning_private.academy_progress'), /permission denied/);
      await assert.rejects(db.query("SELECT nextval('learning_private.academy_revision')"), /permission denied/);
      await db.exec('RESET ROLE');
    }
    const before = await db.query("SELECT revision FROM learning_private.academy_progress WHERE owner_id = $1", ['alice']);
    const revision = before.rows[0].revision;
    const update = "UPDATE learning_private.academy_progress SET snapshot = $2::jsonb, revision = nextval('learning_private.academy_revision') WHERE owner_id = $1 AND revision = $3 RETURNING revision";
    assert.equal((await db.query(update, ['bob', '{}', revision])).rows.length, 0, 'Alice revision cannot update Bob');
    assert.equal((await db.query(update, ['alice', '{"notes":"new"}', revision])).rows.length, 1);
    assert.equal((await db.query(update, ['alice', '{}', revision])).rows.length, 0, 'stale write rejected');
    assert.equal((await db.query("SELECT snapshot FROM learning_private.academy_progress WHERE owner_id='bob'")).rows[0].snapshot.notes, 'bob-private');
  } finally { await db.close(); }
});
