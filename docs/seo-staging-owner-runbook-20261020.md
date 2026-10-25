# First isolated SEO staging deployment: owner runbook

Current checkpoint: [executed staging provisioning](seo-staging-executed-20261021.md). Owner-approved Auth/schema/users are complete; historical pending-approval statements below are superseded. Deployment remains unapproved.

Latest checkpoint: [exact staging approval package and resolved webhook diagnosis](seo-staging-approval-ready-20261021.md). This supersedes pending local build work and the unexplained webhook 403 below. Hosted Auth, provisioning and deployment remain unapproved.

Status: local candidate GO for review; hosted staging NO-GO until the gates below pass; production NO-GO. This document grants no deployment or migration approval.

## Recovered checkpoint and fresh checks

The existing `../L'ecomax-seo-staging` worktree remains on `staging/seo-engine`, baseline `d9d1d7a7b274fe3df9f70bb154704ea9e07e78ee`. All 150 entries in `artifacts/seo-staging-rc-20261020/final-manifest.json` match. Fresh inventory: 2,123 files, 143,615,063 bytes, 702 modules, zero reported problems; lockfile declarations and six migration hashes pass. Only `.env.example` exists at the candidate root; no `.vercel` link exists.

Preserved evidence: 236 candidate tests, eight loopback HTTP checks, TypeScript, focused ESLint and isolated production build passed in the prior session. These were not rerun or relabelled as fresh results. No application code changed in this continuation.

A supplemental dependency scan included course generation and validation entry points: 709 modules, zero reported problems. All 2,123 upload file hashes also match the prior checkpoint inventory, with no additions or removals. Evidence: `artifacts/seo-staging-owner-checkpoint-20261020.json`. The original workspace's Change History check passed with 640 reports after appending this continuation; the candidate and its historical manifest were left unchanged.

The inventory models Git file enumeration and `.vercelignore`, not an actual upload receipt or exhaustive secret/vulnerability audit. The local dependency junction is excluded. Clean Linux installation, native modules, the complete npm prebuild lifecycle and hosted operation remain unverified. The candidate's npm prebuild runs course generation/validation and source-library generation; the prior direct Next build did not exercise that entire lifecycle. Keep the normal build command and treat any hosted failure as a stop, not permission to bypass checks.

## CLI checkpoint resolved

Installed Vercel CLI: **53.4.0**. Use `vercel.cmd` in PowerShell: the `vercel.ps1` shim is blocked by execution policy. Set `$env:NO_UPDATE_NOTIFIER='1'` for this terminal to avoid the observed sandbox update-cache permission errors; no execution-policy change or cache deletion is needed.

Installed help supports `project add <name>`, `link --project <name-or-id> --team <id-or-slug>`, and `deploy --target <target> --scope <scope> --cwd <directory>`. Installed implementation confirms:

- Project add calls project creation with `{ name }`, without a Git repository or deployment.
- A project-name conflict (HTTP 409) is treated as success. A success message alone does not prove a new empty project.
- `link --repo` can connect Git repositories; do not use it.
- Explicit `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` select an existing project without requiring a local `.vercel` link. Both must be set together.

No project creation, linking or deployment command was executed. Help output can return a nonzero help exit code; this is distinct from the observed update-cache errors.

## Owner steps: project creation and isolation

1. Explicitly approve creation of the dedicated staging project and the reviewed candidate. Close the GitHub import flow selecting `main`. Do not push any branch or use repository import.
2. In a fresh terminal, authenticate to the intended Vercel account if necessary. Confirm the exact team slug in the dashboard. Check that `lecomax-seo-staging` is not already occupied; if it exists, stop and audit it rather than adopting it blindly.
3. Run only after creation approval, replacing the team placeholder:

   ```powershell
   $env:NO_UPDATE_NOTIFIER = '1'
   vercel.cmd project add lecomax-seo-staging --scope '<approved-team-slug>'
   ```

