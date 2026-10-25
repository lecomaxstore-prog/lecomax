# Isolated Vercel SEO worker — prepared, not deployed

Current audit: [production readiness continuation](../../docs/seo-production-audit-20261019.md). Editorial v3 uses `gpt-6.1-sol` by default and `gpt-6-astra` optionally. The saved two-request comparison is complete; do not repeat it. The full five-file migration chain, including `202610190003_seo_editorial_review.sql`, now has an isolated synthetic SQL review test. Production remains unmigrated. The latest website quality candidate is build-only, and a matching v3 worker release still needs packaging. The historical paragraphs below do not certify current hosting, pricing, plan eligibility, dependencies, activation or deployment. OpenAI SDK 6.42.0 is a runtime dependency. Keep all activation flags false and the cron list empty.

Latest local revision: [premium editorial readiness](../../docs/seo-premium-readiness-20261019.md). It adds the official pinned OpenAI SDK, editorial Luna/Sol/Astra selection, explicit owner authorization per paid job, and prepared SQL `202610190002_seo_editorial.sql`. Keep `SEO_AI_ENABLED`, `SEO_EDITORIAL_ENABLED` and `SEO_SYNC_ENABLED` false. The new SQL must follow all three previous decoupled/run-control/AI-budget migrations in a separately approved window. Historical hosting and dependency statements below describe older revisions; do not treat them as current activation instructions. No paid premium comparison has run.

Current reliability revision: see [manual sync and run control](../../docs/seo-manual-sync-readiness-20261018.md). The worker now requires the additional run-control migration and uses a shared database lease for manual/cron execution. Older direct RPC workers are denied after that migration. Earlier test counts and architecture notes below describe the prior daily-worker revision.

Use this directory as the root of a **separate** Vercel project with framework Other and Node 24. Never link it to the existing `lecomax` website project. It has no third-party runtime dependencies. `lib/seo-sync-worker.mjs` is the unchanged exported orchestration from the reviewed root worker; the offline test checks equality. The existing Linux/systemd package remains an alternative. Run only one scheduling system.

`vercel.json` deliberately contains an empty `crons` list. No new Vercel project, environment setting, deployment or scheduler has been created. Production verification and explicit approval are required before installation or activation.

This revision supersedes the earlier five-minute proposal for the current Hobby plan. All earlier manifests/reports remain historical evidence. Local validation under Node 24: 11 adapter/configuration tests and one adapter-to-PGlite integration test passed; focused ESLint passed. The initial integration fault-injection fixture omitted the existing SQL parameter names; correcting the fixture made the test pass without changing migration SQL. `npm test` runs dependency-free adapter tests; `npm run test:integration` requires this repository's development PGlite installation. Hosted packaging, actual cron delivery and runtime credentials remain untested.

Required server-only production environment variables:

- `CRON_SECRET`: independent random secret of at least 32 characters; Vercel Cron sends it as a Bearer authorization header. Do not reuse any admin or database secret.
- `SEO_SYNC_ENABLED`: keep `false` until worker execution is approved.
- `SEO_SYNC_SUPABASE_URL`: exactly `https://yddqwgdgeljkzfsmtein.supabase.co`.
- `SEO_SYNC_SERVICE_ROLE_KEY`: securely inject the reviewed official project service credential; never place it in source or public variables.
- `VERCEL_ENV`: platform supplied; the handler rejects values other than `production`.

An authenticated GET to `/api/sync` **writes SEO state** when enabled. Never use it as a read-only health check. There is no user-selected RPC, target, or batch size. All responses disable caching; exceptions and database error bodies are not returned or logged. Only sanitized counts and timing are logged. Protect logs and never log incoming Authorization headers.

The handler awaits all work, stops issuing requests after 45 seconds, limits each request to 10 seconds and each run to 100 jobs. The configured platform limit is 60 seconds, below the documented Hobby Fluid Compute maximum. No new lease is claimed with less than 30 seconds remaining. Responses expose budgetExhausted and batchLimitReached so a partial drain is not mistaken for an empty queue. Client abort does not prove PostgreSQL cancellation: verify the effective PostgREST statement limit during hosted acceptance. Current read-only evidence shows authenticator statement/lock settings of 8 seconds; this is configuration evidence, not a measurement of the worker RPC timeout. Do not change shared role settings as an implicit part of this package.

Concurrent invocations are possible. Existing SQL serializes reconciliation with a one-second lock timeout and uses SKIP LOCKED and lease tokens for work claims. A competing reconciler can fail safely; alert on repeated failures. Interrupted jobs recover when their 60-second lease expires. Failed jobs retain the existing eight-attempt backoff. Terminal failures require a separately authorized retry after correction; Vercel does not replace the queue retry policy.

After migration acceptance and separate worker-deployment approval, deploy this package with activation false and no cron. Verify the new project's identity, Node version, function packaging, secret presence, duration support and access protection. A protected production URL may intercept cron requests; validate the platform's actual cron access before activation. A clean hosted build and real service-role/PostgREST execution are still outstanding.

After separate activation approval, enable the worker and invoke one authenticated run without exposing the token in shell history. Require 38 documents if the catalogue is still 34 products plus 4 categories, no failures and current heartbeat. Invoke again: unchanged catalogue must reconcile zero changes and complete zero additional jobs. Read SQL and REST independently to verify persistence. Stop if any gate fails.

Only then, with schedule activation approved, add this entry to `crons` and deploy the worker configuration:

```json
{ "path": "/api/sync", "schedule": "0 3 * * *" }
```

The current team is Hobby (read-only evidence: 2026-10-18T19:27:54.030Z). The prepared schedule is once daily at 03:00 UTC, with Vercel's hour-level scheduling precision; no plan upgrade or VPS is needed for this daily cadence. `schedule.hobby.json` records the disabled proposal and is not consumed automatically by Vercel. The active `vercel.json` still has no cron entries. After approval, copy only its `cron` object into `vercel.json` and deploy the separately approved configuration. Verify the effective Node 24 function duration before activation.

Daily scheduling changes freshness: catalogue edits may wait until the next day; a backlog exceeding the batch/time budget takes additional days. Existing exponential retry timestamps are earliest eligibility times, not guaranteed retry execution times: retries occur on later daily invocations. Vercel does not automatically retry failed cron calls. Do not add staggered jobs, self-invocation or checkout hooks to bypass plan limits. Faster freshness requires a separately approved plan change. Current-fact storefront fallback remains available.

Observe two daily scheduled invocations before certifying unattended reliability. Alert externally on 5xx/timeouts, terminal queue failures, repeated budgetExhausted/batchLimitReached and heartbeat older than 27 hours. This threshold allows the daily interval plus scheduler imprecision and operational margin. The existing admin UI's 15-minute warning measures the previous freshness target and will warn between daily runs; it is not proof of daily cron failure. Before website rollout, review that UI threshold with the accepted freshness target. No website candidate was changed in this worker-only update. Nominate an alert recipient before activation; dashboard visibility alone is not alert delivery.
Pause by disabling the schedule and setting activation false through separately approved hosted configuration. An already-running request may finish; retain all queue/documents/history. A website rollback does not stop this worker. Never use the old trigger-disable SQL for this trigger-free architecture.

References checked during preparation: [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js), [cron behavior and authentication](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [cron plan limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Supabase timeout scopes](https://supabase.com/docs/guides/database/postgres/timeouts).
