# Staging fix integration — 21 October 2026

**Local three-fix package: GO for a separately approved staging deployment. Hosted staging acceptance: NO-GO until that deployment is tested. Production release: NO-GO.**

## Changes Made

Integrated only these reviewed application changes into `../L'ecomax-seo-staging`:

- `app/layout.tsx`: remove the anonymous metadata manifest declaration and render one same-origin manifest link with `crossOrigin="use-credentials"`.
- `components/CategoryTiles.tsx`: encode whitespace and commas in the single URL used by `srcSet`, without double-encoding existing escapes.
- `public/images/placeholder.png`: add the reviewed neutral 640x640 image at the URL already used by product rendering.

No dependency change is needed. Existing React/Next rendering and image optimization provide the required behavior. The manifest depends on the browser's existing authorized Vercel session; it does not create or copy credentials. No CSP, Vercel Authentication, Supabase configuration, application auth, tracking/push suppression, empty-category behavior, migrations or unrelated source was changed. No files removed. Both worktrees received append-only preparation and verification history reports; previous reports were preserved.

All 2,123 baseline upload hashes matched before integration. The new inventory has 2,124 files: two changed, one added, 2,121 unchanged. A source snapshot and the staging worktree match that inventory. All 40 direct installed dependency versions match the candidate lockfile, including Next.js 15.5.28. The older main-workspace dependency junction was not used for validation.

## Package and exact identity

Evidence directory: `artifacts/seo-fix-integration-20261021/`.

- Full upload source: `source/`, containing the 2,124 inventoried files. Deploy only the inventoried source with its existing exclusions; do not upload local `node_modules`, `.next`, fixtures, logs or harness files. The `.next` build is a synthetic local test output and must not be deployed with `--prebuilt`.
- Small transfer archive: `three-fixes.zip`, 7,707 bytes, containing the three files with relative paths. It is a delta for the pinned candidate, not a standalone Next.js application or a patch for arbitrary main-workspace files.
- Archive SHA-256: `c4a234cafee185a45a6c23d9a1849e3c5ef15b9cedb20e1df561d9b498b66f35`.
- Full manifest: `source-manifest.json`; SHA-256 `58bd96cbb310dcef3e0bc0eb0432e92ba146070f145dc4049e0fd060b9a7e0b6`.
- Lockfile SHA-256: `845c413084fec5f3a2ee54e82138f05378e0afa71fb867595e41593fe93d4adb`.
- `integration.json` records before/after hashes; `package-verification.json` records the exact delta, dependency verification and source identity. `before/` preserves original bytes of the two modified files.
- Fresh read-only Vercel resolution at **2026-10-21T12:00:19.172Z**: alias `lecomax-seo-staging.vercel.app` → **`dpl_9PVLNqN3YRoSmDgi4T5D9o81Svcv`**, READY, project `prj_jPniwpH4s81bhISVReUKTQN0GwvD`. Immutable hostname: `lecomax-seo-staging-rf9rswh7q-lecomaxstore-4321s-projects.vercel.app`.
- Protection remains `all`; schedules 0; Git disconnected. Normal authenticated browser navigation to the immutable host succeeded and showed its old anonymous manifest link. The local fixes are not deployed. Evidence: `deployment-identity.json`.

## Validation

