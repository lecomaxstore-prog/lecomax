# L’ECOMAX Mobile and iPad Consistency Audit

Date: 2026-07-26

## Result

The Expo application now renders as one consistent mobile experience from compact
phones through iPad landscape. On viewports wider than 480 px, the complete
application is centered inside a 480 px shell with a neutral outer background.
Navigation, overlays, onboarding, product media, checkout progress and cart
feedback use that same content width.

## Implementation checklist

- [x] Add a reusable `AppViewport` with a single 480 px maximum width.
- [x] Use `useWindowDimensions` so rotation and split-view changes update live.
- [x] Apply the viewport at the root so all 19 routes and the tab navigator inherit it.
- [x] Keep the existing one- and two-column mobile layouts on tablets.
- [x] Remove large-screen campaign and gallery expansion.
- [x] Constrain native modal and zoom-overlay content to the app viewport.
- [x] Recalculate cart animation coordinates relative to the centered viewport.
- [x] Replace legacy safe-area handling with `react-native-safe-area-context`.
- [x] Permit portrait and landscape orientation in Expo configuration.
- [x] Protect the brand mark and navigation labels from destructive font scaling.
- [x] Remove static `Dimensions.get` usage from application source.
- [x] Preserve compact-phone behavior below the 480 px cap.

## Areas covered

- Root navigation and route transitions
- Homepage header, campaign hero and promotional carousel
- Search, catalogue and two-column product grids
- Product details, gallery and full-screen media zoom
- Wishlist, cart and cart-to-navigation feedback animation
- Checkout and checkout progress
- Account language selector
- Shoe-size guide
- Splash and onboarding
- Bottom navigation
- Safe areas, rotation and landscape

## Width behavior

| Window width | App content width | Expected behavior |
| ---: | ---: | --- |
| 320–479 px | Window width | Fluid compact-phone layout |
| 480 px | 480 px | Full mobile reference width |
| 768 px | 480 px | Centered iPad portrait shell |
| 1024 px | 480 px | Centered iPad landscape shell |

Portrait and landscape onboarding were visually checked at 768 × 1024 and
1024 × 768. The root viewport contract also covers every intermediate width
without device-name or tablet-only branching.

## Validation results

- Prettier: passed for all changed files.
- Mobile interaction audit: passed; 19 screens, 45 components, 140 controls,
  13 text inputs, 0 errors and 0 warnings.
- TypeScript: passed with `tsc --noEmit`.
- Expo lint: passed.
- Unit tests: 5 passed, 0 failed.
- Expo production export: Android, iOS and web bundles generated successfully.
- Shared web/admin production build: passed; 185 static pages generated.

## Remaining release configuration

- A signed App Store or Play Store build still requires configured EAS project
  credentials and signing.
- The shared web/admin build used compile-time placeholders because
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` were not available to the
  build process.
- Pending Supabase migrations from the broader production audit must be applied
  before declaring the real checkout-to-admin journey production-complete.
- Final physical-device QA should cover iOS and Android keyboard behavior,
  split view, display zoom and the largest accessibility text settings.
