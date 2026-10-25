# Authorized local SEO SQL acceptance

## Result: PASS within the in-memory test scope

The user explicitly authorized disposable in-memory PGlite with synthetic fixtures. The existing full-chain review test passed, and an expanded acceptance suite plus existing local regressions finished with **86 passed, 0 failed, 0 skipped**. Change History tests: **6 passed**. No hosted database connection, production/staging migration, deployment, active worker, scheduler or paid API request occurred. Runtime/provider tests use injected fixtures; the hybrid HTTP test uses a temporary local test server, not a deployed worker.

Source branch remains `agent/mobile-product-redesign`, HEAD `e5251911e2a6f1379aca827eb53c310359a662b3`; the initial working tree already had 686 porcelain entries. No reset, deletion or commit was performed. Existing releases, backups and historical reports were retained. Actual UTC recording times are stored in the linked append-only Change History reports.

## Five-file migration chain

The existing offline planner verifies each file against the previously reviewed SHA-256 before the new tests execute it. All SQL databases are created with `new PGlite()` without a persistence path or connection string and are closed in `finally` blocks.

| Order | Migration | Result |
| --- | --- | --- |
| 1 | `supabase/alternatives/202610180002_seo_decoupled.sql` | PASS |
| 2 | `operations/seo-vercel/supabase/migrations/20261018193508_seo_worker_run_control.sql` | PASS |
| 3 | `operations/seo-vercel/supabase/migrations/202610190001_seo_ai_budget.sql` | PASS |
| 4 | `operations/seo-vercel/supabase/migrations/202610190002_seo_editorial.sql` | PASS |
| 5 | `operations/seo-vercel/supabase/migrations/202610190003_seo_editorial_review.sql` | PASS |

Each later migration was also attempted without its predecessors: all four attempts failed, explicit rollback left zero SEO tables, and a subsequent correct full installation succeeded. Repeating each of those later migrations against the complete schema failed and rollback retained all 11 tables. These checks exercise missing prerequisites, repeat rejection and transactional rollback; they do not exhaust every possible permutation. The chain is still not a single atomic transaction. Synchronous legacy `202610180001` was not used.

## Tables, dependencies and relationships

All 11 expected SEO tables exist, each with a primary key and RLS enabled:

| Table | Purpose / relationship |
| --- | --- |
| `seo_documents` | Product/category metadata keyed by kind and entity ID |
| `seo_events` | Retained metadata audit events |
| `seo_sync_queue` | Durable synchronization jobs keyed by kind and entity ID |
| `seo_sync_health` | Singleton synchronization health |
| `seo_worker_control` | Singleton run lease and status |
| `seo_ai_settings` | Singleton disabled initial budget configuration |
| `seo_ai_jobs` | Deduplicated AI jobs and accounting |
| `seo_ai_approvals` | Foreign key `job_id` to `seo_ai_jobs.id` |
| `seo_ai_budget_events` | Budget change audit |
| `seo_ai_request_authorizations` | Foreign key `job_id` to `seo_ai_jobs.id` |
| `seo_ai_editorial_reviews` | Foreign key `job_id` to `seo_ai_jobs.id` |

Exactly three foreign keys were observed. Invalid parent IDs were rejected for all three relationships. A referenced job could not be deleted. There are intentionally no foreign keys or synchronization triggers on commerce tables: metadata holds logical IDs/source snapshots, preserving the decoupled design.

All catalogued SEO constraints are validated and all SEO indexes are valid/ready. Named lookup indexes `seo_documents_slug`, `seo_events_document`, `seo_sync_due` and `seo_ai_pending` are present. Tests enforce duplicate singleton and duplicate AI-job rejection, required slug, valid entity kind, job tier/state/editorial revision, worker state, singleton truth, nonnegative external spending and monthly/lifetime limits. This checks selected invalid inputs and all catalog validation flags, not every possible value of every constraint or query-plan performance.

Synthetic prerequisites use only `products`, `categories` and the three named API roles. Product IDs are text; category IDs are integers cast to text. French and Arabic names/descriptions and optional missing category fields work. Four fixture entities synchronize, an unchanged repeat produces zero work, and a stock-only fixture change produces no SEO change. Migration plus synchronization leaves original product/category rows unchanged. All fixture modifications remain in memory.

## Permission, accounting and editorial acceptance

