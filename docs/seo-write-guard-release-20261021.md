# SEO security fix and release decision — 21 October 2026

**Local security package: GO for review. Hosted security fix: NOT DEPLOYED. Full staging: NO-GO. Production: NO-GO.** No commit, push, deployment, migration, production setting change, hosted editorial write or service activation was performed.

## Changes Made

Recovered the interrupted APP_ENV-only guard and editorial regression from the dirty main workspace. The previous preparation report and all earlier history remain intact. The historical production-review snapshot is preserved, not silently rewritten. All 2,124 files of the last deployed staging source matched their recorded hashes before constructing a new validation snapshot under `artifacts/seo-write-guard-20261021/`. Unrelated workspace changes were not incorporated.

Three runtime files changed:

- `operations/seo-vercel/lib/environment-target.mjs`: centralized `seoWritesAllowed`. Explicit consistent production allows existing behavior; explicit local development without a Vercel deployment allows offline fixtures. Staging, preview, missing/unknown selectors, inconsistent public/runtime selectors, conflicting Vercel environment/custom target and incomplete hosted environment identification deny writes. No feature-flag override.
- `lib/api-security.ts`: every `seo:*` mutation uses that policy after origin/session authorization, before request-body processing, role-specific work, database construction, generation, outbound transport or cache invalidation. Denials return 503 and private/no-store. Read authorization, rate limits and unrelated admin mutations are unchanged.
- `operations/seo-vercel/lib/handler.mjs`: the authenticated worker GET uses the same policy before run acquisition or any RPC, including when sync is explicitly enabled. Valid production worker behavior retains its existing feature, identity, key-binding and budget checks.

`SEO_EDITORIAL_ENABLED=false` is an AI-generation setting, not a production manual-publication switch. Explicit production configuration still permits authorized manual operations. Missing production candidate configuration now fails closed; do not treat this package as deployable to the currently configured production app.

## Mutation inventory

| Entry point | Actions/boundary |
|---|---|
| POST `/api/admin/seo` | Legacy generate, draft, approve, reset, including AI queueing; shared guard |
| POST `/api/admin/seo/editorial` | save, approved, changes_requested, publish, rollback and suggestion import; shared guard |
| POST `/api/admin/seo/ai` | enqueue, approve, review, budget, authorize; shared guard |
| POST `/api/admin/seo/sync` | outbound worker invocation; shared guard |
| Worker GET `/api/sync` | Vercel adapter and node-server adapter call guarded `createHandler`; bearer check followed by environment gate |
| Legacy worker CLI copies | Existing `LEGACY_SEO_RUNNER_DISABLED` exits retained and regression-tested |
| POST `/api/indexnow` and catalogue publication hooks | Existing `lib/indexnow.mjs` production-only transport gate; 6 IndexNow safety tests passed, no external submissions |
| SEO server actions | None found in application source. SEO UI calls the API routes above. |
| Direct database RPCs | No schema changes. Retained grants/RLS evidence and worker SQL suites cover existing service-only boundaries; this application guard is not a replacement for database authorization. |

Catalogue/settings editing is outside SEO Engine publication and retains its existing authorization. The decoupled migration design is unchanged; no storefront-read synchronization or new commerce trigger was introduced.

## Validation and limitations

