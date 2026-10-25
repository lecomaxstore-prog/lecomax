# Second protected SEO Preview — hosted acceptance

**Decision: NO-GO for comprehensive Preview acceptance and NO-GO for Production release.** The hosted build and limited SEO smoke checks passed. The broader requested storefront acceptance is incomplete under the certified read-only policy and fixture catalogue. No deployment or application correction was made during this audit.

## Deployment and provenance

- Deployment: `dpl_DtqnUXwVHUQ98YA4n5QqY3HUMgQB`.
- Immutable URL: https://lecomax-seo-staging-3lxykucmq-lecomaxstore-4321s-projects.vercel.app
- Vercel state: **READY**, re-read from the exact deployment API.
- Project: `lecomax-seo-staging` / `prj_jPniwpH4s81bhISVReUKTQN0GwvD`.
- Team: `team_yFLUcpSvgQi8EQuvuorOZW7w`.
- Target: API `null`, the reviewed Preview request form; no production target or promotion.
- Metadata checkpoint: `hosted-build-packaging-repair`.
- Submission receipt matches the certified 1,212-file request SHA-256: `e04c877a42ddbad8c5be5a2bddf9919bd072cddefc75aa32e9d6159d49054e6c`.
- All 1,212 local file hashes/sizes, certificate/request/manifest hashes and 2,601 recovery hashes were freshly verified. First-attempt evidence remains intact. Second operation, creation and receipt guards are consumed; never reset or rerun.
- The submitted receipt records 1,205 unique upload blobs for 1,212 files and exactly one creation request. This audit made no deployment requests.

Provider evidence was recorded at 2026-10-24T11:58:39Z; safety metadata refreshed at 12:05:14Z. This is the deployed recovery checkpoint, not a claim about the current Production source. Production was neither modified nor queried in this audit.

## Access and methodology

Unauthenticated GET `/` returned **302 to vercel.com**. Existing browser-context access returned the application HTML. No bypass key was created, retrieved or set; authentication cookies and headers were not exported or logged. The browser's existing authentication mechanism was not inspected. Protection is configured for all deployments, with zero configured bypass entries and no Git connection.

Read-only HTTP checks used the existing browser request context against the immutable Preview origin. Browser automation was constrained to GET/HEAD on that origin after the first navigation; external and non-read requests were blocked by the test harness. Initial page navigation occurred before that harness was installed; no explicit form or mutation action was taken. Security conclusions distinguish application policy from harness restrictions.

## Actual HTTP results

| Route | HTTP | Finding |
| --- | --- | --- |
| `/` | 200 | Homepage renders; two fixture products |
| `/boutique` | 200 | Catalogue renders; two fixture products |
| `/homme`, `/femme`, `/chaussures`, `/accessoires` | 200 each | Category metadata/canonicals render; empty fixture categories |
| `/homme/` | 200 | Trailing-slash form resolves; canonical ends in slash |
| `/produit/seo-fixture-fr` | 200 | French fixture product and Product JSON-LD |
| `/produit/seo-fixture-ar` | 200 | Arabic fixture product and Product JSON-LD |
| `/boutique?q=casque` | 200 | Catalogue shell renders; this is not proof of functional search |
| `/connexion` | 403 | `SEO_PREVIEW_READ_ONLY`; login UI cannot be accepted |
| `/panier` | 403 | `SEO_PREVIEW_READ_ONLY`; empty-cart UI cannot be accepted |
| `/robots.txt` | 200 | `User-agent: *` and `Disallow: /` |
| `/sitemap.xml` | 200 | XML index lists static/product/category shards |
| `/sitemaps/static` | 200 | 23 production-origin URLs |
| `/sitemaps/products/0` | 200 | Two fixture-product URLs |
| `/sitemaps/categories/0` | 200 | Two fixture-category URLs |
| `/sitemaps/pages/0`, `/sitemaps/posts/0` | 200 each | Empty XML shards, absent from index |
| `/seo-fixture-category-fr/`, `/seo-fixture-category-ar/` | 403 each | Sitemap/breadcrumb destinations denied by Preview allowlist |
| `/produit/acceptance-missing-product` | 404 | Unknown product is not a soft 200 |
| `/api/search`, `/api/settings`, `/api/categories`, `/manifest.json` | 403 each | Read-only Preview denies APIs/manifest used by client UI |
| `/images/pages%20images/homme.png` | 200 | Category image available |

No redirects occurred on the listed protected-context checks with redirects disabled. Production-origin URLs extracted from XML and schema were not followed onto Production.

## Browser and navigation

Fourteen page/viewport samples covered home, boutique, homme, French product, catalogue query, login and cart at **1440×900 and 390×900**. Screenshots are retained. No `pageerror` exception or horizontal document overflow was observed in these samples. Desktop boutique and mobile product screenshots were visually inspected. No comprehensive cross-browser, accessibility or long-session certification is claimed.

Homepage-to-boutique navigation completed through an actual link click. An immediate 600-ms sample still showed `/`; the follow-up confirmed `/boutique` and its title. Search is a header overlay, not a dedicated search page. Clicking Recherche rendered its search input without entering a query or submitting a form. Its GET `/api/search` is denied with 403, so functional results are unverified/blocked. Query-string catalogue rendering alone does not validate search.

The browser console is **not clean**: expected Preview 403s for APIs, manifest and prefetched excluded links; CSP blocks the Vercel feedback script. No hydration-specific exception was observed, but console failures prevent an unconditional clean-runtime claim. An initial network-idle wait timed out; subsequent checks used DOMContentLoaded with a bounded observation period.

