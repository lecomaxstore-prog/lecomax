# L’ECOMAX mobile favourites implementation

Date: 26 July 2026

## Completed experience

- Rebuilt the Expo Router `Favoris` tab as a production commerce screen.
- Added a safe-area header with back navigation, L’ECOMAX logo, cart action, and live cart badge.
- Added the dynamic saved-item count, All/In-stock filters, and an accessible sorting sheet.
- Added full-width saved-product cards with cached media, missing-image fallback, promotion/new badges, stock state, complete product name, reviews, price, saved variant, add-to-cart, product deep link, and destructive favourite action.
- Added optimistic removal with a five-second restore action.
- Added stock revalidation immediately before cart insertion.
- Added a variant sheet that excludes unavailable colours and sizes.
- Added immediate cart/favourites badge updates and duplicate add prevention.
- Added API/admin-driven horizontal recommendations.
- Added pull-to-refresh, skeleton, empty, filtered-empty, offline-with-cache, fatal API error, removed-product, out-of-stock, adding, success, and failure states.
- Added the authenticated cross-device synchronization message.
- Verified the centred 480 px mobile-oriented shell at iPad width and exact 390 px phone metrics.

## Synchronization contract

The existing customer wishlist remains stored in Supabase Auth user metadata:

- `wishlist`: ordered product slugs.
- `wishlist_variants`: optional map keyed by product slug with `color` and `size`.

The extension is backward compatible:

- Website slug-only save/remove calls preserve existing variant metadata.
- Website slug-only replace calls preserve variants for retained products.
- Mobile guest IDs and selections persist in the existing Zustand/AsyncStorage store.
- On sign-in, guest and server slugs merge without duplicates.
- Mobile ID/slug and variant mapping uses only current API products.
- Sync failures roll the optimistic local state back.

The wishlist API no longer uses the repository’s static fallback product catalogue. Product existence and returned website card data are read from the shared Supabase `products` table.

## API endpoints and fields

- `GET /api/products?active=true`
  - `id`, `slug`, `name`, `category`, `brand`, `price`, `original_price`
  - `images`, `thumbnail`, `active`, `stock`, `created_at`
  - `colors`, `sizes`, `color_stock`, `color_sizes`
  - `out_of_stock_colors`, `out_of_stock_sizes`, `featured`, `tags`, `video`
- `GET /api/reviews/stats`
  - rating and verified-review count keyed by product slug.
- `GET /api/settings`
  - favourites section visibility, titles, recommendation ordering, label, and default sort.
- `GET /api/recommendations?limit=12`
  - shared recommendation slug order and strategy fallback.
- `GET /api/wishlist`
  - authenticated `slugs`, `variants`, and website-compatible product cards.
- `POST /api/wishlist`
  - authenticated `save`, `remove`, and `replace` actions with optional variant metadata.
- `POST /api/client-data/event`
  - consent-gated `favorite_add` and `favorite_remove` events on the website.

All mobile requests continue to use `EXPO_PUBLIC_API_URL`, the existing refresh-token handling, 12-second timeout, safe GET retries, and React Query persistence/invalidation.

## Admin controls

The existing role-protected Settings dashboard now controls:

- Main favourites title.
- Recommendation section visibility.
- Recommendation section title.
- Explicit recommendation slug order.
- Featured/new promotional label.
- Default sorting mode.

Existing product, promotion, inventory, media, category, review, analytics, and customer permissions remain the source of truth. Supabase real-time invalidation refreshes products, promotions, and settings in the app.

## Tests and verification

- Prettier: passed.
- Mobile ESLint: passed with zero warnings.
- Mobile TypeScript: passed.
- Root TypeScript with test-extension support: passed.
- Unit/integration-oriented tests: 11 passed, 0 failed.
  - Guest/account deduplicated merge.
  - Removed-product mapping.
  - In-stock filtering.
  - Five sorting strategies.
  - Variant availability/defaulting.
  - Empty favourites.
  - Existing commerce pricing tests.
- Admin API contract audit: 168 calls checked, 0 failures.
- Mobile secret audit: 260 files checked, 0 findings.
- Mobile interaction audit: 19 screens, 171 controls, 0 errors, 0 warnings.
- Next.js production build: passed.
- Expo Android production bundle: passed.
- Expo iOS production bundle: passed.
- Expo web static export: passed.
- Visual QA: populated and empty states at 390 px phone and 768 px iPad viewport.

## Genuine remaining configuration

The application/dashboard deployment must include the updated Settings route, Wishlist route, and `20260726123000_mobile_app_settings.sql`. The live Supabase project does not yet contain the favourites merchandising rows, so current production clients will use safe defaults until that migration is applied.

The broader live Supabase audit also still reports the previously documented order, inventory, push-token, and account-deletion migrations as unapplied.

Mobile behavioural analytics are intentionally not emitted because the mobile app does not yet expose an explicit data-collection consent/session contract equivalent to the website cookie consent. Website favourite add/remove analytics are connected and remain consent-gated. A mobile consent UX and server registration contract are required before enabling equivalent mobile behavioural events; the implementation does not bypass customer privacy to simulate readiness.
