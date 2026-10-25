import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { supabaseHeaders } from '../operations/seo-vercel/lib/supabase-headers.mjs';

const jwt = (role: string) => 'eyJhbGciOiJIUzI1NiJ9.' +
  Buffer.from(JSON.stringify({ role, sub: 'synthetic-user' })).toString('base64url') + '.synthetic';

test('modern API keys stay in apikey; legacy keys retain Bearer compatibility', () => {
  for (const key of ['sb_publishable_synthetic', 'sb_secret_synthetic']) {
    assert.deepEqual(supabaseHeaders(key), { apikey: key });
    assert.deepEqual(supabaseHeaders(key, jwt('authenticated')), {
      apikey: key, Authorization: `Bearer ${jwt('authenticated')}`,
    });
    assert.throws(() => supabaseHeaders(key, key), /ACCESS_TOKEN/);
  }
  for (const role of ['anon', 'service_role']) {
    const key = jwt(role);
    assert.deepEqual(supabaseHeaders(key), { apikey: key, Authorization: `Bearer ${key}` });
  }
  assert.throws(() => supabaseHeaders(''), /KEY_REQUIRED/);
  assert.throws(() => supabaseHeaders('sb_publishable_synthetic', ''), /ACCESS_TOKEN/);
});

test('installed Supabase SDK supports both key formats and preserves a separate authenticated user JWT', async () => {
  for (const key of ['sb_publishable_synthetic', 'sb_secret_synthetic', jwt('anon'), jwt('service_role')]) {
    const seen: Array<{ path: string; headers: Headers }> = [];
    const client = createClient('https://synthetic.invalid', key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: async (url, init) => {
        const path = new URL(String(url)).pathname;
        seen.push({ path, headers: new Headers(init?.headers) });
        return Response.json(path === '/auth/v1/user'
          ? { id: 'synthetic-user', email: 'fixture@example.test' } : []);
      } },
    });
    assert.equal((await client.from('products').select('id')).error, null);
    assert.equal((await client.auth.getUser(jwt('authenticated'))).data.user?.id, 'synthetic-user');
    assert.equal(seen.length, 2);
    assert.equal(seen[0].headers.get('apikey'), key);
    assert.equal(seen[1].headers.get('apikey'), key);
    assert.equal(seen[1].headers.get('authorization'), `Bearer ${jwt('authenticated')}`);
  }
});
