# SEO staging-to-production inventory — 22 October 2026

## Decision and approval scope

**NO: the complete developed/staging-tested SEO portfolio is not live in production.** The three source fixes explicitly approved for the October 22 minimal production release are live and were verified. The remaining staging implementation was **not granted blanket production approval**. “Developed,” “tested locally,” “accepted on protected staging,” “deployed,” “enabled,” and “verified live” are separate states below.

This inventory reuses the completed production smoke evidence in [the continuation report](seo-production-continuation-20261022.md). Those tests were not repeated. Fresh work consists of source/provenance comparison, read-only provider identity/flag inspection, and isolated candidate validation. No deployment, feature activation, database migration, staging-data copy, customer/order/payment operation, or secret change occurred.

## Authoritative sources and exact revisions

| Source | Exact identity and evidence |
|---|---|
| Live production | `1f17d9e8c54f960b8ba873dfe0974075ed8a9e4a`; `dpl_6MURfA7hrYn5qZh5awX2hrMHkNJo`; READY and current `lecomax.com` alias in fresh provider metadata |
| Pre-minimal production | `d9d1d7a7b274fe3df9f70bb154704ea9e07e78ee`; historical rollback `dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx`, not current production |
| Three-fix staging acceptance | `dpl_BTTcn1fzEYdVSxbevGo6njShC7UJ`; manifest `artifacts/seo-fix-integration-20261021/source-manifest.json`, SHA-256 `58bd96cbb310dcef3e0bc0eb0432e92ba146070f145dc4049e0fd060b9a7e0b6`; historical 36 protected route/viewport cases across immutable host and alias |
| **Current staging** | `dpl_4VCPk44FjpUmadAZKJyNFUKRHMyf`, READY and current `lecomax-seo-staging.vercel.app` alias; source `artifacts/seo-security-resume-20261021/source/` |
| Current staging source authority | `artifacts/seo-write-guard-20261021/release-manifest.json`, SHA-256 `044d3bd8ef1f96c8af6b05a2d44a0a2a5f954fb70eaeb26ad3a73122628a326b`; all **2,124 pinned files match** on this audit. Historical remote receipt matched all expected upload files and recorded 586 extra generated `out/` files |
| Staging Git labels | Worktree originally based on `d9d1d7a7b274fe3df9f70bb154704ea9e07e78ee`; current Vercel metadata reports `e5251911e2a6f1379aca827eb53c310359a662b3`, the dirty workspace label. **That SHA is not a complete commit of the uploaded SEO implementation.** Manifest/upload receipts are the source authority; no missing “SEO release commit” is invented |
| Full unreleased production proposal | `operations/seo/production-handoff-20261021/source-manifest.json`, SHA-256 `b9e9f98596a9bc3ea5610ae1861be6c9f6e83c926563f0145b3fd5870aa228b5`; 2,124 files, current staging source with production cron configuration restored; never the released minimal package |
| Working root | `agent/mobile-product-redesign`, `e5251911e2a6f1379aca827eb53c310359a662b3`; unrelated dirty work preserved |

The older `docs/seo-write-guard-release-20261021.md` says the guard was not deployed. Later security-resume receipts, production handoff and fresh alias metadata supersede that statement: **the guard is deployed to current staging**. Old reports were preserved rather than rewritten.

Machine-readable evidence: [current comparison](../artifacts/seo-release-inventory-20261022/current-source-comparison.json), [exact changed-file inventory](../artifacts/seo-release-inventory-20261022/exact-delta.json), and `provider-1792668492038.json` in the same directory. There are **128 byte-different/absent files** between current staging's 2,124-file manifest and production; five differences are only newline formatting (`lib/db-server.ts`, `lib/seo.ts`, and three owner-auth tests). The first comparison against the earlier staging package is retained separately and is not the final inventory. Missing files in a staging upload list are not automatically intended deletions from production.

## Complete feature comparison

Paths below are relative to each source tree. “Live verified” refers only to the scope actually checked in the retained October 22 report. “Staging tested” does not certify authenticated editorial writes or production configuration.