| Area | Result / evidence |
| --- | --- |
| Direct table writes | PASS: INSERT/UPDATE/DELETE/TRUNCATE privileges absent for all 11 tables for anon, authenticated and service_role |
| Actual role execution | PASS: SET ROLE checks reject settings writes and direct editorial-review reads; anon/authenticated cannot read metadata documents |
| Initial settings | PASS: disabled, fallback disabled, monthly budget zero, lifetime ceiling 50 |
| Caps | PASS: monthly >5, negative monthly amount, lifetime >50 and negative external spend rejected |
| Job integrity | PASS: deduplicated enqueue, unique-key enforcement, initial paid_authorized=false; no claim with disabled settings |
| Existing SQL regression coverage | PASS: reservation limits, retained uncertain spending, double-completion rejection, legacy compatibility, lease fencing and failure isolation |
| Review | PASS: immutable decision persistence; stale/foreign source, result and version rejected; incomplete checklist rejected |
| Editorial publication | PASS: rejected even after review approval; published metadata remains unchanged |
| Provider/HTTP/API regressions | PASS: mocked providers, origin and permission guards, fallback and sitemap behavior |

Some SQL tests deliberately enable synthetic budgets and create synthetic authorization records inside PGlite to test accounting. They do not authorize actual spending, activate a deployed worker or contact a provider. The existing prepared external-spend amount is still unreconciled with historical paid usage; this acceptance does not certify account billing.

## Commands and evidence

From repository root:

```text
node --test operations/seo-vercel/tests/editorial-review-sql.test.mjs
node --test --test-concurrency=1 operations/seo-vercel/tests/*.test.mjs tests/seo-*.test.ts tests/seo-minimal-staging.test.cjs tests/product-indexing.test.ts
node --test lecomax-learning-app/tests/change-history.test.cjs lecomax-learning-app/tests/change-history-interaction.test.cjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js operations/seo-vercel/tests/full-chain-schema.test.mjs
node scripts/verify-seo-quality-preservation.cjs
node operations/seo/verify-bundle.cjs
node lecomax-learning-app/scripts/change-report.cjs --check
```

- Broad acceptance/regression: 86 passed; `artifacts/seo-pglite-20261019/regression.log` includes the final expanded schema/role tests.
- Initial new schema test run: 3 passed; `schema-tests.log`. The later broad run includes the additional role and parent-deletion checks.
- History persistence/interaction: 6 passed; `history-tests.log`.
- Root TypeScript and focused ESLint: exit 0; `typecheck.log`, `lint.log`.
- 99 release manifest entries and eight saved comparison entries matched; evidence `artifacts/seo-quality/preservation-1792412618877.json`.
- Seven-file operational bundle verified without application. No backup archive was read or rewritten.
- Node 26.7.0 local execution; no new production build. Existing module-type warnings remain, unrelated to this test addition.

No confirmed SQL or application defect required a fix. Added coverage is the only code change; migration bytes, release packages, runtime settings and model integration are unchanged.

## Remaining blockers and next authorization

**Next local blocker: real multi-session PostgreSQL concurrency.** PGlite validates SQL behavior and sequential fencing but does not establish race behavior between independent PostgreSQL sessions, production lock contention, hosting timeouts or PostgREST permissions. The existing native concurrency scripts use fewer than all five migrations and cannot be treated as full v3 coverage.

The next authorization should cover a **separate disposable, loopback-only local PostgreSQL cluster with synthetic fixtures, the full five-file chain, and two-session lease/reservation/concurrency tests**, with no hosted credentials, production data, paid calls, deployment or scheduler. This is outside the currently authorized in-memory-only scope; it has not been started. Confirm an installed PostgreSQL version and a reviewed isolated harness before execution; no installation or download is implied.

Hosted staging remains blocked by previously recorded management-plane identity/isolation gaps and unverified hosted acceptance; no hosted status was refreshed during this restricted session. Production remains NO-GO for SEO rollout. Prior Vercel 403, fresh recovery requirements, release freeze, spend reconciliation, worker latency, editorial publication and monitoring blockers remain unresolved. This local PASS is not deployment or full disaster-recovery certification.

## Changes Made

- Added `operations/seo-vercel/tests/full-chain-schema.test.mjs`.
- Added this report, `docs/seo-pglite-acceptance-20261019.md`.
- Added local evidence under `artifacts/seo-pglite-20261019/` and the timestamped preservation report.
- Appended preparation and linked verification reports to `lecomax-learning-app/changes/` through the required CLI; regenerated `lecomax-learning-app/data/change-history.json` without removing previous entries.
- No live preview claimed. Reports appear in the learning app's `/change-history` when its updated bundle is loaded.
