# Staging security continuation — 20 October 2026

**Decision: NO-GO for deployment, branch creation/push, hosted staging acceptance, production release or activation.** Local fixes and offline checks do not establish hosted isolation. The dedicated Vercel project `lecomax-seo-staging` has not been created or deployed in this session. No production resource was contacted. No hosted migration/write, paid request, real IndexNow call, worker/cron activation, push, merge, stash, reset or cleanup occurred.

## Recovery and evidence boundaries

Current branch: `agent/mobile-product-redesign`; HEAD: `e5251911e2a6f1379aca827eb53c310359a662b3`. Production branch is `main`, not the current local branch. The repository already contains extensive tracked modifications, untracked SEO/runtime work, nested release repositories, historical artifacts and source snapshots. These were preserved.

Read AGENTS.md, the Change History schema, isolation-recovery and session-recovery handoffs, and the latest hosted-completion/staging-acceptance handoffs. The earlier successful builds and 227-test result are historical. The latest handoff did not establish either of the two reported runtime gaps as fixed. Both were reproduced by source inspection in this continuation.

`artifacts/seo-staging-security-20261020/` contains:

- `status.txt`, `diff-stat.txt`, `staged.txt`: expanded repository inventories, captured after the first targeted patch, not a pristine pre-edit backup. Initial Git status was also inspected before editing. Do not attribute the entire dirty tree to this session.
- `source-inventory.json`: 1,644 source files scanned, 155 statically named environment references, candidate SDK/direct-REST locations. Includes instructional strings; it does not read dotenv values.
- `supabase-client-inventory.json`: AST-confirmed `createClient` calls, excluding instructional strings: 126 Next.js runtime calls, 23 operator-script calls, one separate mobile call. Records source locations and key expressions, not credential values.
- Test/type/lint/build logs and the appended prepared/verification reports. Failed evidence is retained.

## Local changes

### Supabase keys and authentication

Added `operations/seo-vercel/lib/supabase-headers.mjs`. Modern publishable/secret keys use `apikey` without being treated as JWTs. Legacy anon/service-role keys retain their Bearer behavior. An explicitly supplied user access token remains separate from the API key; an opaque API key cannot be passed as that user token.

Updated maintenance reads, current staff permission reads, the common server REST helper, and the SEO worker. Updated the three SEO REST verification scripts and the synthetic staging package's test adapter. The scripts were not run against hosting or databases.

The authentication model is preserved:

- Browser customers use the public SDK key and their own Supabase session JWT.
- Admin login verifies `/auth/v1/user`, confirmed email and owner/active-staff identity before issuing an HMAC cookie. User JWTs remain in Authorization; the public key remains in apikey.
- Admin HMAC uses the existing independent `ADMIN_SESSION_SECRET`; no database-key signing fallback was added.
- Current staff grants are re-read per request; permission-cookie removal does not grant owner privileges.
- Private learning-owner login uses its separate existing owner database/password/session system.
- Privileged server operations still use service credentials behind application authorization. No RLS, grants or migrations were changed.

Removed the implicit `contact@lecomax.com` owner-authorization fallback in admin access, settings permission and session issuance. An explicit staging owner identity is required for owner access. Existing production configuration must set ADMIN_EMAIL before adopting this candidate.

SDK compatibility was tested with the actually installed library and mocked HTTP for modern/legacy keys plus a separate user JWT. This establishes client request behavior, not a hosted gateway or real-session acceptance result. See [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys). The markdown changelog endpoint was unavailable through the web reader; the HTML changelog and current key documentation were inspected. No SDK dependency upgrade was made.

### IndexNow

Added `lib/indexnow.mjs` as the single outbound transport. Both `lib/product-discovery.ts` (publication and `/api/indexnow`) and `scripts/verify-storefront-release.mjs` use it.

Submission requires APP_ENV and NEXT_PUBLIC_APP_ENV both `production`, NODE_ENV `production`, consistent supplied Vercel environment identity, INDEXNOW_ENABLED exactly `true`, explicit valid INDEXNOW_KEY, and NEXT_PUBLIC_SITE_URL exactly `https://lecomax.com`. There is no embedded key or site-origin fallback.

