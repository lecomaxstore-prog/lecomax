# Final SEO production preparation

**GO for approval review; NO-GO for production execution.** No production data/schema/configuration changes, deployment, worker call or new backup occurred. Account 6's successful worker/SQL/concurrency tests remain retained evidence and were not repeated.

## Refreshed production evidence

At 2026-10-18T21:38:52.285Z UTC, GET-only Vercel metadata and read-only SQL/HTTP verified:

| Item | Verified state |
| --- | --- |
| Website | `lecomax`, project `prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb`, root null, Next.js, Node 24.x, Fluid enabled, Hobby |
| Current and rollback baseline | READY production deployment `dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx`, source `d9d1d7a7b274fe3df9f70bb154704ea9e07e78ee`; still serves lecomax.com |
| Baseline deployment URL | `https://lecomax-bf5hgr5bl-lecomaxstore-4321s-projects.vercel.app` |
| Worker project | Complete accessible project inventory found no SEO-name or seo-vercel-root match; no explicit dedicated worker ID is configured or verified |
| Database | Supabase `yddqwgdgeljkzfsmtein`, PostgreSQL 17.6, verified TLS, read-only transaction, no SEO object/ledger collisions |
| Catalogue/activity | 34 active products + 4 active categories, no invalid required fields, zero long transactions/lock waiters at inspection; no SEO catalogue/commerce triggers |
| REST/auth baseline | Service catalogue and OpenAPI GET 200; anonymous and invalid-session Admin sync GET 401; new RPCs absent as expected before migration |
| RPC timeout | Authenticator statement_timeout and lock_timeout 8s; effective hosted worker RPC timeout not yet measured |
| Scheduler | Worker crons empty; pre-existing website schedules remain unchanged |

Evidence: `artifacts/seo-final-preparation/readonly-1792359532285.json`. Initial sandbox EACCES is retained separately; the authorized read-only retry succeeded. Presence checks did not output secret values. The deployed baseline is a verified rollback target, not a rollback rehearsal or guarantee against later deletion/drift.

## One newly resolved application blocker

The final authentication review discovered that `/api/admin/seo/sync` was missing from the shared policy and therefore defaulted to owner-only in middleware/API guards. This rejected fully authorized staff before the route checked its three required catalogue permissions. Earlier route tests mocked those guards.

Changed only the exact SEO sync policy entry in `lib/admin-policy.ts`. Active staff can reach the existing per-route checks; missing products.view/products.edit/categories.edit still denies access. New tests exercise the real guard chain, origin checks and rate limiter. All three new regressions failed on the old policy and passed after the change; 13 focused authorization/API tests, focused lint and root TypeScript passed. Broader worker/SQL/concurrency tests were not repeated because those components are unchanged.

The corrected isolated candidate's production-mode build passed on Node 24.22.0 at 21:46:45.124Z UTC (228 static pages), with non-secret placeholder service configuration and normal TLS verification. A new build was justified by the shared middleware policy correction. The initial sandbox attempt failed to access Google Fonts (EACCES); the authorized network retry passed. Existing lint warnings remain. This is not hosted production acceptance; never upload placeholder prebuilt output. Evidence: `artifacts/seo-final-preparation/build-retry-result.json`, `build-retry.log`, `auth-before.log`, `auth-after.log`, `typecheck.log`, `lint.log`.

## Release scope

Use **`release/seo-final-20261018`**, manifest `artifacts/seo-final-preparation/candidate.json`. It is the production source baseline plus 36 pinned overlay files: the previous 34-file SEO overlay with the single policy correction, the new regression test and the reviewed generated `next-env.d.ts`. Its 2,602 source files were compared with all 2,577 baseline source files; every delta is pinned, with no unexpected source changes. Build caches, dependency directories, Vercel link data and generated source-library output are excluded from this source comparison and must not be uploaded as prebuilt production output.

The initial strict comparison flagged only the previously unpinned Next-generated declaration; the new manifest explicitly pins it. Previous candidate, reports and baseline archive were preserved. Do not publish from the dirty root (642 entries at initial inspection), do not copy root env files, and do not relink the worker to the website. The new preparation scripts/documents are local operational tools, not website overlay files. Deploy reviewed source with real hosted configuration and a clean hosted build.

Worker code/config remains exactly the eight-file manifest `artifacts/seo-account6/worker-manifest.json`; it has no runtime dependencies, uses supported `.mjs` Node APIs, declares `24.x` and sets maxDuration 60. Node 24 is supported by Vercel and 60 seconds is within Hobby Fluid's documented 300-second maximum. This verifies compatibility on paper and through retained local tests; actual worker packaging/protection/runtime remains unverified until a dedicated project is approved and deployed. [Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [runtime](https://vercel.com/docs/functions/runtimes/node-js), [duration](https://vercel.com/docs/functions/configuring-functions/duration).

## Environment names and initial values

| Target | Required names | State / initial setting |
| --- | --- | --- |
| Existing website | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL | Production names present; preserve values |
| Existing website auth | ADMIN_SESSION_SECRET | Absent; preserve established auth fallback, do not introduce implicit rotation |
| Website manual adapter | SEO_WORKER_URL, SEO_WORKER_CRON_SECRET, SEO_MANUAL_SYNC_ENABLED | Absent; approved exact dedicated HTTPS vercel.app `/api/sync` URL, shared worker secret, manual flag false until gate C |
| Dedicated worker | CRON_SECRET, SEO_SYNC_SUPABASE_URL, SEO_SYNC_SERVICE_ROLE_KEY, SEO_SYNC_ENABLED | Not verified on a named hosted project; independent >=32-character worker secret, exact official project URL, server-only service key, false until gate C |
| Platform | VERCEL_ENV | Supplied by Vercel; worker and manual invocation require production |

