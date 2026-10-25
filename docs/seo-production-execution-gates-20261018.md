# Production execution gates — configuration continuation

Prepared only. Production remains unchanged. This checklist supersedes the synchronous instructions in seo-final-rollout-checklist-20261018.md. Keep that historical document; do not execute its commands.

## Verified evidence

Fresh GET-only hosting and read-only database evidence: `artifacts/seo-final-preparation/readonly-1792360520480.json`, captured 2026-10-18T21:55:20.480Z. Website `lecomax`, project `prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb`, team `team_yFLUcpSvgQi8EQuvuorOZW7w`; alias lecomax.com still routes to READY `dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx`, source `d9d1d7a7b274fe3df9f70bb154704ea9e07e78ee`. Supabase `yddqwgdgeljkzfsmtein`, postgres 17.6, verified TLS/read-only transaction. No SEO relations, functions or migration ledger collisions; 34 active products and 4 active categories. No long transactions or lock waiters at this inspection, not a future-window guarantee.

Scope evidence: `artifacts/seo-final-preparation/scope-1792360507734/result.json`. All 36 overlays pinned; all 2,602 candidate source files compared with 2,577 baseline files, zero unexpected changes or hash mismatches. Reviewed source is `release/seo-final-20261018`. Do not upload its placeholder `.next` build. Prior build, lint, TypeScript, authorization and concurrency results are retained, not rerun.

Worker source is the existing six-file deployable package `release/seo-worker-20261018`, recorded in `artifacts/seo-account8/worker-package.json`, derived from Account 6's eight-file manifest (including SQL). Runtime package contains no SQL or secrets. Verify its hashes before provisioning/deployment. Local specification: `operations/seo-vercel/project-preparation.json`; it is not executable API input. No hosted project exists under the reviewed SEO name/root inventory and no real worker ID is assigned.

## Gate P — provision configuration only (next approval)

Approve creating `lecomax-seo-worker` in the verified team, with no Git connection, automatic deployment, deployment, worker invocation or scheduler. Use the isolated package as the eventual CLI source, project root null, framework Other, Node 24.x, Fluid enabled, function duration 60 seconds, empty crons. Record returned project ID and prove it differs from the website ID. Link only the worker package to that ID; do not relink the website.

Provision production-only sensitive `CRON_SECRET` (independent random secret >=32 characters) and `SEO_SYNC_SERVICE_ROLE_KEY`; use the existing official project service credential through secure input, never a public variable or report. Set `SEO_SYNC_SUPABASE_URL=https://yddqwgdgeljkzfsmtein.supabase.co` and `SEO_SYNC_ENABLED=false`. No credentials in preview/development. Do not reuse an Admin/session/service key as CRON_SECRET. Verify metadata names/targets/types without decrypting values into output. Secret equality/routing requires later controlled acceptance; name presence alone is insufficient.

Prepare website production variables `SEO_WORKER_URL` (actual dedicated production HTTPS vercel.app URL ending `/api/sync`), `SEO_WORKER_CRON_SECRET` (same dedicated invocation secret), `SEO_MANUAL_SYNC_ENABLED=false` under separately included website-configuration scope. Preserve existing Supabase and Admin values and absent ADMIN_SESSION_SECRET fallback. VERCEL_ENV is platform supplied. AI/Mirai settings are optional. Never copy root env files. The worker secret grants invocation only; the service key is privileged database access.

Review dedicated deployment protection so website-to-worker and cron requests reach handler authentication. Do not change website protection. A platform login page/401 is not proof of handler authorization. Actual function packaging, protection and runtime require gate B deployment.

## Gate A — database window, separately approve A1 and A2

Name operator/window and acceptable backup recovery point. Before the window, securely load connection configuration and clear inherited PGHOSTADDR. Pin official ref, verified TLS CA, postgres database/role and session pooler port 5432. No transaction pooler. Refresh read-only identities, locks, catalogue fingerprints and migration ledger immediately before changes.

Run `node artifacts/production-backup.cjs` only at the approved window, preserving older archives in `C:/Users/Ziko/Backups/LECOMAX`. Its live-site/config comparison must match the separately pinned official ref. Require successful dump, unique archive, nonzero size, TOC, full traversal, checksum and metadata report. Start migration within 15 minutes of backup start; otherwise obtain a fresh backup. Stop on any failure. This verifies archive readability, not a fresh restore rehearsal. Managed recovery, Storage binaries and external secrets are not covered by the logical archive. Backup creation was not performed during preparation.

Read-only integrity command: `node operations/seo/verify-bundle.cjs`.

A1 exact SQL SHA-256: `1f084348a0702a9ae6f5a2a52a59537c544d8b8aa2dc7e86e6fe38c33a725445` (`supabase/alternatives/202610180002_seo_decoupled.sql`, matching `operations/seo/migration.sql`). After explicit A1 approval, use PostgreSQL 18 psql with `-X --no-password --set=ON_ERROR_STOP=1 --set=seo_approval=APPROVED_DECOUPLED_202610180002 --file=operations/seo/apply.psql`. Check exit status; then execute `operations/seo/postflight.sql` read-only and require every assertion true.