| Feature / exact main files | Current production code and behavior | Current staging / retained tests | Live verification and why missing work remains |
|---|---|---|---|
| Credentialed manifest — `app/layout.tsx` | Deployed/enabled | Accepted three-fix staging input; production port excludes staging tracking gates | **Live verified** on sampled page types; complete |
| Category image srcset and fallback — `components/CategoryTiles.tsx`, `public/images/placeholder.png` | Deployed/enabled | Accepted input matches release assets | **Live verified** images/fallback; complete |
| Existing page titles/descriptions/canonicals/OG — product/category pages, `lib/product-share.ts` | Deployed/enabled baseline metadata | Staging replaces product/category metadata with SEO-store content/fallback | **Live verified baseline**, not stored approvals; larger reader/DB workflow intentionally excluded |
| Category/CMS slug-segment encoding — `app/[category]/page.tsx`, `lib/seo-engine.ts:seoPath` | Raw category/CMS interpolation; ordinary ASCII sample canonical passes | Encodes French, Arabic, `?`, `#`, `/`, literal `%`; `tests/seo-category-urls.test.ts` | **Not live** for this fix; isolated extraction prepared without SEO-store dependency |
| www-to-apex redirects — `next.config.js`, `middleware.ts` | www returns 200 with apex canonical | No host-redirect implementation found in current pinned staging; redirect policy unchanged | **Not implemented in recovered staging**. This is a new proposal, not a forgotten accepted patch |
| Public-page trailing-slash redirects — `next.config.js` | `trailingSlash:true`, `skipTrailingSlashRedirect:true`; slashless boutique returns 200 with slash canonical | Same explicit skip behavior; comment explains slashless API compatibility | **Not implemented as a staging fix**. Do not globally flip the flag; needs page-only route/method exclusions and callback/API review |
| Sitemap index and pagination — `app/sitemap.xml/route.ts`, `app/sitemaps/[kind]/[page]/route.ts`, `lib/sitemap-data.ts` | Flat sitemap; bounded catalogue queries (5,000 products/1,000 others, subject to server row caps) | Exact counts, 1,000-row shards, deterministic ID order for products/categories/pages/posts; local + protected hosted tests | **Not live**; bundled with broader engine despite no SEO-table dependency. Isolated candidate prepared |
| Sitemap outage behavior — same files | May return seed-product fallback when reads fail | 503, Retry-After 60, no-store; no invented fallback URLs | **Not live**. Current 63-entry production sitemap being available does not prove outage correctness |
| Sitemap optional dates/static routes — `app/sitemaps/static/route.ts`, shard route | Existing static entries; query may request missing category `updated_at` | Retains static/guides; optional-column fallback only for matching 42703; no invented lastmod | **Not live** as staged resilience; extraction preserves production public client |
| Shard URL duplicate rejection — shard route | Shards absent | Leading zero, exponent, negative, unknown kinds and out-of-range shards rejected; tested before DB queries | **Not live**, included in sitemap candidate; distinct from host/slash consolidation |
| Deterministic SEO defaults and persisted approvals — `lib/seo-engine.ts`, `lib/seo-store.ts`, product/category pages | These modules absent; baseline metadata does not read `seo_documents` | Factual fallback, validation, stale-source comparison, published/fallback selection, cache tags | **Not deployed**, not merely disabled. Requires deliberate metadata change, schema/read access and workflow acceptance |
| Duplicate metadata audit — `lib/seo-engine.ts`, `app/admin/seo/page.tsx` | Absent | NFC-normalized title/description matching, active-record filtering, kind+ID identity; tests for accents/Arabic marks | **Not deployed**. This detects duplicate content; it does not redirect duplicate URLs |
| Unknown-stock offer correctness — `app/produit/[slug]/page.tsx` | Unknown stock may be labelled out-of-stock in metadata/JSON-LD | Omits unsupported availability; preserves known stock and preorders; `tests/product-indexing.test.ts` | **Not live**; known in-stock sample cannot verify unknown branch. Independent three-expression candidate prepared |
| Product/Breadcrumb/Organization and safe JSON serialization — product/category pages, `app/layout.tsx`, `lib/seo.ts` | Existing schema and escaping deployed | Existing schema retained; category URL encoding and product availability are deltas | **Live verified baseline** JSON parsing and sample offer; external rich-results eligibility unverified |
| Robots rules — `public/robots.txt`, middleware | Public crawl rules, sitemap reference, utility-page noindex | robots.txt unchanged; staging adds global noindex header in `next.config.js` | **Live verified baseline**. Staging noindex is isolation, not an improvement to ship blindly |
| Missing/inactive product indexing — product page, `lib/db-server.ts` | Existing database-driven visibility/no seed resurrection | Retained and tested; `lib/db-server.ts` differs only in newlines | Missing product **live verified** 404/noindex; inactive real-product case remains unverified; no new missing implementation inferred |
| Existing internal storefront links — product/category UI | Related products/category navigation deployed | Existing navigation retained; extra SEO-dashboard recommendations in `lib/seo-engine.ts:internalLinks` | Baseline **30 links verified**; dashboard recommendations not deployed and not a replacement storefront link graph |
| SEO-managed image alt text — `components/ProductGallery.tsx`, product/category pages | Baseline product/category labels | Uses validated SEO `imageAlt` plus gallery view labels | **Not deployed**; part of metadata reader package; no full alt editorial audit claimed |
| SEO admin dashboard and legacy draft approvals — `app/admin/seo/*`, `app/api/admin/seo/route.ts`, `lib/admin-policy.ts` | Absent | Audit/edit/draft/approve/reset, per-area permissions, optimistic source/version conflict checks | **Not deployed**; real owner/editor/viewer/revoked/expired hosted acceptance incomplete |
| Bilingual editorial revisions/review/publication/rollback — `lib/seo-editorial*.ts`, editorial API/workspace, migrations 002–004 | Absent | Immutable revisions/events, checklist/quality gate, conflict detection, suggestion import and rollback; local SQL/UI tests | **Not deployed**; staging guard denies successful hosted writes; test-boundary approval and lifecycle acceptance unresolved |
| Published editorial product text — `lib/seo-editorial-store.ts`, product page | Absent; original product text | Reads valid current approved French body, rejects stale or superseded content | **Not deployed**; reader has no `SEO_EDITORIAL_ENABLED` switch. Enabling the larger package can affect content without turning AI on |
| Sync queue/manual invocation/run leases/retries — `app/api/admin/seo/sync/route.ts`, `operations/seo-vercel/lib/{handler,seo-sync-worker}.mjs` | Absent from active app; no new SEO cron in production | Source packaged; manual gate, target/key binding, bounded runs, database leases/acknowledgement; worker suites | **Not deployed to production**. Separate worker hosting/scheduler is not proven by frontend source upload; no activation authorized |
| AI jobs/budgets/approval/provider fallback — AI API/control, worker `seo-ai-*` and `seo-editorial*`, migrations | Absent | Job queue, zero initial budget, per-request paid authorization, provider validation, bilingual schemas, quality checks | **Not deployed**; flags off in staging/current production settings; external/provider behavior unverified and activation separate |
| Legacy IndexNow — `lib/product-discovery.ts`, `app/api/indexnow/route.ts` | Deployed callable publishing transport; **does not consume INDEXNOW_ENABLED** | Replaced by guarded shared transport | Code exists; actual external delivery **unverified**, never invoked by these audits. `false` does not disable legacy live path |
| Guarded IndexNow transport — `lib/indexnow.mjs`, discovery/API/release script | Absent | Requires production identity + exact canonical origin/key + explicit flag; URL validation, deadline, redirect rejection; safety tests | **Not deployed**. Adopting it with current false setting changes existing publishing behavior, so release separately after policy review |
| Environment/SEO write isolation — `lib/api-security.ts`, `operations/seo-vercel/lib/environment-target.mjs`, `handler.mjs`, clients/instrumentation | New policy modules absent | Current staging has corrected guard: staging/preview SEO writes denied, worker blocked before RPC; local tests on exact uploaded source | **Deployed to staging**, not production; authenticated hosted actor tests remain incomplete. Do not copy all middleware/auth changes for a sitemap fix |
| FR/AR rendering and locale SEO — pages, editorial modules | French shell; no language alternatives observed | FR/AR synthetic content rendered; bilingual storage/generation exists; shell still French | Arabic content support is **not** localized URL routing/hreflang. Full locale feature not implemented in inspected package; human mapping/review outstanding |
| Search Console / indexing operations | Public prerequisites deployed | Saved reports/runbooks, no current account results | **Account outcome unverified**; old exports and HTTP checks do not prove Google-selected canonical/indexing |
| Performance/CWV and dependency remediation — images, `package*.json` | Existing optimizations; locked Next 15.5.24 | Staging pins Next 15.5.28, sharp 0.35.5 and build isolation changes | **Field CWV unverified**. Dependency upgrade not part of isolated SEO extractions; historical staging runtime audit clean with seven high/two moderate dev findings retained |

