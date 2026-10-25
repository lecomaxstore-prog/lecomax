# Decoupled SEO rollout — 18 October 2026

This document supersedes earlier trigger-enabled rollout recommendations. The original migration remains unchanged for audit. **Never apply `supabase/migrations/202610180001_seo_engine.sql` to production.** No production migration, deployment, environment change or data mutation is authorized by this preparation.

## Recovered state

The previous implementation already supplied product/category metadata, structured data, sitemaps, deterministic and optional MiraiAPI suggestions, approval/version history and the admin editor. Prior backups, restore tests, release candidate and reports remain retained. The last handover correctly held the original migration: a failing synchronous catalogue trigger rejected a stock decrement. Production installation had not occurred at that handover; this session does not re-certify current hosted state.

## Architecture

Install only `supabase/alternatives/202610180002_seo_decoupled.sql` on a database with no prior SEO schema. It is deliberately outside the automatic migration directory: it is a standalone alternative, **not** migration 001 followed by 002. It creates SEO storage, the existing draft/approval RPC, a durable queue and reconciliation health. It creates no commerce triggers, foreign keys to commerce tables or commerce-table writes. Existing inventory, payment and order code stays intact.

A separate Node 24 scheduled process runs `scripts/seo-sync-worker.mjs --run`. Each run reads committed catalogue state, compares only SEO-relevant facts, and upserts changed/new entities into a unique `(kind, entity_id)` queue. Stock and price changes cause no queue churn. Full reconciliation also discovers deletions and marks retained SEO inactive. The first run is the bulk backfill; no backfill runs during installation. Failed scans commit neither queue changes nor their heartbeat; the next successful scan catches up. This captures latest state, not an audit of every intermediate product edit.

The worker claims one job at a time with `FOR UPDATE SKIP LOCKED`, a unique lease token and a 60-second lease. Completion generates deterministic metadata, upserts the permanent document and acknowledges the job in one transaction. Duplicate acknowledgements and superseded tokens are rejected. Changed source resets the pending job and invalidates old tokens. A crashed worker's lease is reclaimed. Errors retry after 15, 30, 60, 120, 240, 480 and 960 seconds; the eighth failure becomes terminal (the stored next-available timestamp is then informational). Expired eighth leases also become terminal. Operators fix the cause then call `retry_failed_seo_jobs()` with the server service role. A source change independently revives that entity.

Automatic synchronization uses deterministic SQL generation and never calls an external provider. The existing optional MiraiAPI draft generator runs only in a separate authenticated admin request, outside all commerce transactions; provider errors retain deterministic suggestions. Its bulk UI remains available. AI content still requires human approval. Queue reconciliation does not overwrite drafts, approved content or audit history. Storefront reads reject stale approved/source facts and use current deterministic content while retaining old approvals for review.

Queue row locks and SEO document locks are never acquired by commerce writes. Shared database CPU/storage exhaustion remains a shared infrastructure risk; this design removes transactional failure and row-lock coupling, not every possible infrastructure outage. PostgreSQL documents `SKIP LOCKED` specifically for queue consumers: https://www.postgresql.org/docs/17/sql-select.html.

## Security and bounds

All four SEO tables have RLS enabled with no public policies. Explicit grants revoke inherited/default table, sequence and function permissions from public, anon and authenticated; the service role reads SEO and invokes only intended security-definer RPCs. Internal generation functions and direct writes remain denied even to service_role. Queue functions use fixed search paths. SQL owns sanitized error codes; worker logs never include raw database/provider errors or credentials. The admin API applies its existing authentication/permissions and restricts status/errors to product scope for staff without category editing access.

The queue is at most one row per observed entity, including retained tombstones. A worker run handles at most 100 jobs. Run every five minutes initially; draining a backlog can require several runs. Reconciliation scans the full catalogue; validate scan duration and load at the real catalogue size, and add keyset partitions before materially larger catalogues. Function lock timeout is one second; installation has five-second lock and 60-second statement limits. Configure an effective PostgREST/service-role statement timeout and scheduler runtime limit; a function-local statement-timeout setting and a client fetch abort are not a guarantee that a running server statement is cancelled. Use a scheduler timeout of four minutes initially and alert on any timeout. Never retry a whole migration after an uncertain outcome without inspecting it.

