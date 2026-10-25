# Final staging acceptance — 21 October 2026

**Protected HTTP acceptance: GO. Full staging: NO-GO. Production: NO-GO.**

The Vercel 403 checkpoint is resolved. The remaining gates are hosted browser acceptance, separately authorized hosted editorial writes, human FR/AR review, and production-specific configuration/release ownership. No deployment, production mutation, hosted editorial write, dependency upgrade, push or merge occurred.

The machine-readable release package is [final-staging-acceptance-20261021.json](../operations/seo/final-staging-acceptance-20261021.json). It supersedes the previous gate assessment without deleting it.

## Authentication repair

`scripts/vercel-cli-api.cjs` delegates authenticated API calls and OAuth refresh to the installed Vercel CLI. Eleven active root operational scripts now use it. Requests use shell-free argument arrays; JSON bodies containing secrets go through stdin. Output stays in memory, errors are sanitized, origins and headers are restricted, and the adapter does not retry mutations. No access token is read from the credential cache, printed, logged or passed in argv.

The fixed entrypoints include hosting configuration/status, environment verification, production readiness, upload audits and both HTTP/session acceptance runners. Mutating configuration, deployment and real-session runners were **not** executed. Their migration is syntax/lint checked, not a claim of end-to-end mutation validation.

Use the current root scripts. Historical `release/` and `artifacts/` copies and the pinned staging candidate were preserved. The pinned candidate still contains the old operational `scripts/seo-final-readiness.cjs`; it is not the supported execution entrypoint and must be refreshed/excluded in the next production source package. Do not execute cached-token tooling from snapshots.

CLI account access, team ownership, staging identity and deployment readiness succeeded. The installed CLI's ordinary `curl` path can create a persistent automation credential, so acceptance used the existing bounded harness with explicit revocation instead. This is supported deployment automation, not a change to all-deployment protection. See [Vercel CLI](https://vercel.com/docs/cli) and [protection automation API](https://vercel.com/docs/rest-api/projects/update-protection-bypass-for-automation).

## Fresh evidence

| Check | Result |
| --- | --- |
| Operational regressions | 24 passed, including five new CLI transport/security checks |
| Editorial/API/component, executable SQL and History regressions | 41 passed; `artifacts/seo-final-editorial-regression-20261021.log` |
| Modified operational scripts | All 12 passed syntax checks; focused ESLint passed |
| Production-mode build | Passed with synthetic environment and outbound fetch blocked; `artifacts/seo-dependency-remediation-20261021/build-1792578499112.json` |
| Standalone TypeScript | Passed after the build; `artifacts/seo-dependency-remediation-20261021/types-1792578844113.json` |
| Protected hosted HTTP | 23/23 passed; `artifacts/seo-runtime-deployment-1792540103835/hosted-acceptance-1792578463604.json` |
| Staging environment | 47 checks passed, 20 variable names, 18 readable values in both scopes; two sensitive values withheld |
| Candidate/migration integrity | 2,123 pinned files unchanged; six ordered migration hashes unchanged |
| Production alias | `lecomax.com` still maps to READY `dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx`, revision `d9d1d7a7b274fe3df9f70bb154704ea9e07e78ee` |

HTTP checks cover homepage, FR/AR fixture product/category SSR metadata and structured data, production canonicals, sitemap index/shards, robots, public catalog APIs, inactive-product 404, unauthenticated admin denial and disabled signup/cron/IndexNow routes. Temporary automation access was revoked; anonymous protection was verified afterward. Staging remains READY at `dpl_9PVLNqN3YRoSmDgi4T5D9o81Svcv`, alias https://lecomax-seo-staging.vercel.app, protection `all`, no schedules, Git disconnected.

The first standalone TypeScript invocation failed with TS6053 because it overlapped the build's regeneration of `.next/types`. Its log and linked failure report remain preserved. Running it sequentially after the build passed (exit 0); no application code or compiler checks were weakened. Build lint warnings remain nonblocking. The restricted-network CLI attempt also failed with EACCES; the authorized external execution context succeeded. These harness/environment failures are not counted as successful application checks.

