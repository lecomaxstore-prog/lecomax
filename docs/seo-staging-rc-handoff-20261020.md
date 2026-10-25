# SEO staging release candidate — 20 October 2026

**Local candidate: GO for owner review. Hosted staging deployment: NO-GO until the owner gates below are satisfied and deployment is explicitly approved. Production: NO-GO.**

The existing `staging/seo-engine` worktree at `../L'ecomax-seo-staging` now contains the selective SEO/security candidate on baseline `d9d1d7a7b274fe3df9f70bb154704ea9e07e78ee`. Nothing was pushed, deployed, migrated remotely or activated. Production-linked workspace configuration and unrelated changes were preserved.

## Completed implementation

- Transferred the SEO dashboard, editorial workflows, APIs, publication metadata, sitemaps, authorization and disabled worker runtime with their dependencies.
- Included modern Supabase apikey/Bearer handling, explicit environment/project bindings, independent admin signing, owner-database target validation, production-only IndexNow transport and disabled email/Expo delivery.
- Effective staging `vercel.json`: Next.js framework, no cron schedules, Git deployments disabled.
- Disabled browser analytics, consent-provider scripts, tracking, ads, push prompts and Trustpilot bootstrap outside production.
- Preserved baseline collection exports and the shared learning modules required by storefront APIs. The original workspace's older `db-server.ts` was not retained in the candidate.
- Declared the existing locked `@next/env` 15.5.24 as a direct build dependency. No dependency versions were upgraded.
- Set the candidate itself as the build tracing root; disabled webpack disk cache because free disk space was approximately 1.6 GB before building.
- Preserved baseline upload exclusions and added exclusions for offline artifacts, CI and separate worker entry points. No dotenv credentials or Vercel project links were transferred.

Exact files, before/after hashes, reasons and corrections are in `artifacts/seo-staging-rc-20261020/`: `transfer-reviewed.json`, `corrections.json`, `baseline-preservation.json`, `dependency-correction.json`, `prior-security-completion.json`, and the final manifest. The initial `transfer.json` is an unexecuted draft; use the reviewed transfer and subsequent correction records.

## Actual validation

All candidate checks used the retained Node **24.22.0** executable.

| Check | Result |
| --- | --- |
| Candidate TypeScript | Passed after preserving baseline collection exports; final build also typechecked |
| Focused ESLint | Passed; existing image warnings remain |
| Application/SEO/auth/client isolation/API compatibility/IndexNow tests | 161 passed |
| Worker authorization/environment/editorial/SQL fixture tests | 71 passed |
| Candidate email handlers with provider/database tripwires | 4 passed |
| Original workspace Change History tests | 4 passed |
| Isolated production build | Passed at 2026-10-20T14:41:36.673Z |
| Built-app loopback HTTP | 8 passed: storefront, anonymous SEO denial, cron refusal, signup/password-reset refusal, protected/disabled email routes; all noindex |
| Browser integration HTML check | No Trustpilot/Google/Clarity/Vercel external tracking script in the returned homepage HTML; no browser UI session claimed |
| Upload/dependency inventory | 2,123 files, approximately 143.6 MB; 702 runtime/build modules; no missing/excluded literal import or undeclared package |
| Six-migration plan | All source hashes match; nothing executed |
| Course content validation | 635,429 checks passed: 48 modules, 192 lessons, 3 languages |

The build ran from the actual staging candidate with synthetic local credentials, disabled integrations and blocked application `fetch`. Public font build inputs were permitted. Build artifacts are local development-target fixtures, **not deployable prebuilt staging output**. Deploy source with independently verified staging variables after approval.

Failed evidence is retained: initial TypeScript exposed removed collection exports; initial tests exposed dynamically loaded fixture/CLI omissions; first build exposed unconditional Resend initialization. All were corrected. Two smoke expectations were corrected to reflect middleware precedence: send-confirmation/newsletter return anonymous 401, order notification returns disabled 503. No authorization was loosened.

