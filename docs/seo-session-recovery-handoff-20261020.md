# SEO session recovery — 20 October 2026

**Release decision: NO-GO.** Local validation cannot establish hosted readiness. No deployment, hosted migration/write, worker activation, paid request, restore or destructive cleanup was performed.

## Recovered checkpoint

The repository contains extensive existing tracked and untracked work. It was preserved; no reset, checkout, commit or cleanup was performed. Read the prior `seo-final-blockers-handoff-20261020.md` together with this correction:

- Its claimed `artifacts/seo-final-blockers-20261020/candidate.json` and final verification manifest were absent on inspection. Do not use those references as release evidence.
- The older `artifacts/seo-release-gates-20261020/candidate.json` does exist, timestamped 09:43 UTC. Its package and hashes were not reverified in this session; it predates the later worker-runner work and is not evidence of current-source parity.
- The previous build launch artifact does record exit 0, but remains historical.
- The final historical total was 159 distinct tests, not 160; the previous handoff explains the removed temporary assertion.
- `operations/seo-vercel/run-tests.mjs` already discovers all worker tests, anchors cwd at the repository root, uses the invoking Node executable, rejects overrides and propagates failures.
- `test:integration` already resolves its fixtures correctly. It did not need a change.

## Actual changes

Five worker SQL test files resolved migration files against the shell working directory. A direct worker-directory budget run reproduced ENOENT before any assertions could exercise the budget schema. Changed fixture reads to module-relative URLs in:

- `operations/seo-vercel/tests/ai-sql.test.mjs`
- `operations/seo-vercel/tests/editorial-sql.test.mjs`
- `operations/seo-vercel/tests/editorial-review-sql.test.mjs`
- `operations/seo-vercel/tests/editorial-workflow-sql.test.mjs`
- `operations/seo-vercel/tests/full-chain-schema.test.mjs`

No runtime behavior or migration bytes were changed. The existing default runner remains intact. Publication/rollback confirmation, revision checks, stale-source filtering, worker acknowledgement/finalization recovery, deadlines, budget fencing and canonical URL cases were reviewed through their existing regressions. No additional runtime defect was established.

## Fresh evidence

Evidence directory: `artifacts/seo-session-recovery-20261020/`.

- `budget-worker-before.log`: one expected failing reproduction, ENOENT from worker cwd.
- `worker-direct.log`: Node 24, all 60 worker tests passed directly from worker cwd.
- `worker-root-runner.log`: Node 24, all 60 passed through the default runner from repository cwd.
- `npm-worker.log`: actual worker-directory `npm test`, 60 passed.
- `npm-integration.log`: actual worker-directory `npm run test:integration`, one passed.
- `application.log`: 99 application/history regressions passed.
- `types.log`, `learning-types.log`: root and learning-app TypeScript passed with incremental writes disabled.
- `lint.log`: focused worker runtime/tests/runner and hosting-evidence ESLint passed.
- Repeated worker/integration invocations overlap: **159 distinct passing tests**, not their summed invocation counts. npm lifecycle scripts resolve `node` from PATH (system Node 26.7.0); the explicit Node24 direct/default-runner executions establish the Node24 result.
- Portable `artifacts/seo-node24/node-v24.22.0.exe` independently reports v24.22.0 and SHA256 `ba93f9a70bd86fce3ebbb39ec758501458453467aa92a34a0a3602d1e3fc2b9c`, matching the retained runtime verification. The official checksum download/signature were not reverified.
- `backup-integrity.json`: protected local October 18 archive SHA256 matches `8bedc61407d22acc8cac307f964c3671b856ead785489fffce492b5b23b3d0df`; pg_restore reads 1,233 inventory entries. The initial sandbox read was denied; the reviewed read-only escalation succeeded. No restore occurred.
- `build-launch.log`: initial isolated build failed on public Google Fonts network access. `build-retry.log` and `verification.json` record the subsequent result. Neither uses production credentials or deploys.

PGlite is an in-memory synthetic SQL fixture. Hosted Auth/RLS acceptance, Linux runtime parity, actual provider latency/cost, browser rendering and human linguistic approval were not established by these tests. Existing native PG17/PostgREST and browser artifacts remain historical.

