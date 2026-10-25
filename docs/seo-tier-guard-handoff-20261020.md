# SEO provider tier guard — 20 October 2026

**Production decision: NO-GO.** This continuation performed local code, synthetic tests, an isolated build and a read-only local backup check. No deployment, hosted migration/write, worker activation, paid request, restore or destructive cleanup occurred.

## Checkpoint recovery

Read `docs/seo-session-recovery-handoff-20261020.md` for the preceding checkpoint and the exact owner/access checklist. All files in its `source-integrity.json` matched on inspection before this change. Git still contains extensive existing tracked and untracked work; no reset or overwrite was performed.

The previous verified total was **159**, not 160. This session adds one real regression test, bringing the current distinct total to **160**. Repeated root/worker-directory executions are overlapping tests, not additional unique tests.

The default worker runner and five module-relative SQL fixture fixes remain intact. No further runner defect was found. Missing `artifacts/seo-final-blockers-20261020/candidate.json` and final verification references remain invalid; the earlier release-gates candidate is historical.

## Actual runtime fix

`operations/seo-vercel/lib/seo-ai-provider.mjs` used `tier in MODELS`. JavaScript's `in` operator accepts inherited names such as `toString`, `constructor` and `__proto__`; these are not model tiers. A mock-only regression demonstrated missing rejection and a path to client construction.

The entry point now requires a string and an own property in one of the explicit routine/advanced or editorial model allowlists, before schema generation or provider construction. Non-string values that coerce to property names are also rejected. Invalid input raises the sanitized `SEO_TIER_INVALID` error. Model identifiers, pricing, prompts, SQL and valid-tier behavior are unchanged.

`operations/seo-vercel/tests/ai-provider.test.mjs` covers inherited names, unknown names, null/undefined, objects and arrays, and checks that the client factory is never called. This is a boundary-hardening fix; the test does not prove that hosted database constraints currently permit such tiers or that a paid request previously occurred.

## Evidence and validation

Evidence directory: `artifacts/seo-tier-guard-20261020/`.

- `before.log`: failing pre-fix regression, “Missing expected rejection”; all provider interaction was mocked.
- `worker.log`: Node24 direct worker-directory suite, **61 passed**.
- `worker-runner.log`: Node24 repository-root runner, the same **61 passed**.
- `application.log`: Node24 application/history regressions, **99 passed**.
- `types.log`, `learning-types.log`, `lint.log`: TypeScript and focused ESLint results.
- `build.log`: isolated build result; final `verification.json` records completion and BUILD_ID verification. The harness uses synthetic credentials, disabled workers/providers and blocked runtime fetches, with public build-font downloads allowed.
- `backup-integrity.json`: renewed read-only SHA256 and pg_restore inventory evidence for the existing October 18 protected archive; hash matches and 1,233 entries are readable. No restore or production connection.
- `source-integrity.json`: hashes of changed source and the current worker runtime/tests and migration chain. This is a validation inventory, not an approved deployment candidate.
- `history-final.log`: append-only history tests after verification reports.

No fresh browser, human FR/AR, native PostgreSQL/PostgREST or hosted session acceptance was performed. Those earlier results remain historical. Local Windows/Node24 success does not establish Vercel Linux/runtime parity. Backup integrity does not establish PITR, freshness, restore success, RPO or RTO.

## Remaining release blockers and owner actions

The prior handoff's exact read-access checklist remains applicable. No known HTTP 403 endpoint was retried and no credential was requested.

1. **Vercel:** authorize existing-identity read access to the intended team/project for alias, deployment, project settings and environment metadata (`decrypt=false`), or supply dated sanitized evidence. Confirm production revision/runtime, all environment scopes, cron/CI schedules and integration/worker destinations. The reason for the old 403 remains unknown; do not claim a particular missing role has been diagnosed.
2. **Supabase:** provide read-only management/configuration evidence for staging `tyltharlnbxrxibuxyye`: project/org/region/account correspondence, Auth settings, redirects/providers, SMTP/SMS restrictions, sessions and hooks. SQL access cannot establish these settings. No production credential reuse.
3. **Isolation:** verify external integrations, webhook destinations, Edge Functions, jobs, queues and external workers independently. Keep workers/providers disabled and budgets zero until separately approved.
4. **Recovery:** name the recovery operator and rollback owner, agree RPO/RTO, provide current backup retention and PITR window evidence, and separately approve a compatible isolated restore drill.
5. **Acceptance:** obtain named French/Arabic factual and linguistic approval for exact source/revisions. Confirm real public language routes/canonical/hreflang separately from bilingual stored content.
6. **Candidate:** review the complete diff against the actual production revision and prepare matching hashed app/worker artifacts. Staging migration/acceptance, deployment, paid requests and activation require separate explicit approval.

## Next account

Inspect this handoff, the previous owner checklist, `verification.json`, Git status and source hashes first. Preserve all changes, source reports, archives and failed/passing logs.

Read `AGENTS.md` and the Change History schema before modifying code. The explicit Node24 runner command from root is:

```text
artifacts/seo-node24/node-v24.22.0.exe operations/seo-vercel/run-tests.mjs
```

From `operations/seo-vercel`, run `../../artifacts/seo-node24/node-v24.22.0.exe --test tests/*.test.mjs`. These suites are synthetic and memory-only. Repeat broader validation only after relevant changes or new failures. Do not retry denied management calls without changed access.

Never combine the synchronous base migration with the decoupled migration chain. Never replay or refund uncertain billed generation automatically. Retain leases, audit and budget history during recovery. Monitoring thresholds, routing and ownership remain owner decisions.

The learning app's `/change-history` route displays appended reports after rebuild. No live preview was verified. Final history reports are appended after the build and need a later learning-app rebuild to reach other devices.