Limitations: local dependencies use an upload-excluded junction to the existing installation. No fresh Linux `npm ci`, Vercel upload, hosted build, real Supabase sessions, hosted RLS/RPC, native PostgreSQL rerun, browser interaction or human FR/AR review was performed. Upload inventory models `.vercelignore` with gitignore semantics; it is not a Vercel upload receipt. The direct Next build generated the source library but did not execute npm's course-generation prebuild lifecycle.

## Required Vercel configuration

Use a new, **Git-disconnected** dedicated staging project, with no production domains or shared production credentials. Root directory is the candidate storefront root, not `operations/seo-vercel`, mobile or learning-app. Select Next.js and Node 24.x. Keep Deployment Protection enabled. Review every enabled environment scope and integration-injected variable before building.

Use `operations/seo/staging-app.env.example` and `docs/seo-staging-configuration-matrix-20261020.md` in the original workspace:

- `APP_ENV=staging`, `NEXT_PUBLIC_APP_ENV=staging`, `SEO_RUNTIME_ENV=staging`.
- `NEXT_PUBLIC_SITE_URL`: exact approved HTTPS staging origin.
- `NEXT_PUBLIC_SUPABASE_URL=https://tyltharlnbxrxibuxyye.supabase.co`.
- Independently obtained staging `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`; matching `NEXT_PUBLIC_SUPABASE_KEY_BINDING` and `SUPABASE_SERVICE_KEY_BINDING`.
- Dedicated fixture `ADMIN_EMAIL`; fresh independent `ADMIN_SESSION_SECRET` of at least 32 characters.
- `SEO_SYNC_ENABLED`, `SEO_AI_ENABLED`, `SEO_EDITORIAL_ENABLED`, `SEO_MANUAL_SYNC_ENABLED`, `SEO_MIRAI_FALLBACK_ENABLED`, `PAYPAL_ENABLED`, `INDEXNOW_ENABLED`, `AGENT_STUDIO_LIVE_ENABLED`: all `false`.
- `TUTOR_DAILY_TOKEN_BUDGET=0`.
- Omit provider, mail, SMS, push, payment, Redis/KV, cron and worker-trigger credentials. Leave optional owner-learning credentials unset.

Do not override `NODE_ENV`, `VERCEL_ENV` or `VERCEL_TARGET_ENV`. Even a Production-scope deployment in this dedicated staging project uses `APP_ENV=staging`. Opaque-key fingerprints detect drift; they do not prove key provenance. Validate the owner-populated protected file locally with `node scripts/validate-seo-environment.mjs --app <protected-file>`; never paste credentials into chat.

## Remaining owner gates and shortest deployment path

1. Supply dated sanitized Vercel/Supabase identity and configuration evidence. Confirm the actual production revision for comparison; the historical baseline is not proof of the currently deployed revision.
2. Confirm staging project ownership, independent key provenance, Auth Site URL/redirects, providers, SMTP/SMS sandbox restrictions, hooks, storage/webhooks/Edge Functions, database/external schedules and integrations. Application guards cannot disable Supabase-hosted mail or hooks.
3. Approve the exact candidate manifest, dedicated Git-disconnected project creation, and first staging source deployment explicitly. Do not push this branch until every existing production-linked project's Git/deploy-hook behavior has been reviewed. Local `git.deploymentEnabled=false` is not evidence about other projects.
4. Separately approve any staging schema/fixture provisioning. Use only `operations/seo/editorial-six-migration-plan.json`; do not combine its decoupled base with the historical synchronous base. Keep SQL AI budgets/authorizations disabled and zero.
5. After the approved hosted build, verify protected/noindex pages, independently scoped credentials, real owner/editor/viewer/revoked sessions, RLS/RPC permissions, publication/rollback and no external effects. Capture immutable deployment identity and source parity.

There are no remaining reproduced local compilation/test failures. Hosted credentials, dashboard isolation, provisioning and deployment approval remain owner-controlled blockers. Production additionally needs recovery/backup evidence, named rollback/monitoring owners, language review and separate release approval.

Change History reports are appended through the supported command in both workspaces. `/change-history` belongs to the learning app after rebuild and shows the current application, not a historical snapshot. No live preview URL was verified.