Each URL must be absolute HTTPS at the canonical origin, without user credentials, a nondefault port or fragment. Invalid/mixed batches and missing/conflicting configuration produce no request. Requests have a deadline and reject redirects. The release script rejects unsafe submission configuration before its live-read phase. The admin route now returns the disabled/error status rather than disguising it as HTTP 200. Product cache invalidation remains operational even when indexing is disabled.

Tests include the actual publication callback under staging, the admin authorization boundary, an actual CLI child process with a network tripwire, unsafe URL/configuration cases and an explicit production request using a mock fetch. **No real IndexNow request occurred.**

### Other staging isolation

- Extended the nonproduction configuration denylist to inherited Redis/KV, IndexNow, EmailJS, Trustpilot and legacy SMTP/IMAP/payment credential names.
- Nonproduction storefront configuration rejects cron secrets and manual-worker endpoint/trigger configuration, or enabled sync/manual-sync flags. A separately configured disabled worker remains a different package; its cron secret is not a storefront variable.
- Expo delivery and receipt polling now reject nonproduction before database access. Absence of EXPO_ACCESS_TOKEN alone is insufficient to disable Expo.
- Browser SDK Auth messaging/mutation paths are blocked outside production; existing fixture login/token refresh, logout, settings and user reads remain available. The server password-recovery route also refuses nonproduction and has no production redirect fallback.
- These browser guards do **not** secure direct access to the public Supabase Auth endpoint. Hosted SMTP/SMS/providers/hooks and redirect settings must still be sandboxed/disabled by the owner.
- Staging app template includes INDEXNOW_ENABLED=false, AGENT_STUDIO_LIVE_ENABLED=false and TUTOR_DAILY_TOKEN_BUDGET=0.
- Staging Vercel template has empty crons and `git.deploymentEnabled=false`. The actual root vercel.json and hosted project settings were not changed.
- Hosting-evidence projection now includes the additional integration variable names while omitting all values.

## Exact Vercel staging configuration

Use [the 155-variable configuration matrix](seo-staging-configuration-matrix-20261020.md) and [staging app template](../operations/seo/staging-app.env.example). The matrix identifies purpose, required/optional status, exposure, scope, safe staging source, disabled features and production risks.

For the **dedicated storefront staging project**, set these in every enabled hosted scope that can build this candidate:

| Variable | Required staging configuration |
| --- | --- |
| APP_ENV | `staging` |
| NEXT_PUBLIC_APP_ENV | `staging` |
| NEXT_PUBLIC_SITE_URL | Exact approved HTTPS origin of the new staging project; no production host |
| NEXT_PUBLIC_SUPABASE_URL | `https://tyltharlnbxrxibuxyye.supabase.co` |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Independently obtained staging publishable or legacy anon key |
| SUPABASE_SERVICE_ROLE_KEY | Independently obtained staging secret or legacy service-role key |
| NEXT_PUBLIC_SUPABASE_KEY_BINDING | Staging ref plus SHA256 of the exact approved public key |
| SUPABASE_SERVICE_KEY_BINDING | Staging ref plus SHA256 of the exact approved service key |
| ADMIN_EMAIL | Dedicated staging fixture owner email |
| ADMIN_SESSION_SECRET | New independent random secret of at least 32 characters |
| SEO_RUNTIME_ENV | `staging` |
| SEO_SYNC_ENABLED | `false` |
| SEO_AI_ENABLED | `false` |
| SEO_EDITORIAL_ENABLED | `false` |
| SEO_MANUAL_SYNC_ENABLED | `false` |
| SEO_MIRAI_FALLBACK_ENABLED | `false` |
| PAYPAL_ENABLED | `false` |
| INDEXNOW_ENABLED | `false` |
| AGENT_STUDIO_LIVE_ENABLED | `false` |
| TUTOR_DAILY_TOKEN_BUDGET | `0` |

Do not override VERCEL_ENV, VERCEL_TARGET_ENV or NODE_ENV. A Production-scope deployment **in a dedicated staging project** still uses APP_ENV=staging. Preview deployments there also use staging configuration. Local Development instead uses local Supabase and APP_ENV=development; do not inherit hosted production credentials.

