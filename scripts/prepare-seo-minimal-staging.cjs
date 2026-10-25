// Offline inventory only: no database client, environment loading or execution mode.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const CHAIN = [
  ['supabase/alternatives/202610180002_seo_decoupled.sql', '1f084348a0702a9ae6f5a2a52a59537c544d8b8aa2dc7e86e6fe38c33a725445'],
  ['operations/seo-vercel/supabase/migrations/20261018193508_seo_worker_run_control.sql', '39b1ad24d16124cddbb2d49052fd0d185b67681418e4a6dc0a3dd4ea1f2cf079'],
  ['operations/seo-vercel/supabase/migrations/202610190001_seo_ai_budget.sql', '5087b11fb0b5692ba76b467aa3b6075e1919f59faef1358006e6e3422f426b63'],
  ['operations/seo-vercel/supabase/migrations/202610190002_seo_editorial.sql', 'a88e6c5ae6d75805a1f01436a7e7fed77ee9e3a0a4855344504c8ba3712c2004'],
  ['operations/seo-vercel/supabase/migrations/202610190003_seo_editorial_review.sql', 'f975fd04b40bf8b5cc4895bbdbe65cdb2640a0ce3549d5b4c69d244ad6d19030'],
];
const sorted = values => [...new Set(values)].sort();
function prepare(read = file => fs.readFileSync(path.join(ROOT, file), 'utf8')) {
  const files = CHAIN.map(([file, expectedSha256], index) => {
    const sql = read(file);
    const sha256 = crypto.createHash('sha256').update(sql).digest('hex');
    if (sha256 !== expectedSha256) throw Error(`MIGRATION_DRIFT:${file}`);
    // This is a lexical inventory of exactly the reviewed hashes, not a SQL parser.
    const code = sql.replace(/--[^\r\n]*/g, '');
    if (!/^\s*begin;/i.test(code) || !/commit;\s*$/i.test(code)) throw Error('TRANSACTION_BOUNDARY');
    const names = pattern => sorted([...code.matchAll(pattern)].map(match => match[1]));
    return { order:index + 1, file, sha256,
      createsTables:names(/create\s+table\s+public\.(\w+)/gi),
      definesFunctions:names(/create\s+(?:or\s+replace\s+)?function\s+public\.(\w+)/gi),
      renamedFunctions:names(/alter\s+function\s+public\.\w+\([^;]*?\)\s+rename\s+to\s+(\w+)/gi),
      publicReferences:names(/\bpublic\.(\w+)/gi) };
  });
  const tables = sorted(files.flatMap(f => f.createsTables));
  const internal = new Set([...tables, ...files.flatMap(f => [...f.definesFunctions, ...f.renamedFunctions]), 'seo_events_id_seq']);
  const external = sorted(files.flatMap(f => f.publicReferences).filter(name => !internal.has(name)));
  if (JSON.stringify(external) !== JSON.stringify(['categories','products'])) throw Error('UNREVIEWED_DEPENDENCY');
  return {
    schemaVersion:1, scope:'SEO-only synthetic staging preparation', applied:false, executable:false,
    productionRef:'yddqwgdgeljkzfsmtein', stagingRef:'tyltharlnbxrxibuxyye',
    source:'Reviewed repository migration bytes; no archive or production rows read',
    coverage:'SEO contract rehearsal only; does not satisfy full application recovery Gate A',
    migrations:files, externalPublicTables:external, createsSeoTables:tables,
    prerequisites:{ postgresMajor:17, schema:'public', roles:['anon','authenticated','service_role'],
      builtins:['gen_random_uuid','md5','jsonb functions'],
      extensionsToEnable:[], managedSchemasToReplace:[],
      note:'Reuse target roles after metadata verification; do not import production role passwords, ownership or default grants.' },
    restoreManifest:{ mode:'synthetic-only', productionRows:0, archiveEntries:[],
      tables:external.map(table => ({schema:'public',table,
        fields:['id','name','slug','active','description','category','brand','images','image'],
        requiredContract:['id (castable to text)','name','slug','active (castable to boolean)'],
        fixtures:'Synthetic French/Arabic products and categories only; no copied commerce records',
        schemaFidelity:'Projected fixture contract, not a faithful restoration of production table constraints, indexes or RLS'})),
      excludes:['all production table data','orders','payments','customers','inventory and checkout data',
        'auth.*','storage.*','realtime.*','vault.*','cron.*','net.*','supabase_migrations.*',
        'production triggers and event triggers','webhooks','foreign servers','subscriptions',
        'production roles and grants','secrets','SEO jobs, approvals, authorizations and historical spending'],
      loadOrder:['Verify target identity, isolation and empty application schema',
        'Separately authorize synthetic dependency fixture creation',
        'Separately authorize the entire five-file chain in order; never synchronous 001',
        'Verify disabled settings and zero authorized jobs before connecting any application'],
    },
    acceptance:[
      {id:'identity-isolation',status:'blocked',requiresWrite:false,assert:'Confirm owning project name/region and Auth, SMTP, hooks, Vercel and external consumers; database emptiness alone is insufficient'},
      {id:'migration-chain',status:'not-run',requiresWrite:true,assert:'Apply only all five pinned files to separately approved disposable target; capture failures and ledger; each file is atomic, chain is not'},
      {id:'roles',status:'not-run',requiresWrite:true,assert:'anon/authenticated cannot read drafts or execute mutations; service_role cannot directly write SEO tables or call revoked legacy claims'},
      {id:'budget',status:'not-run',requiresWrite:true,assert:'enabled=false, mirai_enabled=false, monthly_limit=0, lifetime_limit<=50; cap setter rejects >5; no paid authorization; reconcile external spend before activation'},
      {id:'concurrency',status:'not-run',requiresWrite:true,assert:'Two independent sessions: one durable run lease, deduplicated enqueue, reservations within caps, expired token rejected, uncertain spend retained'},
      {id:'review',status:'not-run',requiresWrite:true,assert:'Reject stale source/version/result and incomplete FR/AR checklist; persist immutable review; editorial publication remains rejected'},
      {id:'http',status:'not-run',requiresWrite:false,assert:'Staging-only genuine owner/editor/viewer/suspended/expired sessions; origin checks; PostgREST schema visibility and sanitized errors'},
      {id:'storefront',status:'not-run',requiresWrite:false,assert:'Fixture product/category metadata, fallback, canonical, Product/Breadcrumb JSON-LD, duplicate checks, sitemap outage 503 and robots'},
    ],
    limitations:['Lexical hash-pinned inventory is not PostgreSQL parsing or runtime validation',
      'No backup TOC entries have been selected; do not use this JSON as a pg_restore list',
      'Whole-store frontend also reads unrelated commerce tables; this minimal contract cannot certify checkout or full storefront recovery',
      'Current worker pins production and rejects staging; do not weaken its guard or invoke it for staging acceptance',
      'No paid model availability, v3 output quality, deployment or scheduler acceptance'],
  };
}
module.exports = { prepare };
if (require.main === module) {
  try {
    if (process.argv.length !== 2) throw Error('NO_EXECUTION_OR_TARGET_ARGUMENTS_SUPPORTED');
    const report = {createdAt:new Date().toISOString(),...prepare()};
    const directory = path.join(ROOT,'artifacts/seo-minimal-staging');
    fs.mkdirSync(directory,{recursive:true});
    const output = path.join(directory,`plan-${Date.now()}.json`);
    fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
    console.log(JSON.stringify({output,applied:false,externalTables:report.externalPublicTables,seoTables:report.createsSeoTables.length}));
  } catch(error) { console.error(error.message); process.exitCode=1; }
}