4. Open that project in Vercel. Record sanitized evidence of team ID, project ID, project name and creation time. Verify zero deployments, no connected Git repository, no deploy hooks, no integration connections and no production domains. Check team integrations that automatically apply to new projects and shared environment-variable assignments. Local source cannot prove these are absent.
5. Settings → Build and Deployment: framework Next.js; Node 24.x; root directory is the uploaded storefront root (leave unset/default), not `operations/seo-vercel` or `lecomax-learning-app`. Set install command `npm ci` and build command `npm run build`; use the default Next.js output directory. Do not use prebuilt local output or override the isolation validator.
6. Settings → Deployment Protection: enable Vercel Authentication with **All Deployments**, before uploading. Inspect bypasses, exceptions and shareable links; none should grant unintended access. Standard Protection excludes production domains, including the dedicated project's production alias. Current documentation lists All Deployments on all plans; if unavailable in the actual account, stop and resolve protection before deploying.
7. Settings → Domains: retain only the new project's Vercel-generated domain. Record its exact assigned HTTPS origin; do not assume the preferred name is available. Never attach, transfer or alias `lecomax.com`, `www.lecomax.com` or another production domain.
8. Settings → Git must remain disconnected. Confirm Cron Jobs has no schedules. The candidate's effective `vercel.json` has `crons: []` and `git.deploymentEnabled: false`; these do not govern other Vercel projects.

## Owner steps: Supabase and environment

1. Open the independently owned staging project and verify project reference **tyltharlnbxrxibuxyye**, organization and project identity. Do not use a production backup or production credentials as fixture material.
2. Review Authentication → URL Configuration: Site URL is the exact approved staging HTTPS origin; redirects are exact required staging callback URLs. No production origins or broad wildcard redirects. Inspect enabled providers, SMTP/SMS, Auth hooks and signup behavior. Do not test signup/reset while outbound hosted mail is uncontrolled. Keep unused providers disabled.
3. Review database schedules/cron, triggers/webhooks, Edge Functions and their secrets, storage integrations and external connections. Confirm no production endpoints/credentials and no enabled external effects. Application flags cannot disable Supabase-hosted effects. Record read-only evidence of schema/migration state, RLS/RPC access and disabled SQL AI authorizations/zero budgets.
4. If schema or synthetic owner/editor/viewer fixtures are missing, stop for separate staging provisioning approval. The reviewed plan is `operations/seo/editorial-six-migration-plan.json`; do not execute it in this preparation session or combine it with historical base migrations.
5. Obtain keys directly from this staging project's API-key dashboard. Use the public key only for `NEXT_PUBLIC_SUPABASE_ANON_KEY`; the privileged key only for server-side `SUPABASE_SERVICE_ROLE_KEY`. Generate bindings as `project-ref:sha256(exact-key)` using trusted local tooling without printing the key. Bindings detect drift, not provenance. Create a new independent admin signing secret of at least 32 characters and a dedicated fixture admin identity.
6. Populate a protected file outside the source/upload tree from `operations/seo/staging-app.env.example`. Set `NEXT_PUBLIC_SITE_URL` to the recorded staging origin. Keep `APP_ENV`, `NEXT_PUBLIC_APP_ENV`, `SEO_RUNTIME_ENV` equal to `staging`; all eight template feature flags false and tutor budget zero. Omit the optional owner-learning group and all provider/mail/payment/push/worker/cron/Redis credentials.
7. From the original workspace, validate without network access:

   ```powershell
   & .\artifacts\seo-node24\node-v24.22.0.exe .\scripts\validate-seo-environment.mjs --app '<absolute-protected-file-path>'
   ```

   Never paste secrets into chat, CLI argument values, source or reports. Success does not prove online key provenance.
8. Enter the reviewed values into only the new Vercel project's Production and Preview environments, inspecting shared and integration-injected variables in both scopes. Mark server credentials sensitive where supported. Do not override `NODE_ENV`, `VERCEL_ENV` or `VERCEL_TARGET_ENV`. Do not import `.env.local` or use a Supabase integration that injects an unreviewed database.

