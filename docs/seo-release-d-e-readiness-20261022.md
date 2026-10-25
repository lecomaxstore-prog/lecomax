# Release D final review and E blockers — 22 October 2026

This continues [the recovery handoff](seo-advanced-de-resume-20261022.md). It does not repeat the completed public audit or authorize deployment.

## Production and exact candidates

Fresh Vercel verification at **2026-10-22T18:39:00.228Z** confirms `lecomax.com` on READY deployment **`dpl_EXrVzU58gZvV2pACLtsGLaKZhce1`**, commit **`9692b1b51778c90a8a3f6fcfcac412771899032d`**. [Provider receipt](../artifacts/seo-advanced-final-20261022/provider-1792694340234.json). All four cron schedules are unchanged; all six SEO flags are false. No jobs were invoked.

- Original recovered D: `32cbebd0a916346e0533409996fdf18e29536cef`, eight-file scope.
- Final D: **`ddf12f4a916478f80f1ca75a1ca83a193d36ef28`**, branch `prepare/seo-advanced-d-20261022`, same eight-file cumulative scope. The original commit is retained as an ancestor.
- E: **`3fd8000d11653c47d6233141e9326aa61fee1bac`**, branch `prepare/seo-advanced-e-20261022`, **86 files**, unchanged and rehashed. The supplied 35-file count is not the complete committed candidate: worker, SQL, fixtures and validation files belong to the recovered package. [Exact prior manifest](../artifacts/seo-advanced-final-20261022/review-commits-1792693522887.json).

D's eight files remain `app/api/indexnow/route.ts`, `lib/indexnow.mjs`, `lib/product-discovery.ts`, `operations/seo-vercel/lib/environment-target.mjs`, `scripts/sitemap-release-urls.mjs`, `scripts/verify-storefront-release.mjs`, `tests/indexnow-safety.test.ts`, and `tests/seo-advanced-indexnow.test.ts`.

## D security, duplicate handling and release scope

This review found and corrected two bounded issues in the existing transport: slashless/trailing-slash variants now collapse to the site's trailing-slash canonical before batch deduplication; `/compte` and `/wishlist` now join the private-route exclusions already used by production middleware. Three existing candidate files changed in this continuation: the transport and its two test files. No commerce, authentication, database or cron implementation changed.

All publication, owner API and explicit release-CLI submissions use one transport. Sending requires literal `INDEXNOW_ENABLED=true`, production app/public/Node environments, compatible Vercel selectors, exact apex site URL and a valid key. False, missing or contradictory configuration returns 503 without fetching. The release CLI requires `--submit-indexnow` and checks configuration before any live fetch. The ordinary release does not invoke that mode.

The API retains same-origin enforcement, owner authorization through the existing permission policy, bounded JSON reading and the existing 30-per-minute process-local rate limit. Public, nonowner or cross-origin calls cannot bypass the route guard. Transport destinations are fixed; credentials, foreign origins, fragments, query strings, private paths and asset URLs are rejected. Requests have a 10-second timeout and refuse redirects. Test fetchers are synthetic; no IndexNow delivery occurred.

Deduplication has a precise boundary:

- Exact and trailing-slash URL variants appear once per payload, including duplicate category URLs from previous/current products.
- One product-publication invocation schedules one IndexNow callback; notification callbacks are separate and preserved. Create, update, delete, stock and per-product bulk paths invoke that helper rather than a second direct transport.
- HTTP rejection, timeout or uncertain completion does not cause an automatic transport retry. The CLI does not submit unless explicitly requested.
- Separate edits, bulk products and explicit repeated owner/CLI calls can resubmit shared URLs. There is **no distributed idempotency store or exactly-once guarantee**. This is intentional for legitimate recrawling and does not justify claiming global duplicate suppression. Keep activation separate if a cross-event suppression policy is desired.

Deployment with today's false flag will stop the legacy production transport, which currently ignores that flag. This behavior change must be included in the exact release approval. IndexNow activation, key-file acceptance and external provider delivery remain outside this release.

## D validation and preservation

Fresh final D results: **120/120 application/regression tests**, zero failures/skips (`tests-1792694488570.json`); full ESLint exit 0 with existing warnings (`lint-1792694791886.json`); TypeScript exit 0 (`types-1792694791862.json`); production-mode synthetic build exit 0, finished **18:44:18.365Z** (`build-1792694496472.json`). These files are under `artifacts/seo-advanced-final-20261022/d/`. The earlier zero-output restricted build was stopped and is not counted as a pass. No application source changed after the final checks.