## Feature flags: configuration is not behavior

Fresh read-only settings at approximately 11:27 UTC show these six flags explicitly `false` in both production project scope and the dedicated staging project's stable scope:

| Flag | Actual consumer | Consequence in current live production |
|---|---|---|
| `SEO_SYNC_ENABLED` | New worker handler | Consumer absent; setting alone is not a deployed disabled worker |
| `SEO_MANUAL_SYNC_ENABLED` | New SEO sync API | Consumer absent |
| `SEO_AI_ENABLED` | New worker AI job loop | Consumer absent |
| `SEO_EDITORIAL_ENABLED` | New editorial AI generation/claim mode | Consumer absent; even staged code does **not** use it as a global manual-publish/read switch |
| `SEO_MIRAI_FALLBACK_ENABLED` | New provider fallback transport | Consumer absent |
| `INDEXNOW_ENABLED` | New `lib/indexnow.mjs` | Guarded consumer absent; legacy publishing path ignores flag |

Production selectors `APP_ENV`, `NEXT_PUBLIC_APP_ENV`, `SEO_RUNTIME_ENV` are `production`; staging selectors are `staging`. The inspected setting versions predate their deployments. Deployment detail did not expose frozen environment values, so this is fresh **project-configuration evidence**, not byte-level proof of every deployed runtime value. No secret endpoint was requested. No advanced SEO feature can truthfully be classified as “deployed in production but safely disabled by these flags” on this evidence. Current staging does contain code blocked by its environment policy and false settings.

