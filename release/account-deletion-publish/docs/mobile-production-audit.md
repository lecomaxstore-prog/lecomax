# L’ECOMAX mobile production audit

Audit date: 2026-07-26

## Release decision

The application code passes formatting, lint, TypeScript, API-contract, secret, unit-test, Next.js production-build, and Expo iOS/Android/web bundle validation. Production checkout remains intentionally unavailable until the five pending Supabase migrations listed below are applied. This prevents duplicate orders and overselling rather than accepting unsafe orders.

## Screen checklist

| Screen | Data and navigation | Loading / empty / error | Accessibility and interaction | Status |
| --- | --- | --- | --- | --- |
| Splash | Expo native splash configuration | Native startup state | Branded static asset | Verified |
| First-launch onboarding | Public app settings + local completion version | Blocking initialization state | Skip, continue, progress labels | Implemented |
| Home | Products, categories, banners, promotions, settings APIs | Skeletons, retry, safe empty sections | Functional header, search, category, product and CTA actions | Improved |
| Search | Products, categories and dashboard-managed suggestions | Debounced state, skeleton, retry, no-results action | Search, clear, scan, filter, sort and category labels | Improved |
| Catalogue / collections | Products and categories APIs | Skeleton, refresh and reset empty state | Accessible filter, sort, category and stock controls | Improved |
| Product detail | Product, review, settings and size-guide APIs | Loading, retry, stock and review errors | Variant state, share, favourite, quantity and add-to-cart feedback | Improved |
| Favourites | Shared product API + persisted IDs | Existing loading / empty handling | Product navigation and remove actions | Verified |
| Cart | Persisted cart + live server validation at checkout | Empty state and coupon errors | Quantity, remove, coupon and checkout actions | Verified |
| Checkout | Shipping, coupon, settings, auth and order APIs | Field errors, submitting state and server failure feedback | Duplicate submission prevention and labelled inputs | Hardened |
| Order confirmation | Created order response | Missing-order fallback | Profile/order navigation | Verified in code |
| Orders | Authenticated orders API | Loading, signed-out/error and empty states | Expandable labelled order rows | Improved |
| Notifications | Live promotions and published products | Loading, retry and empty states | Settings opens OS settings; rows navigate to content | Repaired |
| Account | Auth/session and shared preferences | Signed-out and authenticated states | Appearance, language and service rows labelled | Improved |
| Authentication | Supabase auth and password reset | Validation, loading, success and server errors | All inputs and password controls labelled | Improved |
| Profile | Account profile API | Loading, save and deletion feedback | Inputs and actions labelled | Improved |
| Addresses | Persisted authenticated addresses | Empty state with real add action | Address and navigation actions | Improved |
| Scanner | Expo Camera + product lookup | Permission, camera, lookup and retry states | Permission, torch, retry and search actions labelled | Improved |
| Support / legal | Shared settings and pages API | Missing-content fallback | Back and external actions | Verified |
| Not found / fatal error | Router and error boundary | Recovery actions | Explicit retry/home labels | Improved |

## Implemented checklist

- [x] Central L’ECOMAX palette, typography, spacing, radius, border and control-size tokens.
- [x] Removed bundled production product, price, variant, review-count and shoe-size fallbacks.
- [x] Product descriptions and description images are available through the public product contract.
- [x] Dashboard controls homepage promotions, new arrivals, product section, welcome offer, onboarding and search suggestions.
- [x] Search category imagery comes from dashboard-managed category media.
- [x] Homepage no longer substitutes an unpublished campaign with a bundled campaign.
- [x] Card add actions route to variant selection whenever options are required.
- [x] Product add-to-cart revalidates active status and stock before mutation.
- [x] Coupon eligibility excludes already-discounted products on client and server.
- [x] Order creation uses server pricing, idempotency and atomic inventory prerequisites.
- [x] Notification settings and notification rows are functional.
- [x] Size guide uses the API with loading, retry and error states.
- [x] Persisted React Query cache, cart and favourites support weak/intermittent connections.
- [x] Query intervals reduced; image memory/disk caching and stable list keys retained.
- [x] Automated interaction audit covers 19 screens, 44 components, 140 controls and 13 inputs with zero findings.
- [x] Safe-area layouts and Expo bundles validated for Android, iOS and web.

## Remaining production configuration

Apply these migrations in order:

1. `20260726120000_order_source_idempotency.sql`
2. `20260726123000_mobile_app_settings.sql`
3. `20260726130000_mobile_push_tokens.sql`
4. `20260726133000_atomic_order_inventory.sql`
5. `20260726140000_account_deletion_requests.sql`

Then:

- Save the mobile settings once in the dashboard, including onboarding copy and search suggestions.
- Configure `EXPO_PUBLIC_EAS_PROJECT_ID` and store signing credentials.
- Run signed EAS production builds on Android and iOS.
- Execute one real low-value order against production payment/shipping configuration and verify it in `/admin/orders`.
- Re-run `npm run audit:supabase`; it must return `"ok": true` before enabling checkout.
