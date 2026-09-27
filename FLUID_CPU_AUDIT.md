# Fluid Active CPU audit — 2026-09-21

## Scope and baseline

Audited the root Next.js application (installed version 15.5.24): public Server Components/layouts, route configuration, the 159 API source files via cross-project searches and targeted reads, shared database helpers, mutation invalidation, middleware, authentication boundaries, client polling, recommendations, social images, sitemap/feed and scheduled jobs. Mobile and release copies were not modified.

The workspace already contained significant uncommitted CPU optimizations when this audit started. Those changes were preserved and reviewed; they are distinguished below from this audit's additions. This report does not claim that every private API business rule was exhaustively reviewed.

The supplied six-hour samples imply approximately 116 ms/invocation for product pages, 2,500 ms for product OG images, 264 ms for home, 113 ms for categories and 155 ms for login. These five samples total only 25.23 CPU seconds. They cannot alone explain the account's roughly 181 monthly CPU minutes: compare other routes/projects and equivalent traffic windows too.

## Findings and final behavior

| Area | Cause | Final optimization |
| --- | --- | --- |
| Product OG | Original HEAD handler runs Sharp rotation/crop/JPEG conversion, Satori layout and Resvg rasterization/PNG encoding on each invocation. Caching its source fetch does not cache these operations. | Existing on-demand ISR (300 s), final-PNG Data Cache (24 h), lazy renderer import and concurrent-request coalescing retained. Added caching of the identical 620×620 converted photograph (1 h), reused when price/availability changes. |
| Product detail | Original uncached Supabase helper, metadata/page duplicate reads, separate inventory query and recommendation pattern compilation. | Existing public fetch cache, React request memoization, reuse of inventory snapshot and generateStaticParams retained. Added precompiled family patterns and outage propagation instead of cached false 404s. |
| Home / category | Catalogue/settings/review work performed during server rendering. | Existing 300 s ISR, public fetch tags, review aggregation cache and duplicate catalogue-read elimination retained. Added shared presentation-settings read across root metadata/layout and homepage. |
| Login | Client authentication UI needs no personalized server render. Root settings and StoreSync previously induced work. | Build verifies a prerendered shell with 300 s revalidation. Existing StoreSync exclusion retained. Shared settings reduce regeneration work. Client login/redirect/session logic unchanged. |
| All public layouts | Root metadata, shipping helper and homepage query overlapping settings separately. | One allowlisted public-settings cache (300 s, store-settings tag), React-memoized within a render. Exceptions are not persisted as successful fallback settings. |
| Sitemap | Explicit no-store Supabase fetches defeated intended revalidation. | force-static plus tagged public fetches, 1 h revalidation; existing XML and fallback behavior preserved. |
| Size guide | Uncached settings query on every server render. | Public cached fetch, store-settings tag, 300 s ISR; existing path invalidation still refreshes after admin saves. |
| Review statistics API | Queries and aggregates all review rows each time the handler executes. | Cache the aggregate for 60 s under storefront-reviews; existing submit/update/delete invalidation applies. Error responses remain uncached. Preserves this API's original all-review selection (the storefront helper separately uses verified reviews). |
| Ecomedia social image | Repeats ImageResponse rendering despite cached post fetch. | On-demand static route output with 300 s ISR and storefront-ecomedia data tag. |
| Ecomedia article | Metadata and page independently read the same post. | React cache shares one request result. Live article/feed rendering remains dynamic to preserve existing community behavior. |

No JSX design, image dimensions, crop, typography, OG URLs, product URLs, login, cart, checkout or admin authorization was replaced. The shared settings reader is server-only and selects only public presentation keys. Authoritative commerce reads remain uncached.

## OG verification

Run `node scripts/benchmark-product-og.mjs` from the repository root. It compares the original HEAD renderer with the current renderer using a local photo and synthetic product, without database access.

Measured locally: original cold render approximately 1.2–1.3 CPU seconds; warm renderer approximately 0.8 CPU seconds. Output was byte-identical (377,911-byte PNG). Price changes reused the converted source. Final-PNG cache hit took about 1 ms elapsed, with CPU below this run's measurement resolution.

The benchmark deliberately uses an in-memory cache adapter. It proves saved rendering work and output equivalence, not Vercel network-cache latency or billing. Cold/warm module initialization makes the original/current cold figures unsuitable as a claimed renderer speedup. The main saving is skipping rendering entirely.

Cache regression tests cover concurrent requests sharing a render, positive stock changes reusing artwork, price/name/image/sold-out changes producing distinct artwork, and retrying failed renders. Database outage tests ensure failures do not become cacheable product 404s.

## Validation results

- Final production build completed successfully against the live public catalogue, prerendering 29 product pages, including TypeScript and ESLint checks (existing warnings remain).
- Production-mode HTTP GET checks: home, login, accessories category, an active product, sitemap and size guide all returned 200 with `x-nextjs-cache: HIT`.
- Actual OG route for `a-sac-dos-voyage-compression-sous-vide-43cm`: first request MISS, 1,791 ms elapsed; second request HIT, 7 ms elapsed, identical 197,327-byte PNG. Second requests used `facebookexternalhit/1.1` and received identical output. These are local elapsed times, not Active CPU measurements.
- All 18 focused regression tests passed. The broader suite passed 295 of 296 tests; one unrelated loader failure remains in `tests/assistant.test.ts`: the pre-existing extensionless import of `mobile/src/lib/purchasability` from `lib/assistant-retrieval.ts` cannot resolve under the installed Node test runner.
- No production database mutations, checkout payments or deployment were performed. Admin mutation invalidation was reviewed in code and tested through mocked regression tests, not exercised by changing live products.

