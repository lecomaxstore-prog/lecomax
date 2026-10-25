# SEO continuation checkpoint — Unicode, sitemap and dashboard recovery

This additive checkpoint follows `docs/seo-local-recovery-staging-20261019.md` and Change History `seo-worker-logging-verified-20261019`. Existing dirty/untracked application, mobile, learning, release and artifact work was preserved. No reset, clean, commit, release replacement, production connection, hosted migration/restore, paid call, worker activation or deployment occurred. Actual UTC recording timestamps are in the linked immutable Change History reports.

## Recovered implementation

The repository already implements product/category metadata and canonical URLs, escaped JSON-LD, paginated sitemaps, deterministic fallback, duplicate audits, draft/version/source conflict controls, manual synchronization, durable queue/run leases, retries, budget reservations and per-request authorizations, bilingual editorial generation and immutable review decisions. The latest earlier checkpoint fixed best-effort worker logging and supplied an inert staging proposal. The five-file decoupled migration chain is authoritative; do not substitute or prepend the original synchronous migration.

Reviewed root instructions, history schema, current Git status, root directory structure, SEO application/API/helper sources, worker/test inventory, latest history, staging owner evidence and local recovery notes. Historical native concurrency/build/backup evidence remains historical. The current checkout contains substantial unrelated changes; selected changes below are not the whole Git diff. Several existing SEO files are untracked relative to HEAD, so Git diff alone does not identify this session's changes.

## Runtime changes

- `lib/seo-engine.ts`: both direct and catalogue duplicate audits normalize canonically equivalent Unicode to NFC, preserving meaningful accents and Arabic marks. This is exact normalized matching, not semantic similarity or a complete multilingual plagiarism detector. Related links identify records by kind plus ID so a category sharing a product's ID is retained.
- `app/sitemaps/[kind]/[page]/route.ts`: reject leading-zero and other noncanonical numeric page aliases before any database query. Existing canonical zero/nonzero shard routes and outage behavior remain intact.
- `app/admin/seo/SeoAiControl.tsx`: isolate component state by entity kind, ID and document version. Clear displayed results while refreshing, accept only the newest request's result/error, and invalidate pending results on unmount. This prevents older responses from displaying stale jobs or budget controls. Server authorization remains authoritative; no spending/publication rule changed.
- `tests/seo-engine.test.ts`, `tests/seo-sitemap.test.ts`, `tests/seo-ai-dashboard.test.ts`: regressions for French/Arabic canonical equivalence, distinct marks, inactive records, shared IDs, shard aliases, selection identities, reversed fetch order, stale failure and unmount.

No SQL migration, deployment bundle, canonical product slug, model, price, provider timeout or publication policy changed.

## Validation

PASS: 79 selected SEO metadata/sitemap/indexing/API/security/synchronization/worker/provider/editorial tests, including existing full-chain in-memory editorial SQL review test. That SQL test constructs disposable synthetic PGlite state and executes all five local migrations; it contacts no hosted database, provisions no service and sends no provider request. It checks immutable reviews, stale/foreign result rejection, privilege fences and nonpublication. This is not PostgreSQL 17 or genuine concurrent-session acceptance.

PASS: three new dashboard component-hook tests plus six Change History persistence/interaction tests = 88 distinct tests for the session. The three dashboard cases passed again after the cleanup refactor; do not count reruns twice. The lightweight hook harness is not a real-browser React lifecycle test.

PASS: root TypeScript `--noEmit --incremental false`, learning-app `npm.cmd run typecheck`, focused ESLint. The initial dashboard lint emitted a ref-cleanup warning; the cleanup was clarified and the final focused rerun passed without warnings. A report append initially rejected UTF-8 BOM and seven-digit fractional timestamps; only the unappended input was corrected, then accepted by the CLI. No existing archived report was edited.

Evidence: `artifacts/seo-unicode-regression.log`, `artifacts/seo-dashboard-history-tests.log`, `artifacts/seo-dashboard-final-tests.log`, `artifacts/seo-unicode-types.log`, `artifacts/seo-unicode-learning-types.log`. The initial lint log retains the superseded warning; final lint passed in terminal output. Final history integrity is recorded in the verification follow-ups.

UNVERIFIED: new production build, browser preview, Google Rich Results acceptance, entire unrelated repository test suite, hosted actor/PostgREST behavior, real provider generation and FR/AR human acceptance. No repeated expensive build or native cluster provisioning was needed for these changes. Earlier unrelated suite failures are not claimed resolved.

