# SEO isolation recovery — 20 October 2026

**Production: NO-GO.** Local recovery and validation are complete for the scope below. No deployment, hosted migration/write/settings change, production connection, scheduled worker activation or paid provider request occurred.

## Recovered checkpoint

HEAD: `e5251911e2a6f1379aca827eb53c310359a662b3`. Before edits, the expanded Git inventory contained 238 tracked dirty entries and 42,144 untracked files (mostly accumulated artifacts/snapshots), with zero staged entries. Nested dirty release repositories were preserved. No reset, checkout, commit, cleanup or deletion of existing reports/backups/user data occurred.

The user-described “19 files” is not a complete recoverable session boundary. The pending `seo-environment-isolation-prepared-20261020` report actually names 21 files. Comparison with the last verified tier-guard build and its source inventory also identifies changed worker fixtures and API tests. Do not attribute the entire dirty tree to the interrupted session.

Evidence directory: `artifacts/seo-isolation-recovery-20261020/`.

- `status-before.txt`, `tracked-diff-stat.txt`, `staged-diff-stat.txt`: full Git inventory; no environment values.
- `checkpoint.json`: initial hashes for the 21 reported files and their historical build equivalents.
- `recovered-source-diff.txt`, `delta-from-historical-build.json`, `prior-inventory-drift.json`: inspection evidence. The source diff includes this recovery's corrections; it is not a pristine pre-edit patch. The old build has a deliberate cache-disabling config wrapper.
- Prior handoffs read: tier guard, session recovery, continuation, final blockers, release gates, and staging readiness audit. The missing final-blockers candidate remains missing historical evidence, not an approved candidate.

### Interrupted implementation inspected and retained

The 21 reported paths:

```text
operations/seo-vercel/lib/environment-target.mjs
operations/seo-vercel/lib/handler.mjs
operations/seo-vercel/tests/environment-isolation.test.mjs
instrumentation.ts
next.config.js
middleware.ts
lib/supabase.ts
lib/supabase-server.ts
lib/owner-auth-database.mjs
lib/admin-session.ts
lib/paypal-server.ts
app/api/admin/seo/sync/route.ts
app/layout.tsx
scripts/next-build.mjs
scripts/build-seo-editorial-isolated.cjs
scripts/seo-sync-worker.mjs
operations/seo/worker/scripts/seo-sync-worker.mjs
app/api/auth/signup/route.ts
app/api/send-confirmation/route.ts
app/api/newsletter/send/route.ts
app/api/orders/[id]/notify/route.ts
```

Also inspected the staging app/worker templates, offline validator, `environment-fixture.mjs`, manual-sync/authorization tests, and changed worker tests `ai-deadline`, `finalization-retry`, `handler`, `hybrid`, `logging-recovery`, and `sql-integration`. The six migration hashes remain unchanged. Existing API permission/origin checks, owner-only publication/rollback, revision/source fencing, leases, budget reservation and uncertain-finalization handling were retained.

## Changes completed in this recovery

Seven code/config/test files:

| File | Concrete change |
| --- | --- |
| `operations/seo-vercel/lib/environment-target.mjs` | Reject PostgreSQL query overrides before the local branch, unexpected databases and repeated TLS parameters; reject production APP_ENV in custom nonproduction Vercel targets; add synchronous SDK target/key-role/binding-format validation; reject hosted JWT identities and privileged public keys in local configuration. |
| `lib/supabase.ts` | Run synchronous checks before constructing the browser SDK, covering OAuth/Realtime paths that do not necessarily call the HTTP fetch wrapper. Retain full fingerprint validation on HTTP and redirect denial. |
| `operations/seo-vercel/tests/environment-isolation.test.mjs` | Add regression cases for URL overrides, custom deployment targets, synchronous initialization, and offline app/worker validator success and sanitized failure. |
| `tests/environment-clients.test.ts` | Execute actual browser/server client modules with mocked transport; check constructor rejection, fingerprint/origin checks, key drift, deadlines and redirect denial. |
| `.env.example` | Document required explicit target, bindings, independent admin secret and disabled automation flags; clear an invalid password-like hash example and unusable owner DSN example. No real dotenv files changed. |
| `lib/admin-session.ts` | Correct the obsolete comment describing service-key fallback. |
| `scripts/next-build.mjs` | Correct the obsolete placeholder-build comment. |

The concrete database defect was reproduced without connecting: a URL beginning with `127.0.0.1:54322` was accepted as local while `pg-connection-string` parsed its `host`/`port` query parameters as the production destination. The policy now rejects those parameters. The new regression initially changed the username instead of the database path; that test-only error was corrected.

Additional changed files: this handoff; immutable reports `seo-isolation-recovery-prepared-20261020.json` and `seo-isolation-recovery-verified-20261020.json`; generated `lecomax-learning-app/data/change-history.json`. Evidence and a one-off runtime smoke harness are retained in the evidence directory. Previous history is untouched.

## Executed validation

All explicit Node invocations used the existing Node 24.22.0 executable. No package installation was needed.