## First deployment: separate explicit approval required

The shortest stable-origin route uses the **Production environment of the dedicated staging project**. This is not authorization to deploy the LECOMAX production project. `APP_ENV=staging` remains mandatory, and All Deployments protection must already cover the staging alias. If those conditions cannot be demonstrated, stop.

1. Obtain explicit approval for this specific first staging source deployment, naming the candidate manifest, staging project ID, team ID and assigned origin. Missing hosted isolation evidence, credentials or required schema remains a blocker.
2. Use a fresh terminal with no inherited credential/configuration overrides. Set both IDs from the reviewed staging project, not from the original workspace's `.vercel`. Confirm them against Vercel Settings before running:

   ```powershell
   $env:NO_UPDATE_NOTIFIER = '1'
   $env:VERCEL_ORG_ID = '<verified-staging-team-id>'
   $env:VERCEL_PROJECT_ID = '<verified-lecomax-seo-staging-project-id>'
   $candidate = "C:\Users\Ziko\Desktop\my projects\L'ecomax-seo-staging"
   vercel.cmd deploy --cwd $candidate --scope '<approved-team-slug>' --target production --non-interactive
   ```

   Do not use `--public`, `--prebuilt`, `--force`, `--yes`, `--env`, `--build-env`, repository linking, Git push or domain promotion. Explicit IDs avoid automatic project setup. If the command requests a new project or reports another identity, stop.
3. Retain the immutable deployment ID/URL, build result, source inventory and configuration evidence. A failed build is a failed staging attempt, not a reason to deploy a different branch. Verify the hosted install/build lifecycle and compare deployment source with the reviewed inventory.
4. In an anonymous browser with no bypass cookie, verify both generated deployment URL and staging alias require Vercel authentication. Then, authenticated to Vercel, verify global noindex and the existing refusal checks. Protection runs before application middleware, so test application headers after passing protection.
5. With separately approved synthetic fixtures, test owner/editor/viewer/revoked sessions, RLS/RPC restrictions, publication/rollback and absence of outbound effects. Sensitive authentication routes may intentionally return 503 without independently scoped shared rate limiting; this remains an acceptance/design blocker, not permission to copy production Redis.

## Stop conditions and production path

No hosted access/configuration proof or credentials were supplied in this continuation. The first deployment is **not yet safe to execute**. This runbook is conditional on owner evidence and approval; it is not a guarantee that a new project cannot inherit team defaults.

Shortest safe path: owner isolation evidence → independent staging credentials and separately approved schema/fixtures → protected staging source deployment → hosted build/auth/RLS/rollback/no-outbound acceptance → FR/AR review, current production revision comparison, backup/restore evidence and named rollback/monitoring owners → separate production release approval. Do not infer production readiness from local tests.