Optional SEO_AI_BASE_URL/API_KEY/MODEL and MiraiAPI are not prerequisites for deterministic fallback. No credential generation, upload or retrieval is implied by this list.

## Backup and recovery

The retained 18:37:25Z archive's existence/metadata were rechecked in `backup-metadata.json`. Account 6's checksum/full-read/schema-match verification remains the retained integrity evidence; this session did not repeat the restore or claim a new full archive check. It is not fresh enough for execution. No backup was created prematurely.

Immediately before a future approved migration window, run the reviewed `artifacts/production-backup.cjs` with secure environment configuration, verified TLS, pinned project identity and PostgreSQL 18 tools. Require unique external archive path, successful exit, checksum, full traversal, metadata report and migration start <=15 minutes from backup start. Preserve earlier archives. Recheck the exact target before invocation; the backup helper cross-checks the configured project with live-site source rather than hardcoding the official ref. Clear stale PGHOSTADDR before use; prefer the already reviewed session-pooler connection. Stop on any failed gate or expired freshness window.

Recovery limitations remain explicit: the earlier full local Supabase restore had 36 managed-extension/ownership errors; the selected application-data profile subsequently restored successfully and verified rows. The latest archive itself was not restored. Logical backups exclude external Storage binaries, hosted secrets and complete managed-service recovery. Use provider-supported managed recovery or a separately reviewed application recovery plan for disaster recovery; never overlay the portable local profile onto production. Routine SEO recovery is to pause the worker and roll back the website, leaving additive SEO data intact.

## Four separate production approval gates

| Gate | Approved scope required | Acceptance / stop condition |
| --- | --- | --- |
| **A — Database** | Named operator/window, fresh verified backup, official project, standalone 002 and separately explicit run-control transaction | Repeat preflight/hash checks; apply 002 through reviewed wrapper, then its postflight; apply control with bounded transaction and then fenced-access postflight. Stop on drift, unknown commit or failed assertion. No deployment or execution implied |
| **B — Vercel** | Dedicated worker provisioning/configuration and disabled deployment; separately named website deployment of final candidate | Node 24, actual function duration/protection, secure env presence, clean hosted builds; both activation flags false, SEO crons empty. Complete real Admin/PostgREST acceptance. No worker run implied |
| **C — Manual execution** | Explicit worker/manual activation, first bounded run, stated repeat/overlap test scope | Correct actor, durable counts, catalogue coverage, idempotency, no secret leakage, measured timeout acceptance and monitoring ready. Unknown outcome means inspect status, not automatic retry |
| **D — Scheduled execution** | Separate daily scheduler/configuration deployment approval | Accept daily/backlog freshness, nominate alert recipient, verify actual alert delivery and two observed invocations; only then certify unattended behavior |

Migration A1: `supabase/alternatives/202610180002_seo_decoupled.sql`, SHA-256 `1f084348a0702a9ae6f5a2a52a59537c544d8b8aa2dc7e86e6fe38c33a725445`.

Migration A2: `operations/seo-vercel/supabase/migrations/20261018193508_seo_worker_run_control.sql`, SHA-256 `39b1ad24d16124cddbb2d49052fd0d185b67681418e4a6dc0a3dd4ea1f2cf079`.

Both are additive and contain no commerce trigger. A2 revokes old unfenced worker RPC access. Use ON_ERROR_STOP, verified target/TLS, transaction_timeout 120s and idle_in_transaction_session_timeout 15s in the migration session; migrations have their own lock/statement bounds. Never use blanket db push, synchronous 001, historical staging runners referencing 001, automatic ledger writes, or trigger-disable rollback SQL. The old migration is retained only under `supabase/audit/` in the website candidate and excluded from the executable migration path; the root historical original must not enter rollout.

Gate B can be split to approve worker provisioning/disabled packaging before gate A, if desired; that is still a production configuration approval and was not performed. Synthetic hosted staging and real test identities must be arranged before declaring hosted acceptance complete. The current worker cannot be pointed at staging without a distinct reviewed test package because its production binding is intentionally fixed.

Hobby permits once-daily schedules with hour-level timing. Proposed `0 3 * * *` remains inactive. Faster freshness requires a separate hosting/plan decision; a daily backlog can take multiple days and the existing 15-minute Admin warning needs policy acknowledgement or separately scoped revision. [Official cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

## Rollback and unresolved blockers

The exact website rollback is `dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx` in the existing website project. Recheck READY state, project and retained source immediately before rollout. Under explicit incident approval, pause worker schedule/activation and website manual activation, account for in-flight requests, then roll back website routing. Website rollback alone does not stop the worker. Do not restore commerce data or delete SEO history as routine rollback; do not regrant legacy RPCs to run old worker binaries.

The [hosted acceptance matrix](seo-hosted-acceptance-20261018.md) and default-dry-run `scripts/seo-hosted-acceptance-readonly.cjs` are prepared. Remaining blockers require external state or approvals: no named dedicated worker project/runtime/secrets; no installed SEO schema/RPCs; no real hosted owner/staff acceptance or effective RPC timeout measurement; no accepted alert recipient/daily freshness policy; no fresh execution-window backup; no A/B/C/D approvals. Current 8s role settings are not a timeout measurement. [Supabase timeout scopes](https://supabase.com/docs/guides/database/postgres/timeouts).

Stop here. The first production-changing action in the database-first sequence is gate A's migration, after its just-in-time backup and rechecks; alternatively dedicated worker provisioning needs gate B approval first. No further production-changing action is authorized by this preparation request.