## Why the full staged package was held

1. The approved October 22 release deliberately included only manifest/category-image/fallback fixes. It excluded SEO engine, new dependencies, schema and worker integrations.
2. Current staging includes the write-security correction, but actual owner/editor/viewer/expired/revoked acceptance is incomplete. The final handoff recorded a real staging sign-in response `email_provider_disabled` (422). Vercel access is not application authentication. No Auth setting was changed in this inventory.
3. The corrected environment guard intentionally denies staging SEO writes. A successful hosted editorial lifecycle test requires a separately reviewed bounded test design; flipping an AI flag cannot authorize it.
4. Full production package build previously stopped at its environment guard because complete existing production secrets were unavailable in the local secure build context. Later minimal-release build success does not validate the larger package's different contract.
5. Six ordered additive/decoupled migrations were prepared, locally tested and reviewed, **not authorized/applied by the minimal release**. The October 21 read-only preflight recorded no SEO relations/functions/ledger. That historical schema observation is not relabelled as a fresh database query; a future engine release needs a fresh ledger check.
6. Human bilingual review, recovery/credential-compatible rollback coverage, authenticated lifecycle acceptance and monitoring ownership remain full-engine gates. The later October 22 application-profile backup/restore supersedes old backup freshness claims but does not certify Storage/Vault/offsite/same-major recovery.
7. `www` and slash redirect consolidation was never part of the recovered staged implementation. Its omission is a development/policy decision, not an unreleased accepted fix.

Six authoritative SQL files (their exact SHA-256 values remain in `operations/seo/production-readiness-20261021/migration-plan.json`):

1. `supabase/alternatives/202610180002_seo_decoupled.sql`
2. `operations/seo-vercel/supabase/migrations/20261018193508_seo_worker_run_control.sql`
3. `operations/seo-vercel/supabase/migrations/202610190001_seo_ai_budget.sql`
4. `operations/seo-vercel/supabase/migrations/202610190002_seo_editorial.sql`
5. `operations/seo-vercel/supabase/migrations/202610190003_seo_editorial_review.sql`
6. `operations/seo-vercel/supabase/migrations/202610190004_seo_editorial_workflow.sql`

Never apply the superseded trigger migration `supabase/migrations/202610180001_seo_engine.sql`, synthetic prerequisites, or staging repair SQL as part of these candidates. No staging rows are required or copied.

## Isolated next releases

All three candidates branch directly from the live commit, preserve the existing dependency lockfile/configuration/four cron schedules, and require **zero SQL migrations and zero flag/secret changes**. They are separate alternatives to stacking the full staging tree. Their exact final commits, file hashes and validation are recorded in [candidate releases](../artifacts/seo-release-inventory-20261022/candidate-releases.json).

### R1 — Sitemap resilience and completeness (first proposed release)

Branch `prepare/seo-sitemap-20261022`; worktree `release/seo-sitemap-candidate-20261022`.

Runtime files (byte-identical to current pinned staging): `app/sitemap.xml/route.ts`, `app/sitemaps/[kind]/[page]/route.ts`, `app/sitemaps/static/route.ts`, `lib/sitemap-data.ts`. Test file: `tests/seo-sitemap.test.ts`.