References: [Vercel project CLI](https://vercel.com/docs/cli/project), [deployment protection and scopes](https://vercel.com/docs/deployment-protection), [Supabase redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls). The Supabase changelog markdown fetch failed during this review; no Supabase implementation or migration was changed.

Change History remains append-only. `/change-history` is in the learning app after rebuild, not this storefront deployment and not a historical preview. No live preview was verified.

## Autonomous completion checkpoint

This addendum supersedes the earlier unverified local lifecycle and account-access status; it does not supersede the approval gates.

- Full Node 24.22.0 `npm run build`, including course generation, 635,429 course checks, source-library generation, Next compilation, lint/type checks and 230 static pages, passed on an exact disposable upload copy. Eight HTTP refusal/noindex checks passed against that new build.
- Fresh candidate suites: 161 application/auth/isolation/SEO tests, 71 worker tests and four email side-effect tests passed. Separate TypeScript and focused ESLint passed (two existing image warnings). Six Change History tests passed.
- Nine browser fixture scenarios passed, including editorial recovery/conflicts/publication controls and 375/768/1440 widths. Mobile and desktop screenshots were inspected. This is SEO web UI coverage, not native mobile or hosted Auth acceptance.
- Thirteen native PostgreSQL 17.11/PostgREST 16.5 checks passed, covering all six pinned migrations, RLS on 13 SEO tables, role/RPC restrictions, expired/invalid JWTs, concurrency, rollback and synthetic backup/restore. Local services stopped cleanly.
- All 150 candidate hashes remain unchanged. Fresh upload scan still reports 2,123 files, 143,615,063 bytes and zero problems. No real dotenv or Vercel link was added to the candidate.
- Read-only Vercel CLI access identifies account `lecomaxstore-4321` and accessible team `lecomaxstore-4321s-projects`. Explicit project inspection in that team reports no `lecomax-seo-staging` project.
- Read-only Supabase access confirms project `tyltharlnbxrxibuxyye` is `ACTIVE_HEALTHY`. It has zero recorded migrations, public tables, Auth users, Edge Functions, storage buckets, public user triggers, and installed `pg_cron`/`pg_net`/`http` extensions. The six-migration plan requires separate synthetic catalogue prerequisites; applying the six files alone to this empty project is not a complete provisioning plan.
- Hosted Auth settings, key provenance and credentials remain unverified. No hosted resource was changed. Clean Linux dependency installation remains untested; the local build used the excluded dependency junction.

The sandbox initially blocked browser DevTools, native PostgreSQL startup and public font downloads. Restricted attempts and successful narrowly scoped retries are retained, not erased. No application fix or isolation bypass was needed.

Reusable local harness: `scripts/verify-seo-staging-lifecycle.cjs`. Evidence: `artifacts/seo-staging-autonomous-completion-20261020.json`.

Decision: **local engineering GO for staging setup; deployment NO-GO; production NO-GO**. Next approval: create only the empty, Git-disconnected `lecomax-seo-staging` project in `lecomaxstore-4321s-projects`. That approval must not be interpreted as permission to deploy, provision schema, connect Git or activate integrations.

## Owner-authorized project creation completed

The owner subsequently explicitly authorized one empty project and non-destructive security configuration. Creation is complete; do not create another project.

- Project: `prj_jPniwpH4s81bhISVReUKTQN0GwvD` (`lecomax-seo-staging`).
- Verified team: `team_yFLUcpSvgQi8EQuvuorOZW7w` / `lecomaxstore-4321s-projects`.
- Dashboard: https://vercel.com/lecomaxstore-4321s-projects/lecomax-seo-staging
- Git link absent; zero deployments. Only assigned domain: `lecomax-seo-staging.vercel.app`; no production domain added or changed.
- Vercel Authentication changed from `all_except_custom_domains` to `all` and independently read back. Directory listing is false and Git fork protection true. No protection-bypass configuration or OPTIONS allowlist was returned.
- Project environment variable count zero, hidden Production variable count zero, shared-variable assignment count zero. No secrets copied or added.
- Existing team Upstash installation has `projectSelection: selected` and an empty `projects` array; this project is not assigned. No integration was created, activated or modified.
- Node defaults to 24.x. Framework is still unset: build configuration and application environment setup were not included in this security-only change.

Security PATCH payload: `operations/seo/staging-project-security.json`. The API accepted the payload, but did not return `publicSource` or `skipGitConnectDuringLink`; those fields are not claimed independently verified. Git disconnection is verified directly. Protection behavior over HTTP cannot be tested before a deployment exists.

Sanitized evidence: `artifacts/seo-staging-project-created-20261020.json`. The first deployment procedure above must use the verified IDs recorded here, retain `APP_ENV=staging`, and still wait for explicit deployment approval.

Next approval scope: configure this staging project's Next.js build settings and staging-only application environment. Independent credentials must be supplied through a protected mechanism, never chat. Separate approval is still required for Supabase synthetic catalogue/schema/Auth fixture provisioning and, later, the first deployment. No production changes or paid features are authorized.
