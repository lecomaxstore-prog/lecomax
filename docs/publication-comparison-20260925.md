# Publication comparison — September 25, 2026

Repository: lecomaxstore-prog/lecomax (private). Target: main and Vercel project lecomax.

GitHub baseline: 7abbf2fdc9353d64114f24ccedce59b89feac408.
Original local branch: agent/mobile-product-redesign. Its history differs from main (7 local-only commits, 25 main-only commits). A source snapshot was reconciled in an isolated checkout; the original working directory was preserved.

## Changes ready for publication

46 source, documentation, test, configuration and asset files differ from GitHub main before this report. Most apparent local changes were already published.

| Change | File |
| --- | --- |
| Updated | `.env.example` |
| Updated | `.gitignore` |
| Added | `app.json` |
| Updated | `app/admin/settings/page.tsx` |
| Updated | `app/api/product-translations/route.ts` |
| Updated | `app/layout.tsx` |
| Updated | `app/page.tsx` |
| Added | `components/ChatWidget.module.css` |
| Updated | `components/ChatWidget.tsx` |
| Updated | `components/Footer.tsx` |
| Updated | `docs/product-translations.md` |
| Added | `docs/search-console-crawled-recheck-20260924.json` |
| Added | `docs/search-console-discovered-recheck-20260924.json` |
| Added | `docs/search-console-resume-20260924.md` |
| Added | `docs/social-sharing-preview.md` |
| Added | `lib/chat-dictation.ts` |
| Added | `lib/product-translation-store.ts` |
| Updated | `lib/product-translation.ts` |
| Updated | `lib/social-image.ts` |
| Updated | `mobile/src/app/(tabs)/account.tsx` |
| Updated | `mobile/src/app/(tabs)/catalog.tsx` |
| Updated | `mobile/src/app/(tabs)/search.tsx` |
| Updated | `mobile/src/app/(tabs)/wishlist.tsx` |
| Updated | `mobile/src/app/product/[slug].tsx` |
| Updated | `mobile/src/components/home-promotion-section.tsx` |
| Updated | `mobile/src/components/product-description.tsx` |
| Updated | `mobile/src/components/product-gallery.tsx` |
| Updated | `mobile/src/components/search-product-card.tsx` |
| Updated | `mobile/src/components/wishlist-product-card.tsx` |
| Updated | `mobile/src/components/zoomable-product-photo.tsx` |
| Updated | `mobile/src/global.css` |
| Updated | `mobile/src/screens/checkout-screen.tsx` |
| Updated | `mobile/src/screens/smart-assistant-screen.tsx` |
| Added | `public/images/social/lecomax-share-v2.jpg` |
| Added | `public/images/social/lecomax-share-v3.jpg` |
| Added | `scripts/backfill-product-translations.mjs` |
| Added | `scripts/prepare-social-image.mjs` |
| Added | `scripts/setup-product-translations.ps1` |
| Added | `scripts/verify-share-preview.mjs` |
| Added | `tests/chat-dictation.test.ts` |
| Updated | `tests/product-translation-api.test.ts` |
| Updated | `tests/product-translation-browser.test.ts` |
| Added | `tests/product-translation-store.test.ts` |
| Updated | `tests/product-translation.test.ts` |
| Added | `tests/social-image.test.ts` |
| Added | `update_database.bat` |

## Reconciliation decisions

- Keep GitHub's newer customer-assistant policy, conversation context, 60-second API timeout, source-backed tutor, source links, and their tests.
- Keep GitHub-only files, including customer-assistant-policy, learning-source-context, associated documentation and evaluation scripts.
- Preserve assistant retrieval imports ending in .ts so the Node test runner can resolve them.
- Keep secure order error handling; exclude the local debug-file write and database-error response payload.
- Apply local assistant UI, product/gallery/account/search designs, chat dictation, persisted translations, social images, and related documentation and scripts.
- Retain the web scroll style type and destructure checkout keyboard hook results to pass TypeScript and React lint checks.
- Exclude 2,388 old tracked build/release artifacts, the unrelated projects folder, Lighthouse output and the temporary .gitignore_append.txt file. These are not deletions of production source.
- Environment values, signing material, dependencies and local logs remain outside the publication.

## Validation

- 421 tests passed, plus 10 Android Back scenarios and scroll-return scenarios.
- Website and mobile TypeScript checks passed.
- Mobile lint passed with one existing auth effect dependency warning.
- Admin API audit: 182 calls, 161 routes, no failures.
- Mobile secret audit: 182 source files, no findings.
- Mobile interaction audit: no errors; 17 accessibility warnings.
- Next.js production build passed using non-secret placeholder configuration locally; Vercel builds using its existing production environment.
- Changed text files scanned for credential/private-key patterns without findings.

## Deployment scope

Vercel deploys the Next.js website and APIs. Mobile source is published to GitHub; distributing the Expo/Android UI to installed apps requires a separate Expo update or app release. No database migration or translation backfill is executed by this publication.
