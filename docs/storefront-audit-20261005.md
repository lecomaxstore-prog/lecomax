# Storefront audit — 5 October 2026

Scope: repository review, targeted fixes, automated regressions, real catalogue read-only checks, and headless Chrome responsive checks. Based on main commit `e337f90`. Branding, layouts, payment providers and business policies are preserved. Work was isolated from the original workspace's unrelated changes.

## Findings and fixes

| Priority | Finding | Change / main files |
| --- | --- | --- |
| High | Browser storage restrictions could interrupt checkout after order acceptance or lose the retry key. | Added optional storage with an in-memory fallback; used by cart, checkout, confirmation and wishlist. `lib/browser-storage.ts`, `app/checkout/page.tsx`, `app/merci/page.tsx` |
| High | Same-event cart changes could use stale items; an inventory response could remove a product added during the request. | Synchronous cart reference updates and reconciliation limited to the queried products. `components/CartContext.tsx` |
| High | Cart additions did not consistently enforce selected variant stock, integer quantities and colour prices. | Validate variants/quantities and apply the variant price; cap stock and preorder quantities; sanitize persisted lines. `components/CartContext.tsx` |
| High | Repeated checkout taps could enter before React's loading state updated; stalled requests offered poor recovery. | Synchronous submission guard, 30-second COD request timeout, and 15-second quote deadline with a friendly error. Server idempotency remains authoritative. `app/checkout/page.tsx`, `lib/use-cart-calculation.ts` |
| Medium | Wishlist responses could overwrite a later session; rapid taps could duplicate mutations. | Session-version guards and synchronous pending tracking. `components/WishlistContext.tsx` |
| Medium | Failed Ecomedia requests could reject without a usable retry; filter changes could append stale results. | Abort obsolete reloads, guard pagination, deduplicate posts and show retry feedback. Validate malformed authenticated post/comment bodies. `components/ecomedia/EcomediaFeed.tsx`, `app/api/ecomedia/{posts,comments}/route.ts` |
| Medium | Homepage counts, promotion copy and ecoClub claims disagreed with the catalogue or implemented loyalty rules. | Server-supplied initial counts, live discount maximum, no resurrection of bundled products when the live catalogue is empty, and shared loyalty tiers. `app/page.tsx`, `components/CategoryTiles.tsx`, `app/ecoclub/page.tsx` |
| Medium | Shipping/confirmation copy and store opening hours used conflicting constants. | Read shipping and business-hour configuration; confirmation displays the quoted estimate and server-returned total. Empty opening hours ask customers to contact the store. `app/boutique/BoutiqueClient.tsx`, `app/{boutiques,nous-contacter,merci}/page.tsx`, `lib/storefront-settings-server.ts` |
| Medium | Six permanently hidden menu images downloaded approximately 12.2 MB. | Removed their unused image elements without changing the visible menu. `components/Header.tsx` |
| Medium | Preorder products were marked unavailable in product metadata/schema. | Use preorder availability for eligible zero-stock products. `lib/product-share.ts`, `app/produit/[slug]/page.tsx` |
| Low | Cart quantity controls were small and lacked specific accessible names; some Ecomedia text was corrupted. | 44px controls, explicit French names and stock-aware disabled states; repaired visible text. `app/panier/page.tsx`, Ecomedia components |

Academy source anchors in `learning/click-flows.ts` and `learning/resources.ts` were updated to match the cart implementation.

## Verification

- Full regression suite: 495 tests, 494 passed, one skipped; zero failures. Six new behavioural tests cover restricted storage, cart quantity/price/variant logic, malformed hydration, inventory races, malformed Ecomedia payloads, and wishlist session/double-tap behaviour.
- TypeScript, ESLint and production build pass. Build includes 631,184 course validation checks. The isolated local build uses non-secret placeholders for missing service configuration; live catalogue/browser checks use the configured development server.
- Existing commerce and preorder SQL suites pass in embedded PGlite: idempotency, stock/preorder constraints, rollback, coupon contention, configuration conflicts and permissions. This is not a multi-connection production load test.
- Existing Android back-controller suite: ten scenarios plus scroll-return cases pass. No native mobile source changed.
- Admin API contract audit: 161 routes and 183 client calls pass.
- Secret scan: 1,342 files, no findings. No configured private-value comparisons were available in the isolated checkout, so this does not replace a credential rotation/history audit.
- All 29 active catalogue product pages return successful HTML with a title, canonical link, product JSON-LD and image references. This does not certify every remote image URL.
- Headless Chrome: nine routes at 320, 360, 375, 390, 412, 430, 768 and 1440 pixels (72 checks), with no horizontal overflow or captured uncaught browser errors. Real product variant selection, add-to-cart and refresh persistence pass. Additional assertions check that hidden menu PNGs do not download and a checkout phone field is reachable at 390×400.
- Mobile homepage, cart and checkout screenshots were inspected. Browser scripts and reports are under `scripts/*storefront-audit*`, `scripts/audit-live-catalog.mjs`, `scripts/audit-performance.mjs` and ignored `out/storefront-audit/`.

## Performance evidence and limits

Before the menu fix, an unthrottled production Chrome sample at 390px measured LCP 1,256ms, CLS 0 and about 13.67 MB of resource transfer. Six hidden menu PNGs accounted for approximately 12.19 MB. The desktop sample reused the same browser cache and must not be compared as a cold-load result. These are laboratory observations, not field Core Web Vitals, a slow-network benchmark or an INP measurement. The fix removes the six requests; it does not imply a measured percentage improvement in conversion or LCP.

## Remaining operational checks and decisions

- Enter and verify actual opening hours in admin settings. Existing address/telephone copy and legal return terms still require owner review when business details change.
- Run an approved staging/sandbox purchase for COD and PayPal, including capture, confirmation email, stock effects, cancellation and refund. No live payment, customer account, email or order was created by this audit.
- Test on a physical Android phone with the real keyboard, touch, network loss and Back button. Reduced viewport emulation does not prove native keyboard behaviour.
- Inspect authenticated admin and customer journeys with suitable test accounts, including registration, recovery, profile edits, wishlist merge and account deletion. Existing automated tests cover portions of these flows; no exhaustive live account audit is claimed.
- Monitor field LCP/INP/CLS and real slow-network results after release. Product schema still contains a fixed shipping transit range; a structured admin-configured range would avoid drift if shipping estimates change. Search currently caps its fetched catalogue, which should be revisited before substantial catalogue growth.
- Broad accessibility certification, a penetration test, production database load/locking verification and every possible filter/checkout permutation remain outside the executed checks.

Readiness: the targeted fixes pass the recorded checks and are suitable for release with post-deployment verification. This is not a claim that every business operation or external payment integration has been certified.
