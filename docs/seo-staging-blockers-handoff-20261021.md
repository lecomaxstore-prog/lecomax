# Staging preparation — 21 October 2026

Local build blockers are resolved. Hosted staging remains **NO-GO** until separately approved Auth and provisioning work and the webhook access check are complete. No deployment, push, hosted mutation, migration or provider activation was performed.

## Resolved and verified

- Lossless NTFS compression completed on task-owned artifact/build directories. Both reports recorded zero content-hash mismatches and zero deletions. The disk had 6.85 GB free when work resumed; the entire increase is not attributed to compression. No source/history cleanup or lowered disk guard was used.
- Full Node 24.22.0 `npm run build` passed, including 635,429 course checks, source-library generation and Next production compilation. The existing candidate was retried with public font downloads permitted, application fetch blocked, and synthetic local credentials. No application source change was needed. Public font access remains a build prerequisite, not an offline-font claim.
- Eight local HTTP refusal/noindex checks passed against this fresh build. It is synthetic test output, not deployable prebuilt staging output.
- Fresh 161 application/security tests, 71 worker tests, four email side-effect tests and six history tests passed (242 total). TypeScript and focused ESLint passed with two existing image warnings. Earlier nine-browser-scenario and 13 native database results were retained, not rerun or relabelled as fresh.
- Verified Vercel project `prj_jPniwpH4s81bhISVReUKTQN0GwvD`, team `team_yFLUcpSvgQi8EQuvuorOZW7w`, Git disconnected, all-deployment protection, zero deployments, expected build settings, no shared variables and no assigned integration.
- All 20 environment names/scopes are correct, with no extra or branch-specific assignments. Eighteen readable values match in Production and Preview. The two sensitive values are withheld by Vercel, so only their storage metadata and original write/provenance are verified. No environment value was printed or exported. The earlier list-endpoint check failures were API readback limitations, not observed value drift; the installed CLI's current pull endpoint resolved readable-value verification.
- Supabase `tyltharlnbxrxibuxyye` remains healthy in organization `mbhkspintqoxntjbykrm`, distinct from production. Fresh read-only counts: zero public tables, Auth users, buckets, public/Auth user triggers, outbound extensions, subscriptions and foreign servers. No schema was changed.

## Auth and webhook findings

The full 243-field Auth configuration was inspected using the existing CLI login and a GET-only management audit. Only safe boolean settings and credential-presence flags were retained. Social/phone/anonymous authentication and all Auth hooks are disabled. No custom SMTP credentials or provider/hook endpoints are configured. Site URL remains `http://localhost:3000`; redirect allowlist is empty; signup and email/password authentication are enabled.

No custom SMTP does **not** mean mail delivery is disabled: Supabase supplies a default mail service. See [Supabase SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp). No test messages, recovery calls, signups or invitations were sent.

Database triggers and Auth hooks are independently absent/disabled. The separate platform-level project and organization webhook listing endpoints both returned **HTTP 403**. Their contents remain unknown; obtain owner dashboard evidence or appropriately scoped read access. Do not infer that they are empty. The [platform webhook listing](https://supabase.com/docs/reference/api/v2-projects-ref-webhooks-endpoints-get) is separate from database triggers.

Prepared, **not applied**: `operations/seo/staging-auth-corrections-20261021.json`. It sets the staging Site URL, disables signup and all external Auth providers including email/password, and leaves redirects empty. This conservative first-smoke configuration intentionally prevents password login. Real-session acceptance later requires a separately approved no-delivery Auth test configuration; this plan does not activate SMTP or deploy a mail hook.

## Synthetic provisioning proposal

Prepared, **not executed**: `operations/seo/staging-synthetic-provisioning-plan-20261021.json`.

The plan combines three synthetic products and two categories, minimal `admin_roles`/`admin_staff`/`admin_role_permissions` prerequisites, the six existing hash-pinned SEO migrations, and separately approved preconfirmed owner/editor/viewer/revoked Auth fixtures. It requires restrictive grants/RLS, no production data, no messages, disabled AI budgets, no worker/cron execution and explicit precommit/postcommit stop rules. It supersedes the old catalogue proposal's five-migration wording without changing historical pins.

This is a reviewable design, not executable SQL or an executed rehearsal of the new staff/Auth prerequisites. It does not provide all commerce tables, prices, orders or checkout functionality. Broader storefront compatibility is not claimed.

Scope correction: the SEO admin session route calls `sensitiveRateLimit` without `requireShared=true`; missing Redis does not itself cause that route to return the shared-limiter 503. The shared requirement is used by separate learning-mobile routes. Do not add production Redis or weaken guards. Distributed rate-limit adequacy still belongs in production readiness, but it is not a proven blocker to this SEO session route.

## Evidence and next owner action

- Build: `artifacts/seo-staging-lifecycle-1792518723790/result-1792536139977.json` and matching npm-build log.
- HTTP: `artifacts/seo-staging-rc-20261020/smoke-1792536335843.json`.
- Environment: `artifacts/seo-staging-env-verified-1792536384542.json`.
- Auth/webhooks: `artifacts/seo-staging-auth-full-1792536269807.json`.
- Fresh application/worker/types/lint logs: timestamped entries in `artifacts/seo-staging-rc-20261020/`.

Next: owner review of the two proposal files, separate authorization to apply staging Auth corrections and provision synthetic schema/users, and resolution of the webhook 403. Deployment approval remains separate and is not requested until those gates pass. A clean Linux installation, real staging Auth/RLS acceptance, protected hosted HTTP checks and full storefront acceptance remain untested.

Change History is append-only in the learning app at `/change-history` after rebuild. No live preview was verified. Existing production settings and the reviewed candidate source are unchanged.
