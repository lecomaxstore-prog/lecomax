# SEO staging runtime repair and acceptance — 21 October 2026

The synthetic staging schema is repaired. The candidate's existing sitemap and catalogue GET handlers pass locally against the hosted staging database. This does **not** certify hosted Vercel rendering or authenticated application acceptance.

## Checkpoint and completed fixes

- Recovered existing staging worktree `../L'ecomax-seo-staging`, original upload inventory `artifacts/seo-staging-rc-20261020/upload-inventory-1792537752288.json`, and the previous dependency validation copy. Preserved unrelated working changes and historical reports.
- Verified Supabase project `tyltharlnbxrxibuxyye`, organization `mbhkspintqoxntjbykrm`, name `lecomax-seo-staging`. No production connection or production changes.
- Applied `operations/seo/staging-runtime-repair.sql` only to that staging project, after real local SQL tests and a hosted fixture/AI/trigger preflight. The transaction requires the exact target marker and the reserved three-product/two-category population. It is an operational staging repair, **not a production migration** and must not be rerun after application.
- Added missing product price, inventory, optional display fields and creation timestamp; category ordering and timestamps. Modification timestamps remain null rather than invented. The 100 MAD prices are synthetic fixtures, not real offers. Corrected fixture category references to URL slugs.
- Added six empty read-contract tables: `pages`, `ecomedia_posts`, `settings`, `banners`, `promotions`, `reviews`. No content, campaign or review was published. Sitemap behavior remains fail-closed on missing data/errors; no application fallback was introduced to conceal missing tables.
- Restored two missing test-only files in the isolated dependency copy, with recorded hashes: `operations/seo-vercel/node-server.mjs` and `operations/seo/worker/scripts/seo-sync-worker.mjs`. Deployment exclusions remain intact.
- Promoted the validated `package.json` and `package-lock.json` into the existing staging worktree only. Original files are retained in `artifacts/seo-runtime-candidate-1792539562088/`. The shared root packages and node_modules are unchanged. No push or deployment occurred.

## Validation and evidence

| Check | Actual result |
| --- | --- |
| Local executable SQL and offline Nodemailer compatibility | 4 passed; actual catalogue/sitemap selections, privileges, RLS, target/fixture refusal, MIME generation under original and proposed versions |
| Application/security/SEO regression suite | 161 passed in isolated dependency candidate; includes sitemap errors, URL encoding, metadata/JSON-LD, IndexNow isolation and editorial authorization |
| Worker suite | 71 passed after restoring test-only inputs; previous 68/70 result was incomplete packaging, not an accepted pass |
| Email side-effect tripwires | 4 passed; no delivery/provider/database call permitted in the tested staging routes |
| Change History tests | 6 passed, including expansion, persistence, conflict preservation and retry |
| Candidate TypeScript | Passed; `types-1792539160436.json` |
| Learning-app TypeScript | Passed via `npm.cmd --prefix lecomax-learning-app run typecheck` |
| ESLint | New/modified JS validation scripts passed; production build lint passed with existing warnings |
| Production build | Passed on Node 24.22.0 / Next 15.5.28, `build-1792539361690.json`; earlier restricted-network attempt failed fetching fonts and is retained |
| Local production HTTP | 8 passed, `smoke-1792539547840.log`; synthetic environment with application fetch blocked |
| Hosted database REST | 10 real service-role read queries and 8 anonymous-denial checks passed, `artifacts/seo-staging-runtime-rest-1792539331450.json` |
| Candidate handlers with hosted database | 5 passed: sitemap index, products/categories shards, public products and categories APIs; `artifacts/seo-staging-runtime-handlers-1792539333815.json`. Local handler execution, **not hosted HTTP/SSR** |
| External Vercel protection | 12/12 routes across alias and deployment URL require Vercel authentication; `artifacts/seo-staging-protection-1792539127771.json` |
| Runtime dependency audit | Fresh isolated candidate audit: 0 findings, `audit-runtime-acceptance-20261021.json` |
| Final candidate inventory | 2,123 files / 702 scanned modules; zero problems, `artifacts/seo-staging-rc-20261020/upload-inventory-1792539666572.json` |

Application, worker, typecheck, build and audit evidence above lives under `artifacts/seo-dependency-remediation-20261021/` unless a complete path is specified. The current candidate was compared byte-for-byte with the original 2,123-file upload inventory before promotion: only the two dependency manifests differed. Appending Change History subsequently adds history-only differences, checked separately.

The first fresh inventory falsely flagged lockfile declaration drift because npm sorted object keys differently. The validator now compares dependency maps by keys and values; explicit checks still reject version changes and missing/extra keys. The corrected inventory passed. The initial PowerShell npm launcher was blocked by execution policy; using the installed `npm.cmd` entry point completed the learning-app typecheck without changing policy.