## Files changed during this audit

- `lib/storefront-settings-server.ts` — new shared public-settings cache.
- `app/layout.tsx`, `app/page.tsx`, `lib/shipping-config-server.ts` — use shared settings.
- `lib/product-og-renderer.tsx` — converted photograph cache; unchanged artwork.
- `lib/product-recommendations.ts` — compile classification regexes once.
- `lib/db-server.ts`, `lib/product-share.ts` — distinguish database outages from missing products.
- `app/sitemap.xml/route.ts` — static output and tagged database reads.
- `app/guide-des-tailles/page.tsx` — cache public size-guide data.
- `app/api/reviews/stats/route.ts` — cache computed statistics.
- `app/api/ecomedia/social-image/[slug]/route.tsx` — cache rendered social image.
- `app/ecomedia/[slug]/page.tsx` — request-level post deduplication.
- `scripts/benchmark-product-og.mjs` — repeatable real-render/output benchmark.
- `tests/product-og-cache.test.ts`, `tests/product-cache-errors.test.ts` — cache behavior and outage regression coverage.
- `tests/seo-sitemap.test.ts`, `tests/review-submit-proof.test.ts` — update mocks for public cached reads / existing review invalidation.
- `FLUID_CPU_AUDIT.md` — findings, verification and remaining risks.

Important pre-existing uncommitted changes retained: product OG route/cache extraction, product/category/boutique/home ISR, public Supabase fetch mode, catalogue/review memoization, storefront mutation tags, StoreSync exclusions, shared client settings timer and middleware maintenance-request coalescing. These must be included with their helper files when deploying the workspace; this audit did not recreate them.

## Remaining CPU and freshness risks

- First uncached OG artwork remains expensive. Different real products or changed artwork require rendering. Random missing slugs still require a lookup on the first request, but do not run the renderer. Cache hits are not a substitute for abuse protection against unlimited unique URLs.
- Final PNG is keyed by visible product fields, with stock normalized to in/out of stock. Source files overwritten at an unchanged image URL can remain stale until image/PNG cache revalidation; use a new image URL when replacing artwork. Increment the renderer cache version if its design changes.
- Five-minute ISR and time-based data caches can briefly serve stale content. Product/admin/order mutations already invalidate tags/paths; direct database edits rely on revalidation. Broad storefront-products invalidation can refresh many pages after an order. Narrowing it requires complete inventory mutation coverage and was not attempted speculatively.
- StoreSync still polls public server-backed pages every 30 seconds. Cached pages reduce rendering CPU, but requests and middleware still occur. Public settings/products/categories APIs and live community/chat polling can contribute substantial invocation volume. Cart reconciliation, checkout quotes, authentication and private/admin reads remain live intentionally.
- Middleware maintenance checks execute on storefront requests, including cached pages; its short in-instance cache/coalescing is not a global cache. Security checks and rate limits remain intact. Admin/auth-bearing API responses can intentionally bypass shared caching.
- Search/recommendations still scan bounded catalogue/analytics datasets, and review aggregation scans review rows on cache misses. Larger datasets should move aggregation to the database after measuring the actual workload.
- AI, upload/media work, admin analytics, message polling and the two daily cron jobs retain their existing behavior. The five supplied route samples are insufficient to attribute account-wide consumption to them.
- Next.js Data Cache has payload limits. The measured OG PNG fits comfortably, but large catalogue fetches or unusual image payloads should be monitored for cache-write failures.
- Static build success alone does not prove live checkout/payment flows. This audit performs no real purchases, outbound messages or production mutations.

## Verify after deployment

1. Deploy the complete reviewed workspace changes. No production deployment was performed as part of this audit.
2. In Vercel Observability → Functions, select production and the new deployment. Compare equivalent six-hour windows: total Active CPU, invocations, and CPU/invocation for the five original routes. Compare request volume too. Database waiting time is not itself Active CPU.
3. Request an actual product URL and its OG URL twice with ordinary GET requests. Repeat with a social crawler User-Agent. Inspect status, Content-Type and `x-vercel-cache`; expect warm HITs, with occasional MISS/STALE when cold or revalidating. Avoid browser hard-refresh/no-cache headers during this check.
4. Confirm `/`, category and `/connexion` responses are cache-served. Check the deployment build output: public pages should be Static/SSG, not dynamic server rendering. Local `x-nextjs-cache` checks validate Next.js caching; production `x-vercel-cache` validates Vercel's layer.
5. In a preview environment, change a product price/image, cross stock from positive to zero, hide a product, edit category/settings, and submit/delete a review. Verify affected content refreshes and genuine missing/hidden products stay 404. Positive stock changes should reuse identical OG artwork. Verify login, cart and checkout with the project's normal smoke flow.
6. If CPU remains high, inspect all routes and account projects, not just these five. Investigate cache misses, frequent tag invalidations, unique bot URLs, polling APIs and errors. Do not infer a CPU reduction from wall-clock duration alone.

References: [Next.js 15 caching](https://nextjs.org/docs/15/app/guides/caching), [unstable_cache](https://nextjs.org/docs/15/app/api-reference/functions/unstable_cache), [Vercel Active CPU pricing](https://vercel.com/docs/functions/usage-and-pricing), [Vercel Functions Observability](https://vercel.com/docs/functions).