The retained 12-case D browser result covers unchanged UI; it was not rerun or relabeled as a new browser run. E's historical browser test is likewise retained. External IndexNow delivery, authenticated production mutation and real payment execution were not tested.

Final [source/release manifest](../artifacts/seo-advanced-final-20261022/d/release-manifest-1792694840952.json): SHA-256 **`e51d8a354d0c7386d755a7ed5521b0a017a79f0a4bb06fcd1b9904b7614fb9ff`**, 2,588 tracked worktree file hashes, exact commit and eight-file scope. [Source-only Git archive](../artifacts/seo-advanced-final-20261022/d/release-d-ddf12f4a-1792694840952.zip) is generated from that commit and its independent digest is recorded in the manifest; Git archive line endings can differ from worktree bytes. Packaging's initial Unicode-path parsing error was corrected to use NUL-separated Git filenames before generating either deliverable.

The final scope check requires C and original D to be ancestors, a clean worktree, exactly the eight allowed paths versus C and no whitespace errors. Therefore A's sitemap implementation, B's category/CMS encoding, C's stock schema, commerce/authentication code, root dependency lockfile, middleware, Next configuration and storefront cron configuration remain byte-identical in Git to C. Relevant A/B/C and commerce/security regressions are included in the 120-test suite.

Packaging is source-only via `git archive`, not the synthetic `.next` output, local dependencies or dirty root. The offline packaging script records every tracked source-file hash, archive digest, commit, scope, validation receipts and rollback identity. Use the manifest accompanying the final SHA; earlier manifests are historical. Remote production build and live smoke can occur only after exact-release authorization. No remote build, deployment or push has been performed here.

## E: exact remaining blockers

E's **167 application tests, 71 worker/SQL tests, 12 synthetic browser cases and successful production-mode build** are retained evidence, not fresh executions in this continuation. All 86 candidate hashes and six migration hashes were checked again. These checks do not close the following:

| Blocker | Evidence required before the relevant release/activation |
|---|---|
| Production schema inventory | Read-only comparison of actual migration ledger, existing objects and function signatures to all six reviewed hashes; detect old trigger schema/conflicts. Production schema was not queried here. |
| Database rehearsal/recovery | Representative isolated PostgreSQL 17 schema/roles, six-file ordered application, PostgREST RPC/grant checks, native concurrency/lease behavior and tested backup/restore. In-memory PGlite is not hosted acceptance. |
| Real authenticated workflows | Owner, product editor, category editor, viewer, revoked and expired sessions through actual middleware/API/database paths; same-origin denial and fresh revocation. Synthetic auth fixtures and anonymous 401 checks are insufficient. |
| Public reader/content acceptance | Published/fallback output, stale facts, deactivation, cache invalidation and publication rollback verified with representative approved content. Product/category readers and gallery/body integration can change output immediately. |
| Hosted write-test boundary | Existing `seoWritesAllowed` denies hosted staging writes. A separately reviewed isolated test boundary is needed to prove save/review/publish/rollback without removing the production guard or using production as a test database. |
| Packaging/dependency isolation | Clean install and independent app/worker build against pinned lockfiles; resolve the shared-junction/multiple-lockfile tracing warning in release acceptance. Root versions matched the retained lockfile; no blanket dependency upgrade is included. |
| Worker and paid-provider activation | Separate project/credential binding, exact endpoint, scheduler ownership, lease/retry status, budgets, owner paid authorization and provider/fallback acceptance. No scheduler or paid call is authorized. |

Permission distinctions from actual E code: metadata reads require `products.view`; product edits require `products.edit`, category work requires `categories.edit`. Manual metadata approval is editor-permission based; it is not universally owner-only. Editorial reads require product view; save/review require product edit; editorial publish/rollback require owner plus explicit confirmation and exact revision/source validation. AI dashboard/actions and sync require product view/edit and category edit; budget and paid-request authorization require owner. Session verification uses the existing `admin_session`, active staff membership and role-permission reads. Do not broaden permissions or treat a valid cookie alone as acceptance.

Public reader exposure is explicit: `seo-store.ts` and `seo-editorial-store.ts` read active `seo_documents` through a server-only client using service-role credentials when configured, with a 300-second tagged cache. They validate published source/current facts; editorial output also checks approved metadata matches. They do not gate reads on `SEO_EDITORIAL_ENABLED` or `SEO_AI_ENABLED`. Missing schema falls back, but successful existing schema can immediately expose approved content; flags false are not a global E disable switch. Draft/private revision tables must remain inaccessible to public roles. Cache expiry is not proof of immediate publication rollback.