## Security and dependency decision

All eight affected catalogue/supporting tables have RLS enabled, no anon/authenticated grants, service-role SELECT only and no service-role writes. Hosted readback also confirms zero public user triggers, outbound extensions, foreign servers and subscriptions; AI/Mirai disabled and monthly/lifetime budgets zero. Evidence: `artifacts/seo-staging-runtime-database-20261021.json`.

The security advisor reports 24 informational RLS-without-policy notices, consistent with intentional server-only/default-deny tables, plus the pre-existing leaked-password-protection warning. Password login/signup remain disabled, verified by Auth configuration readback. No paid protection or external provider was activated. Evidence: `artifacts/seo-staging-runtime-advisors-20261021.json`. Grants and RLS are separate controls: [Supabase API security](https://supabase.com/docs/guides/api/securing-your-api).

The prepared dependency delta pins Next and matching env/ESLint to 15.5.28, sanitize-html 2.18.1, sharp 0.35.5 and Nodemailer 10.1.7. The prior audit identified actionable Nodemailer 9.x parser/TLS issues; the proposed major was assessed in isolation, not blindly installed into shared dependencies. Offline MIME generation, app types, regressions and build passed. Real SMTP/TLS delivery is deliberately untested; the test uses [Nodemailer's stream transport](https://nodemailer.com/transports/stream), which generates bytes without sending. [Official releases](https://github.com/nodemailer/nodemailer/releases) document the current 10.1.7 release.

The retained full audit has **9 development-tool findings: 7 high, 2 moderate**, including glob/braces tooling. No forced Next downgrade or Tailwind major upgrade was made. The already deployed version still uses its original dependencies; local promotion does not patch that deployment.

## Remaining gates and release decision

**Staging deployment readiness: GO for owner review of the protected dependency candidate, not authorization to deploy.** The schema repair is already applied and does not require a source deployment. The dependency update requires a separately approved source deployment, preserving project `prj_jPniwpH4s81bhISVReUKTQN0GwvD`, team `team_yFLUcpSvgQi8EQuvuorOZW7w`, all-deployment protection, empty schedules and disabled external effects. Never upload synthetic `.next` output as a prebuilt release.

Exact review candidate: `../L'ecomax-seo-staging`, pinned by `artifacts/seo-staging-rc-20261020/upload-inventory-1792539666572.json`. Package SHA-256: `669dd71f555b370d3abd365c6f96d42f276d0e3e835b46c9d22bc4a2e42c50b7`; lockfile SHA-256: `845c413084fec5f3a2ee54e82138f05378e0afa71fb867595e41593fe93d4adb`. Recheck inventory hashes immediately before any separately authorized source upload.

**Final staging acceptance: NO-GO pending protected hosted checks. Production readiness: NO-GO.**

1. Connect a signed-in browser and verify hosted sitemap, robots, FR/AR product/category pages, rendered metadata/canonicals/JSON-LD, SSR and browser console/network errors. Current canonical URLs intentionally point at `https://lecomax.com`; this behavior was preserved. Static robots currently contains production allow rules and the production sitemap, while staging is protected and uses noindex headers. Verify both layers on hosted responses; do not claim robots disallows all staging crawling.
2. Real owner/editor/viewer/revoked application sessions remain untested because email/password Auth is disabled. Select an explicitly approved no-delivery test strategy; a Vercel session alone does not authenticate the app. Exercise editorial/dashboard authorization without enabling paid generation, indexing or publication.
3. Review the final candidate upload manifest, then explicitly approve any protected dependency deployment. Verify its clean hosted build and repeat HTTP/browser checks after deployment. The local build is Windows-based; it is not proof of a clean Linux installation.
4. Before production: review remaining development-tool advisories, complete FR/AR editorial review, compare with current production revision, validate production-specific schema/permissions without applying migrations, and complete backup/restore, rollback, monitoring and ownership gates. Obtain separate production release approval.

## Files changed in this continuation

- `operations/seo/staging-runtime-repair.sql`
- `scripts/test-seo-staging-runtime.cjs`
- `scripts/verify-seo-staging-runtime-rest.ps1`
- `scripts/verify-seo-staging-runtime-handlers.cjs`
- `scripts/seo-dependency-validation.cjs`
- `scripts/prepare-seo-runtime-candidate.cjs`
- `scripts/inventory-seo-staging-rc.cjs`
- This acceptance document, new evidence files, append-only Change History reports and generated manifests.
- In the sibling staging worktree only: `package.json`, `package-lock.json`, appended Change History reports/manifest.

No production mutation, push, deployment, message delivery, payment, cron activation, paid AI request or external publication was performed. Change History is available at `/change-history` after the learning app loads the updated bundle; no live preview is claimed.