## Fresh staging read-only evidence

Dedicated `lecomax_staging` MCP reads returned:

| Area | Status | Evidence / limit |
| --- | --- | --- |
| Database access | PASS | `supabase_read_only_user`, transaction read-only on, database postgres |
| Server version | PASS | PostgreSQL 17.11; this is identity/version evidence, not migration compatibility certification |
| Public application / SEO tables | PASS, empty | Zero / zero; no application persistence installed |
| Hosted migration / Edge Function inventories | PASS, empty | Both lists empty |
| Security advisor | PASS, bounded | Empty lint list; not a comprehensive security certification |
| Storage bucket inventory | PASS, empty | Zero buckets; Auth/Storage permissions not fully exercised |
| Database egress indicators | PASS, bounded | Zero foreign servers/subscriptions; cron.job and net.http_request_queue absent |
| Project identity | PASS, prior evidence | Designated ref tyltharlnbxrxibuxyye; prior authenticated management and user Owner evidence retained, not freshly reverified through a management endpoint |
| Auth redirects/providers, SMTP/SMS, hooks | UNVERIFIED | Available MCP tools do not expose these settings |
| External integrations, workers, CI schedules | UNVERIFIED | Empty SQL/Edge inventory cannot establish external inactivity |
| PG17 migration / full privilege acceptance | UNVERIFIED | Hosted schema remains empty; local PGlite is not hosted PG17 |
| Backup/restore readiness | BLOCKED | Fresh protected backup and reviewed recovery harness/restore evidence still required; no production access this session |
| Staging execution readiness | BLOCKED / NO-GO | Incomplete isolation and hosted acceptance; writes remain disabled by instruction |
| Implicit CLI staging target | FAIL, prior evidence | Existing checkout is production-linked; do not relink it or invoke implicit linked commands |

Separate project refs do not prove outbound isolation. Prior `docs/seo-staging-owner-verification-20261019.md` remains the detailed dashboard evidence checklist. No fresh assertion is made about hosted flags, provider credentials or scheduler state.

## Exact next steps

1. Preserve this checkpoint and all older reports. Inspect subsequent Git changes and read this document plus `docs/seo-local-recovery-staging-20261019.md`. Reports: `seo-unicode-sitemap-prepared-20261019`, `seo-unicode-sitemap-verified-20261019`, `seo-ai-dashboard-race-prepared-20261019`, `seo-ai-dashboard-race-verified-20261019`.
2. Add real-browser regression coverage for rapid product/version switching and overlapping AI refreshes when an isolated local fixture server is available. Do not load production credentials for that test.
3. Continue unfinished editorial result editing/publication as a separately reviewed local implementation: immutable revisions, expected document/source/result checks, review invalidation after edits, atomic publication and version-fenced rollback. Current review approval intentionally cannot publish. Do not merely remove its block or mutate provider results in place.
4. Collect read-only Auth redirect/provider/SMTP/SMS/hook and integration/worker evidence using the existing owner access. Record sanitized destinations and enabled states; no test sends or secret values. Do not mistake SQL emptiness for complete isolation.
5. Freeze a matching v3 application/worker candidate, reconcile actual external spending and generation-timeout/lease budgets, and design a staging-only runner without weakening the existing production target guard. The inert plan is not runnable acceptance infrastructure.
6. Only after isolation is evidenced and separate hosted-write approval exists: apply the reviewed synthetic dependency/5-migration plan to staging, test PG17 actual-owner/default privileges, actor/origin/PostgREST boundaries, concurrency and recovery. Keep initial AI/worker/schedule execution disabled and budgets zero. A synthetic rehearsal does not replace full disaster recovery.

Reproduce focused changes without dotenv: `node --test tests/seo-engine.test.ts tests/seo-sitemap.test.ts tests/seo-ai-dashboard.test.ts`. Existing in-memory review check: `node --test operations/seo-vercel/tests/editorial-review-sql.test.mjs`. History: `node lecomax-learning-app/scripts/change-report.cjs --check`.

## Changes Made

Six runtime/test files listed above, this checkpoint and four append-only history entries; the history CLI regenerates the learning app manifest. Local validation passed within the stated scope. `/change-history` will show the entries in an updated local learning-app bundle; no running preview or deployment is claimed. The full SEO production-readiness mission remains incomplete for the explicitly listed technical and hosted gates.
