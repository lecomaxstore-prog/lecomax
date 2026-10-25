# SEO A+B+C+D acceptance gap review — 24 October 2026

**Comprehensive Preview acceptance: NO-GO. Production: NO-GO. Release E: ON HOLD.**

This continuation closes deterministic offline coverage gaps without changing application source, relaxing Preview restrictions, modifying data, or deploying. No demonstrated application defect required a repair. Provider access and representative hosted acceptance remain unresolved.

## Checkpoint and provenance

- Repository: `C:/Users/Ziko/Desktop/my projects/L'ecomax` (editor root branch `agent/mobile-product-redesign`).
- Recovery repository: `C:/Users/Ziko/Desktop/my projects/L'ecomax/.recovery-seo-preview-isolated`.
- Recovery branch: `preparation/seo-preview-credential-20261023`.
- Recovery status: 137 modified tracked files and 15 untracked files. Complete file inventory is saved in `artifacts/seo-preview-resume-20261023/acceptance-gaps-results-1792844258934.json`. Nothing was discarded or committed.
- Fresh integrity verification at 2026-10-24T12:14:28Z: all 1,212 payload sources and 2,601 baseline hashes match, 288 runtime traces have no missing/outside files, guards intact. The isolated build has 149 expected line-ending differences and zero unexpected differences.
- Payload SHA-256: `e04c877a42ddbad8c5be5a2bddf9919bd072cddefc75aa32e9d6159d49054e6c`. This is the hash of `JSON.stringify(parsed request.json)`, not the request file's byte hash. Certificate, request and source integrity evidence remain preserved.
- Existing deployment: `dpl_DtqnUXwVHUQ98YA4n5QqY3HUMgQB`, [protected Preview](https://lecomax-seo-staging-3lxykucmq-lecomaxstore-4321s-projects.vercel.app).
- Staging project: `lecomax-seo-staging` / `prj_jPniwpH4s81bhISVReUKTQN0GwvD`; team `team_yFLUcpSvgQi8EQuvuorOZW7w`.
- **READY is verified in saved provider evidence dated 2026-10-24T11:58:39Z.** A fresh read-only provider audit in this continuation returned `READ_ONLY_PROVIDER_AUDIT_UNCONFIRMED`. Current provider state was not revalidated. The link is the historical deployed candidate, not a newly checked preview.
- First/second submission guards remain consumed. No deployment launcher was run.

The prior hosted acceptance report remains authoritative for its timestamp: `docs/seo-final-protected-preview-acceptance-20261024.md`. It demonstrated core routes, noindex/CSP, ten HTML metadata samples, 30 corrected image hashes, and 14 viewport samples without page exceptions or horizontal overflow. Those are historical hosted results, not new hosted checks.

## Six blockers: classification and evidence

| Blocker | Finding | Remaining limit |
| --- | --- | --- |
| A. Search 403 | Intentional Preview policy. `allowedSeoRequest` rejects `/api/search` before the handler. The actual handler is GET-only, rate-limited, selects active products with a 250-row bound and returns ranked results. Offline handler tests passed for match, empty query, no match, database failure and rate limiting. | Hosted search results and browser hydration remain unverified. Search spans at most 250 selected products; suitability for a larger production catalogue needs an explicit coverage decision. |
| B. Login/cart/category 403 | Explicit Preview GET exclusions, not evidence of a production routing regression. Existing guard tests require these exclusions. Fixture categories also fall outside the four enumerated standard category routes. | Login and empty-cart initial components render offline with dependencies mocked and effects unexecuted. No authentication, cart mutation or checkout tested. Dynamic category/CMS metadata and schema tests pass offline; hosted destinations remain denied. |
| C. Two products / missing images | Observed hosted fixture coverage is two products and two fixture categories, with empty standard categories. Actual `dbProd.images` mapping and schema image normalization pass with synthetic populated images; empty images intentionally omit Product.image and gallery fallback tests pass. | Database provenance and actual images columns cannot be independently inspected. Incomplete fixture content is consistent with evidence; it is not proven by a successful database read. No invented images or database population. |
| D. Stock JSON-LD | Offline gap closed for supported mapping: positive stock → InStock, zero → OutOfStock, zero/unknown with preorder enabled → PreOrder; unknown without preorder omits availability. Positive stock wins over preorder. | Hosted evidence still covers InStock only. Real stock correctness and representative hosted states remain unverified. |
| E. Console errors | All 185 entries in the saved console file classified: 178 expected Preview-policy 403s; seven intentionally CSP-blocked `vercel.live` feedback scripts; zero unclassified entries. | Historical snapshots cannot prove absence of every runtime/hydration defect. No new browser session or clean-console claim. |
| F. Supabase | Current connected plugin is installed/enabled. Exact staging project identity reads through both available account links returned permission denied. This differs from the previous OAuth refresh failure but still prevents independent verification. | Staging database, stock, RLS/grants and egress remain UNVERIFIED. The available plugin tools expose no reconnect operation. Reauthenticate a project-authorized account through the normal connection UI; no credentials/settings changed. |

Preview exclusions cover APIs, manifest, auth/cart pages and prefetched destinations. They deliberately prevent fuller storefront operation. They must not be removed merely to turn checks green. The separate production context is not subject to `isSeoPreview` when configured correctly; production-specific environment selection still requires release review.

## Validation completed in this continuation

1. **83 focused tests passed**, zero failed, skipped or cancelled. Log: `artifacts/seo-preview-resume-20261023/acceptance-gap-focused-20261024.log`. Suites cover stock schema, product search, catalogue filtering/counts, storefront policy, category/CMS URLs, sitemap boundaries, Preview read-only/email/credential guards, IndexNow mocked transport and gallery fallback.
2. **20 additional offline checks passed** in `acceptance-gaps-20261024.cjs`: twelve stock/image combinations executing the actual product mapping and schema expressions; six checks of the actual search handler with a mocked read-only database; login and empty-cart initial static rendering using React server rendering with mocked providers. No effects, submissions, browser hydration or real database calls are exercised.
3. Schema checks assert price 123.45 MAD, canonical Product/Offer URLs, local image normalization, remote image preservation, absent-image omission and availability. Synthetic values are not real inventory.
4. Catalogue/category tests include active/inactive/empty filtering and category changes. Sitemap tests cover >1,000-row pagination and empty/error cases. Category/CMS tests exercise encoded and unusual slugs. These are offline assertions, not populated hosted catalogue acceptance.
5. Integrity audit passed as above. Saved corrected-package evidence was read: successful npm ci, course validation (635,429 checks; 48 modules; 192 lessons; three languages), 226-page build, TypeScript, 167 regressions and 37 local acceptance checks. Earlier failed attempts remain preserved. No new build/TypeScript run was necessary because application source and payload are unchanged. New offline tests ran on Node 26.7.0; the certified historical build used Node 24.22.0.
6. Initial additional-harness execution failed because it assumed worktree-local TypeScript dependencies. It was corrected to normal parent dependency resolution; subsequent 18-check and expanded 20-check runs passed. This was a test harness issue, not an application correction.

Saved early lazy-image observations are not broken-asset proof. The prior UTF-8-corrupted image harness produced 404s; its corrected 30/30 hash-matching run remains authoritative. No real image URL defect was demonstrated here.

## Changes Made

Added:

- `artifacts/seo-preview-resume-20261023/acceptance-gaps-20261024.cjs`: deterministic source-level handler/schema/static-render acceptance and console classification.
- `artifacts/seo-preview-resume-20261023/acceptance-gap-focused-20261024.log`: 83-test result.
- `artifacts/seo-preview-resume-20261023/acceptance-gaps-results-1792844211447.json`: first successful 18-check checkpoint, preserved.
- `artifacts/seo-preview-resume-20261023/acceptance-gaps-results-1792844258934.json`: expanded 20-check result and complete recovery status inventory.
- `artifacts/seo-preview-resume-20261023/hosted-build-repair/integrity-and-traces-1792844074349.json`: fresh integrity evidence.
- This report and the linked append-only Change History entry generated by `record-acceptance-gap-review.cjs`.

No application source files changed; no files removed. Only audit artifacts, documentation and the root learning app's append-only history/manifest are added or updated. The certified recovery history/payload remains unchanged. No current learning-app UI preview was checked.

## Smallest remaining release path

1. Restore authorized read-only Supabase and Vercel access. Re-read the exact existing deployment and verify project identity, representative catalogue/image/stock data, safety flags and available egress evidence. Use the staging project only.
2. Decide whether deterministic offline coverage is acceptable for intentionally excluded search/login/cart/category/CMS behavior. If full hosted coverage is required, prepare a narrowly scoped candidate and representative offline/test-data strategy. Database writes and policy expansion are not authorized by this report.
3. Any application change needing hosted validation requires a new reproducible package/certificate and **separate explicit Preview deployment authorization**. Do not reuse consumed guards. No new candidate deployment is presently requested because this review made no application repair.
4. Review the production-specific A+B+C+D diff against a freshly identified production baseline. Exact production changed-file scope is currently UNVERIFIED; the staging package is not a promotable production package. Exclude Preview-only configuration and Release E. Verify production indexability and canonical/sitemap origins while keeping IndexNow disabled.
5. Before production approval, document the exact known-good production deployment ID and immutable rollback artifact, compare its configuration with the proposed production candidate, define smoke checks and rollback triggers (5xx, inaccessible catalogue, wrong canonical/indexability or unexpected writes). The rollback action requires the release operator's explicit production authorization. No production baseline or rollback deployment ID was invented or queried here.

Production remains NO-GO because data provenance, representative hosted coverage/acceptance decisions, production-specific indexability/diff and an exact rollback target are unresolved. The current evidence does not demonstrate a critical application regression, but it is insufficient to certify their absence across those untested areas.

## Continuation handoff

Resume from this report and the 20-check results; do not repeat course generation, packaging repair, deployment or broad development. Preserve the current 1,212-file certificate, 2,601 hashes and consumed guards. Re-run the added offline harness only if relevant source changes. Next useful work is restoring authorized provider reads and resolving acceptance criteria, followed by production-scope/rollback preparation. Release E stays on hold; no deployment, mutations, secrets changes, email/payment/IndexNow/worker/cron actions were performed.
