# Storefront loading and reliability ? 2026-10-13

The live homepage still serves the earlier banner implementation. A public request returned HTTP 200, 54,011 compressed bytes, 3.011217 seconds to first byte and 3.607982 seconds total. These are single-request observations, not Core Web Vitals.

## Changes

- Removed six permanently hidden navigation images (12,191,600 total source bytes) and hidden promotion markup; visible navigation is retained.
- Load search code only when opened, with a loading state.
- Product rails and collection cards appear without JavaScript reveal timers or entrance delays.
- Optional recommendation ranking waits until the catalogue is near the viewport, with a 5-second request deadline.
- Client settings/catalogue reads time out after 10 seconds, allowing later refreshes to recover. Boutique refreshes its client data without a duplicate server-shell refresh.
- Includes the earlier responsive hero and smaller default WebP assets already present locally.

## Validation

21 focused tests passed. TypeScript and focused lint passed. Production build generated 249 pages; existing repository-wide lint warnings remain. Generated homepage has one responsive hero image, no hidden menu image elements, and visible catalogue content in 593,354 bytes of HTML. This is not a measured production speedup.

No deployment performed. Browser/mobile performance and checkout end-to-end checks remain unverified. The immutable follow-up report records the exact checks and limitations.
