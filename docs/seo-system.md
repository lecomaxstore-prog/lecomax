# LECOMAX SEO system

Current rollout: [decoupled replacement and worker plan](seo-decoupled-rollout-20261018.md). The trigger-enabled installation instructions below are historical and superseded. Preserve migration 202610180001 for audit; do not apply it to production.

Migration preparation update: see [the reviewed migration runbook](seo-migration-runbook.md)
for the live PostgreSQL schema audit, privilege hardening, exact migration hash,
read-only verification SQL, environment requirements and approval gates. This
new audit supersedes the historical statement below that no SQL connection was
available. The migration remains unapplied.

## Architecture and audit

The existing application uses Next.js 15.5 App Router, React 19, Supabase server-side catalogue reads, cookie-based administrator sessions and per-area staff permissions. Product URLs are `/produit/{slug}/`; category URLs are `/{slug}/`. Products already had server-rendered metadata, Product/Breadcrumb JSON-LD, real review aggregates, related-product links, and an optimized Next Image gallery. Public pages use five-minute cached Supabase reads; catalogue mutations invalidate the existing storefront tags. Robots already allows public pages and social images, with private pages excluded by middleware.

The previous sitemap limited catalogue queries and reintroduced seed products on database failure. The new `/sitemap.xml` is an index with sections of 1,000 active entries under `/sitemaps/{products,categories,pages,posts}/{page}/`, plus `/sitemaps/static/`. Database outages return 503 and Retry-After rather than a successful incomplete or obsolete sitemap. Dates come from actual source `updated_at`; static pages without known dates omit them. Product edits invalidate cached catalogue reads; direct database changes are picked up within the five-minute revalidation window. A metadata approval invalidates the SEO cache and affected page. Sitemap counts and entries use deterministic ID ordering; the catalogue can change between crawler requests, so later crawls reconcile page boundaries.

## Apply the database migration (not performed by implementation)

1. Back up the Supabase schema and test on a staging database.
2. Apply `supabase/migrations/202610180001_seo_engine.sql` once through the normal migration pipeline or Supabase SQL Editor with schema-owner privileges. This is a transactional, additive migration. It creates SEO tables, functions and triggers, and backfills SEO rows without updating or deleting products, categories or customer records.
3. Verify `/api/admin/seo` while signed in, then create/edit a staging product and check its automatic SEO row. Check categories too.
4. Generate a draft, approve it, and inspect server-rendered metadata on the corresponding page. Confirm a read-only staff account cannot modify SEO and a product editor cannot edit category SEO.
5. Obtain approval before production schema rollout or deployment.

The migration assumes the existing `products` and `categories` tables, their `id`, `slug`, `name`, `active` columns, and standard Supabase roles. Optional fields are extracted from row JSON. `service_role` uses its normal Supabase BYPASSRLS privilege. No anonymous or authenticated database role can read drafts or write SEO tables. The server requires `SUPABASE_SERVICE_ROLE_KEY`; never expose it in client code.

No SQL migration connection variable was configured during implementation. A read-only REST check outside the network sandbox confirmed that products and categories are reachable (HTTP 200) and the SEO table is not yet exposed (HTTP 404). A local PostgreSQL-compatible PGlite test verifies migration behavior without touching the remote database. Remote installation is not claimed.

## Persistence, review and rollback

`seo_documents` stores automatic fallback, draft and published metadata separately, plus source snapshots and a version. Catalogue insert/update triggers refresh deterministic French text; delete triggers archive SEO by marking it inactive. Drafts and approved content survive source changes and provider outages. The dashboard flags approved text whose source has changed; stale drafts cannot be approved. Approval requires a version match, preventing concurrent users from overwriting unseen changes. Volatile price and stock are deliberately excluded from persisted generated copy; current prices and availability remain sourced from the catalogue in structured data.

`seo_events` preserves draft content, approvals, resets and generation fallback explanations. There is no delete endpoint or expiry. A transaction saves content and its event together. Database/network failures are shown in the dashboard; they cannot reliably be persisted when storage itself is unavailable. AI failures that successfully fall back are persisted in the draft event detail.

