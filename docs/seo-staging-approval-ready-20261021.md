# Staging approval package — 21 October 2026

The remaining work crosses the owner's explicit hosted-change boundary. Local preparation is complete; **GO for owner review**, not GO to deploy or apply schema. Production remains unchanged.

## Webhook 403 resolved as a feature-access diagnosis

Both the staging project and its separate organization return `webhooks_access_disabled`, with the message that webhook access is disabled for that organization or project. This is consistent with Supabase's documented early-access allowlist restriction for [Platform Webhooks](https://supabase.com/docs/guides/platform/webhooks). Do not enable early access, upgrade a plan or broaden permissions merely to eliminate this response.

This establishes disabled platform-feature access, not an enumerated empty endpoint list. It is no longer classified as an unexplained credential/permission blocker. Reassess if platform feature access is later enabled. Database triggers and Auth hooks have separate prior verification and remain absent/disabled. Sanitized error evidence: `artifacts/seo-staging-auth-full-1792536634643.json`.

## Exact review package

`operations/seo/staging-approval-package-20261021/manifest.json` pins the three review artifacts and the existing six SEO migration files. Artifact verification checked all nine hashes, the intentional SQL guard, RLS and restrictive grants on five prerequisite tables, disabled Auth providers and four synthetic user templates. No SQL or user request was executed.

1. `auth-corrections.review.json`: exact proposed PATCH for `tyltharlnbxrxibuxyye`, organization `mbhkspintqoxntjbykrm`. Sets the staging Site URL, disables signup and email/phone/social/anonymous providers and all Auth hooks, and keeps redirects empty. No secret changes, messages or provider activation. Password login intentionally remains unavailable in this first smoke phase.
2. `prerequisites.sql.review`: exact synthetic catalogue and staff schema/rows. Five tables: products, categories, admin_roles, admin_staff and admin_role_permissions. Each has RLS and explicit service-role SELECT-only grants after revoking inherited API-role privileges. Three products, two categories, two roles, three staff records and three permission mappings. Fixed IDs are reserved synthetic fixtures. No production reads or data copies. The draft raises `REVIEW_DRAFT_NOT_APPROVED` before DDL; it cannot be applied unchanged.
3. `auth-users.request-templates.json`: owner/editor/viewer/revoked fixture templates with confirmed synthetic emails and password-generation placeholders. These are not runnable API request bodies and contain no real passwords. No invitation, signup or recovery method is permitted. Actual password generation and user creation require separate approval.

The six existing migrations remain hash-pinned in their original order. After approval, prepare a target-verified execution package from these review artifacts; remove the deliberate SQL guard only in that approved package. Do not wrap independently transaction-managed migration files in a pretend all-or-nothing transaction. Record each applied stage; stop on failure and review committed state before retry. Postcommit deletion/rollback is not implicitly authorized.

The synthetic schema supports the SEO/admin contract, not complete commerce, checkout or production recovery. The new prerequisite SQL is statically reviewed, not an executed SQL rehearsal. The native database migration rehearsal was not rerun under the current no-migrations restriction; its earlier evidence remains historical. Runtime application source was not changed.

## Approval sequence and genuine gates

1. Approve the exact staging-only Auth correction artifact. After application, verify every setting by readback without sending messages.
2. Separately approve synthetic prerequisite schema, six pinned migrations and fixture users. Do not apply user templates until the Auth test strategy is approved; do not introduce a publicly known placeholder password. Confirm disabled database budgets, grants/RLS and absent outbound schedules after each stage.
3. For real-session acceptance, choose and approve a no-delivery Auth configuration. The conservative email-disabled patch does not permit a password-login claim. Do not activate external mail or fake a logged-in session to bypass this gate.
4. Only after the agreed first-deployment scope is verified, request explicit deployment approval naming Vercel project `prj_jPniwpH4s81bhISVReUKTQN0GwvD`, team `team_yFLUcpSvgQi8EQuvuorOZW7w`, the reviewed candidate manifest and staging origin. No current approval authorizes deployment.

Staging environment verification remains clean: exactly 20 names in Production and Preview, no duplicates/extras/branch overrides, all 18 readable values match. Vercel withholds two sensitive values; their original verified provenance/write and sensitive-storage metadata are retained. Evidence: `artifacts/seo-staging-env-verified-1792536802551.json`.

Shortest production path after staging: protected hosted build and anonymous-access/noindex checks; real owner/editor/viewer/revoked authorization and RLS/RPC tests; no-outbound verification and rollback rehearsal; FR/AR review; current production revision comparison; backup/restore and monitoring/rollback ownership; separate production release approval. Clean Linux install and hosted build/auth remain untested until authorized. Do not infer production readiness from local passing tests.

Change History in the learning app remains append-only. No live preview is claimed.

## Completed validation for this package

Fresh rerun: 242 application/worker/email/history tests, nine browser fixture scenarios, candidate and learning-app TypeScript, focused ESLint (two existing image warnings), full Node 24.22.0 npm production lifecycle and eight local HTTP refusal/noindex checks passed. No native migration rehearsal was run. The candidate's 2,123 upload files were hash-checked before build; no runtime source changed.

Build evidence: `artifacts/seo-staging-lifecycle-1792518723790/result-1792536651712.json`; HTTP: `artifacts/seo-staging-rc-20261020/smoke-1792536858403.json`; browser: `artifacts/seo-editorial-browser/run-iG6H1T/`; approval artifact check: `artifacts/seo-staging-approval-package-check-1792536803409.json`. The linked Change History verification report records the results and untested limits. Decision remains GO for owner review, not permission to execute hosted changes.
