// Explicit read-only SQL and GET-only HTTP probes. Never calls a mutation RPC.
const fs = require('node:fs');
const { Client } = require('pg');
require('@next/env').loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const ref = 'yddqwgdgeljkzfsmtein';
const api = `https://${ref}.supabase.co`;
const u = new URL(process.env.OWNER_DATABASE_URL);
if (process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') !== api ||
    !(u.hostname === `db.${ref}.supabase.co` || u.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(u.username).endsWith('.' + ref)) || u.port === '6543') throw Error('Target mismatch');
const config = { host: u.hostname, port: Number(u.port || 5432), database: u.pathname.slice(1),
  user: decodeURIComponent(u.username), password: decodeURIComponent(u.password),
  ssl: { rejectUnauthorized: true, ca: fs.readFileSync('supabase/prod-ca-2021.crt', 'utf8') }, connectionTimeoutMillis: 10000 };
const report = { at: new Date().toISOString(), productionDataWrites: false, probes: [] };
async function probe(name, url, headers, expected, extract) {
  const response = await fetch(url, { method: 'GET', headers, redirect: 'manual', signal: AbortSignal.timeout(15000) });
  const body = await response.text();
  report.probes.push({ name, status: response.status, passed: expected.includes(response.status),
    ...(extract ? extract(body) : {}) });
}
(async () => {
  const c = new Client(config); c.on('error', () => {});
  try {
    await c.connect();
    const results = await c.query(fs.readFileSync('supabase/verification/seo-rollout-integrity.sql', 'utf8'));
    report.integrityAndActivity = results.filter(r => r.command === 'SELECT').map(r => r.rows);
    await c.query('begin read only');
    report.timeoutSetting = (await c.query("select current_setting('transaction_read_only') read_only,current_setting('server_version') server_version,current_setting('transaction_timeout') original_timeout,has_parameter_privilege(current_user,'transaction_timeout','SET') can_set")).rows[0];
    await c.query('rollback');
    // Terminate only this test connection in a read-only transaction; no locks or writes.
    await c.query('begin read only');
    await c.query("set local transaction_timeout='1000ms'");
    const start = Date.now(); let code;
    try { await c.query('select pg_sleep(2)'); } catch (e) { code = e.code; }
    report.transactionDeadlineTest = { errorCode: code, elapsedMs: Date.now() - start,
      passed: code === '25P04' && Date.now() - start < 4000 };
  } finally { await c.end().catch(() => {}); }
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const { supabaseHeaders: headers } = await import('../operations/seo-vercel/lib/supabase-headers.mjs');
  await probe('Auth settings available', api + '/auth/v1/settings', { apikey: anon }, [200]);
  await probe('Auth invalid token denied', api + '/auth/v1/user', { apikey: anon, Authorization: 'Bearer invalid-readonly-probe' }, [401, 403]);
  await probe('Service PostgREST catalogue discovery', api + '/rest/v1/products?select=id&limit=0', headers(service), [200]);
  await probe('PostgREST RPC discovery without invocation', api + '/rest/v1/', { ...headers(service), Accept: 'application/openapi+json' }, [200], body => {
    let rpcPresent = null; try { rpcPresent = Boolean(JSON.parse(body).paths?.['/rpc/save_seo_document']); } catch {}
    return { seoSaveRpcDiscovered: rpcPresent };
  });
  await probe('Anonymous Admin API denied', 'https://lecomax.com/api/admin/seo', {}, [401]);
  await probe('Invalid Admin cookie denied', 'https://lecomax.com/api/admin/seo', { Cookie: 'admin_session=invalid-readonly-probe' }, [401]);
  await probe('Anonymous Admin page redirects', 'https://lecomax.com/admin/seo', {}, [307, 308, 302]);
  const file = `artifacts/seo-migration/hosted-readonly-${Date.now()}.json`;
  fs.writeFileSync(file, JSON.stringify(report, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ file, ...report }));
  if (!report.transactionDeadlineTest.passed || report.probes.some(p => !p.passed)) process.exitCode = 1;
})().catch(e => { console.error('Read-only inspection failed:', e.code || e.name); process.exitCode = 1; });