No page workers were observed. One browser-context service worker belongs to **vercel.com**, not the Preview; the Preview page has no service-worker controller. This does not certify absence of all server-side/background processes.

## SEO and structured data

All 21 detailed HTTP samples had `X-Robots-Tag: noindex, nofollow, noarchive` and CSP. All ten successful HTML page variants in that sample had a title, description and production-origin canonical. Homepage canonical is apex `/`; category, boutique and product canonicals end with `/`. Neither canonicals nor sitemap locations used the staging hostname.

Preview noindex and robots disallow are deliberate staging behavior. They do not validate Production's indexable robots/header configuration and must not be promoted as-is. Search-engine indexing state itself was not queried.

JSON-LD blocks parsed without JSON errors. Both fixture products expose Product, Offer, price 100 MAD, canonical offer URL, shipping and return-policy data, and `https://schema.org/InStock`. Both omit a Product image and display placeholder/no-image visuals. Actual database stock could not be independently checked; no OutOfStock, PreOrder or unknown-stock hosted case is available in the tested catalogue. Syntax parsing and field inspection are not an external rich-result validator certification.

Category sitemap and breadcrumb URLs point to fixture categories denied by this Preview. That is a Preview coverage/allowlist mismatch; this audit does not establish whether those routes work under Production configuration.

## Image acceptance

**30/30 corrected source-image URLs returned 200 and matched their certified SHA-256 bytes.** Encoded accents, spaces and apostrophes were exercised. This proves deployed asset preservation, not attachment to real catalogue products.

The first image run used mojibake paths after PowerShell's text decoding and produced 404s. It is retained in `image-results.json` as a harness failure. The UTF-8-safe rerun, `image-results-utf8.json`, is authoritative. No application image files were changed. Some below-fold browser images were not loaded at the early snapshot, consistent with lazy loading; those observations are not classified as broken-image failures.

## Security and staging isolation

Fresh Vercel checks passed: exact project/team; all-deployment protection; zero bypass entries; no Git connection; empty hosted cron definitions; Preview-only credential metadata; expected staging URL; disabled PayPal, IndexNow, SEO sync/AI/editorial/manual sync, fallback and live-agent flags; zero tutor token budget. Sensitive credential values were not fetched.

Certified source restricts application outbound fetch to GET/HEAD against enumerated REST tables on `https://tyltharlnbxrxibuxyye.supabase.co`, rejects redirects and method overrides, and denies non-SEO routes before handlers. CSP limits connect/img/script resources and disallows forms, frames and workers. Observed HTML/API denial headers agree with this policy.

Direct staging Supabase identity/catalogue reads could not authenticate: MCP OAuth refresh failed. The query never returned data. Therefore real staging database provenance, stock correctness, database grants/RLS and absence of Production database traffic are **not independently verified** in this audit. Fixture names in hosted output are evidence of observed content, not proof of their database origin.

No checkout, signup, password reset, order, payment, email, IndexNow, cron, migration or hosted credential-verifier action was executed. No absence-of-side-effects claim is inferred solely from HTTP success: runtime egress, provider email logs and database write logs were not comprehensively audited.

Secret-pattern scans found no matches in 21 sampled responses, 23 directly referenced JavaScript assets and 551 build-log events. Only fixed private-key/token-prefix patterns were checked. This is not an exhaustive secret audit, does not include every lazy chunk, and does not prove absence of all credentials. Build logs were scanned in memory; sensitive provider bodies were not saved.

## Releases A+B+C+D and E

| Release capability | Hosted conclusion |
| --- | --- |
| A sitemap index/shards | Basic real hosted output passes; only one populated page per kind, no large-catalogue pagination boundary |
| B category/CMS canonicals | Four standard category canonicals pass; fixture-category routes denied and CMS/unusual-slug coverage incomplete |
| C stock-aware Product JSON-LD | InStock fixture output observed; unknown-stock/out-of-stock/preorder behavior remains historical local-test evidence |
| D IndexNow safety | Disabled configuration and certified source preserved; no live submission, authorization or mutation test performed |
| E editorial/worker/database workflow | **ON HOLD**, not enabled or exercised |

Prior local build/course/TypeScript/167-regression evidence is retained and applicable to unchanged source, but is not relabeled as hosted acceptance.

## Remaining release gates

1. Decide and separately authorize a safe test strategy for search, login/cart rendering and category/CMS routes currently excluded by the Preview policy. Do not remove guards as part of this acceptance audit.
2. Establish approved representative staging data with real product images and stock variants. Resolve missing image metadata and validate sitemap destinations against routes allowed for testing.
3. Restore read-only staging access and verify data/stock provenance plus runtime egress and side-effect isolation with appropriate provider evidence.
4. Re-run affected hosted HTTP/browser checks, including real search rendering/results, populated categories, stock variants, CMS and pagination edge cases. Resolve or explicitly accept Preview console restrictions.
5. Review the production-specific source/configuration diff, indexability, disabled feature gates and rollback plan. Keep Release E out of scope. Obtain separate explicit Production approval; this report does not authorize a release, promotion or redeployment.

## Changes Made

Added local audit scripts, immutable sanitized evidence, screenshots and this report. No recovery application source, payload, secrets, provider settings or guards were modified. A linked Change History report records the incomplete acceptance. Evidence directory: `artifacts/seo-preview-resume-20261023/hosted-final-acceptance/`. No learning-app UI preview was tested.
