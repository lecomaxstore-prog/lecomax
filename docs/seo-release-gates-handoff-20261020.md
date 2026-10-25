# SEO release candidate and next-account handoff

Production decision: **NO-GO**. This continuation preserves the preceding checkpoint and all uncommitted work. No hosted writes, migration, deployment, paid provider request or worker activation is authorized or performed.

## Implemented correction

`app/[category]/page.tsx` previously interpolated decoded category/CMS slugs directly into canonical and Open Graph URLs and category JSON-LD. A slug containing `?`, `#` or `/` changed URL semantics, while the sitemap encoded that slug as one path segment. These outputs now use the existing `seoPath` encoder. Existing ASCII slugs retain their URLs. French/Arabic characters and literal percent sequences are preserved through encoding; no slug is renamed.

`tests/seo-category-urls.test.ts` executes the actual metadata export for category and CMS fixtures and inspects the rendered category JSON-LD tree. It covers ASCII, French, Arabic, query/fragment/slash characters and literal percent sequences. The seven new cases plus existing engine/sitemap cases passed: 21 focused tests.

## Release gates

PASS is limited to the evidence stated. Historical passes are identified rather than claimed as freshly executed.

| Gate | Status | Evidence or missing requirement |
| --- | --- | --- |
| Category/CMS canonical and JSON-LD correction | PASS | Fresh 21 focused tests; seven new behavioral cases |
| Product metadata, sitemap, duplicate handling, workers, budgets and editorial permissions | PASS | Fresh expanded selection: 157 tests passed, zero failed/skipped; `regression.log` |
| Isolated production build | PASS | Fresh build exit 0 at 2026-10-20T09:42:38.850Z; synthetic credentials and blocked runtime fetches; public font downloads permitted |
| Root/learning TypeScript and changed-file ESLint | PASS | Fresh checks; `artifacts/seo-release-gates-20261020/` |
| Desktop/mobile browser fixture scenarios | PASS | Historical nine Chrome scenarios; category metadata correction does not change visible layout; no cross-browser certification |
| PG17.11/PostgREST compatibility and SQL/HTTP concurrency | PASS | Historical 13 native checks, six pinned migrations, 13 tables; unchanged SQL/runtime |
| Local synthetic backup/restore | PASS | Historical PG17 dump restore with row/sequence equivalence; not production recovery |
| Staging database/storage observations | PASS | Fresh read-only query: zero buckets/public buckets/storage policies, all eight listed storage tables have RLS |
| Staging database role boundary | PASS | Fresh anon/authenticated lack superuser, BYPASSRLS and public CREATE; service_role has BYPASSRLS and must remain server-only |
| Security advisor | PASS | Fresh dedicated staging advisor returned no lints; not a penetration test |
| Exact staging identity and ownership | UNVERIFIED | Prior evidence names `tyltharlnbxrxibuxyye`, `lecomax-seo-staging`, eu-west-1; no new platform identity/ownership certification |
| Auth providers, redirects, SMTP/SMS, hooks | BLOCKED | Exposed connector has no configuration reader; earlier management requests denied |
| External integrations, worker/CI schedules and destinations | UNVERIFIED | Local worker has no cron entries; external schedules/configuration not visible |
| Vercel environment isolation and deployed parity | UNVERIFIED | Local configuration is inspectable; names alone cannot prove value separation or target identity |
| Hosted migration and real owner/editor/viewer/revoked sessions | BLOCKED | Requires completed isolation review and explicit hosted-write approval; fixture roles are insufficient |
| Current protected production backup/PITR and recovery ownership | BLOCKED | Requires owner-provided protected backup evidence and approved isolated production-compatible recovery rehearsal |
| Human French/Arabic review and Arabic public-route acceptance | UNVERIFIED | Automated bilingual checks do not establish linguistic correctness or public Arabic/hreflang coverage |
| Real-provider latency, billing and spending reconciliation | BLOCKED | Requires separate paid-call approval; no uncertain charge may be automatically refunded/replayed |
| Production Node/runtime/environment parity | UNVERIFIED | Local Node is 26.7.0; worker declares Node 24.x. Passing local tests is not Node 24 hosted acceptance |
| Candidate scope and production baseline | BLOCKED | Full dirty-tree build snapshot contains existing unrelated work; exact production delta needs owner/reviewer acceptance |
| Deployment/worker activation | BLOCKED | Separate explicit authorization required; no approval inferred from local test success |

