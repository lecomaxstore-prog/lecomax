const test = require('node:test'), assert = require('node:assert/strict');
const { environmentEvidence } = require('../scripts/seo-hosting-evidence.cjs');
test('hosting evidence reports scopes without exposing values or arbitrary keys', () => {
  const report = environmentEvidence({ envs: [
    { key: 'SEO_SYNC_SERVICE_ROLE_KEY', target: ['production', 'preview'], value: 'SECRET_VALUE', decrypted: 'SECRET_CLEAR', gitBranch: 'PRIVATE_BRANCH' },
    { key: 'SEO_SYNC_SERVICE_ROLE_KEY', target: 'development', customEnvironmentId: 'PRIVATE_CUSTOM' },
    { key: 'SECRET_DYNAMIC_KEY', value: 'DO_NOT_OUTPUT', target: ['production'] },
  ], token: 'SECRET_TOKEN' });
  assert.deepEqual(report.SEO_SYNC_SERVICE_ROLE_KEY, { scopes: ['production', 'preview', 'development'], branchScoped: true, customScoped: true });
  assert.deepEqual(report.OPENAI_API_KEY.scopes, []);
  assert.doesNotMatch(JSON.stringify(report), /SECRET_VALUE|SECRET_CLEAR|SECRET_DYNAMIC_KEY|SECRET_TOKEN|PRIVATE_BRANCH|PRIVATE_CUSTOM|DO_NOT_OUTPUT|"value"|decrypted|"token"/);
});
test('missing environment inventory fails closed instead of reporting all secrets absent', () => {
  for (const value of [null, {}, { envs: null }, { envs: {} }])
    assert.throws(() => environmentEvidence(value), /HOSTING_ENV_RESPONSE_INVALID/);
  assert.deepEqual(environmentEvidence({envs: []}).SEO_AI_ENABLED.scopes, []);
});
test('isolation bindings and deployment targets are visible as scopes only', () => {
  const keys = ['APP_ENV','NEXT_PUBLIC_APP_ENV','NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_SUPABASE_KEY_BINDING','SUPABASE_SERVICE_KEY_BINDING',
    'OWNER_DATABASE_URL','OWNER_DATABASE_BINDING','SESSION_SECRET','SEO_RUNTIME_ENV',
    'SEO_SYNC_KEY_BINDING','SEO_MANUAL_SYNC_ENABLED','SEO_WORKER_URL',
    'SEO_WORKER_ALLOWED_ORIGIN','SEO_WORKER_BINDING','SEO_WORKER_CRON_SECRET','SEO_MIRAI_FALLBACK_ENABLED'];
  const report = environmentEvidence({envs:keys.map(key=>({key,target:['preview'],value:'PRIVATE_VALUE'}))});
  for (const key of keys) assert.deepEqual(report[key].scopes,['preview']);
  assert.doesNotMatch(JSON.stringify(report),/PRIVATE_VALUE/);
});
test('partial or malformed inventories cannot certify absent scopes', () => {
  for (const input of [
    { envs: [], pagination: { next: 123 } },
    { envs: [null] }, { envs: [{ key: 'APP_ENV' }] },
    { envs: [{ key: 'APP_ENV', target: ['unknown'] }] },
    { envs: [{ key: 'APP_ENV', target: ['preview'], gitBranch: {} }] },
  ]) assert.throws(() => environmentEvidence(input), /HOSTING_ENV_RESPONSE_INVALID/);
});
test('disabled integration guard variables are included without credential values', () => {
  const keys = ['AGENT_STUDIO_LIVE_ENABLED', 'PAYPAL_ENABLED', 'PAYPAL_CLIENT_SECRET',
    'NEXT_PUBLIC_PAYPAL_CLIENT_ID', 'GROQ_API_KEY', 'RESEND_API_KEY', 'PRIVATE_EMAIL_PASS',
    'VAPID_PRIVATE_KEY', 'EXPO_ACCESS_TOKEN', 'WHATSAPP_ACCESS_TOKEN', 'PHONE_RELAY_KEY',
    'INDEXNOW_ENABLED', 'INDEXNOW_KEY', 'LEARNING_CRON_SECRET',
    'UPSTASH_REDIS_REST_URL', 'KV_REST_API_TOKEN', 'TRUSTPILOT_API_KEY'];
  const report = environmentEvidence({ envs: keys.map(key =>
    ({ key, target: ['preview'], value: 'PRIVATE_VALUE' })) });
  for (const key of keys) assert.deepEqual(report[key].scopes, ['preview']);
  assert.doesNotMatch(JSON.stringify(report), /PRIVATE_VALUE/);
});