Omit all provider/email/SMS/push/payment keys; INDEXNOW_KEY; CRON_SECRET and LEARNING_CRON_SECRET; SEO_WORKER_URL/ALLOWED_ORIGIN/CRON_SECRET/BINDING; Redis/KV URL/token pairs; and optional owner-learning credentials. The optional owner-learning group requires its own staging database binding and new credentials before it can be enabled. Some sensitive authentication routes require shared rate limiting in a production-mode runtime and will intentionally return 503 without it. Resolving that needs an independently scoped staging rate-limit design and acceptance, not copying production Redis.

Do not put worker variables or a worker CRON_SECRET in the storefront project. The separate worker template is retained only for later approved work; no worker project or cron should be deployed now. SQL AI budgets/authorizations must also remain disabled/zero; environment values do not prove database budget state.

Opaque key fingerprints are drift checks, not proof of origin. Never hash a copied production key and call it staging verification. Do not put secrets in chat or source.

Offline validation, once a protected file is populated:

```text
node scripts/validate-seo-environment.mjs --app <protected-staging-file>
```

This does not load .env.local or contact a server. A blank template is intentionally not valid. Validator success is not deployment approval.

## Git and deployment strategy

The root is the Next.js storefront. `operations/seo-vercel` is the separate worker root and must not be selected for the storefront. `mobile` and `lecomax-learning-app` are separate applications. The root package has a prebuild source-generation step; do not run an ordinary root build with inherited dotenv credentials. The inspected isolated build script is appropriate for local checks.

Root `vercel.json` retains four production commerce/learning schedules. `.vercelignore` excludes dotenv, .vercel links and release directories, but is not proof of Git-connected project isolation or complete deployment contents. The root has no Git deployment-disable rule. GitHub `verify.yml` runs on every branch push and pull request; its comment says Vercel builds every push. The Android workflow runs on version tags/manual dispatch and contains a production API target. Do not create release tags.

Vercel enables unspecified branches by default; the staging template's false setting only matters when it is the effective configuration of the actual project. See [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration).

**Do not create or push a staging branch yet.** Before a later explicitly approved `staging/seo-security-20261020` branch:

1. Obtain dated read-only/sanitized evidence of every Vercel project connected to `lecomaxstore-prog/lecomax`, their root directories, production branches, Git deployment rules, deploy hooks, integrations and external CI.
2. Have the owner confirm that the proposed branch cannot trigger deployment in the production-linked project. Local branch naming does not prove this. No production settings were changed here.
3. Prepare an isolated reviewed source package without .env*, .vercel links, production data or existing release artifacts. Its effective root vercel.json must be the staging template, with empty crons and Git deployment disabled. Review all candidate files against the actual production revision; the dirty workspace is not a release candidate.
4. Prefer an initially Git-disconnected dedicated staging project, created only after explicit approval, with root directory set to the reviewed storefront source. No production domain aliases. Inspect shared/integration-provided variables and every scope before any deployment.
5. Request separate explicit approval for branch creation/push, project creation, staging provisioning/migrations and deployment. Nothing in this handoff authorizes them.

## Remaining blockers

- No fresh hosted Vercel/Supabase configuration or credential-provenance evidence; prior management denial/connection observations were not retried.
- No deployed staging app, real staging owner/editor/viewer sessions or hosted Auth/RLS/RPC acceptance.
- Staging schema/catalogue and the current six-file editorial migration plan require separately authorized provisioning. Do not use older five-file or synchronous-base plans as the current editorial rollout.
- Legacy operator scripts remain outside the staging package and must not be executed: `scripts/run-migrations.mjs` and `scripts/fix-push-permissions.mjs` hardcode production; `create-contact-table.mjs`, `create-newsletter-table.mjs`, and `setup-chat.mjs` incorrectly use a database service key with the Management API. Other legacy setup/audit scripts inherit .env.local or direct credentials. This session fixes application/SEO transport compatibility, not authority or safety of every historical administration script.
- Older candidate packagers have hardcoded runtime file lists that already omitted environment-target and now also need the new header dependency. Do not deploy their historical artifacts; current app/worker artifacts need complete transitive dependency review.
- 126 Next.js SDK call sites largely rely on the existing startup/middleware isolation validation; only the common wrapped browser/server clients additionally validate each transport target. This is not a per-route rewrite or proof that arbitrary standalone imports are safe.
- The separate mobile app retains production backend defaults. It is not an approved staging client.
- Hosted Auth SMTP/SMS/hooks, OAuth redirects, storage/webhooks/Edge Functions, schedules and integrations remain unverified. No-credential application configuration cannot disable Supabase's own hosted mail system.
- Existing public metadata/product URLs can retain production canonicals. Staging must remain protected and globally noindex; browser/crawler acceptance was not performed in this session.
- Named FR/AR review, current backup/PITR evidence, approved restore rehearsal, rollback owners and monitoring thresholds are still required.