Browser discovery returned no surfaces, and opening the in-app browser returned unavailable. No hosted desktop/mobile, hydration, navigation, console/network, dashboard or editorial visual result is claimed. Existing nine-group local browser evidence at `artifacts/seo-editorial-browser/run-2zo3ci/result.json` remains valid historical fixture evidence; it is not hosted acceptance. Prior genuine owner/editor/viewer/revoked-session checks are retained at `artifacts/seo-real-session-acceptance-1792541505297.json`; expired hosted sessions remain unverified.

Fresh SQL fixture regressions verify immutable revisions, stale-save fencing, exact-revision review, publication and rollback, source drift and role restrictions without hosted writes. Retained read-only staging RLS evidence at `artifacts/seo-quality/staging-readonly-1792577238994.json` verifies TLS, 24 RLS-enabled public tables, zero anon/authenticated grants, no public triggers/foreign servers/subscriptions, disabled AI and zero budgets/spend. No successful local test certifies real hosted cache invalidation.

## Production differences and release requirements

- Staging uses Supabase `tyltharlnbxrxibuxyye`; production's expected project is `yddqwgdgeljkzfsmtein`. Staging keys were independently checked; production secret bytes were not certified by the withheld API readback. Never copy staging keys or bindings to production.
- Production metadata lacks the candidate's explicit application environment, Supabase key bindings and dedicated `ADMIN_SESSION_SECRET`. The new admin code requires a dedicated secret of at least 32 characters. Optional existing owner-learning requires its own reviewed database binding. Preserve existing commerce, email, AI, owner authentication and four production schedules; do not promote staging's disabled-runtime configuration wholesale.
- `artifacts/seo-final-source-delta-20261021.json` compares pinned paths with the current production Git baseline: 152 changed/added, 414 byte-identical and 1,557 differing only in CRLF normalization. It does not certify omitted paths or deployed byte equivalence. Prepare the production upload set separately; the staging candidate is not production-approved.
- Use only the six hashes/order in `operations/seo/editorial-six-migration-plan.json`. The same-day read-only production preflight and local restore compatibility results are retained. Never use the superseded trigger migration, synthetic prerequisites, staging repair SQL or blanket migration push in production. Recheck ledger/locks/schema before the approved window; stop on drift or uncertain execution.
- The October 18 backup restored locally: 110 application/auth table hashes matched; all six migrations preserved rows and sequence values, and created 13 RLS-enabled SEO tables. This used PostgreSQL 18.6 and omitted 38 managed-platform entries; production is PostgreSQL 17.6. Refresh the recovery point and verify storage/Vault/managed services coverage, RPO/RTO and named restore operator before release. No fresh backup or full hosted restore is claimed.
- Roll back the application to the verified READY deployment above if release checks fail, after rechecking target compatibility. Stop only newly activated SEO jobs/providers. Preserve SEO revisions/audits/budgets and existing commerce services; do not drop tables or run automatic reverse migrations. Rehearse the exact approved rollback with a named operator.
- Production indexing requires human FR/AR review, current Search Console ownership/sitemap review, public canonical/JSON-LD checks and inactive-product 404 checks. Bilingual editorial content does not establish Arabic canonical routes/hreflang support. Never submit protected staging URLs. Keep indexing/AI/synchronization activation separately gated.
- Retained dependency audit: zero runtime findings; seven high/two moderate development findings. No affected package appeared in the 291 inspected server traces. Build-tool risk remains; use trusted inputs and reassess if the lockfile/build pipeline changes. No dependency upgrade was made.
- Before release name the operator, rollback operator, alert recipient and release window. Record error/latency baseline and approved thresholds. Stop on any cross-environment write, unauthorized mutation, unexpected paid/outbound request, two sitemap 5xx probes one minute apart, repeated new checkout failures or sustained new 5xx/latency regression. Use existing logs; no paid monitoring integration is enabled.

## Exact next action

Connect a signed-in browser authorized for the protected staging deployment, then complete desktop/mobile storefront and admin inspection. Vercel reauthentication is no longer needed. Separately approve a bounded editorial test for existing synthetic product `seo-fixture-fr` after its current baseline and exact mutation/cleanup payloads are pinned. No synchronization or hosted editorial writes are authorized here. Human content review, production configuration, recovery ownership and separate migration/deployment approvals remain release gates.

Change History receives linked preparation and verification entries via the append tool. Reports appear at `/change-history` when the updated learning-app bundle is loaded; no current hosted preview or deployment is claimed.
