// Called only by the fresh-cluster rehearsal. No dotenv, hosted DSNs or target overrides.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const crypto = require('node:crypto'), assert = require('node:assert/strict'), net = require('node:net');
const { Client } = require('pg');
const restPort = 55461;
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const executable = workspace => path.join(workspace, 'artifacts/seo-local-tools/postgrest/postgrest.exe');
// The official Windows PostgREST binary needs libpq and its DLL dependencies.
const restEnvironment = (workspace, env) => ({
  ...Object.fromEntries(Object.entries(env).filter(([key]) => key.toUpperCase() !== 'PATH')),
  PATH: path.join(workspace, 'artifacts/seo-local-tools/pgsql/bin') + ';' +
    (Object.entries(env).find(([key]) => key.toUpperCase() === 'PATH')?.[1] ?? ''),
});

function preflight(workspace, env) {
  const archive = path.join(workspace, 'artifacts/seo-local-tools/postgrest-16.5.zip');
  assert.equal(sha(fs.readFileSync(archive)), '17f595b0d8dd37473d0231417dea07c5ac9f791282ff5b017fae51ff29e5de2f', 'POSTGREST_ARCHIVE_INTEGRITY');
  const version = cp.execFileSync(executable(workspace), ['--version'], { env: restEnvironment(workspace, env), windowsHide: true, encoding: 'utf8', timeout: 5000 }).trim();
  assert.match(version, /^PostgREST 16\.5(?:\D|$)/);
  return version;
}

