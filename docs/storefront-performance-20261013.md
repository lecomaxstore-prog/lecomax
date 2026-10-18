# Storefront loading improvements — 2026-10-13

## Observed baseline

Public homepage HTTP requests from the development environment returned 200:

- Uncompressed: 603,935 bytes, 3.301 seconds to first byte, 12.901 seconds total.
- With compression: 54,011 transferred bytes, 3.132 seconds to first byte, 4.295 seconds total.
- The captured public HTML had four hero image elements: desktop/mobile foreground images and desktop/mobile backdrop images. Both foreground variants were prioritized.

These are individual request observations, not a Lighthouse score, browser rendering time, or a measurement of the customer's connection. Compression is already working on the public site. Post-deployment measurements are still required.

## Implemented

- One responsive picture chooses the matching desktop/mobile source. Media-specific preload hints avoid requesting both priority variants. Allowed remote images use Next.js optimization, with original-file fallback after errors.
- Default banner files now use WebP. Desktop: 2,145,760 → 145,308 bytes. Mobile: 2,158,587 → 145,360 bytes. This is about 93% smaller at the source-file level; the former Next.js optimized response was already smaller than its PNG source. Existing settings pointing to the shipped PNG paths map to the new files. Custom banners remain unchanged.
- The main hero image, heading and actions no longer wait for entrance animations. The catalogue is visible before hydration. ScrollReveal only hides offscreen elements after its observer is available, and respects reduced motion.
- The optional community post request starts in parallel with other homepage reads. Banner and community reads have 1.8-second deadlines and preserve their existing empty fallbacks. Public cache tags and freshness intervals are unchanged.

## Validation and release

Focused tests cover responsive markup, preload selection, unknown image hosts, image-error recovery, legacy banner paths, initial content visibility, concurrent requests, request deadlines and asset decoding/size. Existing catalogue/cache-error and change-history tests are also used.

The immutable linked change report records final build and validation results. No production deployment, mobile browser timing or Core Web Vitals improvement is implied by these local changes. Repeat browser measurements after deployment, including mobile LCP, INP, CLS, cold/warm requests and image request waterfalls.
