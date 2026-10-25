# Account 6 production readiness

**GO for reviewed local preparation; NO-GO for production execution.** No migration, deployment, production mutation, secret rotation or SEO scheduler activation occurred. Application code and existing release candidates were preserved. This report closes the unfinished build verification and updates the manual-sync rollout instructions; prior reports remain historical evidence.

## Build and font investigation

The inherited `artifacts/seo-manual-build-result.json` already recorded exit 0 at 2026-10-18T19:43:14.415Z on Node 24.22.0. Its log contains two TLS connection interruptions followed by a successful compile and completed build, so the handoff's unfinished-build statement was stale.

A new production-mode Next.js 15.5.24 build of `release/seo-manual-20261018` completed with exit 0 on Node 24.22.0, from 21:26:36.284Z to 21:30:29.006Z UTC. All 228 static pages generated. Evidence: `artifacts/seo-account6/build-result.json` and `build.log`. Existing lint warnings and workspace-root inference warnings remain. This was a local build with deliberate non-secret placeholder service configuration and existing caches, not a clean hosted build or production integration certification. Never upload its prebuilt output to production.

Installed Next font code uses HTTPS requests, environment proxy detection and three retries. Sandbox Google Fonts probing returned EACCES; the authorized outside-sandbox retry fetched both Google CSS and font binary with HTTP 200 and normal TLS verification. No HTTP(S) proxy or extra CA environment configuration was present. No TLS bypass or font mock was added. Historical connection interruption is consistent with transient network failure, not evidence of a deterministic application error; its exact network cause cannot be reconstructed. System interception cannot be categorically ruled out from environment checks alone. Typography is unchanged. Evidence: `font-probe.json`, `font-probe-retry.json`.

## Validation and worker review

- Root TypeScript with `--noEmit --incremental false`: passed. Candidate type validation also passed within Next build.
- Focused ESLint for SEO UI/API/libraries and worker handler: passed.
- SEO engine, API, queue, sitemap, manual-sync and indexing regression tests: 30 passed.
- Worker adapter and SQL integration: 14 passed, including persistent completed/failed/interrupted status, idempotent repeat execution, authorization, disabled/preview/target gates, deadlines, sanitized errors and denied legacy RPC access.
- Decoupled SQL suite: passed actual SQL generation, create/update/delete reconciliation, stock isolation, failure catch-up, retry/backoff/exhaustion/recovery, stale tokens, approvals and RLS/grants.
- Commerce SQL with deliberately broken SEO generation/queue: passed standard/preorder, variants, mixed carts, rollback, fulfillment, cancellation, immutable snapshots, coupons, idempotent redemption and RPC permissions. This is isolated PGlite evidence, not production checkout testing. The seven-file migration bundle integrity check also passed.
- Native PostgreSQL 18.6 multi-connection test: passed on final retry (`concurrency-final.log`). Only one run acquired the lease; distinct jobs used SKIP LOCKED; expired run replacement rejected stale steps; stale job acknowledgement was rejected; stock writes succeeded while SEO queue/documents/control were locked. Initial attempts failed at the harness's 30-second initdb boundary during concurrent build activity; retained logs show initialization completed in one timed-out attempt. No failed attempt is counted as a pass.

The manual API checks session, same origin and all three catalogue permissions before invoking the worker; permissions are refreshed per request. Its rate bucket is process-local, not a distributed quota. Shared SQL run fencing provides cross-instance exclusion. The run lease is 90 seconds; job lease is 60 seconds. Each fenced step locks the control row and validates token/state/expiry. Expired workers cannot finalize a successor. Status persists the latest run, not a complete historical audit.

The worker has a 45-second deadline, 10-second per-request cap, 100-job cap and 30-second reserve before a new claim. Finalization can consume two additional bounded three-second requests, within its configured 60-second platform cap. The admin proxy's 52-second timeout and browser's 56-second timeout do not prove SQL cancellation. Hosted effective RPC timeout remains a required measurement. No commerce trigger or synchronous SEO dependency is introduced by either approved candidate migration. Shared database resource contention remains possible.

## Actual hosting, migration and backup evidence

GET-only Vercel inspection at 21:28:56Z and 21:30:21Z UTC confirmed:

- Website project `prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb`, Node 24.x, team plan Hobby.
- `lecomax.com` still targets READY deployment `dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx`, source `d9d1d7a7b274fe3df9f70bb154704ea9e07e78ee`. This existing pre-SEO deployment is the rollback baseline, not a rollback performed or rehearsed this session.
- Production Supabase URL/anon/service-key names and ADMIN_EMAIL exist. Website SEO_WORKER_URL, SEO_WORKER_CRON_SECRET and SEO_MANUAL_SYNC_ENABLED are absent. ADMIN_SESSION_SECRET is absent; preserve established authentication behavior rather than rotating secrets implicitly. Optional AI names are absent and do not block deterministic SEO.
- All 34 pinned website candidate hashes matched. Unsafe `202610180001_seo_engine.sql` is absent from its executable migration directory. Never deploy the dirty repository root or use blanket Supabase migration push: the unsafe original remains in the root only as retained prior work.

Read-only PostgreSQL inspection used verified TLS and read-only transactions against project `yddqwgdgeljkzfsmtein`. Standalone migration 002 had no object/ledger collisions, catalogue integrity failures, SEO commerce dependencies, long transactions or lock waiters. A separate run-control preflight at 21:31:35.974Z found no relation/function/ledger collisions for the new control migration. These are point-in-time checks and must be repeated before execution.

