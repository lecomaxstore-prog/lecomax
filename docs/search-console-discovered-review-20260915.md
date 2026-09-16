# Search Console discovered URL review — 15 September 2026

Resumed from the saved 26-URL export. Fresh public HTTP results are in
`search-console-discovered-recheck-20260915.json`.

## Findings

- 24 URLs return 200, have self-referencing canonicals, appear in the live sitemap, and allow indexing in the inspected robots metadata/headers. These checks do not establish Google's current indexing decision.
- `/produit/a-lenovo-gm2-pro-ecouteurs/` and `/produit/a-lenovo-lp40-pro-ecouteurs/` still return 200 with bundled product content, a generic product title, and the homepage canonical. Neither is in the sitemap.
- A read-only live database query for Lenovo product names returns only the active K3 Pro speaker. No equivalent replacement for either earbud product was established.
- The Ecomedia post `ecoutez-sans-limites-mrfbvkoe` has no H1 in the inspected HTML; this alone does not establish an indexing barrier.

## Local correction

The product page no longer restores missing products from the bundled catalogue.
Both page rendering and metadata generation now invoke `notFound()` when the live product is unavailable. This prevents missing product metadata from falling through to the homepage canonical while old product content remains visible.

The existing database helper also returns null on database failures: product detail pages now use the not-found flow in that case instead of serving stale bundled stock/prices. Distinguishing an outage from a missing record remains a separate availability improvement.

Validation: `node --test tests/product-indexing.test.ts tests/seo-sitemap.test.ts` — 7 passed. Tests cover both removed Lenovo slugs, inactive products, active product canonicals/prices, and existing sitemap behavior. Diff whitespace check passed.

## Remaining

Deployed to production on 15 September 2026 after user authorization. Deployment `dpl_GzWtCFgoSYPPXMXZEcupiFhQwfu8` is READY and aliased to https://lecomax.com. Release source: `release/security-storefront-publish`, baseline `3a9584c` plus the product-page patch and regression test (uncommitted). Build completed in approximately three minutes using Next.js 15.5.24; compilation, type checking and page generation passed, with existing image lint warnings.

Live verification passed for normal and Googlebot user agents: both old Lenovo URLs return HTTP 404 with noindex and no old product content or Product structured data. The inherited homepage canonical remains in the not-found document, but the old indexable HTTP 200 product response is gone. The active K3 Pro returns HTTP 200 with its own canonical and remains in the sitemap; both removed products are absent. Evidence: `product-indexing-live-verification-20260915.json`.

The existing storefront smoke check passed: homepage metadata, structured data, crawler access, 52 sitemap URLs, help animation and anonymous API protection. The new deployment's error-level runtime log query returned no entries. This is an immediate post-deploy check, not continuous monitoring; drain configuration was not inspected.

Previous deployment for rollback: `dpl_8Sa2SvBfu611ogrSfvyyvcb1dW3y` (`https://lecomax-2px034ekq-lecomaxstore-4321s-projects.vercel.app`).

No Search Console validation or indexing request was submitted. Google's selected canonical and recrawl status remain unverified.

## GitHub synchronization and final deployment

The deployed product-page change and regression test were committed as `c70b3b3306958a09b4fc242a3e88b04880299407` and pushed to `lecomaxstore-prog/lecomax` main. Remote main was verified to match this commit. Its automatic Vercel production deployment, `dpl_38KstXSWtA6xz3s3YFtyT7Vkx57w`, reached READY and was confirmed to serve both lecomax.com and www.lecomax.com. The product indexing checks passed again after domain assignment; no error-level runtime logs were returned for this deployment.

The user also supplied a Google Search Console live-test screenshot confirming a 404 response for the removed GM2 Pro URL. This confirms the live inspection result, not a completed update of Google's indexing report.