Use “Revenir aux métadonnées automatiques” for a content rollback: it archives the prior approval and restores the automatic fallback without deleting history. Older content can be copied from the history into the editor and saved/approved again. To disable the feature at infrastructure level, roll back the application using the pre-change source copies in `artifacts/seo-system-backup/`, and disable the two catalogue triggers if necessary. Keep the SEO tables and events intact. `supabase/rollback/202610180001_seo_engine_disable.sql` disables synchronization and mutation RPC access without dropping data; it is an operational rollback script, not a forward migration.

## Optional AI configuration

Set these server-only environment variables in the chosen environment:

```text
SEO_AI_BASE_URL=https://YOUR-COMPATIBLE-PROVIDER/v1
SEO_AI_API_KEY=YOUR-PRIVATE-SERVER-KEY
SEO_AI_MODEL=YOUR-MODEL
```

The provider must support `POST /chat/completions`, JSON mode and chat messages. MiraiAPI can be used with its operator-verified compatible endpoint and model; no endpoint or live provider compatibility is assumed. HTTPS and no redirects are required. Only product name, description and category are sent; never customer data. Requests time out after 20 seconds. Provider errors and keys are not sent to the browser.

AI selects an exact contiguous excerpt from the existing description. The server verifies that excerpt and builds French metadata around it. It cannot introduce a new product claim. Titles and alt text remain factual deterministic text based on the product name. Missing configuration, invalid output or downtime produces the deterministic draft instead. Nothing generated is automatically approved. Content accuracy still depends on the source catalogue and administrator review.

## Admin workflow and limits

Open `/admin/seo` through the Catalogue menu. Existing `products.view`, `products.edit` and `categories.edit` permissions are retained. Browse/search product and category rows, inspect missing source data, duplicate titles/descriptions, stale approvals and long metadata. The length hints are editorial guidance, not Google character-limit rules or ranking scores. The preview is illustrative; Google may choose different titles/snippets.

Bulk actions process up to 50 selected rows sequentially with progress, cancellation after the current row, and per-row errors. Successfully saved drafts remain after navigation; a partially finished lot can be resumed by selecting the remaining rows. The browser must remain open during a lot. There is no unattended AI job or automatic mass approval. PostgreSQL fallback generation is automatic for future catalogue writes, without requiring the browser or AI.

The audit fetches PostgREST pages of 500 rows and detects duplicates across the loaded catalogue using linear-time counts. It intentionally refuses catalogues of 50,000 or more SEO records instead of silently truncating; for larger catalogues, move audit/filter aggregation into server-side queries. Sitemaps are independently paginated. Product slugs are already validated by the existing product editor; recommendations never silently rename existing URLs. Any intentional rename must have a reviewed permanent redirect. Existing related-product/category navigation remains in place.

The gallery keeps its existing responsive sizes, priority first image, and lazy thumbnails. This change adds no runtime dependency or storefront client-side AI bundle. No Core Web Vitals improvement is claimed without a measured field comparison.

## Validation commands and external checks

```text
node scripts/test-seo-sql.mjs
node --test tests/seo-engine.test.ts tests/seo-api.test.ts tests/seo-sitemap.test.ts tests/product-indexing.test.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm.cmd run build
npm.cmd test
node lecomax-learning-app/scripts/change-report.cjs --check
```

Production rollout still needs live database integration checks, provider credentials if AI is wanted, Google Rich Results Test, Search Console sitemap submission/inspection, and Lighthouse/PageSpeed plus field Core Web Vitals monitoring. Existing Product and Breadcrumb schemas are preserved; unknown stock no longer asserts InStock. Neither structured data nor this system guarantees indexing, rich results or rankings.