- Validation: 8 focused regressions; TypeScript; focused lint; complete production-mode Next 15.5.24 build with synthetic data; compiled loopback index + all three advertised fixture shards 200; three invalid/nonexistent shard URLs 404. No production regression suite was repeated.
- Risk: index now depends on counts in all four public tables; a failing required read produces deliberate 503 instead of a misleading partial success. Count/row requests are not a cross-request snapshot; catalogue changes reconcile in later crawls. Page size assumes the normal 1,000-row PostgREST cap. Exact counts may cost more on a larger catalogue. Existing five-minute caching remains bounded. Empty synthetic pages/posts do not prove every real content row.
- Release-window checks after authorization: confirm unchanged production alias/base, public count/select compatibility for all four tables and optional category dates; use normal remote build from this candidate. Then verify index and **all advertised production shards**, XML/active-row coverage, static-page retention, escaped URLs, retry/cache headers and logs. Do not submit to Search Console/IndexNow automatically.
- Rollback: restore alias to current immutable `dpl_6MURfA7hrYn5qZh5awX2hrMHkNJo` after explicit rollback authorization and READY check. No schema rollback or data deletion. Cached sitemap indexes may temporarily reference removed shard routes after rollback; monitor until five-minute cache windows expire and request revalidation only if separately approved.

### R2 — Category/CMS canonical encoding

Branch `prepare/seo-category-canonical-20261022`; worktree `release/seo-category-canonical-20261022`.

Runtime file: `app/[category]/page.tsx`; test: `tests/seo-category-urls.test.ts`. Extracts the staged encoding behavior directly with `encodeURIComponent`, avoiding the broader `seo-engine`/`seo-store` dependency and preserving production title/description content.

- Validation: 7 category/CMS cases including Arabic/accented names, reserved characters and literal percent; consistent OG/Breadcrumb/Collection canonical identities; TypeScript, focused lint and production-mode synthetic build.
- Risk: canonical serialization changes for non-ASCII/reserved slugs. Existing ASCII URLs remain identical. Tests treat slugs as decoded database strings; a database that stores already-percent-encoded slugs needs catalogue review before release. No slug renaming or redirect is performed.
- Rollback: prior immutable production deployment; no database work. Verify canonical/OG/JSON-LD consistency on affected real slugs after release. Does not solve www/slash duplication.

### R3 — Unknown-stock metadata/JSON-LD

Branch `prepare/seo-stock-schema-20261022`; worktree `release/seo-stock-schema-20261022`.

Runtime file: `app/produit/[slug]/page.tsx`; tests: `tests/product-indexing.test.ts`, `tests/seo-stock-schema.test.ts`. Extracts exactly three staged availability expressions; excludes SEO database readers and editorial body changes.

- Validation: 7 focused tests cover missing/inactive products, metadata and actual Product-offer expression for null/zero/positive stock and preorder combinations; price/shipping unchanged. TypeScript and focused lint; final build result is in the candidate manifest.
- Risk: unknown inventory loses an unsupported availability property; it is not advertised as available. This changes crawler metadata only, not stock resolution, cart, order or payment logic. Merchant rich-result interpretation remains externally unverified.
- Rollback: prior immutable deployment, no inventory/database rollback. Verify a real unknown-stock item only if one exists; never change inventory just to test.

### R4 — New redirect policy (not a recovered approved patch)

Do not switch `skipTrailingSlashRedirect` globally. A future page-only canonicalization candidate needs exact public route/method scope, `www` host handling, path/query preservation, exclusions for `/api`, assets, Auth/OAuth callbacks, webhooks, admin and checkout/payment flows, no loops, and one-hop tests. A blanket host redirect can change API callers' origin/cookie behavior and is outside the prepared releases. Obtain scope approval before presenting it as an accepted staging feature.

### R5 — Guarded IndexNow; R6 — Full SEO engine

Review guarded IndexNow separately: current `false` would stop legacy automatic submissions after replacement. Do not activate it while releasing sitemaps.

Resume the existing engine package only after real-session/test-boundary, production configuration, six-migration/recovery and human content gates close. Rebase the pinned package onto whichever small releases are actually deployed; do not import staging `vercel.json` (zero crons), noindex/tracking/payment suppression or synthetic content. Keep provider/worker/scheduler/indexing activation under separate authorization.

## Remaining production verification gaps

Retained gaps: authenticated owner/session lifecycle and deployed owner DB/TLS; real inactive/unknown-stock branches; full catalogue metadata uniqueness and orphan/link coverage; below-threshold and all-zone shipping (not an SEO release prerequisite unless affected); Google-selected canonicals/indexing and Rich Results/Merchant validation; live Arabic UX/locale route parity; field LCP/INP/CLS. Project flag readback does not certify provider delivery or runtime secret equality. These were not silently marked complete.

## Changes Made

Added this complete inventory, exact source/provider evidence, and three isolated local candidates with append-only preparation/verification reports. Root application runtime files and unrelated work were preserved. Existing production smoke tests were reused; only changed-candidate tests/builds and the new inventory checks were run. No production release is authorized by this document. The next proposed authorization is **R1 only**, identified by its final commit/manifest in `candidate-releases.json`; R2–R6 remain separate.
