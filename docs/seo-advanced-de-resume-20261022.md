# Advanced SEO D/E recovery — 22 October 2026

## Decision

**D: GO for scoped release review; NO-GO for deployment until exact-scope authorization. E: NO-GO for production; local engineering checks pass, but database, authenticated workflow and content/runtime gates remain open.** No deployment, production SQL, secret change, flag activation, indexing submission or staging-data import occurred.

The interruption was recovered, not restarted. D and E originally had no candidate commit: both branches pointed at C with dirty recovered files. This session preserved their bytes and created local review commits only. No push occurred.

| Item | Exact identity |
|---|---|
| Production, freshly checked 2026-10-22T18:21:28.424Z | `dpl_EXrVzU58gZvV2pACLtsGLaKZhce1`, READY, alias `lecomax.com`, commit `9692b1b51778c90a8a3f6fcfcac412771899032d` |
| D | `prepare/seo-advanced-d-20261022`, commit `32cbebd0a916346e0533409996fdf18e29536cef`, worktree `release/seo-advanced-d-20261022` |
| E | `prepare/seo-advanced-e-20261022`, commit `3fd8000d11653c47d6233141e9326aa61fee1bac`, worktree `release/seo-advanced-e-20261022` |
| Pinned staging | `dpl_4VCPk44FjpUmadAZKJyNFUKRHMyf`, READY; manifest SHA-256 `044d3bd8ef1f96c8af6b05a2d44a0a2a5f954fb70eaeb26ad3a73122628a326b`; all 2,124 files freshly rehashed |

Both review commits are direct children of C, not cumulative with each other. Their worktrees are clean. The dirty root remains on `agent/mobile-product-redesign`; unrelated changes were not staged or committed.

Production retains A (paginated resilient sitemap), B (encoded category/CMS canonical URLs) and C (unknown-stock schema). Existing schedules remain summer learning reminder `0 19 * * *`, winter reminder `0 20 * * *`, review followups `0 9 * * *`, mobile campaigns `5 9 * * *`. Job execution was not triggered. All six provider-read SEO flags remain false. Fresh provider evidence: [provider receipt](../artifacts/seo-advanced-final-20261022/provider-1792693288425.json).

## D: guarded IndexNow, not a separate third recovered candidate

The independently discussed IndexNow replacement became **candidate D**. There is no evidence of an additional committed IndexNow release separate from D. E does not contain D's replacement. Production still has legacy IndexNow code that ignores `INDEXNOW_ENABLED`; false alone does not prove legacy submissions are off.

D changes exactly eight files:

- `app/api/indexnow/route.ts`: preserve the guarded submission result, including disabled/invalid status.
- `lib/product-discovery.ts`: route product publication through the shared transport; retain catalogue invalidation and notification behavior.
- `lib/indexnow.mjs`: production-only transport, explicit true flag, valid key, exact apex origin, URL/batch validation, timeout and redirect refusal.
- `operations/seo-vercel/lib/environment-target.mjs`: shared environment consistency policy.
- `scripts/verify-storefront-release.mjs`: use the guarded transport and paginated sitemap reader; submission still requires explicit `--submit-indexnow`.
- `scripts/sitemap-release-urls.mjs`: bounded sitemap-index/shard reader and deduplication.
- `tests/indexnow-safety.test.ts` and `tests/seo-advanced-indexnow.test.ts`: transport, publication and sitemap-reader regressions.

The last session had already strengthened the pinned transport to reject private paths, assets and query URLs, and updated release tooling for A's sitemap index. These two differences from the initial six-file recovery receipt, plus the two added files, are preserved and hashed; they were not recreated here.

Actual flag behavior: sends require `APP_ENV=production`, `NEXT_PUBLIC_APP_ENV=production`, `NODE_ENV=production`, compatible Vercel selectors, exact `NEXT_PUBLIC_SITE_URL=https://lecomax.com`, literal `INDEXNOW_ENABLED=true`, and a valid key. Missing/false/contradictory settings produce `{ok:false,status:503}` without calling the transport. With today's false flag, deploying D deliberately stops legacy submissions. No key or external delivery verification was attempted. Activation and key-file/provider acceptance remain separate work.