A2 exact SQL SHA-256: `39b1ad24d16124cddbb2d49052fd0d185b67681418e4a6dc0a3dd4ea1f2cf079`, file `operations/seo-vercel/supabase/migrations/20261018193508_seo_worker_run_control.sql`. After explicit A2 approval and repeated target checks, invoke psql with `-X --no-password --set=ON_ERROR_STOP=1`, command `SET transaction_timeout='120s'; SET idle_in_transaction_session_timeout='15s';`, then that file in the same session. The file owns BEGIN/COMMIT; do not add a single-transaction wrapper. Require `operations/seo-vercel/supabase/run-control-postflight.sql` assertions afterward. A2 intentionally revokes unfenced RPC grants; do not rerun A1 postflight expecting its former worker grants afterward.

Never run synchronous 001, blanket db push, the old staging runner, automatic ledger insert or trigger-disable rollback. Candidate 001 exists only as an audit copy. No deployment or worker call is implied. Unknown commit means read-only inspection, never blind retry. Stop after any failed assertion or unexpected business-data drift.

## Gate B1 — disabled worker deployment

Require approved real project ID, verified package hashes and false activation. Separately approve source deployment from `release/seo-worker-20261018` to that project, no prebuilt upload. Confirm Node 24, 60-second function duration, empty crons and actual access policy from deployed metadata. No successful worker run is authorized. Under explicit disabled acceptance scope only, check unauthorized 401, unsupported method 405 and authorized WORKER_DISABLED 503, with no begin-run RPC. Recheck activation independently immediately before the authorized GET because GET /api/sync writes when enabled.

## Gate B2 — website deployment and hosted acceptance

After A acceptance, approve only `release/seo-final-20261018` to the existing website project. Recheck alias/base SHA and all source hashes; stop on drift. Build hosted source using the lockfile and real hosted environment. Keep both activation flags false. Use `docs/seo-hosted-acceptance-20261018.md` for the exact owner/full-editor/view-only/anonymous/expired/suspended/origin matrix, RPC discovery and service-role-only privileges, no-store/token-redaction and UI polling.

Prepared dry-run: `node scripts/seo-hosted-acceptance-readonly.cjs`. Only after deployment use its `--execute-readonly` with genuine securely supplied test cookies. Missing actors are not-run. RPC transport acceptance may invoke only reviewed SELECT-only seo_run_status; never probe mutating RPCs to test denials. Inspect definitions and grants first. Real Admin credentials/test identities and isolated hosted timeout fixture remain prerequisites. The observed 8-second authenticator timeout is configuration, not effective cancellation proof. No production sleep fixtures or synthetic commerce locks.

## Gate C — manual activation and bounded persistence tests

Before approval, nominate an alert owner/recipient and transport, configure independent monitoring and prove delivery under separately authorized notification scope. ADMIN_EMAIL is not evidence of an SEO alert destination. Worker code emits sanitized JSON logs but does not send alerts. Monitor 5xx/timeouts, failed/partial durable run state, terminal jobs, oldest pending queue age, repeated budget/limit exhaustion and missed heartbeat. Record concrete queue-age escalation thresholds with the accepted freshness policy. Dashboard inspection alone is insufficient.

Approve both activation flags and one bounded run separately from deployment. Explicitly include an unchanged-catalogue repeat and optional overlap attempt. Require persisted SQL/REST counts, 38 active entities only if catalogue unchanged, durable completed status, zero extra jobs on unchanged repeat and 409 on true overlap. Inspect unknown outcomes before retrying. Draft/save/version-conflict/approval/reset canaries require separate inactive fixture and cleanup/retention approval; do not edit live products or create orders. Check rendered canonical/metadata/JSON-LD/sitemaps for standard and preorder products without mutating catalogue data.

## Gate D — daily scheduling

Approve schedule `0 3 * * *` in UTC and its separate deployment only after manual acceptance, delivered alerts and accepted daily freshness/backlog policy. Keep scheduling absent until then. Hobby permits once daily with hour-level timing; do not promise exact 03:00 or bypass limits with staggered jobs. Require two observed scheduled invocations; heartbeat escalation after 27 hours. Existing 15-minute UI freshness warning requires explicit policy acknowledgement or a separately reviewed UI change. See [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing) and [function duration](https://vercel.com/docs/functions/configuring-functions/duration).

## Gate R — incident authority, separate from rollout

Approve pausing manual and worker activation plus removing schedule/config deployment; account for in-flight work. Then, if separately authorized, rollback website to `dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx` after checking availability/project. Rollback does not stop the worker or reverse environment settings. Preserve additive SEO data/history. Never reset leases, regrant legacy RPCs, drop tables or restore the full commerce database as routine rollback. SQL repair and disaster restore need their own reviewed approval.

## Genuine remaining blockers

No dedicated hosted worker ID/configuration or deployment; website SEO env names absent; migrations/RPCs absent; hosted real-user/protection/persistence acceptance and effective RPC timeout not measured; no nominated alert recipient/transport/delivery proof or accepted daily freshness policy; fresh window backup pending. These are external configuration, approval or hosted acceptance dependencies, not reasons to rebuild the engine. Next requested approval is Gate P only; A, B1, B2, C, D and R stay separate.