## Validation and next session

Fresh Node 24 results:

- Application/SEO/security/owner/client/indexing selection: 167 passed initially; the final focused run adds two IndexNow tests and rechecks affected routes/tooling.
- Worker suite: 71 passed, including offline SQL fixtures, authorization and environment isolation.
- Final focused selection: 27 passed, including six Change History tests. **246 distinct passing Node tests total** across these selections; overlapping reruns are not added.
- Root and learning-app TypeScript with incremental writes disabled: passed.
- Focused ESLint across modified runtime, tooling and tests: passed.
- Initial isolated build: failed only on blocked Google Fonts downloads (`build-launch.log`); a reviewed isolated retry was launched. See the completion addendum for its actual result.
- No fresh hosted, native PostgreSQL/PostgREST, browser UI or production recovery validation is claimed. Earlier native tests remain historical; SQL/migration bytes were not modified.

Resume by reading this handoff, the matrix, current Git status and the final integrity manifest. Preserve all reports and evidence. Next owner work is dated sanitized hosting/Auth/isolation evidence and candidate review, followed by separate approval for staging provisioning and deployment. Continue local tests only for changed code or unresolved failures.

Change History is the learning app's `/change-history` after rebuild. It shows the current app, not an archived snapshot. No live preview was verified; no preview URL is claimed.

## Completion addendum

Isolated build passed at **2026-10-20T14:08:13.793Z**. Snapshot: `release/seo-editorial-check-1792505019952`. All 15 modified application/worker runtime source files match this snapshot. The build uses synthetic keys, no copied dotenv/hosting links and blocked application runtime fetches; only public font downloads were permitted. The shared-workspace tracing-root warning remains: this is not proof of standalone deployment-package completeness. Subsequent handoff and Change History updates are not in that snapshot. No UI preview was run.

Current validation summary: [verification.json](../artifacts/seo-staging-security-20261020/verification.json).

### Files changed in this continuation

- `operations/seo-vercel/lib/supabase-headers.mjs`
- `lib/indexnow.mjs`
- `lib/product-discovery.ts`
- `middleware.ts`
- `lib/admin-access.ts`
- `lib/supabase-service-headers.ts`
- `operations/seo-vercel/lib/handler.mjs`
- `scripts/verify-storefront-release.mjs`
- `operations/seo-vercel/lib/environment-target.mjs`
- `lib/mobile-campaigns.ts`
- `lib/mobile-push-receipts.ts`
- `app/api/account/password-reset/route.ts`
- `lib/supabase.ts`
- `lib/admin-settings-access.ts`
- `app/api/admin/auth/session/route.ts`
- `operations/seo/staging-app.env.example`
- `.env.example`
- `operations/seo/staging-vercel.json`
- `tests/admin-access.test.ts`
- `operations/seo-vercel/tests/environment-isolation.test.mjs`
- `tests/indexnow-safety.test.ts`
- `tests/supabase-key-compatibility.test.ts`
- `tests/environment-clients.test.ts`
- `app/api/indexnow/route.ts`
- `scripts/verify-seo-live.mjs`
- `scripts/verify-seo-hosted-readonly.cjs`
- `scripts/seo-final-readiness.cjs`
- `scripts/verify-seo-staging-package.cjs`
- `scripts/seo-hosting-evidence.cjs`
- `tests/password-reset-api.test.ts`
- `tests/staging-outbound.test.ts`
- `tests/seo-hosting-evidence.test.cjs`
- `docs/seo-staging-configuration-matrix-20261020.md`
- `docs/seo-staging-security-handoff-20261020.md`

Also appended two immutable Change History reports and regenerated `lecomax-learning-app/data/change-history.json` through the supported append command. Existing reports were retained.

Final history integrity: **637 valid reports**; all six history tests passed after the final append (already included in the 246 distinct tests). Reports: `seo-staging-security-prepared-20261020` and `seo-staging-security-verified-20261020`. No preview field was added.