**Validation:** retained 118/118 tests, TypeScript exit 0, full ESLint exit 0 with existing warnings, production-mode synthetic build exit 0 at 18:07:44.673Z, and retained 12-case synthetic browser pass. All changed file modification times precede those checks; post-recovery hashes are unchanged. No SQL or new npm dependency is needed. GO scope is these eight files, flags unchanged; deployment and activation remain unauthorized.

## E: metadata, editorial, AI and synchronization package

E contains **86 changed/added files**, individually listed and hashed in the [final snapshot](../artifacts/seo-advanced-final-20261022/resume-snapshot-1792693541110.json) and [review commit manifest](../artifacts/seo-advanced-final-20261022/review-commits-1792693522887.json). No files were removed.

Runtime scope: product/category metadata readers; product editorial body and gallery alt integration; admin SEO dashboard, editorial review/workspace and AI/sync controls; four admin SEO API routes; SEO-specific admin permission dispatch and mutation environment guard; five `lib/seo-*` modules; worker handler, AI provider/budget/editorial/sync libraries; Vercel and portable worker entrypoints; six SQL migrations and postflight SQL. Supporting scope includes worker package/lock/configuration, fixture files, application/worker/SQL tests, environment validator, sync scripts and migration inventory tooling. Exact filenames are in the linked manifest, including files that were previously untracked and absent from `git diff`.

Three existing test-loader adaptations differ from pinned staging: `seo-ai-api`, `seo-editorial-api`, and `seo-sync-authorization` now load the actual environment guard and explicit synthetic production selectors. Earlier failed attempts are preserved. The final tests succeeded after those changes. Worker tests/fixtures/portable entrypoints have separately recorded local provenance in `e/worker-package.json` and `e/recovery-dependencies.json`; they are not falsely attributed to the pinned storefront upload.

**Interrupted build resolved:** `e/build-1792692396169.json` records exit 0, started 18:06:36.168Z and finished **18:08:48.036Z**. The log contains successful compilation, page generation and route output. It had finished after the prior interruption; rerunning it was unnecessary. This was `next build` with synthetic loopback data, not a Vercel production deployment or a real-database build.

| Validation | Result and scope |
|---|---|
| Application/regression suite | Retained final 167/167, zero failures/skips; earlier failed runs retained |
| TypeScript | Final retained exit 0 at 18:10:31.493Z, after final source/test changes |
| ESLint | Retained full run exit 0; build also performs lint/type checks after the final two test edits; existing warnings remain |
| Worker/SQL | Fresh 71/71, zero failures/skips, finished 18:21:59.093Z |
| Six migrations | Exact six hashes verified; in-memory workflow suite exercises all six; older `full-chain-schema` planner covers five and must not be mislabeled as six |
| Browser | Fresh existing loopback E server: 12 synthetic FR/AR product/category route/viewport cases, sitemap/robots/checkout reads, four SEO APIs anonymous 401, missing product 404, zero page exceptions |
| Whitespace | Existing extra blank EOF in `operations/seo-vercel/lib/seo-sync-worker.mjs`; nonfunctional, preserved rather than rewriting recovered code |

Browser evidence: `e/browser-1792693374932.json`. A second server launch failed with EADDRINUSE because the prior loopback server remained alive; no process was killed. This is browser evidence against the existing server, not a newly launched clean environment or authenticated acceptance.

Dependency closure: all declared root direct dependencies/devDependencies match their lockfile-resolved installed versions. Root package/lock are unchanged from C. Next 15.5.24, TypeScript 5.9.3, ESLint 8.57.1, OpenAI 6.42.0 and PGlite 0.5.8 were present. Worker runtime declares Node 24.x and OpenAI 6.42.0; its package/lock are recovered. SQL uses repository-only PGlite. Validation used Node 24.22.0 and the existing shared `node_modules` junction. A fresh standalone install, transitive security audit and hosted worker bundle were not performed. The build's multiple-lockfile/tracing-root warning remains a clean isolated remote-build acceptance item.