## Exact external access requirements and owner actions

No known 403 endpoint was retried. The server-side reason for the previous Vercel denial is unknown; it cannot establish whether a token scope, project membership or team policy is missing.

1. **Vercel owner:** grant the existing authorized identity read access to the intended team/project, or supply dated sanitized evidence. The existing reader requires GET access to `/v4/aliases/lecomax.com`, `/v13/deployments/{deploymentId}`, `/v9/projects/{projectId}`, and `/v10/projects/{projectId}/env?decrypt=false`, scoped to the linked team. No secret-value/decryption or write permissions are required. Confirm alias/project identity, current production revision, Node runtime, production/preview/development/custom/branch environment scopes, cron configuration, CI schedules, external workers and integration destinations. Empty local crons do not prove hosted inactivity.
2. **Supabase owner:** provide read-only management/configuration access to staging project `tyltharlnbxrxibuxyye`, or export dated sanitized settings. SQL read access is insufficient for organization/account correspondence, Auth configuration, platform integrations or backup/PITR settings. Confirm project/org/region and that the plugin identity matches the dashboard account. Do not grant broad service-role access just to inspect settings.
3. **Authentication:** record Site URL, complete redirect allowlist, enabled providers and callback hosts, email/password and session/refresh/revocation settings, SMTP/SMS sandbox recipients and restrictions, Auth hooks and destinations. Confirm staging credentials are independently scoped without sharing their values.
4. **Isolation/integrations:** inventory webhooks, email/SMS/payment/provider endpoints, Edge Functions, database schedules, queues, foreign servers/subscriptions, hosting jobs and external CI. Confirm no production credential reuse or production destinations. Keep workers/providers disabled and budgets zero. Empty SQL inventories alone are insufficient.
5. **Recovery:** provide latest protected backup timestamp and retention, PITR enabled status and recovery window, named recovery operator and rollback owner, agreed RPO/RTO, and evidence from an explicitly approved compatible isolated restore rehearsal. October 18 archive readability proves neither current recoverability nor an RPO/RTO.
6. **FR/AR review:** named reviewers approve factual claims, French grammar, Arabic meaning/RTL and mixed brand text against the exact source/revision. Confirm actual public language routes/canonical/hreflang separately from stored bilingual drafts. Record reviewer, date, revision and explicit acceptance.
7. **Release scope:** identify the current production revision and review the complete candidate delta, including unrelated existing changes. Produce a real hashed candidate manifest; the missing previous manifest is not a candidate. Staging migrations/acceptance, production deployment, paid calls and activation each still require separate explicit authorization.

Do not send credentials in chat. Use approved access controls or sanitized evidence.

## Resume instructions for another account

1. Inspect Git status and this session's `verification.json`; do not reset the dirty tree. Preserve all failed/passing logs, reports, backups and prior source.
2. Read `AGENTS.md` and `lecomax-learning-app/docs/change-history.md`. Reports are append-only; use the append script and `--check`.
3. Use explicit Node24 for compatibility checks. From root, run `artifacts/seo-node24/node-v24.22.0.exe operations/seo-vercel/run-tests.mjs`; from the worker directory, use `../../artifacts/seo-node24/node-v24.22.0.exe --test tests/*.test.mjs`. Existing tests use memory/synthetic fixtures.
4. Only repeat local checks after relevant changes. Never infer hosted acceptance from these passes. Do not rerun blocked management endpoints without changed access.
5. Once owner evidence and separate staging authorization exist, verify the current six-file editorial workflow migration plan and hashes; never combine the original synchronous base with the decoupled base. Retain grants/RLS, fencing, audit history and spend reservations.
6. On uncertain billed generation, never automatically replay or refund. On release failure, disable workers/providers first, then follow the reviewed application rollback and bounded disable procedure; retain schema and audit/budget history.
7. Monitoring ownership remains unresolved: queue age, 503s, expired leases, unconfirmed finalization, unknown billing, budget limits, sitemap failures and backup freshness need thresholds, routing and named operators.

Change History is available in the learning app at `/change-history` after rebuilding. No running preview or historical UI snapshot was verified in this session.
