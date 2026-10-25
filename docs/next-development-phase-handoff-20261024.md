# Next L'ECOMAX development phase — planning handoff

**Planning only; implementation and deployment have not started.** SEO A+B+C+D are closed as already live. Read [the completion record](seo-abcd-completion-20261024.md) and preserve its exact rollback reference. Release E stays ON HOLD. Do not promote the SEO Preview or use its restrictive settings as a Production configuration template.

## Existing work inspected before this roadmap

| Existing work | What to reuse / avoid duplicating |
| --- | --- |
| `docs/storefront-performance-20261013.md`, `docs/storefront-loading-reliability-20261013.md` | Responsive hero, WebP defaults, content visible before hydration, concurrent optional reads/deadlines, deferred search/recommendations and removal of hidden content already documented. Old single-request ~3-second TTFB figures are historical, not current CWV. Their original “not deployed” wording must not be treated as today's release state. |
| `components/ResponsiveHeroImage.tsx`, `components/ScrollReveal.tsx`, `lib/use-settings.ts` | Inspected editor versions match the verified Production commit after LF normalization. Reuse responsive image selection, reduced-motion handling and request behavior; don't rebuild them from scratch. |
| `components/ProductGallery.tsx`, `components/OurProductsGrid.tsx`, `components/CartContext.tsx`, `app/page.tsx`, `app/layout.tsx`, `app/checkout/page.tsx`, `lib/use-cart-calculation.ts` | Inspected editor versions differ from Production. Existing local work includes gallery labels/dialog/Escape controls, image sizing, cart quote cancellation and debouncing. Diff and attribute each change before adoption; presence in the editor is not proof of deployment or correctness. |
| `app/layout.tsx`, package dependencies | Existing Speed Insights integration and production gating found in editor source. Verify deployed telemetry and accessible data before adding another analytics package or changing consent behavior. |
| `tests/storefront-loading-performance.test.ts`, gallery/variant/stock/delivery tests | Existing focused coverage for responsive hero markup, error fallbacks, initial visibility, deadlines, shipping and stock rules. Reuse appropriate cases when source actually changes. No tests rerun just for planning. |
| `docs/mobile-cart-checkout-implementation.md`, `docs/mobile-ipad-consistency-audit.md` | Existing Expo cart/checkout and viewport work; separate native app evidence from mobile-web acceptance. Do not redesign native screens as a side effect of website work. |

No current visual usability audit, Lighthouse run, field-CWV read or conversion analysis was performed in this planning turn. The roadmap identifies investigations and acceptance criteria, not newly proven defects.

## Recommended first task

**Establish a version-matched mobile storefront performance baseline and identify one measured bottleneck.** Start with home, boutique and one representative product page. Deliver a compact baseline report with deployment/commit, lab traces, available field metrics, request waterfall, LCP element and the smallest proposed fix. Stop for review before implementing it.

Why first: responsive image and loading improvements already exist, while local and live source differ. A baseline prevents duplicating finished work or shipping unrelated changes. Do not nominate an image rewrite or cache change until the measured cause supports it.

Suggested bounded measurement plan, once this next task is authorized:

1. Read-only confirm Production identity; inventory local changes against that exact commit. Prepare any future isolated branch from the verified baseline, preserving all dirty directories and archives. Do not create/reset a worktree as part of this planning handoff.
2. Inspect existing field data if authorized and available, segmented by mobile/desktop and date window. If unavailable or insufficient, record that rather than infer field results from lab runs.
3. Run three comparable mobile lab samples per selected page with recorded browser/device/network/CPU settings; report median and spread, cold versus warm separately. Inspect TTFB, LCP phases, layout shifts, long tasks, JS and image transfer. A single score is not a release gate.
4. Use read-only public content and a controlled local harness for interactions that could mutate state. Keep analytics/consent behavior unchanged. Do not exercise login, cart/order APIs or payment flows on Production.
5. Propose one change supported by a trace and an exact file diff; record expected benefit, regression risks and focused validation. No broad rewrite or automatic deployment.

## Prioritized roadmap