**Release blockers:** six flags false are not a global off switch. `seo-store` and `seo-editorial-store` read approved content without those flags; deterministic fallback metadata can also change immediately. Manual review/save/publication is independently permission/environment gated. The recovered staging guard denies hosted staging writes, so prior staging read acceptance does not prove a successful real owner/editor workflow. Complete authenticated owner/editor/viewer/revoked/expired session, published reader/cache invalidation, stale-content, service-role access and recovery acceptance before production. Production schema state was not queried. Real provider billing/fallback behavior, budgets, editorial human review and worker/scheduler deployment remain unverified.

## Database requirements, safety and rollback

D and released A/B/C require **no migration**. E's functional storage, review, AI budget and worker system requires the matching decoupled schema. Missing schema may allow fallback rendering but is not a functional E release. Do not infer installed production migrations from source files or flags.

Apply nothing now. A future separately authorized database rollout must inspect actual schema/migration history, backup/restore evidence, role/grant compatibility and PostgREST RPC visibility, then apply only missing reviewed files in this order:

1. `supabase/alternatives/202610180002_seo_decoupled.sql` — isolated documents/events/queue.
2. `operations/seo-vercel/supabase/migrations/20261018193508_seo_worker_run_control.sql` — leases/run controls.
3. `202610190001_seo_ai_budget.sql` in the same migrations directory — AI jobs/settings/budget controls.
4. `202610190002_seo_editorial.sql` — editorial storage.
5. `202610190003_seo_editorial_review.sql` — review records.
6. `202610190004_seo_editorial_workflow.sql` — exact-revision workflow/publication gates.

Authoritative hashes: [production-readiness plan](../operations/seo/production-readiness-20261021/migration-plan.json), verified against E. **Do not use the older trigger migration `supabase/migrations/202610180001_seo_engine.sql` or mistake the five-file planner for this six-file chain.**

Prerequisites include PostgreSQL 17 compatibility, `anon`/`authenticated`/`service_role`, products/categories columns and expected identifiers. Tests verify isolated SEO structures, grants/RLS, budgets, revision approval and commerce-row preservation. Functions use controlled privileges; SQL transaction boundaries and repeat/missing-predecessor failures were exercised in memory. This does not prove native PostgreSQL concurrency, hosted Auth/PostgREST, production locks, existing-object conflicts or restore time. Review SQL changes against actual production before execution; never replay all six blindly or import staging rows. Separate worker configuration contains zero active crons and a disabled proposed Hobby schedule; it must never replace storefront `vercel.json`.

Rollback should first pause scheduling/new jobs and account for in-flight leases, retain audit/content/budget history, then return the app to its immediately preceding verified deployment if authorized. Leaving additive SEO schema in place is safer than destructive down-migrations; app rollback does not undo committed content, provider charges or schema. No tested production down-migration exists. Use tested backup/restore or a separately reviewed forward correction for database failure. E flags do not turn off public readers: an app rollback or specifically reviewed publication rollback is needed for bad published content, with cache handling and revalidation checked.

## Completed staging-to-production inventory

Fresh pin verification retains **123** staging-vs-C differences: 16 metadata/editorial/application, 2 reader integration, 5 guarded IndexNow, 23 worker/schema, 19 SEO-validation, 53 infrastructure/security/other-review and 5 newline-only entries. This supersedes the older 128-vs-pre-A inventory, not the historical report itself. Every path and D/E membership is recorded in the final snapshot; missing staging upload files are not deletion instructions.

| Module | Actual status / remaining work |
|---|---|
| Baseline titles/canonical/OG/robots/JSON-LD/internal links | Deployed; retain prior sampled verification, no repeated whole-site audit |
| Paginated sitemap, category encoding, unknown-stock schema | A/B/C deployed and preserved |
| Guarded IndexNow | Local tested D; pinned staging version exists; production legacy ignores false flag |
| Metadata storage, approved readers, gallery alt content, duplicate audit | Local tested E / staging implementation; production absent; schema/read/cache/content acceptance open |
| SEO dashboard, revisions, reviews, publication/rollback | E / staging implementation; real successful hosted actor workflow blocked |
| AI generation, budgets, provider fallback | E; mocked/SQL tested, paid-provider execution and human content approval pending |
| Queue, leases, retries, manual sync, worker scheduler | E; isolated tested, production schema/worker/scheduler absent or unverified; no automatic activation |
| www/slash consolidation | Not implemented; separate page-only redirect proposal needed |
| Locale routes/hreflang | Not implemented; FR/AR editorial payloads and Arabic product fixtures are not bilingual URL architecture |
| CWV, ranking/indexing outcomes, rich-results/Merchant validation | Unverified external/field evidence |
| Staging-only infrastructure | Exclude staging env files, global noindex, outbound suppression, zero storefront crons, alternate auth/client bindings from D/E |
| Other remaining deltas | Keep dependency upgrades, auth/session/owner DB, mail/push/payment and build/security changes in separate reviews; do not bulk-copy staging |
| Acceptance scripts/tests and five newline-only differences | Retain as tooling/history; not missing runtime features or release mandates |

