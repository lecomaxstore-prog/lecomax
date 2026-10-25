# SEO recovery correction and Preview handoff — 23 October 2026

## Decision

**GO for review of the corrected candidate; NO-GO for a new deployment until Preview isolation is verified. No deployment was submitted.** Production deployment remains subject to separate explicit approval. Release E and the session-security prototype remain on hold; no migrations, jobs, secrets, flags, payments or customer records were changed.

The corrected candidate is **already identical in Git tree content to the currently live Release D source**. A production redeployment is not needed to deliver these filename corrections to the live site: the corruption existed in the separate recovery checkout. Do not treat the earlier handoff's production identity as current.

## Verified identities

- Vercel login: `lecomaxstore-4321`; team `team_yFLUcpSvgQi8EQuvuorOZW7w`, slug `lecomaxstore-4321s-projects`.
- Production project: `lecomax`, `prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb`.
- Current apex deployment: `dpl_CxX8Deg6R6T4prqTnHEiJVvqGu6f`, READY, immutable host `lecomax-5tvr48bai-lecomaxstore-4321s-projects.vercel.app`.
- Verified deployed source: `ddf12f4a916478f80f1ca75a1ca83a193d36ef28`. Metadata includes an unrelated dirty-root Git label, so this conclusion also uses all **2,053 uploaded source-file identifiers**, freshly compared with the retained Release D receipt: zero mismatches or missing source files.
- Corrected commit: **`8a12abcce38c0dc557a9ef9f86c3ce3dd113e863`**, branch `correction/seo-abcd-utf8-20261023` in `.recovery-seo-abcd-corrected` (separate local repository).
- Corrected and production Git tree: `e8dda63a070f4f429616ec521ad633836c99960f`; **zero source differences**.
- Original recovery retained, clean: `7278fcf84b733370081e9d44f87e768e1beed4b1`. The user-supplied `...3378...` SHA was a transcription error; Git and the immutable original manifest use `...3370...`.
- Original `artifacts/seo-recovery-abcd-manifest.json` unchanged; its digest is recorded in the [new complete 2,588-file manifest](../artifacts/seo-preview-resume-20261023/corrected-manifest.json).

Sandbox HTTPS produced EACCES; the authorized network check returned HTTP 308 and the installed CLI authenticated successfully when invoked directly through `node .../vercel/dist/vc.js`. No interactive login or token entry is required. The main workspace is dirty with pre-existing work and was not used as a deployment source.

## Exact correction scope

Thirty 100%-identical image renames, no file-content changes, no application-reference edits. Names were recovered from baseline Git commit `1f17d9e8c54f960b8ba873dfe0974075ed8a9e4a`, matched by blob identity and original paths, and independently confirmed against current Release D. No filenames were invented. Original unusual spellings such as `descption iamges` were preserved.

| Original product directory restored | Images |
| --- | ---: |
| `Chaussons d'extérieur à poils pour femme` | 6 |
| `Chaussons d'intérieur pour femme` | 6 |
| `Chaussons à fleurs de rose` | 6 |
| `GENAI Écouteurs stéréo HD sans fil TWS` | 4 |
| `Sac bandoulière` | 8 |

All paths are under `public/images/products/`. [Exact old/new paths, original blob identities, SHA-256 hashes and reference locations](../artifacts/seo-preview-resume-20261023/image-corrections.json). References were found in the storefront catalogue, cart color images and mobile catalogue/fallback assets. All 92 local storefront catalogue image references resolve with exact case. Directory reference evidence does not claim every retained description image is currently displayed.

## Validation