- Standalone TypeScript and focused ESLint: exit 0 (`types-result.json`, `lint-result.json`).
- Candidate regression tests: **27 passed**, zero failures/skips (`tests-result.json` and referenced log). Includes catalogue, rendering/loading, indexing, sitemaps and staging outbound denial.
- Change History regression: **4 passed** (`history-tests.log`).
- Production-mode build: exit 0 using Node 24.22.0 and the candidate's locked dependencies (`build-result.json`). Existing unrelated full-build lint warnings were retained, not suppressed.
- Exact compiled source exercised through a loopback Next.js production server, synthetic FR/AR catalogue responses and synthetic keys only. Server runtime external fetches and non-GET/HEAD operations were blocked by a harness outside the deployment source. APP_ENV is development for this isolated fixture; no real Supabase integration or hosted authentication is claimed from local tests.
- Final Playwright matrix: **18/18 route/viewport checks** at 1440, 375 and 390 pixels: home, boutique, FR/AR products and categories. HTTP 200, one H1, no overflow/page exceptions, parseable JSON-LD, production-domain canonical URLs and staging noindex. All images decoded; no HTTP 400/404/5xx in the final matrix (`browser-final-matrix.json`).
- Manifest and raw/optimized placeholder GETs: 200. Exactly one credentialed manifest link rendered. No malformed srcset warnings. Robots and sitemap index plus three shards: 200; XML valid and expected two fixture products/categories listed. Mobile menu open/close and AR category/product/back flow passed; FR desktop product navigation passed (`browser-navigation-http.json`).
- Inspected `local-ar-mobile.png` and `local-fr-desktop.png`. These are local synthetic screenshots, not hosted previews. Cookie consent remains visible and usable; tracking consent was not granted.

## Diagnosed test limitations

The first local process stalled on a desktop category AVIF response, causing a load-event timeout. Raw image, WebP and direct Sharp AVIF encoding succeeded. A fresh process of the **same unchanged build** served AVIF correctly and passed the entire matrix. Initial matrix, request logs and image/AVIF diagnostics are retained. The underlying first-process stall is not conclusively explained; include a cold image/AVIF check after deployment. No unrelated image pipeline change was added to this three-fix package.

The sole repeated local console error is unchanged CSP correctly rejecting the synthetic `ws://127.0.0.1:9` realtime destination. Real hosted realtime was not simulated. Navigation aborts of speculative RSC prefetches were recorded separately from HTTP failures. No CSP relaxation or console suppression was used. An intentional unsupported quality=76 diagnostic returned 400; the application requests allowed quality=75, which passed. This diagnostic 400 is not an application regression.

## Deployment and rollback instructions — not authorization

1. Review this exact manifest and delta. Before deployment, recheck all source hashes, target project/team, current alias identity and `all` protection. Obtain explicit staging deployment approval. Build remotely from the inventoried source using existing staging-only configuration; do not copy main-workspace environment values or use the synthetic local build output.
2. Record the resulting immutable deployment ID and source inventory association. Test through normal authorized Vercel login. Repeat manifest automatic loading, raw/optimized placeholder, srcset, desktop/mobile category images including cold AVIF, console/network and FR/AR navigation checks. Then close the hosted fix gate. Never describe local fixture tests as hosted verification.
3. If the new staging build regresses, stop acceptance and, with explicit rollback authorization, restore the stable alias to the above READY deployment after rechecking its identity/protection. This rollback restores the pre-fix behavior (including known old image/manifest defects); it is not a fully accepted release. No database rollback is required because this package contains no database changes.
4. For a local source rollback, compare current hashes to `integration.json` first. Restore only the two saved original files from `before/`; remove the added asset only if it still matches this package's hash. Preserve all unrelated work and all Change History records, and append a rollback report. These instructions were not executed.

## Genuine remaining gates

- Explicit staging deployment approval and post-deployment checks on the newly identified immutable deployment. There is no remaining local integration/type/lint/test/build blocker for these three fixes.
- Full SEO-engine staging acceptance still requires normal application-admin login and the separately approved bounded hosted editorial write/cache-invalidation/rollback exercise. Vercel login alone is not application-admin authorization.
- Production remains subject to the existing human FR/AR review, production-specific configuration, recovery and named release/rollback/monitoring gates in `operations/seo/final-staging-acceptance-20261021.json`. They were not repeated or claimed complete by this bounded integration.

No deployment, commit, push, migration, hosted write or production modification occurred. Learning history is available at `/change-history` when the updated local learning bundle is loaded; this storefront package intentionally excludes that mobile history bundle under its existing `.vercelignore` rules. No live learning-app preview is claimed.
