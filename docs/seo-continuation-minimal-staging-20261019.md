# SEO continuation: minimal staging preparation

## Decision

Local preparation is verified; hosted staging execution and production rollout remain **NO-GO**. No migration, restore, deployment, live catalogue write, worker invocation, cron change or paid API call occurred. The new manifest is an offline synthetic SEO rehearsal plan, not evidence of full application recovery or an executable restore list.

## Recovered state

Branch `agent/mobile-product-redesign`, HEAD `e5251911e2a6f1379aca827eb53c310359a662b3`. Initial porcelain status contained 683 entries, including many unrelated modifications and untracked directories. Existing work was not reset, committed, deleted or replaced. Root instructions and the append-only history schema were read first. The latest checkpoint is `docs/seo-staging-gate-readiness-20261019.md`; older synchronous migration instructions are superseded.

The repository contains the Next.js application (`app`, `components`, `lib`), separate mobile/learning applications, migrations and rollback/verification SQL, the independent worker (`operations/seo-vercel`), historical release directories, local artifacts and protected backup references. Inspection covered the SEO implementation, tests, latest readiness/recovery reports, release manifests, operational bundle and backup reports. Historical backup contents were not exported or restored in this session.

Existing implemented features include product/category fallback and approved metadata, source/version conflict protection, canonical and social metadata, escaped Product/Breadcrumb JSON-LD, sitemap pagination/outage handling, robots exclusions, duplicate checks, manual draft approval/reset, manual synchronization controls, durable queue/run leases, bounded worker execution, AI accounting and bilingual v3 editorial validation/review. Review approval deliberately cannot publish editorial content. These are source capabilities with local test evidence, not a claim of live installation.

Preservation check freshly matched 99 recorded website/worker release entries and eight saved comparison entries. The seven-file decoupled operational bundle also passed. These are selected-manifest checks, not a complete baseline certification. Historical reports describe two verified archives and a partial Windows restore with 36 errors; no backup checksum or traversal was rerun here. The latest prior Node 24 production-mode build remains historical evidence only.

## Current infrastructure evidence

- Local dedicated MCP URL identifies `tyltharlnbxrxibuxyye`, `read_only=true`, host `mcp.supabase.com`; recorded production is `yddqwgdgeljkzfsmtein`. No production database connection was used.
- Fresh staging SELECT: database `postgres`, role `supabase_read_only_user`, PostgreSQL 17.11, transaction read-only on, zero public tables and functions, absent `cron.job` and `net.http_request_queue`. Migration list and Edge Function list are empty; security advisor lints are empty.
- Project display name, owner/region, Auth/SMTP/hooks, external consumers and platform isolation remain unverified. Empty database inventories do not establish those facts. The available dedicated tools do not expose these management settings.
- Local Vercel link identifies project `prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb`, name `lecomax`, team `team_yFLUcpSvgQi8EQuvuorOZW7w`. The first GET-only audit failed with sandbox network `EACCES`. The authorized read-only retry outside that sandbox returned `HOSTING_GET_403` at the alias lookup. This confirms the authorization blocker, but cannot distinguish token scope, team membership or project policy. No login, permission or secret changes were attempted; environment values were not read from Vercel.
- Worker configuration has an empty cron array and 60-second hosting duration. Handler uses a 45-second run budget and pins the production project. **Do not invoke it as a staging test or weaken its guard.** A separately reviewed staging test configuration is still needed.

## Exact minimal dependency scope

Run `node scripts/prepare-seo-minimal-staging.cjs` from the repository. It reads five exact hash-pinned migration files, checks their individual transaction boundaries, inventories tables/functions/renames/public references, and writes a uniquely named JSON plan under `artifacts/seo-minimal-staging/`. It has no database client, credential loading or execution mode; any CLI argument is rejected. A changed migration fails closed and requires renewed review.

The ordered chain is decoupled `202610180002`, worker run control `20261018193508`, AI budget `202610190001`, editorial `202610190002`, and editorial review `202610190003`. Never prepend synchronous `202610180001`. The files are individually transactional; the chain is not atomic. Intermediate budget defaults are not final policy.

The chain creates 11 SEO tables: `seo_documents`, `seo_events`, `seo_sync_queue`, `seo_sync_health`, `seo_worker_control`, `seo_ai_settings`, `seo_ai_jobs`, `seo_ai_approvals`, `seo_ai_budget_events`, `seo_ai_request_authorizations`, `seo_ai_editorial_reviews`. The generated plan records function definitions and rename aliases for each file plus the referenced identity sequence.

External public tables are only `products` and `categories`. SQL accesses IDs directly and projects JSON fields `id`, `name`, `slug`, `active`, `description`, `category`, `brand`, `images`, `image`. A logical fixture needs an ID castable to text and meaningful name/slug/active; optional JSON fields can be absent. This projected contract deliberately does not reproduce production constraints, ownership, indexes or RLS. `model` is not currently included in `seo_queue_payload`, despite optional v3 model handling; no new extraction is claimed.

