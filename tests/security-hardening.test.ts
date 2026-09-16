import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { paypalWebhookChange } from '../lib/paypal-webhook-event.ts';
import { sameRequestOrigin } from '../lib/request-origin.ts';
import { hasAdminPermission, adminApiPermission } from '../lib/admin-policy.ts';
import { createSessionToken, verifySessionToken } from '../lib/admin-session.ts';
import { securityIo } from './helpers/security-io.ts';
import { PGlite } from '@electric-sql/pglite';

test('signed admin sessions reject tampering and enforce signed expiry', async () => {
  const previous = process.env.ADMIN_SESSION_SECRET;
  process.env.ADMIN_SESSION_SECRET = 'unit-test-secret-'.repeat(4);
  try {
    const token = await createSessionToken('admin@example.test', 60_000);
    assert.equal(await verifySessionToken(token), 'admin@example.test');
    assert.equal(await verifySessionToken(token.slice(0, -8) + 'AAAAAAAA'), null);
    assert.equal(await verifySessionToken(token, -1), null);
    assert.equal(await verifySessionToken('x'.repeat(5000)), null);
  } finally {
    if (previous === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = previous;
  }
});

test('admin policy denies customers, unknown areas and write escalation', () => {
  const staff = { owner: false, permissions: ['products.view'] };
  assert.equal(hasAdminPermission(null, null), false);
  assert.equal(hasAdminPermission(staff, adminApiPermission('/api/products', 'GET')), true);
  for (const [path, method] of [['/api/products/id', 'DELETE'], ['/api/admin/staff', 'POST'], ['/api/admin/new-area', 'GET']]) {
    assert.equal(hasAdminPermission(staff, adminApiPermission(path, method)), false);
  }
});

test('origin checks reject cross-site and forwarded-host spoofing, preserve native clients', () => {
  const req = (headers: Record<string,string>) => ({ url: 'https://shop.test/api/settings', headers: new Headers(headers) });
  assert.equal(sameRequestOrigin(req({origin:'https://evil.test','x-forwarded-host':'evil.test'})), false);
  assert.equal(sameRequestOrigin(req({'sec-fetch-site':'cross-site'})), false);
  assert.equal(sameRequestOrigin(req({origin:'https://shop.test'})), true);
  assert.equal(sameRequestOrigin(req({})), true);
});

test('body limits reject oversized streams without trusting Content-Length', async () => {
  const io = securityIo('@/lib/request-body')!;
  const req = new Request('https://shop.test', { method:'POST', body: JSON.stringify({value:'x'.repeat(200)}) });
  await assert.rejects(io.readJsonLimited(req, 64), /REQUEST_BODY_TOO_LARGE/);
  assert.deepEqual(JSON.parse(JSON.stringify(await io.readJsonLimited(new Request('https://shop.test', {method:'POST', body:'{"ok":true}'}), 64))), {ok:true});
});

test('refund event resolves the original capture and never trusts arbitrary link hosts', () => {
  const event = {id:'EV-1', event_type:'PAYMENT.CAPTURE.REFUNDED', create_time:'2026-09-15T12:00:00Z', resource:{id:'REFUND1', links:[{rel:'up',href:'https://api.paypal.com/v2/payments/captures/CAPTURE1'}]}};
  assert.equal(paypalWebhookChange(event)?.captureId, 'CAPTURE1');
  event.resource.links[0].href = 'https://evil.test/v2/payments/captures/CAPTURE1';
  assert.equal(paypalWebhookChange(event), null);
  assert.equal(paypalWebhookChange(null), null);
  assert.equal(paypalWebhookChange({id:'E'.repeat(101),event_type:'other'}), null);
});

test('webhook transaction handles replay, event ordering, missing orders and RPC permissions', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create table orders(id uuid primary key default gen_random_uuid(), payment_reference text unique, payment_status text, updated_at timestamptz);
      create table paypal_webhook_events(event_id text primary key,event_type text,capture_id text);
      insert into orders(payment_reference,payment_status) values('CAPTURE1','captured');`);
    await db.exec(readFileSync(new URL('../supabase/migrations/20260915120000_atomic_paypal_webhooks.sql', import.meta.url),'utf8'));
    const send = (id:string, status:string, time:string, capture='CAPTURE1') => db.query('select reconcile_paypal_webhook($1,$2,$3,$4,$5) as result', [id,'PAYMENT.CAPTURE.TEST',capture,status,time]);
    await db.exec('set role service_role');
    await send('EV1','refunded','2026-09-15T12:00:00Z');
    assert.equal((await send('EV1','refunded','2026-09-15T12:00:00Z')).rows[0].result.duplicate, true);
    await send('EV2','captured','2026-09-15T11:00:00Z');
    await send('EV3','pending','2026-09-15T13:00:00Z');
    await assert.rejects(send('EV4','captured','2026-09-15T13:00:00Z','MISSING'),/PAYMENT_ORDER_NOT_READY/);
    await db.exec('reset role');
    assert.equal((await db.query('select payment_status from orders')).rows[0].payment_status,'refunded');
    assert.equal((await db.query("select count(*)::int as count from paypal_webhook_events where event_id='EV4'")).rows[0].count,0);
    for (const role of ['anon','authenticated']) {
      await db.exec(`reset role; set role ${role}`);
      await assert.rejects(send('EV5','captured','2026-09-15T13:00:00Z'),/permission denied/);
    }
  } finally { await db.close(); }
});

for (const env of [
  { UPSTASH_REDIS_REST_URL: 'https://redis.test', UPSTASH_REDIS_REST_TOKEN: 'test' },
  { KV_REST_API_URL: 'https://redis.test', KV_REST_API_TOKEN: 'test' },
]) test(`shared limiter rejects abuse and fails closed with ${Object.keys(env)[0]}`, async () => {
  const exports: Record<string,any> = {};
  let count = 0, failed = false;
  const runtimeEnv: Record<string, string> = { ...env };
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/sensitive-rate-limit.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, {
    exports, AbortSignal, process:{env:runtimeEnv},
    require(name:string) {
      if(name==='server-only') return {};
      if(name==='node:crypto') return {createHash:()=>({update:()=>({digest:()=> 'hash'})})};
      if(name==='next/server') return {NextResponse:Response};
      if(name==='./api-security') return {clientIp:()=> 'test',enforceRateLimit:()=>{throw new Error('Shared configuration must not use local counters');}};
      throw new Error(name);
    },
    fetch:async(url:string, options:RequestInit)=>{
      assert.equal(url, 'https://redis.test');
      assert.equal((options.headers as Record<string,string>).Authorization, 'Bearer test');
      if(failed) throw new Error('offline'); return Response.json({result:[++count,60_000]});
    },
  });
  for(let i=0;i<30;i++) assert.equal(await exports.sensitiveRateLimit({},'test'),null);
  assert.equal((await exports.sensitiveRateLimit({},'test')).status,429);
  failed=true;
  assert.equal((await exports.sensitiveRateLimit({},'test')).status,503);
  failed=false;
  runtimeEnv.UPSTASH_REDIS_REST_URL='https://other-redis.test';
  delete runtimeEnv.UPSTASH_REDIS_REST_TOKEN;
  runtimeEnv.KV_REST_API_URL='https://redis.test';
  runtimeEnv.KV_REST_API_TOKEN='test';
  const previousCount=count;
  assert.equal((await exports.sensitiveRateLimit({},'test')).status,503);
  assert.equal(count,previousCount,'Incomplete explicit credentials must not be mixed with the Vercel token');
});