## E migrations and rollback boundaries

Authoritative order and hashes remain in [the six-file production-readiness plan](../operations/seo/production-readiness-20261021/migration-plan.json):

1. `supabase/alternatives/202610180002_seo_decoupled.sql`.
2. `operations/seo-vercel/supabase/migrations/20261018193508_seo_worker_run_control.sql`.
3. Same directory: `202610190001_seo_ai_budget.sql`.
4. `202610190002_seo_editorial.sql`.
5. `202610190003_seo_editorial_review.sql`.
6. `202610190004_seo_editorial_workflow.sql`.

Dependencies include existing products/categories columns, compatible identifiers, roles `anon`, `authenticated`, `service_role`, PostgreSQL functions and grants. Migration 006 adds immutable editorial revisions/events and publication controls; the older five-file schema test is not proof of this sixth step. The six-file workflow tests cover revision/review/publication/rollback and restricted grants using synthetic data. Each reviewed file has transaction boundaries; migration 006 sets bounded lock/statement timeouts. These controls do not remove production conflict/locking/recovery risk.

No production migration was run. D requires none. E's functional storage needs the schema, but only missing, verified migrations may be applied after separate authorization and backup/rehearsal. Never apply the old trigger migration, replay the whole chain blindly or import staging records.

E rollback must stop new work and account for in-flight leases; restore the prior app deployment or specifically reviewed publication state and verify caches. Keep additive schema and immutable content/budget history unless a separate tested recovery plan requires otherwise. App rollback does not refund provider spend or undo committed SQL/content. No destructive down-migration is approved or certified.

## Decisions, rollback and precise next actions

**D: GO for the exact source release with `INDEXNOW_ENABLED=false`, subject to explicit deployment approval. Execution remains on hold.** Activation is a separate NO-GO pending authorization and provider/key verification. **E: NO-GO for production** until the applicable blockers above close.

After approval naming final D SHA and eight-file manifest: recheck production still equals C and the rollback deployment is READY; build/deploy only the isolated D source through the normal production pipeline, preserving all flags/secrets and four crons. Confirm deployment source receipt/hash and alias identity; smoke sitemap shards, product/category canonicals, availability schema, storefront/cart/checkout entry and anonymous authorization without placing orders. Confirm disabled IndexNow using safe configuration/log evidence, not product mutations or actual submission. Monitor runtime errors. No A/B/C redeployment is needed.

If an introduced regression requires rollback, obtain explicit rollback authorization and restore alias to **`dpl_EXrVzU58gZvV2pACLtsGLaKZhce1` / `9692b1b51778c90a8a3f6fcfcac412771899032d`**, after READY/source checks. This preserves A+B+C but restores legacy IndexNow behavior, including its flag limitation. No schema rollback is needed for D. No rollback was executed.

After D is verified live, integrate E onto that verified baseline as a new cumulative candidate. Do not deploy sibling E as-is: it would remove D. Close schema/recovery and actor/content tests first; obtain distinct approvals for any migration, app deployment, worker deployment, scheduling or paid AI activation. Keep production unchanged while these gates are open.

## Changes Made

Fixed D's canonical batch deduplication and two private-route exclusions, expanded its existing regression tests, added offline source packaging and this readiness handoff. E source and unrelated root work remain unchanged. Preparation and linked validation reports are appended to the learning app's immutable Change History; no preview or history deployment is claimed.


## Owner-authorized Release D execution completed ? 2026-10-22T19:06:04.412Z

**Release D: SUCCESS.** This execution supersedes the preparation-only hold above. The owner explicitly authorized exact D deployment and safe rollback; Candidate E, migrations, secrets changes and feature activation remained excluded.

