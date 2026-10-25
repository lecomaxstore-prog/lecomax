# Local worker recovery and isolated staging proposal

Staging and production execution status: **NO-GO**. This is an additive checkpoint, not a replacement for earlier audit reports. UTC recording time is in Change History.

## Implemented and verified locally

Worker logging is now best-effort and independent of durable run outcomes. Previously a synchronous logger exception after successful finish could turn the response into failure, and the second logger call could escape the catch. A rejected logger promise was not handled. The handler now absorbs synchronous exceptions and rejected promises, and does not await pending log promises. Durable completion/failure finalization, target pin, authentication, batch limits and time reserves remain unchanged. Lost telemetry is an explicit tradeoff: this avoids triggering a duplicate retry solely because a log sink failed. A synchronously blocking logger is still outside this protection; no remote telemetry delivery guarantee is claimed.

The new operations/seo/staging-isolated-plan.json is an inert configuration proposal, not a runtime environment, CLI cache or deployable runner. It pins the designated staging reference, disables worker/AI/editorial/scheduler execution, declares zero initial budget, includes no credentials or schedules and lists six required evidence categories. Existing production handler intentionally rejects staging. Nothing loads this proposal to start a service.

## Reproducible offline checks

Run from repository root, without dotenv or production credentials:

```text
node --test operations/seo-vercel/tests/handler.test.mjs operations/seo-vercel/tests/logging-recovery.test.mjs tests/seo-cli-target.test.cjs tests/seo-minimal-staging.test.cjs tests/seo-isolated-plan.test.cjs
node --test operations/seo-vercel/tests/ai-provider.test.mjs operations/seo-vercel/tests/editorial.test.mjs operations/seo-vercel/tests/editorial-quality.test.mjs
node --test lecomax-learning-app/tests/change-history.test.cjs lecomax-learning-app/tests/change-history-interaction.test.cjs
node node_modules/eslint/bin/eslint.js operations/seo-vercel/lib/handler.mjs operations/seo-vercel/tests/logging-recovery.test.mjs tests/seo-isolated-plan.test.cjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

Inside lecomax-learning-app: `npm.cmd run typecheck`. History check from root: `node lecomax-learning-app/scripts/change-report.cjs --check`.

Results: 25 initial focused cases passed; broader run passed 18 cases including the updated recovery case (17 additional unique provider/editorial cases); six history tests passed. Total 48 distinct passing cases. Focused ESLint and both TypeScript checks passed. Mocked concurrency overlap, deadline, lease/finalization and sanitized failure paths are covered; this is not live multi-session PostgreSQL concurrency. No SQL migration suite, hosted integration test, worker server or paid transport was run.

## Evidence audit and configuration boundary

Prior reports retain matching staging identity/region/organization, user-confirmed dashboard Owner access, read-only MCP binding/session, bounded database isolation indicators, empty Edge Functions and inspected Storage trigger definitions. No new evidence changes Auth, SMTP/SMS, hooks, external integration or worker status. These remain UNVERIFIED, not assumed disabled.

The staging CLI correction plan in seo-staging-cli-correction-20261019.md is retained: separate clean workspace, no copied .temp/dotenv/credential/migration tree, no one-file project-ref substitution. Production-linked configuration is untouched. Its existing guard remains advisory, not an interceptor for arbitrary CLI commands.

## Remaining work and exact next action

1. Collect dated read-only dashboard evidence: Authentication > URL Configuration (all redirects); Sign In / Providers (enabled providers, signup/confirmation, callbacks); Email > SMTP Settings (host/sender and sandbox restrictions); Phone (SMS restrictions); Auth Hooks (event/destination definitions). Exclude secrets; no test sends.
2. Inspect project/organization Integrations and Database Webhooks, then external hosting environment scope, worker/service state, cron and CI schedules. Reconcile staging references and sanitized destinations; prove absence of production credentials/destinations without exporting values. Source flags alone do not certify external state.
3. Freeze/review a matching v3 app/worker package and future staging-only runtime design without weakening production guardrails. Review timeout/lease budgets and actual-owner full privilege acceptance. The inert proposal is not this runnable package.
4. Hosted full-chain, PostgREST/actor/origin, default ACL, concurrency and recovery acceptance require completed isolation evidence and separate authorization. No automatic migration, linking, restoration or deployment follows this checkpoint.
5. Editorial result editing/publication remains unfinished; this change does not implement or authorize publishing. Define publication/version-conflict/rollback semantics and review scope before implementing that workflow. Production recovery, spending reconciliation, human French/Arabic approval and monitoring/disable drills remain mandatory.

Next recommended action is the read-only Owner dashboard evidence collection in steps 1-2. Safe local work remains possible, but the complete remaining feature set and all hosted acceptance cannot honestly be declared finished from this checkpoint.

## Changes Made

Worker log-failure recovery, regression tests, inert staging proposal and this technical checkpoint added. Prior reports preserved; linked preparation and validation entries appended through the history CLI. No preview or deployment claimed.
