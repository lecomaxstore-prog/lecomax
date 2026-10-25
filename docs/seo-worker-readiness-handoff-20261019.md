# SEO worker readiness continuation — 19 October 2026

Production readiness: **NO-GO**. Hosted staging execution: **NO-GO**. No production access, hosted writes/migrations/restores, deployment, activation, paid requests, credential changes or CLI relinking occurred.

## Recovered state

Read `seo-session-recovered-20261019.md`, current instructions/history schema, worker/runtime/tests, migration inventory, staging-owner checklist and relevant SEO sources. Initial Git status has 711 entries and is preserved in `artifacts/seo-worker-readiness-20261019/initial-status.txt`. No previous changes were reset or replaced.

Before edits the editorial workspace, browser fixture and both worker modules matched the last successful isolated snapshot. After edits, a complete file-content comparison of `app`, `components`, `lib` and `operations/seo-vercel/lib` against `release/seo-editorial-check-1792445435403` found only the two worker modules changed. Six migration hashes still match; no migration was altered. Evidence: `integrity.json` in the artifact directory above.

## Implemented

- `operations/seo-vercel/lib/seo-ai-worker.mjs`: recheck the provider/persistence time reserve after claiming an AI job. An exhausted reserve refuses generation and settlement; the existing durable lease/fencing recovery remains responsible for the claimed job. No automatic paid retry or reservation release was introduced. Conservative accounting may retain the reservation even though generation did not start.
- `operations/seo-vercel/lib/handler.mjs`: reject non-finalization RPCs after the run deadline, retain bounded finalization, require 25 seconds remaining after the claim, and persist AI time/batch cutoffs through the existing budget/limit flags. Previously a three-job AI cutoff or time cutoff could report the run completed despite not checking whether more AI jobs remained. Cutoffs now report partial status; this means potentially deferred work, not a measured queue count. A known empty AI queue still completes normally. A post-claim reserve failure finalizes failed with the budget flag, preserving conservative recovery semantics.
- `operations/seo-vercel/tests/ai-deadline.test.mjs`: three regression cases cover no provider invocation after a slow claim, no settlement of ungenerated content, sanitized failure/finalization, time/batch flags and empty-queue completion.
- `operations/seo-vercel/tests/sql-integration.test.mjs`: added assertions that both cutoff flags persist actual SQL `partial` state.
- This handoff and append-only `seo-worker-deadline-prepared-20261019` / `seo-worker-deadline-verified-20261019` reports; the history manifest is generated only by the append CLI.

No changes to provider prompts/models, publication rules, public SEO behavior, schema, target restrictions or hosting configuration. Vercel worker configuration remains unscheduled with a 60-second maximum; no deployed configuration was inspected or changed.

## Fresh validation

Evidence directory: `artifacts/seo-worker-readiness-20261019/`.

| Check | Result |
| --- | --- |
| Focused handler/deadline/HTTP/logging tests | PASS: 21 (`focused.log`) |
| Full existing SEO regression selection | PASS: 142, 0 failed, 0 skipped (`regression.log`); includes editorial, API/authorization, metadata/sitemap, provider fixtures, PGlite SQL and history |
| SQL partial-state assertions added afterward | PASS: 1 integration test (`sql-partial.log`), a rerun of an included test, not an extra distinct suite count |
| Root TypeScript | PASS, exit 0 (`types.log`), no incremental cache |
| Learning app TypeScript | PASS, exit 0 (`learning-types.log`) |
| Focused ESLint | PASS, exit 0 (`lint.log`); SQL test separately linted after its assertions |
| Worker module syntax | PASS, `node --check` for both changed modules |
| Chrome editorial scenarios | PASS: 9 (`browser.log`), synthetic loopback-only fixtures; responsive 375/768/1440 included |
| Migration integrity | PASS: 6/6 hashes unchanged (`integrity.json`) |
| Native PG18 concurrency | NOT RERUN: unchanged migration/SQL runtime; prior seven checks remain historical |
| PostgreSQL 17 / real PostgREST acceptance | BLOCKED: not established by PGlite or database version inspection |
| Fresh production build | NOT RUN: available disk about 988 MB, below the existing 1 GB guard; guard not bypassed |

The prior successful build result and BUILD_ID remain present. Source comparison supports continuity for unchanged application directories, not a fresh build certification of the worker changes. This worker is plain ESM and has no build script; its changed runtime was imported/executed through synthetic handler/HTTP tests. No caches were removed this continuation because the known disposable caches cannot materially address the capacity constraint. Source, snapshots, databases, backups, logs, reports and releases remain preserved.

## Verified staging evidence and limits

Fresh bounded SELECT through the existing `lecomax_staging` connection reports `supabase_read_only_user`, transaction read-only on, PostgreSQL 17.11, zero public tables, zero foreign servers/subscriptions, and absent `cron.job` / `net.http_request_queue`. Security advisory result is empty. Exact tool results are retained in `staging-readonly.json`.

This is **read-only inventory evidence only**. It does not verify Auth redirects/providers, SMTP/SMS, hooks, external integrations/workers, real application RLS, PostgREST actor/origin behavior or migration compatibility. No platform configuration endpoint is available in the dedicated staging tool set. Only PostgreSQL 18 is installed locally; no PG17 installation was attempted on the nearly full disk. Existing backup/restore and hosted isolation blockers were not re-investigated without new evidence.

## Exact next actions

1. Preserve this checkpoint and dirty tree. Inspect changes since the current artifact snapshot before continuing; do not rerun unrelated historical audits without a reason.
2. Resolve capacity before creating another isolated build or PG17 environment. Keep the build's 1 GB guard. Do not delete historical evidence or database files. The current app build remains historical, not a release approval.
3. Collect read-only staging Auth URL/provider/SMTP/SMS/hook and external integration/worker settings evidence using the existing owner dashboard; record enabled states and sanitized destinations only. The exact checklist is in `seo-staging-owner-verification-20261019.md`, but its historical five-migration acceptance step must use the current **six-file** editorial inventory.
4. Arrange a suitable isolated PG17 environment and test the six-file chain, actual-owner default ACLs and genuine PostgREST owner/editor/viewer/revoked-session behavior. Hosted writes require separate authorization and proven isolation; do not use the production-linked CLI implicitly.
5. Carry these worker changes into a separately reviewed matching application/worker candidate after acceptance. Keep worker/provider/schedules disabled and budgets zero. Real provider latency/lease and spending acceptance remain unverified; the new conservative timing guard does not certify them.
6. Resolve backup/PITR/compatible restore evidence, human French/Arabic factual review, deployed configuration parity, monitoring/disable drills and rollback ownership before considering production. Existing editorial publishing/rollback and public SEO tests pass locally; no new Arabic routes/hreflang or live rich-results acceptance is claimed.

## Changes Made

Two worker runtime files and two regression files changed. Local tests pass within the limits above. Append-only history records describe the fixes and limitations; `/change-history` is the current learning-app route after a rebuild, not a verified live preview. Production remains **NO-GO**.