- Isolated candidate: **61 tests passed**, zero failed/skipped (`tests-1792590746005.log`). Real route/shared-guard tests cover owner, editor, viewer, anonymous, foreign origin, disabled generation, production separation, reads and rate limiting. A separate matrix exercises every admin action with counted traps before body/database/provider/cache work; worker requests with valid bearer and enabled sync make zero outbound calls in denied environments.
- Worker suite: **71 passed**, zero failed/skipped (`worker-tests-final.log`), including local SQL workflow/authorization/recovery tests. No hosted SQL tests ran.
- IndexNow plus Change History: **10 passed**, zero failed/skipped (`history-indexnow-tests.log`).
- Standalone TypeScript, focused runtime ESLint and production-mode Next 15.5.28 build: exit 0, recorded in timestamped result JSON/logs. Locked candidate dependencies were reused without upgrades. Existing unrelated build warnings remain.
- Exact compiled candidate in an isolated loopback server with synthetic catalogue/keys: **18/18** route/viewport checks passed (home, boutique, FR/AR products and categories at 1440/375/390 pixels), no page exceptions, HTTP errors, overflow or undecoded images. Existing CSP correctly blocks synthetic loopback realtime WebSockets; this is not a warning/error-free real integration certification. Browser data: `browser.json`.
- Robots and sitemap index returned 200; all three actual index-advertised shards returned 200 with expected synthetic entities (`local-sitemaps-final.json`). All four anonymous SEO admin GETs returned 401. Earlier guessed `.xml` shard paths returned expected 404; this harness mistake and a Fetch status-property correction are not product defects.
- Failed attempts retained: sandbox Google Fonts fetch failure before successful network-enabled build; omitted test-fixture dependencies before successful isolated suite; old staging-worker allow expectation corrected to deny. No application workaround for those harness failures was added.
- Playwright MCP reported its profile already in use. A fresh headless Chrome profile completed local acceptance; the existing user's browser/profile was not killed, reset or bypassed. Hosted visual results from the prior deployment remain historical evidence, not results for this undeployed patch.

## Exact package and staging baseline

- Current alias (fresh GET-only metadata): `lecomax-seo-staging.vercel.app` → `dpl_BTTcn1fzEYdVSxbevGo6njShC7UJ`, READY.
- Immutable hostname: `lecomax-seo-staging-qlk9zr988-lecomaxstore-4321s-projects.vercel.app`.
- Staging project `prj_jPniwpH4s81bhISVReUKTQN0GwvD`, team `team_yFLUcpSvgQi8EQuvuorOZW7w`. Authentication `all`; zero cron definitions.
- Last deployed source manifest: `artifacts/seo-fix-integration-20261021/source-manifest.json`; SHA-256 `58bd96cbb310dcef3e0bc0eb0432e92ba146070f145dc4049e0fd060b9a7e0b6`. Previous hosted upload-byte verification is retained in the approved-deployment handoff.
- Minimal three-file delta: `artifacts/seo-write-guard-20261021/seo-security-fix.zip`; SHA-256 **`b25949d1e9f2c553233fd7bd0fe3436dada8fc8fdeeb5af86b249cf6f5c7dafb`**. Extracted contents were hash-verified against the tested runtime files.
- `release-manifest.json` pins all 2,124 intended upload files, including before/after hashes for the three runtime changes. Tests, synthetic fixtures, `.next`, credentials, dependency folders and logs are not additions to the deployment delta. `validation-source-manifest.json` separately records test-support files.
- No database migration, environment update, dependency change, route/UI change or cron change is part of this package. Learning reports remain local and append-only; this storefront package does not deploy the learning app.

## Production readiness