## Environment checklist and scheduler deployment

Website: validate `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, and a dedicated `ADMIN_SESSION_SECRET`. Keep `SEO_AI_API_KEY`, `SEO_AI_BASE_URL`, `SEO_AI_MODEL` optional and server-only. Do not log their values.

Dedicated worker process: `SEO_SYNC_ENABLED=true`, `SEO_SYNC_SUPABASE_URL` (explicit reviewed HTTPS project URL), `SEO_SYNC_SERVICE_ROLE_KEY` (secret store injection). There is no implicit `.env.local` loading and no automatic fallback to website credentials. Leave `SEO_SYNC_ENABLED` unset until activation is approved. Use Node 24 with the reviewed lockfile; install dependencies in a clean runner. Schedule `node scripts/seo-sync-worker.mjs --run` every five minutes through the hosting provider's scheduler or an isolated job runner, with a four-minute runtime bound and overlap disabled. SQL leases still protect against accidental overlap. No public HTTP worker endpoint or new cron secret is introduced. No hosted schedule was installed.

## Ordered rollout (requires separate production approval)

1. Review the exact candidate manifest and alternative SQL hash in the final readiness report. The old candidate/SQL and all backup files remain audit artifacts. Do not use the old psql wrapper or a workspace-wide migration push: they can execute the unsafe original or unrelated migrations.
2. Reverify target identity, backup checksum/restore fitness and backup recency; inspect current schema and existing commerce trigger definitions. Stop if any SEO objects already exist. This standalone installer intentionally fails atomically on rerun rather than overwriting records or pretending an incompatible schema is current. Reconciliation, worker completion and failed-job retry are repeatable.
3. Run the local tests, then authenticated hosted staging checks with matching PostgreSQL/Supabase roles, PostgREST schema cache and synthetic checkout data. Preserve all existing commerce triggers. Confirm no SEO catalogue triggers before and after installation. Real payment-provider calls are not part of local validation.
4. After database-only approval, execute the entire standalone file with a bounded owner session. Verify four RLS tables, intended grants, absence of catalogue SEO triggers and unchanged commerce rows/functions. Refresh PostgREST schema cache if needed using the normal Supabase procedure.
5. After worker activation approval, configure the dedicated runner and execute one bounded run. Check backfill counts, queue failures and metadata persistence. Run again: unchanged entities should produce zero additional work. Test product creation/update and a safe staged checkout under injected SEO failure; never inject faults into production commerce.
6. Separately approve and deploy only the isolated website candidate with real production environment values. Rebuild on the deployment platform; do not deploy the placeholder local build as prebuilt. Verify admin permissions, status/error display, product metadata, canonical/structured data and sitemap responses.

## Monitoring and recovery

Retain JSON worker logs with timestamp, reconciliation/completion/superseded/failure counts; alert on nonzero exit, any terminal failure, heartbeat older than 15 minutes, or backlog age exceeding the business freshness target. `/admin/seo` shows heartbeat, last completion, pending/failed counts and the most recent 20 sanitized failures/retry times. Use `seo_sync_status()` for external monitoring. A failed scan leaves the old heartbeat visible, so an unavailable queue is distinguishable from a healthy empty queue. Refresh the dashboard to update its status snapshot.

To pause, disable the scheduler or unset its activation flag; allow any in-flight transaction to finish. Commerce requires no rollback. Keep all SEO tables/history/queue rows. Restore the reviewed worker or repair the SEO-only function/permissions, then retry failed jobs and reconcile. Never disable business triggers or remove storage. A website rollback alone does not pause an external scheduler. If the unsafe old migration is unexpectedly installed, stop this rollout and use a separately reviewed conversion/recovery; this installer intentionally refuses that state.

## Validation evidence

Final results and remaining limitations are recorded in `docs/seo-decoupled-readiness-20261018.md` and linked append-only learning-app reports. Local fixtures do not certify hosted Auth, real payments, Supabase managed extensions, PostgreSQL 17 production load or Linux/Vercel clean installation.