## Live URL findings and Search Console gaps

The prior 64-unique-URL sitemap audit remains the evidence for no observed HTTP/canonical/indexability/JSON-LD/required Product-field failures in that sample. It was not repeated or represented as a fresh full audit.

Fresh nine-request [URL policy evidence](../artifacts/seo-advanced-final-20261022/url-policy-1792693449872.json): HTTP redirects 308 to HTTPS preserving path/query; www homepage and www boutique query return 200 with apex canonical; slashless boutique/homme return 200 with trailing-slash canonicals matching their slash variants. This confirms duplicate crawl surfaces with consistent canonical hints, not proof of Google's selected canonical. `trailingSlash:true` plus intentional `skipTrailingSlashRedirect:true` protects slashless API callers. A future page-only policy must preserve query/path and exclude APIs, assets, OAuth/auth callbacks, webhooks, admin and payment flows; test one-hop behavior and loops before any host change.

`/fr` and `/ar` return 404 (inherited homepage canonical observed on the error response). There is no implemented locale prefix or hreflang architecture; dynamic category routing does not make these language pages. This is a multilingual feature gap, not evidence that existing locale pages regressed. Do not add hreflang pointing to nonexistent URLs. Live storefront remains French; Arabic content quality and complete parity need a separate design/content scope.

Google Search Console is **unverified**: no authorized account data/export was used. Still needed: correct property access/verification, sitemap submission/last-read/errors, Page Indexing exclusions, URL Inspection user-vs-Google canonical and last crawl, rich-result/Merchant reports, manual actions/security issues, performance queries/impressions/clicks and CWV. Public sitemap and canonical checks do not establish these outcomes.

## Recommended order and exact GO / NO-GO

1. Retain current C production. Review D `32cbebd0a916346e0533409996fdf18e29536cef` as the next eight-file release, explicitly accepting that false now stops IndexNow. **GO for review; NO-GO to deploy without that authorization.** Fresh provider baseline check, isolated remote build and public smoke are release-window gates. No migration or flag change belongs in D.
2. Keep IndexNow activation separately **NO-GO** until enabled-scope authorization and safe key-file/provider checks. No indexing outcome is promised.
3. E `3fd8000d11653c47d6233141e9326aa61fee1bac` is **NO-GO for production** until database preflight/recovery, real authenticated workflow, content/read/cache acceptance and isolated packaging gates close. Database rollout, app readers, worker deployment, scheduling and paid AI activation each need explicit scope. Preserve all six false flags during unrelated releases.
4. If D is released first, integrate E onto verified D and revalidate a new cumulative commit/manifest. **Never deploy sibling E as-is after D:** it would restore legacy IndexNow. Shared environment policy currently matches but must be checked during integration.
5. Plan redirect consolidation, multilingual architecture, GSC access and measured CWV improvements separately, using existing evidence rather than repeating passed historical audits.

D rollback target today is C (`dpl_EXrVzU58gZvV2pACLtsGLaKZhce1`); this would also restore legacy IndexNow behavior. C's historical predecessor is B (`dpl_EPWoJY1yHaFfNBzcTk82Qws4KH5M`), then A (`dpl_DfWASww1g3NJcTd5xfSSmLfsSKc7`). No rollback was performed.

## Changes Made

Added this handoff and `scripts/seo-de-resume-evidence.cjs`; saved fresh provider, URL, dependency/hash and worker/browser evidence; created two clean local review commits without rewriting candidate code. Linked verification reports are appended to the learning app's immutable Change History. Existing reports and manifests are preserved. `/change-history` is the learning-app route, not a newly published preview; no preview was checked and no learning-app deployment occurred.
