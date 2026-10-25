// Offline by default. The explicit one-shot mode consumes this session's approval.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { choices, schemaFor, MODELS, MAX_OUTPUT } from '../operations/seo-vercel/lib/seo-ai-provider.mjs';
const catalogue = readFileSync(new URL('../lib/products.ts', import.meta.url), 'utf8');
const slug = 'c-baasploa-course-homme';
const match = catalogue.match(/slug: "c-baasploa-course-homme",\s+name: "([^"]+)"/);
if (!match) throw Error('CANARY_SOURCE_MISSING');
const source = { slug, name: match[1], category: 'chaussures' };
const plan = {
  createdAt: new Date().toISOString(), enabled: false, paidRequests: 0,
  source, sourceOrigin: 'Existing local catalogue; revalidate active live product and database ID before execution',
  sourceHash: createHash('sha256').update(JSON.stringify(source)).digest('hex'),
  model: MODELS.routine, maxRequests: 1, maxOutputTokens: MAX_OUTPUT,
  maxInputAndSchemaBytes: 12000, reservationUsd: 0.01,
  illustrativeCostUsd: 0.000325, illustrativeTokens: { input: 1000, output: 400 },
  options: choices(source), schema: schemaFor(source),
  requirements: [
    'Explicit approval for one paid request with a $0.01 ceiling',
    'Fresh account model-access check; server-side dedicated project key',
    'Use an isolated local SQL database with reviewed migrations and this single source fixture',
    'Set local monthly cap to $0.01; reserve using seo_ai_claim before calling the provider',
    'No production DB connection, deployment, scheduler, catalogue updates or publication',
    'Disable Mirai, use maxRetries=0, preserve reservation after uncertain outcome; do not retry',
    'Persist result and usage locally, inspect French/Arabic quality and measured latency',
  ],
};
const destination = `artifacts/seo-openai/canary-plan-${Date.now()}.json`;
writeFileSync(destination, JSON.stringify(plan, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ destination, enabled: false, paidRequests: 0 }));
if (process.argv.includes('--approved-one-shot')) {
  const { runApprovedCanary } = await import('./seo-canary-once.mjs');
  await runApprovedCanary(plan);
} else if (process.argv.length > 2) {
  throw Error('UNKNOWN_CANARY_ARGUMENT');
}