| Check | Result and log |
| --- | --- |
| Recovered worker baseline | 67 passed, `worker-before.log` |
| Final worker environment/engine/editorial/SQL/recovery suite | 71 passed, `worker-final.log` |
| Application SEO, CLI/hosting, client isolation, security, owner auth/session, indexing and history selection | 137 passed, `application.log` |
| Corrected regression selection | 12 passed, `corrections.log`; overlaps preceding totals |
| Native PostgreSQL 17.11 / PostgREST 16.5 | 13 checks passed, `native-postgres-retry.log`: concurrent writes/publication, rollback atomicity, role/RPC boundaries, RLS on 13 tables, migration replay rejection, expired/invalid JWTs, FR/AR JSON roundtrip and synthetic dump/restore with sequence equivalence |
| TypeScript | Root Next.js and Expo learning app passed with incremental writes disabled: `types.log`, `learning-types.log`. There is one Next.js app and one Expo learning app, not two Next.js applications. |
| Focused ESLint | Passed, `lint-corrected.log`, `validator-lint.log` |
| Isolated production build | Passed at 11:50:01 UTC; `build-retry.log` and original build-result JSON; snapshot `release/seo-editorial-check-1792496822234` |
| Built-app loopback HTTP | Passed, `runtime-smoke.json`: storefront 200, SEO API unauthenticated 401, cron 503, noindex; server stopped |
| History integrity | Append script and final `--check`; final history test results recorded separately |

There are **208 distinct Node tests** in the worker/application selections, plus 13 native acceptance checks and the HTTP smoke checks. Do not add overlapping correction/history reruns to the distinct test total.

Failures retained, not concealed:

- `worker.log`: 69/70 passed; one newly written test's path-replacement mistake, corrected without changing runtime code.
- `lint.log`: new test variable named `module` violated Next.js lint; renamed, then passed.
- `native-postgres.log`: Windows sandbox prevented pg_ctl restricted-token creation; reviewed escalation succeeded. Both native services stopped.
- `build-launch.log`: Google Fonts network EACCES; reviewed retry allowed public fonts and succeeded. Both builds had synthetic keys, disabled workers/providers, no copied dotenv/hosting links and blocked application runtime fetches.
- `runtime-smoke.log`: the one-off harness initially read PowerShell UTF-16 output as UTF-8, before server startup. It now reads the build's original JSON; `runtime-smoke-retry.log` passed.

Build warning: Next inferred the parent workspace tracing root because the isolated snapshot shares installed dependencies. This build proves compilation/runtime smoke, not standalone deployment-package completeness. Final history reports and later test-only edits are not part of that historical build. No UI preview is claimed.

## Isolation limits and owner actions

1. **Approve environment identity and credentials independently.** Development only targets local Supabase; preview/staging only the recorded staging ref `tyltharlnbxrxibuxyye`; production only `yddqwgdgeljkzfsmtein`. Opaque Supabase keys do not embed verifiable project identity. A fingerprint detects drift after review; hashing an arbitrary copied key does not establish its origin. Use independently obtained staging credentials/bindings, admin/session secrets and worker endpoint/secret bindings. Never send secret values in chat. See [Supabase API key documentation](https://supabase.com/docs/guides/getting-started/api-keys).
2. **Complete hosted configuration evidence.** Supply dated sanitized Supabase project/org/region/account correspondence, Site URL, full redirect allowlist, provider callbacks, SMTP/SMS recipient restrictions, Auth hooks, session/revocation policy, Edge Functions/integration destinations and schedules. Database-only access is insufficient. No prior denied management endpoint was retried.
3. **Complete Vercel evidence.** Confirm production revision, intended app/worker project identity, Node runtime, Production/Preview/Development/custom/branch environment scopes, integrations, external CI/workers and schedules. Existing root commerce/reminder cron entries were preserved; the SEO worker and staging templates have empty cron lists. Local files do not prove hosted inactivity. Existing handoff lists the exact GET-only metadata endpoints needed; decrypted values are unnecessary.
4. **Review local configuration without execution.** Populate a protected staging file using `operations/seo/staging-app.env.example` or `staging-worker.env.example`. Run `node scripts/validate-seo-environment.mjs --app <protected-file>` or `--worker <protected-file>`. These read only the named file and do not contact any server. Keep all five SEO activation flags `false`; budgets remain zero. Validator success is not hosted ownership verification.
5. **Authorize hosted staging acceptance separately, after isolation approval.** Verify the six hashes in `operations/seo/editorial-six-migration-plan.json`. Never combine the synchronous base and decoupled base. Approve staging schema/catalogue setup and real owner/editor/viewer/revoked/expired session, origin, RLS/RPC, publication and rollback acceptance. Local synthetic roles do not prove hosted Auth behavior.
6. **Establish recovery and editorial acceptance.** Name release/rollback/recovery operators and monitoring recipients/thresholds; provide current protected backup freshness/retention, PITR window and RPO/RTO; explicitly approve an isolated compatible restore rehearsal. This session restored only synthetic test data, not production archives. Named French/Arabic reviewers must approve exact revisions and public language route/canonical/hreflang behavior.
7. **Review release scope before any deployment.** Compare the complete candidate with the actual production revision, including unrelated dirty files. Prepare matching app/worker artifacts and configuration parity. The new required guards intentionally refuse missing/mismatched configuration; deploying before supplying approved bindings and the independent admin secret would fail startup. There is no fallback to the database key for admin sessions. Paid-provider tests, deployment, migration and activation each require their own authorization.

On failure, disable workers/providers first, roll back the reviewed application artifact, and use the bounded disable procedure only with approval. Retain schema, audit/revision history and uncertain spend reservations; never automatically replay/refund possibly billed generation.

## Next session

Read this handoff, `verification.json`, Git status, AGENTS.md and the Change History schema first. Preserve all old reports and evidence. New runtime source hashes are recorded in `source-integrity.json`, not a deployment-approved manifest. Repeat checks only after relevant changes/new failures. Continue with owner evidence and separately authorized hosted acceptance rather than rerunning already-passing local suites.

Change History is available at `/change-history` in the learning app after rebuild. It refers to the current app; no running preview or archived visual snapshot was verified.