- Live production: https://lecomax.com on READY **dpl_CxX8Deg6R6T4prqTnHEiJVvqGu6f**.
- Exact production source commit: **ddf12f4a916478f80f1ca75a1ca83a193d36ef28**. Vercel metadata and uploaded source hashes agree with the approved manifest; this was the established isolated CLI upload, not an unrelated root checkout deployment.
- Rollback: **dpl_EXrVzU58gZvV2pACLtsGLaKZhce1**, C **9692b1b51778c90a8a3f6fcfcac412771899032d**, verified READY in resumed preflight. No rollback performed. A D rollback restores the legacy IndexNow flag limitation; no database restore is authorized.
- Resumed preflight verified all 2,588 candidate hashes, all 2,589 prepared files, clean candidate worktree, exact eight-file Git delta, correct project/team, 2,048 inherited uploaded C files, unchanged environment metadata and flags. A separate traversal found zero unexpected source files. The existing isolated upload and nine production-aligned line endings were preserved. Prior successful 120 tests, TypeScript, lint and build evidence was reused; no repeat local build or full suite was needed.
- Remote receipt verifies 2,053 uploaded files. Exactly three changed: app/api/indexnow/route.ts, lib/product-discovery.ts, scripts/verify-storefront-release.mjs. Exactly five added: lib/indexnow.mjs, operations/seo-vercel/lib/environment-target.mjs, scripts/sitemap-release-urls.mjs, tests/indexnow-safety.test.ts, tests/seo-advanced-indexnow.test.ts. No removals or additional source delta.
- **INDEXNOW_ENABLED=false**; all six SEO flags remain false. APP_ENV, NEXT_PUBLIC_APP_ENV and SEO_RUNTIME_ENV remain production. No secrets or configuration changed. Disabled transport check using verified source and synthetic input returned 503 with zero fetch calls. Uploaded source identity plus provider configuration and retained regression evidence support disabled behavior; no production publication mutation or real IndexNow delivery was invoked, and complete outbound telemetry is not claimed.
- Four cron schedules unchanged: learning-reminder?slot=summer at 0 19 * * *; learning-reminder?slot=winter at 0 20 * * *; review-followups at 0 9 * * *; mobile-campaigns at 5 9 * * *. No cron was invoked.

Live acceptance passed: 30 public HTTP checks; 36 products and four categories sampled; valid sitemap index and all four advertised shards (23 static, 36 product, four category, five post URLs); 10 metadata/schema page checks; six mobile/desktop browser cases with no failed images, overflow, page exceptions or observed 5xx responses. Cart quantity persisted as one across navigation; checkout returned 200 and nine inputs without an order submission. In-stock and out-of-stock schema matched actual public inventory. Anonymous authorization checks passed. Vercel bounded runtime queries since submission returned zero 5xx/error records, exit 0, without denial or timeout; this is a bounded observation, not a future error guarantee.

Remaining unverified: authenticated admin login/role/session workflows, actual order/payment execution, dedicated owner-database TLS connectivity, external IndexNow/key acceptance and provider delivery. Unknown-stock, preorder and absent special-locale/CMS cases remain synthetic-only. No production database compatibility blocker was observed for this eight-file D scope; D changes no schema and requires no migration. No production schema audit was claimed.

Evidence: [resumed preflight](../artifacts/seo-release-d-production-20261022/preflight-resumed-1792695624390.json), [remote source/configuration receipt](../artifacts/seo-release-d-production-20261022/receipt.json), [live checks](../artifacts/seo-release-d-production-20261022/live.json), [disabled guard](../artifacts/seo-release-d-production-20261022/disabled-check-1792695713412.json), [sanitized runtime summary](../artifacts/seo-release-d-production-20261022/runtime-summary-1792695911498.json), [final alias verification](../artifacts/seo-release-d-production-20261022/verified.json).

**Release E remains NO-GO / ON HOLD**, unchanged at 3fd8000d11653c47d6233141e9326aa61fee1bac. All documented schema/six-migration, PostgreSQL recovery/grants, authenticated actor/revoked-session, public-reader/cache/rollback, app/worker packaging and scheduler/paid-provider acceptance blockers remain open. No E integration, deployment, migration or activation occurred.

Changes Made: completed the approved D production deployment and recorded validation. Updated this handoff and appended a linked immutable Change History follow-up. No unrelated local work was deployed. The updated local learning-app history is not separately published by this storefront deployment; no historical preview is claimed.


## Release E final readiness continuation ? 2026-10-22T19:30:24.051Z

E was integrated onto verified D as **2d641a37a57680ab036726c3cf06f2ede5d17dae** (86-file delta including the isolated tracing-root fix). Production D, flags, six migrations and four crons remain unchanged. Final decision **NO-GO**: inherited owner-session non-revocation is confirmed in D and E; the owner chose a separate security release. A tested design prototype is outside E. Database read-only inventory, native PG17/PostgREST, 178 app tests, 71 worker/SQL tests, types/lint/build, 12 browser cases and local reader/cache checks passed within the documented boundaries. See [the complete final readiness, evidence, blockers and release/rollback sequence](seo-release-e-final-readiness-20261022.md) and [separate remediation](../operations/security/admin-session-revocation/README.md). No production migration or E deployment occurred.