| Priority | Workstream / proposed scope | Dependency and completion criteria |
| --- | --- | --- |
| P0 | Baseline and source reconciliation | First task above. Versioned evidence, available field/lab distinction, top bottleneck and exact candidate files. No speedup claim before measurement. |
| P1 | Website speed / CWV | Address the dominant measured LCP/INP/CLS cause: image discovery, server wait, client work or shifts as evidenced. Preserve current cache freshness and visible server-rendered catalogue. Repeat comparable measurements after a local fix; future hosted measurement requires separate deployment authorization. |
| P1 | Cart and checkout reliability | Reconcile existing local quote/stock work with deployed handlers. Exercise synthetic variant changes, stale stock/price, coupon/shipping errors, slow/out-of-order responses, retry and duplicate-submit behavior with transport mocked. Preserve server-authoritative totals, idempotency and stock checks. Acceptance: no stale quote submitted, recoverable errors and focused regression cases; no real transactions. |
| P1 | Mobile web responsiveness and accessibility | Review 320/390/768/1024/1440 CSS-pixel widths, orientation, text zoom, keyboard/focus, sticky controls, gallery/search overlays and reduced motion. Prioritize purchase-blocking issues. Acceptance: usable reflow, no obscured primary controls/focus, labeled inputs/errors and keyboard-complete scoped flows, with screenshots/manual findings; not a blanket compliance certificate. |
| P2 | Product image optimization | Inventory actual rendered size, intrinsic dimensions, transfer bytes, responsive sources and LCP priority. Reuse existing WebP/AVIF/Next image pipeline. Only generate derivatives for demonstrated oversized assets; preserve originals, URL/variant mapping and fallbacks. Acceptance: verified byte benefit and visual comparison, no broken paths or new shifts. Move to P1 if baseline shows images dominate. |
| P2 | Product-page design and conversion | Review existing gallery, variant selection, stock/preorder messaging, shipping/returns and primary action on mobile. Propose one evidence-backed layout/copy change before implementation. Acceptance: user can identify price, availability, delivery and chosen variant; preserve actual policies and structured data. Conversion uplift requires trustworthy analytics, not design opinion or invented percentages. |
| P2 | Storefront resilience and ongoing performance | Extend existing timeout/error recovery only where a reproduced gap exists. Test empty/offline/slow/error states and navigation recovery with mocks; review existing observability access before adding services. Acceptance: no endless loading, bounded retries, clear recovery and no sensitive logs. Promote any demonstrated purchase-blocking regression to P1. |

Accessibility is a requirement across all changes, not a final cosmetic pass. Use the [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/) for scoped keyboard, focus, reflow, text alternatives, form errors and target-size checks; combine automated checks with manual interaction review.

CWV targets for available field data are p75 **LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1**, assessed separately for mobile and desktop. These are targets, not measured L'ECOMAX results. Lab traces diagnose causes and cannot replace field INP or a representative reporting window. Source: [Google Web Vitals](https://web.dev/articles/vitals).

## Boundaries and release discipline

- Keep SEO canonicals, indexability, sitemap/stock behavior and disabled IndexNow intact; add relevant smoke assertions only for affected changes.
- No blanket cherry-pick of the root editor changes or restrictive SEO Preview. Review selected files and dependencies against Production; preserve newer local work without assuming it is approved.
- No migrations, secret changes, real order/payment execution, cron/email/worker activation or Release E. Sandbox payment/rollback rehearsal are separate operational tasks requiring their own scope and authorization.
- Each eventual coherent implementation needs an append-only Changes Made report, meaningful focused checks and actual limitations. Build/type checks when source changes warrant them; reuse unchanged expensive evidence.
- A future release needs an exact reviewed artifact/diff, refreshed rollback anchor and separate deployment authorization. This document authorizes none of those actions.

## Next-account start point

Production last verified 2026-10-24 12:27:57 UTC: `dpl_CxX8Deg6R6T4prqTnHEiJVvqGu6f`, commit `ddf12f4a916478f80f1ca75a1ca83a193d36ef28`. A–D live; E on hold. Recovery branch `preparation/seo-preview-credential-20261023` and its 1,212-file package are evidence, not the next Production candidate. Preserve 2,601 hashes, all history and consumed guards. Vercel login works through `vercel.cmd` with approved network access; Supabase staging requires owner-authorized organization OAuth. Await authorization for the bounded baseline task; do not implement or deploy from this handoff alone.
