// Test-only support outside the upload candidate; runtime modules remain unchanged.
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === '../operations/seo-vercel/tests/editorial-quality-fixtures.mjs' && context.parentURL?.includes('/seo-production-review-20261021/source/tests/')) {
    return nextResolve(new URL('../operations/seo-vercel/tests/editorial-quality-fixtures.mjs', import.meta.url).href, context);
  }
  return nextResolve(specifier, context);
} });
