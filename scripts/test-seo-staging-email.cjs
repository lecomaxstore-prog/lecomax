// Exercise the actual candidate route handlers with provider/database tripwires.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const candidate = path.resolve(__dirname, "../../L'ecomax-seo-staging");
for (const file of ['app/api/auth/signup/route.ts', 'app/api/send-confirmation/route.ts', 'app/api/newsletter/send/route.ts', 'app/api/orders/[id]/notify/route.ts']) {
  test(`${file} refuses staging before email, database or request-body operations`, async () => {
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync(path.join(candidate, file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const forbidden = () => { throw Error('SIDE_EFFECT_FORBIDDEN'); };
    new Function('exports', 'require', 'process', 'fetch', code)(exports, name => {
      if (name === 'next/server') return { NextResponse: Response };
      if (name === 'resend') return { Resend: forbidden };
      if (name === '@supabase/supabase-js') return { createClient: () => new Proxy({}, { get: forbidden }) };
      return new Proxy({}, { get: () => forbidden });
    }, { env: { APP_ENV: 'staging', RESEND_API_KEY: 'synthetic-config-drift-must-still-not-send' } }, forbidden);
    const response = await exports.POST(new Proxy({}, { get: forbidden }), { params: Promise.resolve({ id: 'fixture' }) });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, 'EMAIL_DISABLED');
  });
}
