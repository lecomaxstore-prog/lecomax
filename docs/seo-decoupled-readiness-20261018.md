# Decoupled SEO readiness — 18 October 2026

**Local implementation and validation completed. Ready for hosted staging and production rollout review; not approved for production execution.** No production migration, website deployment, production data mutation or hosted scheduler activation occurred. No existing backup, original migration, previous candidate or historical report was deleted or replaced.

## Delivered architecture

The new standalone migration installs permanent SEO documents/audit storage plus a durable reconciliation queue, without catalogue triggers or commerce-table writes. A separately scheduled Node worker scans current catalogue facts, queues new/changed/deleted entities, and commits generation and acknowledgement atomically. Unique keys, lease tokens, retry backoff, terminal failures and operator retry make repeated and interrupted work safe. Automatic generation is deterministic; optional AI remains an authenticated admin draft operation, independent of commerce, with deterministic provider-failure fallback and human publication approval.

Admin SEO now shows pending/failed counts, the last reconciliation/completion, stale-worker warnings and sanitized retry errors. Storefront reads use current deterministic facts when stored source or approval is stale. The missing preorder flag mapping in the root workspace was restored from the behavior already present in the previous release candidate; no checkout or payment implementation was altered.

## Files created or modified in this continuation

| Area | Files |
| --- | --- |
| Standalone migration | `supabase/alternatives/202610180002_seo_decoupled.sql` |
| Read-only verification | `supabase/verification/seo-decoupled-postflight.sql` |
| Scheduled worker | `scripts/seo-sync-worker.mjs` |
| Admin status/API | `app/admin/seo/page.tsx`, `app/api/admin/seo/route.ts` |
| Metadata safeguards | `lib/seo-store.ts`, `lib/product-share.ts` |
| SQL/worker/concurrency tests | `scripts/test-seo-decoupled.mjs`, `scripts/test-seo-concurrency.cjs`, `scripts/test-preorder-sql.mjs` (optional failure-injection mode) |
| Application/browser tests | `tests/seo-sync.test.ts`, `scripts/smoke-seo-dashboard.mjs` |
| Isolated candidate preparation | `scripts/prepare-seo-decoupled-candidate.cjs` |
| Documentation | `docs/seo-decoupled-rollout-20261018.md`, this report, supersession notice in `docs/seo-system.md` |
| Visible change history | `lecomax-learning-app/changes/seo-decoupled-implementation-20261018.json`, linked verification report, generated `lecomax-learning-app/data/change-history.json` |
| Local release/evidence | `release/seo-decoupled-20261018/`, `artifacts/seo-decoupled-*`, retained synthetic concurrency clusters and their results |

The original reviewed migration remains byte-for-byte unchanged, SHA-256 `958e8727fb9d5f32df6702b00cd17e1e0a2e71b98674f1523ae29e439af3332f`. **Do not apply it.** The alternative SQL SHA-256 is `1f084348a0702a9ae6f5a2a52a59537c544d8b8aa2dc7e86e6fe38c33a725445`. Never run 001 followed by the alternative. The new installer requires an absent SEO schema; reruns fail transactionally without replacing data. Worker/reconciliation/retry operations are repeatable.

## Actual validation

| Check | Result |
| --- | --- |
| Trigger-free SQL and actual worker orchestration in PGlite | Passed creation/update/deletion, bulk backfill, stock filtering, queue-offline catch-up, generation failure, all eight retry attempts and exponential delays, terminal retry recovery, lease expiry, stale-token/duplicate completion, single-row identity, permanent approvals, stale-draft conflict, RLS/grants, internal-function/sequence denial, read-only postflight and safe migration rerun |
| Existing inventory/checkout SQL with SEO deliberately broken | Passed the existing standard/preorder, variants, mixed cart, fulfillment, cancellation, idempotency, rollback, configuration snapshot, coupon-limit and RPC-permission suite while queue writes and generation raised injected errors |
| Real multi-connection PostgreSQL 18.6, synthetic localhost cluster | Passed distinct concurrent claims, `SKIP LOCKED`, stale acknowledgement rejection, reconciler lock timeout and **product creation/stock writes while both SEO tables held exclusive locks**. Cluster stopped afterward |
| Application tests under Node 24.22.0 | 46 distinct focused tests passed across SEO API/engine/sitemaps/indexing, new synchronization/store safeguards, preorder API/rules/retry and mobile-cart reconciliation |
| Exact isolated candidate focused tests | 26/26 passed |
| TypeScript | Root `tsc --noEmit --incremental false` passed after restoring the missing preorder mapping; candidate Next.js type validation passed |
| ESLint | Focused lint passed with no output. Full build lint completed with existing unrelated warnings |
| Next.js production build | Passed under Node 24.22.0 / Next.js 15.5.24, exit 0, using the isolated candidate and placeholder credentials; existing workspace-lockfile, cache and unrelated lint warnings retained |
| Browser tests against local production build | Passed draft/edit/approve/reset/bulk/history/conflicts; synchronization counts, errors, stale/unavailable/healthy states; no horizontal overflow at 375, 768 and 1440 pixels. Mobile screenshot visually inspected. Data/auth were isolated fixtures |
| Change-history tests | 6/6 persistence, append protection and UI interaction tests passed; learning-app TypeScript passed; final manifest check recorded in verification report |