async function runChecks({ workspace, root, data, bin, env, host, port, password, client, check, report }) {
  // Independently verify the live connection before provisioning any local test role.
  assert.equal(host, '127.0.0.1'); assert.equal(port, 55460);
  assert.equal(fs.realpathSync(root), path.resolve(root));
  assert.ok(path.resolve(root).startsWith(path.join(workspace, 'artifacts/seo-editorial-native-')));
  const identity = (await client.query("select current_setting('data_directory') dir,host(inet_server_addr()) host,inet_server_port() port,current_setting('server_version') version")).rows[0];
  assert.equal(path.resolve(identity.dir), path.resolve(data));
  assert.equal(identity.host, host); assert.equal(identity.port, port); assert.match(identity.version, /^17\.11(?:\D|$)/);
  report.postgrestVersion = preflight(workspace, env);

  await check('all 13 current SEO tables have RLS, validated constraints and ready indexes', async () => {
    const tables = (await client.query("select relname,relrowsecurity from pg_class where relnamespace='public'::regnamespace and relkind='r' and relname like 'seo_%' order by relname")).rows;
    assert.equal(tables.length, 13); assert.ok(tables.every(t => t.relrowsecurity));
    assert.equal((await client.query("select count(*)::int n from pg_constraint where connamespace='public'::regnamespace and not convalidated")).rows[0].n, 0);
    assert.equal((await client.query("select count(*)::int n from pg_index i join pg_class c on c.oid=i.indrelid where c.relnamespace='public'::regnamespace and (not indisvalid or not indisready)")).rows[0].n, 0);
    for (const role of ['anon', 'authenticated', 'service_role']) for (const table of tables) {
      const privileges = (await client.query("select has_table_privilege($1,$2,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN') unsafe", [role, table.relname])).rows[0];
      assert.equal(privileges.unsafe, false, `${role}:${table.relname}`);
    }
    const settings = (await client.query('select enabled,mirai_enabled,monthly_limit from seo_ai_settings')).rows[0];
    assert.equal(settings.enabled, false); assert.equal(settings.mirai_enabled, false); assert.equal(Number(settings.monthly_limit), 0);
    report.seoTables = tables.map(t => t.relname);
  });

  await check('replaying all six migrations fails atomically without changing the installed schema', async () => {
    const snapshot = async () => (await client.query(`select
      (select jsonb_agg(row_to_json(c) order by c.oid) from pg_class c where c.relnamespace='public'::regnamespace) relations,
      (select jsonb_agg(row_to_json(c) order by c.oid) from pg_constraint c where c.connamespace='public'::regnamespace) constraints,
      (select jsonb_agg(row_to_json(e) order by e.id) from seo_editorial_events e) events`)).rows[0];
    const before = await snapshot();
    for (const migration of report.migrations) {
      let failed = false;
      try { await client.query(fs.readFileSync(path.join(workspace, migration.file), 'utf8')); }
      catch { failed = true; }
      finally { await client.query('rollback'); }
      assert.ok(failed, 'REPLAY_SHOULD_REFUSE_EXISTING_SCHEMA');
      assert.deepEqual(await snapshot(), before);
    }
  });

  await check('PG17 synthetic dump restores with matching SEO rows and sequence states', async () => {
    const dump = path.join(root, 'synthetic.dump');
    const run = (name, args) => {
      const fd = fs.openSync(path.join(root, name + '-restore-check.log'), 'a');
      try {
        const result = cp.spawnSync(path.join(bin, name + '.exe'), args, {
          env: { ...env, PGPASSWORD: password }, windowsHide: true, timeout: 60000, stdio: ['ignore', fd, fd],
        });
        assert.equal(result.status, 0, `${name}:${result.error?.code ?? result.status}`);
      } finally { fs.closeSync(fd); }
    };
    const connection = ['-h', host, '-p', String(port), '-U', 'postgres'];
    run('pg_dump', [...connection, '-d', 'postgres', '-Fc', '-f', dump]);
    await client.query('create database seo_synthetic_restore');
    run('pg_restore', [...connection, '-d', 'seo_synthetic_restore', '--exit-on-error', '--no-owner', dump]);
    const restored = new Client({ host, port, user: 'postgres', password, database: 'seo_synthetic_restore', connectionTimeoutMillis: 5000, query_timeout: 10000 });
    try {
      await restored.connect();
      const inventory = async db => {
        const tables = (await db.query("select tablename from pg_tables where schemaname='public' order by tablename")).rows;
        const result = [];
        for (const { tablename } of tables) {
          assert.match(tablename, /^[a-z_]+$/);
          const rows = (await db.query(`select row_to_json(t)::text value from public."${tablename}" t order by row_to_json(t)::text`)).rows;
          result.push({ table: tablename, count: rows.length, hash: sha(JSON.stringify(rows)) });
        }
        const sequences = (await db.query("select sequencename,last_value from pg_sequences where schemaname='public' order by sequencename")).rows;
        return { tables: result, sequences };
      };
      assert.deepEqual(await inventory(restored), await inventory(client));
      report.syntheticBackup = { bytes: fs.statSync(dump).size, sha256: sha(fs.readFileSync(dump)), restoreVerified: true };
    } finally { await restored.end(); }
  });

  await new Promise((resolve, reject) => {
    const server = net.createServer(); server.once('error', reject);
    server.listen({ host, port: restPort, exclusive: true }, () => server.close(resolve));
  });
  const loginPassword = crypto.randomBytes(32).toString('hex'), jwtSecret = crypto.randomBytes(48).toString('hex');
  await client.query(`create role seo_rest_login login noinherit password '${loginPassword}'; grant anon,authenticated,service_role to seo_rest_login;`);
  const token = (role, exp = Math.floor(Date.now() / 1000) + 60, secret = jwtSecret) => {
    const body = [Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'), Buffer.from(JSON.stringify({ role, exp })).toString('base64url')].join('.');
    return body + '.' + crypto.createHmac('sha256', secret).update(body).digest('base64url');
  };
  const fd = fs.openSync(path.join(root, 'postgrest.log'), 'wx');
  const processHandle = cp.spawn(executable(workspace), [], { windowsHide: true, stdio: ['ignore', fd, fd], env: {
    ...restEnvironment(workspace, env), PGRST_DB_URI: `postgresql://seo_rest_login:${loginPassword}@127.0.0.1:${port}/postgres`,
    PGRST_DB_SCHEMAS: 'public', PGRST_DB_ANON_ROLE: 'anon', PGRST_JWT_SECRET: jwtSecret,
    PGRST_SERVER_HOST: host, PGRST_SERVER_PORT: String(restPort), PGRST_DB_CONFIG: 'false',
    PGRST_DB_CHANNEL_ENABLED: 'false', PGRST_DB_POOL: '2', PGRST_LOG_LEVEL: 'error',
  } });
  fs.closeSync(fd);
  let spawnError;
  processHandle.on('error', error => { spawnError = error; });
  const closed = new Promise(resolve => processHandle.once('close', resolve));
  const request = (route, bearer, body) => fetch(`http://127.0.0.1:${restPort}/${route}`, {
    method: body === undefined ? 'GET' : 'POST', redirect: 'error', signal: AbortSignal.timeout(5000),
    headers: { ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}), 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  try {
    let ready = false;
    for (let i = 0; i < 40; i++) {
      if (spawnError) throw Error('POSTGREST_START_FAILED');
      if (processHandle.exitCode !== null) throw Error('POSTGREST_EXITED');
      try { const response = await request(''); if (response.ok) { ready = true; break; } } catch { /* Bounded local readiness probe. */ }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert.ok(ready, 'POSTGREST_NOT_READY');
    await check('real PostgREST denies anonymous/authenticated private RPCs and accepts service role', async () => {
      for (const bearer of [undefined, token('authenticated')]) {
        const response = await request('rpc/seo_editorial_read', bearer, { p_id: 'one' });
        assert.ok([401, 403, 404].includes(response.status), `private RPC status:${response.status}`);
        const table = await request('seo_editorial_revisions?select=*', bearer);
        assert.ok([401, 403, 404].includes(table.status), `private table status:${table.status}`);
      }
      const response = await request('rpc/seo_editorial_read', token('service_role'), { p_id: 'one' });
      assert.equal(response.status, 200); assert.equal((await response.json()).revision, 1);
    });
    await check('real PostgREST rejects expired and invalid-signature JWTs', async () => {
      for (const bearer of [token('service_role', 1), token('service_role', Math.floor(Date.now() / 1000) + 60, 'wrong-secret-at-least-32-characters')]) {
        assert.equal((await request('rpc/seo_editorial_read', bearer, { p_id: 'one' })).status, 401);
      }
    });
    await check('real PostgREST enforces optimistic concurrency and French/Arabic JSON roundtrip', async () => {
      const bearer = token('service_role');
      const read = async () => (await request('rpc/seo_editorial_read', bearer, { p_id: 'one' })).json();
      const before = await read();
      const args = { p_id: 'one', p_version: before.version, p_revision: before.revision, p_source: before.source,
        p_action: 'save', p_content: before.head.content, p_job: null, p_event: null, p_checklist: {},
        p_notes: 'Synthetic HTTP revision acceptance', p_actor: 'fixture@example.invalid' };
      const competing = await Promise.all([
        request('rpc/seo_editorial_mutate', bearer, args),
        request('rpc/seo_editorial_mutate', bearer, args),
      ]);
      assert.equal(competing.filter(response => response.status === 200).length, 1);
      const rejected = competing.find(response => response.status !== 200);
      assert.ok(rejected.status >= 400 && rejected.status < 500);
      const conflict = await rejected.json();
      assert.match(conflict.message, /SEO_EDITORIAL_.*CONFLICT/);
      const result = await competing.find(response => response.status === 200).json();
      assert.deepEqual(result.head.content, before.head.content);
      const stale = await request('rpc/seo_editorial_mutate', bearer, args);
      assert.ok(stale.status >= 400 && stale.status < 500);
      assert.equal((await read()).revision, before.revision + 1);
    });
  } finally {
    if (processHandle.exitCode === null) processHandle.kill();
    await Promise.race([closed, new Promise((_, reject) => {
      const timer = setTimeout(() => reject(Error('POSTGREST_SHUTDOWN_TIMEOUT')), 5000); timer.unref();
    })]);
    report.postgrestStopped = true;
  }
}
module.exports = { preflight, runChecks };