Fresh names/scopes-only metadata is in `hosting-1792590658365.json`; no environment values were exported. `readiness-review.json` compares the production contract with observed scopes. Missing production-scope required names: `APP_ENV`, `NEXT_PUBLIC_APP_ENV`, `SEO_RUNTIME_ENV`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_KEY_BINDING`, `SUPABASE_SERVICE_KEY_BINDING`, `ADMIN_SESSION_SECRET`, `OWNER_DATABASE_BINDING`. Six initial-off feature names are also absent (`SEO_SYNC_ENABLED`, `SEO_MANUAL_SYNC_ENABLED`, `SEO_AI_ENABLED`, `SEO_EDITORIAL_ENABLED`, `SEO_MIRAI_FALLBACK_ENABLED`, `INDEXNOW_ENABLED`); absence defaults those features off and is distinct from missing required identity/binding configuration. Existing secret bytes and bindings remain unverified; do not copy staging values or overwrite commerce/mail settings.

Production alias resolves to READY `dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx`, revision `d9d1d7a7b274fe3df9f70bb154704ea9e07e78ee`. Its four cron path/schedule pairs match the retained production configuration exactly: learning reminder summer `0 19 * * *`, winter `0 20 * * *`, review followups `0 9 * * *`, mobile campaigns `5 9 * * *`. They were not modified. Never deploy the staging zero-cron configuration to production.

All six ordered migration hashes match `operations/seo/editorial-six-migration-plan.json`. The same-day read-only preflight and isolated restore evidence are reused because SQL did not change. Production permissions evidence recorded at `2026-10-21T13:10:33.570Z` confirms RLS on all 61 public tables, restricted public schema creation and no anon/authenticated execution of the inventoried security-definer functions. Metadata does not certify every policy predicate or real actor. No database connections or mutations were needed for this continuation's retained-evidence audit.

Remaining gates:

1. Deploy and verify the security package on protected staging using separately authorized existing application sessions. Hosted owner/editor/viewer/expired/revoked session acceptance is still incomplete. Successful hosted editorial lifecycle tests remain prohibited by this request and by the new staging guard; changing a feature flag cannot authorize them. Any future bounded write-test design needs separate review and approval.
2. Human content/routing review: Arabic text occurs in the French storefront shell (`lang=fr`, `og:locale=fr_MA`) with no verified language alternatives. FR/AR synthetic products are different entities, not established translations. No hreflang mapping or locale route was invented. Editorial bilingual storage alone does not establish an Arabic storefront.
3. Production-specific final package/configuration and in-place secret binding verification; preserve all four schedules. The old production proposal's hashes are superseded for these three runtime files and must not be treated as a final approved production package.
4. Fresh release-window backup/PITR and compatible isolated restore, including managed storage/Vault coverage. Retained October 18 logical backup restored on PG18 does not certify PG17.6 production managed-service recovery; 38 extension/event-trigger entries were excluded. Name operator, RPO/RTO and recovery point.
5. Monitoring operator, recipients, baseline and agreed latency/error thresholds. Retain stop conditions for unauthorized/cross-environment writes, unexpected delivery/spend, repeated sitemap errors and checkout regressions. No paid monitoring or services enabled.
6. Human language review, retained 7 high/2 moderate development-tool dependency-risk disposition, Search Console/field performance review and separately authorized commerce canaries. Runtime dependency audit was historically clean, not freshly re-audited.

## Deployment and rollback plan — approval required

1. Re-resolve staging alias/project/team and require the pinned deployment above; stop on drift. Recheck all-deployment Authentication, zero crons and disabled integrations without exposing values.
2. Reverify the baseline manifest and archive SHA-256. Assemble baseline plus only the three reviewed files; verify the complete `release-manifest.json`. Use a normal clean remote build, never the synthetic local `.next` or `--prebuilt`. Do not deploy the main dirty workspace.
3. With explicit approval, submit one deployment to the dedicated staging project only. Record ID, uploaded file hashes and build result. Preserve Authentication and configuration; no migration or separate worker activation. If a separately hosted worker is later deployed, its own source inventory and approval are required.
4. Check immutable URL then alias using normal authorized browser access. Verify storefront/read-only endpoints and authenticated denial with zero database/provider effects. Use existing authorized sessions only; session minting or Auth changes require a separately reviewed plan. Do not claim success from anonymous 401 alone. No successful editorial writes are authorized.
5. On deployment/build failure, retain evidence and do not promote. On runtime regression, the prior staging deployment above is the technical application rollback target, subject to a fresh READY check and explicit rollback approval. **It contains the original write gap:** reverting does not constitute security recovery. Keep Authentication and disabled integrations, suspend editorial testing and prepare a corrected patch. No destructive SQL rollback or audit deletion.

Production is not approved. Any future production deployment/migration/activation needs a separately pinned production package, resolved gates and explicit approval. Its observed application rollback target is `dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx`; revalidate it and schema compatibility at the release window.

Change History: local learning app `/change-history` after loading its updated bundle. No live preview or hosted availability of these new reports is claimed.