The minimal manifest imports **zero production rows and zero archive entries**. It proposes synthetic French/Arabic product/category fixtures after separate write approval, followed by the reviewed SEO chain. It excludes production commerce/payment/customer/inventory data, Auth/Storage/Realtime, cron/network/Vault, webhooks/triggers, foreign servers/subscriptions, roles/passwords/secrets and historical SEO jobs/authorizations. Reuse verified managed roles; enable no additional extension. PostgreSQL built-ins include UUID generation, MD5 and JSONB functions. No managed schema replacement is planned.

This narrower rehearsal can test SEO contracts without sensitive production data. It does **not** satisfy full recovery Gate A, demonstrate commerce compatibility or provide `pg_restore` TOC selection. A production-data recovery exercise still needs a hardened harness, fresh protected snapshot, exact archive-object selection, isolation evidence and separate approval. No recovery requirement has been silently waived.

## Reproducible acceptance and validation

The generated plan includes explicit pending acceptance cases for identity/isolation, all five migrations, anonymous/authenticated/service-role permissions, disabled settings and caps, two-session concurrency, immutable/stale editorial review, genuine HTTP actor sessions and storefront metadata. Write-requiring cases are marked; none were executed. Existing SQL suites remain available for a separately authorized disposable database, but were excluded because the current instruction says to validate without applying migrations.

Checks run in this session:

| Check | Result |
| --- | --- |
| New offline plan tests | 3 passed: scope/exclusions, drift in each migration, refusal of execution/target overrides |
| Existing selected SEO/product-indexing and pure worker/provider/editorial suites | 76 passed, zero failures; mocked providers, no paid calls |
| Root TypeScript `--noEmit --incremental false` | Passed |
| Full Next ESLint | Passed with existing image warnings; config refreshed the generated private source library |
| Focused ESLint and Node syntax check for new tooling | Passed |
| Change History persistence/interaction tests | 6 passed |
| Five-file hashes/transaction boundary inventory | Passed; lexical inspection only, not SQL parsing/runtime validation |
| Operational bundle and release/comparison preservation | Passed; no network or SQL execution |
| Staging read-only metadata/security | Passed within the limited scope above |
| Vercel metadata access | Failed, HTTP 403 after sandbox EACCES was distinguished |

Evidence logs and the concrete `plan-1792412132155.json` are under `artifacts/seo-minimal-staging/`. Append-only verification records carry actual UTC timestamps and final history-test results. A new production build was not run: no application runtime code changed, the available runtime is Node 26.7.0 versus worker Node 24, and inspected free space was about 1.76 GB with prior documented build disk exhaustion. No old candidate or build output was overwritten to force a build. This session does not claim fresh production-build success, SQL concurrency success, hosted RLS acceptance or a verified UI preview.

## AI configuration and remaining blockers

The v3 `editorial-sol` identifier is already `gpt-6.1-sol`; legacy jobs retain their original models and premium remains separate. The official [GPT-6.1 Sol documentation](https://developers.openai.com/api/docs/models/gpt-6.1-sol) confirms that identifier and structured-output support. This is not current account-access or billing verification. No provider request was sent and no model or price configuration changed.

Final prepared SQL retains the $5 monthly and $50 cumulative ceilings, disabled initial settings, per-request authorization, reservations and uncertain-spend accounting. External-spend reconciliation remains incomplete: prepared $0.000246 does not cover the previously recorded conservative total of at least $0.060741. Reconcile actual account billing before any paid activation. The nine-second generation timeout versus historical 17–20-second latency remains unresolved; no timeout-only change was made.

Other blockers: platform identity/isolation, full recovery harness and fresh verified backup/restore, matching frozen v3 website/worker release, genuine staging PostgREST and permission/concurrency acceptance, Vercel access, safe worker staging configuration, editorial result editing/publication, actual v3 French/Arabic human acceptance, monitoring ownership/delivery and scheduler/freshness policy.

Staging is ready for further read-only inspection and review of the synthetic plan, **not execution**. Production SEO rollout remains **NO-GO**; this says nothing new about the health of the existing live shop, which was left unchanged.

The next approval-bearing action is **running the existing full-chain editorial-review SQL test in disposable in-memory PGlite**: `node --test operations/seo-vercel/tests/editorial-review-sql.test.mjs`. Inspection confirms `new PGlite()` with synthetic tables, roles and fixtures, no hosted database connection or provider call. The test simulates budget authorization and run leases only in memory; it never activates a real worker. Approval is needed because this test executes the five migrations, while the current request restricts validation to not applying migrations. It would validate the narrower SQL contract, not true multi-session PostgreSQL concurrency or the separate production backup/recovery gate.

## Changes Made

Added `scripts/prepare-seo-minimal-staging.cjs`, `tests/seo-minimal-staging.test.cjs`, this report, generated plan/log artifacts and two linked append-only Change History reports (582 total reports after final validation). The history CLI regenerates `lecomax-learning-app/data/change-history.json`. No application runtime, SQL migration, model configuration, existing release or backup was modified. The learning app's `/change-history` displays the reports when the updated local bundle is loaded; no live preview or deployment is claimed.