Evidence includes `artifacts/seo-decoupled-sql.log`, `seo-decoupled-typecheck-final.log`, `seo-decoupled-lint-final.log`, `seo-decoupled-build-final.log`, `seo-decoupled-browser.log`, `seo-decoupled-candidate-tests.log`, screenshots under `artifacts/seo-decoupled-ui/`, and `artifacts/seo-concurrency-1792350109802/result.json` (2026-10-18T19:02:01.501Z).

Reproduce the principal local checks from the repository root with Node 24:

```text
node scripts/test-seo-decoupled.mjs
node scripts/test-preorder-sql.mjs --with-seo-failures
node scripts/test-seo-concurrency.cjs
node --test tests/seo-sync.test.ts tests/seo-api.test.ts tests/seo-engine.test.ts tests/seo-sitemap.test.ts tests/product-indexing.test.ts tests/preorder.test.ts tests/preorder-api.test.ts tests/preorder-retry.test.ts tests/mobile-cart-reconciliation.test.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false
node lecomax-learning-app/scripts/change-report.cjs --check
```

The native concurrency harness requires the installed PostgreSQL 18 Windows tools and loopback port 55441. The browser harness requires a local built server and placeholder test session configuration; its requests are fixtures. `supabase/verification/seo-decoupled-postflight.sql` is the new read-only SQL check; the previous trigger-based postflight does not apply.

Initial validation exposed the root preorder type mismatch; its correction passed typechecking. The first native PostgreSQL attempt could not create its Windows token in the sandbox; the subsequent loopback guard needed `host(inet_server_addr())` to normalize `/32`. Both harness issues were corrected and the test passed. The first build could not fetch Google Fonts inside the sandbox; the network-enabled retry passed. These were local validation failures, not production incidents. Original logs and clusters remain retained.

## Release scope and remaining risks

`artifacts/seo-decoupled-candidate-final.json` inventories the isolated candidate, derived from the earlier recorded production commit `d9d1d7a7b274fe3df9f70bb154704ea9e07e78ee` plus the previously reviewed SEO overlay and this continuation. Unchanged overlay files were hash-checked against the earlier candidate. No entire dirty-worktree copy was used. The unsafe original migration is kept only under the candidate's `supabase/audit/`, outside its migrations directory. The package is a review candidate, not a published release or newly approved production commit. Current hosted HEAD was not rechecked.

The build reused installed workspace dependencies and did not run a clean Linux/Vercel install. It is not deployable as a placeholder prebuilt artifact. The candidate website source was unchanged after that build; only test/SQL-verification packaging was finalized separately. Existing broader workspace changes remain outside this release.

Hosted PostgreSQL 17/Supabase PostgREST, managed role behavior, actual admin sessions, scheduler reliability, real payment flows and production-size load remain untested in this session. Local SQL uses actual commerce functions on synthetic data; it does not certify a live checkout. The full scan is suitable for the previously reported small catalogue, but catalogue growth requires load measurement and eventual partitioning. Shared database resource exhaustion remains possible despite removing transactional SEO coupling. A stopped worker causes eventual-consistency lag; current-fact storefront fallback and heartbeat monitoring mitigate it. Configure effective server statement limits and scheduler runtime limits as described in the rollout plan.

The [rollout plan](seo-decoupled-rollout-20261018.md) covers environment names, reviewed migration execution, worker activation, backfill, monitoring, failed-job retry, pausing and recovery. Separate approval is still required for any production migration, worker activation or deployment. Existing backups have not been refreshed or re-certified here.
