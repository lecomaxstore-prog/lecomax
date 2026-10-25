import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

test('Expo delivery and receipt polling stop before database access in every nonproduction environment', async () => {
  for (const APP_ENV of ['staging', 'preview', 'development', 'test', '', undefined]) {
    for (const [file, entry] of [
      ['lib/mobile-campaigns.ts', 'deliverMobileCampaign'],
      ['lib/mobile-push-receipts.ts', 'checkMobilePushReceipts'],
    ]) {
      const exports: any = {};
      const code = ts.transpileModule(readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      }).outputText;
      new Function('exports', 'require', 'process', 'fetch', code)(exports, () => ({
        createClient: () => { throw Error('DATABASE_MUST_NOT_RUN'); },
      }), { env: { APP_ENV } }, () => { throw Error('NETWORK_MUST_NOT_RUN'); });
      await assert.rejects(exports[entry]('synthetic'), /MOBILE_DELIVERY_DISABLED/);
    }
  }
});