| Check | Result |
| --- | --- |
| Original 18-file SEO manifest | All hashes match; original checkout clean |
| Corrected complete source | 2,588 files hashed; clean; tree equals live D |
| SEO + commerce/auth/security regressions | **120 passed**, zero failures/skips |
| Lint | Exit 0; existing warnings retained |
| TypeScript | Exit 0 |
| Fresh production build | **Passed, 225 static pages**, synthetic service configuration |
| Image decoding/integrity | All 30 decode; original bytes preserved |
| Case and URL encoding | All 30 exact-case paths and encoded URL round trips pass |
| Local production-build image HTTP | All 30 HTTP 200, bytes match originals |
| Live image HTTP | All 30 HTTP 200, bytes match originals |
| Live sitemap | Index plus all 4 shards valid: 23 static, 36 products, 4 categories, 5 posts |
| Live canonical/schema checks | Homepage, shop, sampled products and all sampled categories passed |
| Known stock | In-stock and out-of-stock schema/metadata passed against public catalogue |
| Unknown stock/preorder/special slugs | Synthetic tests passed; no naturally occurring live samples available |
| Desktop/mobile | 6 live browser cases passed; no failed images, overflow, page exceptions or observed 5xx |
| Commerce entry | Local browser cart quantity persisted; cart link and checkout entry passed; no order/payment submitted |
| IndexNow | Production flag freshly verified false; local guard tests pass; no submission attempted |
| Crons | All four original schedules present in fresh provider configuration; none invoked |
| Runtime logs | Since 2026-10-23T05:30:00Z: bounded 5xx/error queries returned zero records, exit 0, no denial/timeout |

The first fresh build failed with ENOSPC. Only disposable `.next/cache` directories in the two recovery checkouts were removed (about 1.3 GB); original source, commits, manifests, reports, logs and compiled output were retained. The unchanged-source retry passed. [Initial checks](../artifacts/seo-preview-resume-20261023/validation.json), [successful retry](../artifacts/seo-preview-resume-20261023/build-retry.json), [image/source verification](../artifacts/seo-preview-resume-20261023/image-integrity-and-production.json), [live acceptance](../artifacts/seo-preview-resume-20261023/live.json).

Harness diagnostics are retained: the initial manifest reader needed BOM handling; a directory-reference assertion was corrected for nested description images; the initial receipt comparison included generated `out/` files only on one side. The final source-only comparison above consistently excludes generated output and reports zero differences. These harness failures were not application defects or successful validation claims.

## Preview blocker and minimum next action

Preview URL/ID: **none**. Existing staging Vercel project is `lecomax-seo-staging` / `prj_jPniwpH4s81bhISVReUKTQN0GwvD`, access protection enabled for all deployments. Read-only checks confirm Preview staging selectors, staging URL `https://tyltharlnbxrxibuxyye.supabase.co`, disabled PayPal, disabled IndexNow and all five listed SEO engine flags false. No settings were changed.

The staging project includes a sensitive service-role credential. Its provenance and current staging permissions have not been independently verified. Neither connected Supabase account exposes staging project `tyltharlnbxrxibuxyye` (Primary lists no projects; Ax lists a different project). **Connect the account owning that existing staging project**, or provide authorized account access through the normal connector UI. Do not paste credentials in chat. Then verify isolation/read compatibility and deploy only the corrected source to Vercel Preview, preserving production aliases and configuration.

The preliminary Preview metadata report's `SEO_MIRAI_FALLBACK_ENABLED` entry under credential-name screening is a broad-name-match false positive: it is a feature flag, verified false, not a provider credential. Names and safe flags alone do not certify the sensitive service key or database boundary. Supabase's [API key documentation](https://supabase.com/docs/guides/getting-started/api-keys) explains why service credentials require this isolation check.

Local synthetic builds and live production acceptance do **not** constitute hosted candidate Preview acceptance. Preview runtime SEO/commerce/browser/log checks remain pending. Actual order/payment execution, authenticated admin lifecycle, external indexing/rich-results outcomes and absent live stock/locale cases remain unverified. Existing lint/tracing warnings remain; disk capacity is limited.

## Rollback

No deployment occurred, so no production rollback is needed. Keep the original recovery commit/manifest and corrected branch. Rejecting the correction requires no data operation; retain the corrected artifact for audit rather than rewriting history. For any later Preview problem, leave production aliases unchanged and stop using that Preview. Before a separately approved production release, refresh the current READY deployment identity and use that retained immutable deployment as the rollback target, only with explicit authorization. No database restore or down migration is part of this release.

## Changes Made

Restored 30 UTF-8 image paths in a separate committed candidate; added source, image, build and read-only live verification evidence; appended preparation, disk-failure and linked verification reports to the learning app's immutable Change History. History route: `/change-history`; no history UI preview was checked or published in this session. Original recovery and manifest remain unchanged. No production or Preview deployment was made.