## Minimum owner actions

Provide a dated, sanitized staging dashboard/configuration record showing project reference, organization, region and access role; Auth Site URL and complete redirect allowlist; enabled providers and callback hosts; SMTP/SMS sandbox and recipient restrictions; hook/integration destinations. Do not provide credentials in chat.

Provide sanitized Vercel environment scopes and target-project identity, confirmation of independently scoped staging credentials, plus worker/CI schedule and destination inventories. A service-role key must not be exposed in client bundles. The fixed production worker URL must not be used to test staging: current worker preview guards deliberately fail closed. No attempt was made to bypass unavailable management permissions or repeatedly retry their documented denials.

Name the release and rollback operators and provide protected backup/PITR evidence, recovery objectives, and human French/Arabic acceptance. Only after those requirements are reviewed should the owner authorize hosted staging migrations and integrated acceptance. Production deployment, paid calls and worker activation require separate decisions.

## Migration, backup and deployment procedure

1. Review the exact app/worker delta against the actual production revision. The local candidate is a review/build artifact, not an automatically approved production baseline. Use the manifest's hashes to detect drift.
2. Verify the six ordered hashes in `operations/seo/editorial-six-migration-plan.json`. The decoupled base replaces the original base migration: never apply both. Reapplication intentionally refuses atomically; use a migration ledger.
3. Confirm a protected compatible backup, named restore owner and isolated recovery rehearsal. Retain historical backups and audit/budget records. The packaged disable SQL is a rollback control, not a destructive schema downgrade.
4. After explicit staging approval, apply only the reviewed chain and validate actual migration-owner ACLs, RLS/RPC grants, native constraints/triggers, real Auth session revocation/expiry, origin protections, publication/rollback and synthetic recovery on staging.
5. With production approval, deploy matching reviewed app and worker artifacts with workers/providers/editorial generation disabled, zero AI budget and no schedules. Verify public metadata, sitemaps, permissions, environment target/parity and logs before requesting activation.
6. On failure disable worker/AI entry points first. Roll back the app to the reviewed preceding artifact; use bounded disable SQL only with authorization. Preserve schema, revision/audit history and uncertain budget reservations. Reconcile possibly billed provider requests before retry.

## Monitoring and alerts required before activation

- Page operator on unauthorized target/configuration drift or unexpected worker activation.
- Alert on repeated worker 503s, expired leases, unconfirmed finalization and queue backlog/oldest-job age. Do not automatically retry paid generation merely because finalization is uncertain.
- Track `stage`, `finalization`, `budgetExhausted`, `batchLimitReached`, completed/superseded/failed counts and latency from sanitized worker logs; never add raw provider bodies, credentials or product contents.
- Alert on unknown billing, monthly budget exhaustion and reconciliation discrepancies; assign a human owner.
- Probe sitemap status and expected catalogue coverage, canonical/JSON-LD consistency, editorial storage 503s and backup freshness. Define thresholds and on-call routing with the owner before activation; none is installed here.

## Evidence and resume instructions

New evidence: `artifacts/seo-release-gates-20261020/`. Prior database/browser/build evidence: `artifacts/seo-readiness-final-20261020/` and `docs/seo-production-readiness-20261020.md`. Treat each timestamp as evidence for that source snapshot only.

The review package is identified in `artifacts/seo-release-gates-20261020/candidate.json`. It references the tested app source/build snapshot and includes worker runtime/configuration, migration plan/files, bounded disable SQL and this handoff. Its manifest hashes every included source file and is verified immediately after packaging. App snapshot build configuration deliberately disables disk caching; production configuration parity remains unverified. No credentials or hosting links are copied. Final Change History records require a later learning-app rebuild.

Read the final verification report and candidate manifest before rerunning anything. Preserve the working tree and every prior report. Continue with the missing owner evidence; do not repeat denied management calls without a changed permission/tool state. Do not enable hosted execution merely because all local checks pass.

The learning app displays append-only reports at `/change-history` after rebuild. No live preview or historical snapshot UI was verified.