Reference guidance: [Google ecommerce SEO](https://developers.google.com/search/docs/specialty/ecommerce), [Google site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure), [Google ecommerce structured data](https://developers.google.com/search/docs/specialty/ecommerce/include-structured-data-relevant-to-ecommerce), [Next.js metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata).

## Recorded local verification — 18 October 2026

- Production build: exit code 0, recorded in `artifacts/seo-build-result.json`; detailed log in `artifacts/seo-build-verified.log`. Existing image lint warnings and network-sandbox fetch warnings remain. The full npm prebuild/course validation had passed earlier; a later attempt hit a Windows course-file write error, so the final production builder was invoked directly.
- Application and learning-app TypeScript checks: passed. Focused ESLint: passed.
- SEO/API/sitemap/product indexing tests: 20 passed. Isolated SQL checks: passed, including Supabase-style default privileges, optimistic concurrency, retained content and denied direct writes.
- Production-browser UI with isolated catalogue fixtures: passed at 375, 768 and 1440 pixels; generation, approval, conflict handling, reset, bulk progress and history checked. Screenshots in `artifacts/seo-ui/` contain test data, not production catalogue records. Real unauthenticated HTTP checks returned 401 for the SEO API and a login redirect for the dashboard.
- Change-history tests: 6 passed. Android back-controller and scroll-return regression scenarios: passed.
- Full root suite: initial run had 633 passing tests, 5 skipped and 4 failures. The new SEO-reader mock failure was corrected and its tests passed in the focused rerun. Two learning-guided tests (`Unexpected import ../LessonTeacher`) and one Windows terminal REPL test failed outside this change; those unrelated modules were not modified to mask the failures. The whole suite is not claimed green.
- No production deployment, remote schema migration, configured live AI-provider test, Google rich-result validation or field performance measurement was performed.

## Continuation audit — 18 October 2026

Recovered the existing implementation and append-only reports before editing. No prior code was reverted. The production Supabase read-only audit returned 200 for products (34), categories (4), and orders, and 404 for both SEO tables: the existing migration is still awaiting approval and application. No new migration was needed for this continuation.

The dashboard now binds editor mutations to the version opened. Refreshing or bulk generation cannot silently upgrade an old form to a newer version; stale text remains visible and an explicit reload restores the current record. Pagination stays in range when a filtered catalogue shrinks. Browser regression coverage exercises the refresh conflict.

The live categories schema has no updated_at column. Sitemap shards now retry without that optional column only on PostgreSQL 42703 naming updated_at, omitting lastmod; unrelated schema and network errors remain retryable 503 responses. Regression tests cover both cases.

The read-only verifier now runs on Node 26, can check every active product with --all-products, detects duplicate titles/descriptions in the checked sample, accepts category navigation for products without similar cards, handles unknown stock, and exits unsuccessfully when a page check fails. It checks at most 1,000 active products; production catalogues larger than this require paginating this verification utility (the application sitemap is independently paginated).

Editorial reference: Google recommends distinct, descriptive titles and avoiding repeated boilerplate: https://developers.google.com/search/docs/appearance/title-link . Next.js 15 cache behavior: https://nextjs.org/docs/15/app/guides/caching .

### Continuation verification results

- Full npm production build, including course validation and source refresh: exit 0 (artifacts/seo-resume-build-result.json). Build used read-only catalogue access.
- TypeScript: exit 0. Full ESLint: exit 0 with existing image warnings.
- SEO, sitemap, product indexing, admin authorization, checkout delivery, stock and preorder regressions: 58/58 passed. Isolated PGlite migration checks passed. Change-history tests: 6/6 passed.
- Local production HTTP verification: 390/390 checks passed across all 34 active products, unique titles/descriptions, canonical and Open Graph metadata, parseable Product/Breadcrumb JSON-LD, live price/availability, category links, all sitemap sections, robots rules and public checkout/cart routes. Report: artifacts/seo-verification/local-http.json. This is structural verification, not Google Rich Results certification.
- A stale local prerender initially showed 69 MAD instead of the database price 59 MAD for one product. Local on-demand page revalidation corrected it. No product row or pricing code was modified.
- Browser fixtures at 375/768/1440 pixels passed generation, manual draft editing/saving, approval, conflict feedback, reset, bulk progress, history and refresh/reload protection. Screenshots are isolated test data. Real unauthenticated API returned 401; dashboard returned 307 to login.
- Supabase SEO tables remain absent (404). Real persisted approval workflows and RLS require installing the existing migration in staging first. No remote writes, production deployment, real AI provider call, payment submission, Google Rich Results test or field performance measurement occurred. The complete unrelated repository test suite was not rerun; its earlier failures remain documented above.