The retained external backup `C:/Users/Ziko/Backups/LECOMAX/lecomax-production-2026-10-18T18-37-25-364Z.dump` passed SHA-256, complete archive read, 1,233-entry inspection and comparison of 1,114 schema blocks with no differences. It was 172.2 minutes old at this inspection, failing the <=15-minute execution gate. Its exact archive has not been restored; logical backup coverage and managed-service exclusions remain as previously documented. No backup was deleted or replaced.

Evidence: `artifacts/seo-account6/hosting-details.json`, `hosting-retry.log`, `production-readonly-retry.log`, `run-control-preflight.json`. No credential values were output.

## Exact approval-gated rollout

1. Agree the operator/window, recovery point and hosted acceptance plan. With explicit scope for the backup operation, create one fresh external backup using the reviewed backup script, verify checksum/full read, preserve all older archives and require migration start within 15 minutes of backup start.
2. Repeat read-only identity, schema/catalogue/activity, both migration collision checks and candidate/bundle hashes. Stop on drift. Capture business fingerprints and verify rollback availability again.
3. With separate database approval, apply only standalone 002 through `operations/seo/apply.psql`. Expected SHA-256: `1f084348a0702a9ae6f5a2a52a59537c544d8b8aa2dc7e86e6fe38c33a725445`. Run `operations/seo/postflight.sql` before adding control. Then, under separately explicit approval for the control addition, apply `operations/seo-vercel/supabase/migrations/20261018193508_seo_worker_run_control.sql`, hash `39b1ad24d16124cddbb2d49052fd0d185b67681418e4a6dc0a3dd4ea1f2cf079`, with verified target, ON_ERROR_STOP, 120-second transaction and 15-second idle caps. Never apply synchronous 001 or automatically insert ledger records. Unknown commit outcome means inspect, not retry.
4. Run `operations/seo-vercel/supabase/run-control-postflight.sql`; require every assertion true, service-role fenced access and browser/legacy denial, no business-definition drift. Verify actual PostgREST discovery/access without mutation probes under read-only scope. Old direct-worker grants are intentionally revoked.
5. With separate worker deployment approval, create/verify a dedicated Vercel project for `operations/seo-vercel`, Node 24, framework Other, configured 60-second duration. Supply CRON_SECRET, SEO_SYNC_SUPABASE_URL and SEO_SYNC_SERVICE_ROLE_KEY securely; keep SEO_SYNC_ENABLED false and crons empty. Verify clean hosted packaging, protection/access behavior, logs and timeout support. Never relink the existing website project. Independently approve and build/deploy the 34-file website candidate from reviewed source with manual activation disabled.
6. Test real owner, authorized staff, view-only/product-only staff and unauthenticated boundaries. Hosted session and UI acceptance remains untested locally. Do not publish/edit real products as an implicit test.
7. Separately approve worker/manual activation and a bounded smoke run. Set the website worker URL/shared worker secret and manual flag securely. Require persistent counts, correct catalogue coverage, repeat-run idempotency and overlap rejection. Check effective SQL timeout safely in a separately scoped environment; never inject commerce faults into production.
8. GET representative product/category metadata, canonical, JSON-LD and all sitemap types, including standard/preorder facts. Confirm fallback and approved content behavior. Verify database persistence independently.
9. Only after separate scheduler approval, activate the once-daily `0 3 * * *` proposal. Current `operations/seo-vercel/vercel.json` remains `crons: []`. Hobby allows daily schedules with hour-level precision; five-minute freshness requires a separately approved hosting/plan decision. Accept daily/backlog latency explicitly and reconcile the admin's existing 15-minute freshness warning with this policy. Do not bypass limits with staggered jobs or self-invocation.
10. Nominate alert delivery and observe two actual scheduled runs before claiming unattended reliability. Monitor heartbeat older than 27 hours, terminal failures, queue age, repeated partial batches, worker duration/5xx and commerce errors. Rollback of the website does not stop the worker: separately disable activation/schedule, preserve data/history and account for in-flight work. Old worker binaries fail after grant revocation; SQL regrant/repair/full restore requires its own reviewed approval.

## Remaining blockers and next approval

Production remains NO-GO until backup freshness, a named dedicated worker project with configured secrets, clean hosted build/runtime/RPC acceptance, real admin tests, alert routing, daily freshness acceptance and explicit phase approvals are satisfied. Current local validation does not certify production execution. Optional MiraiAPI is not required for deterministic fallback.

The next production-related operation requiring explicit scope is a fresh verified backup in an agreed migration window. It does not authorize either migration, deployment, activation or production smoke writes. Prepare hosted acceptance arrangements first so the backup does not expire while those decisions are pending.

## Session files and history

Added this report and `artifacts/seo-account6/` validation scripts, logs, current eight-file worker manifest and structured evidence. Appended `lecomax-learning-app/changes/seo-account6-readiness-verified-20261018.json` and its linked `seo-account6-history-verified-20261018.json` follow-up through the official history command, which regenerated `lecomax-learning-app/data/change-history.json`. No application source correction was justified by this review. Existing reports, backups and candidates were preserved. Learning-app TypeScript, focused history lint and all six history/archive/interaction tests passed. The final official history check passed with 555 retained reports. No live preview was checked or attached.

Current official references: [Vercel cron usage and plan limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), [cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [Hobby limits](https://vercel.com/docs/plans/hobby). A configured 60-second cap is this package's choice; it is not a claim that every Hobby runtime has a 60-second maximum.
