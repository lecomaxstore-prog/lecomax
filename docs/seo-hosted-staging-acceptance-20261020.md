# Hosted staging acceptance: preparation and owner checklist

Production is **NO-GO**. This procedure grants no permission for hosted writes,
migrations, deployments, login/account creation, worker activation or paid calls.
The current runner is an eight-actor HTTP status acceptance check, not full RLS,
Auth, migration, database recovery or production certification.

## Recovered checkpoint

The five recovered files are `artifacts/seo-hosted-preparation-20261020/discovery.json`,
`scripts/seo-hosting-evidence.cjs`, `scripts/seo-staging-acceptance.cjs`,
`tests/seo-hosting-evidence.test.cjs` and `tests/seo-staging-acceptance.test.cjs`.
They are untracked in Git; the large dirty tree does not identify a five-file
session boundary. The latter two match the interrupted report's test inventory.
All existing files, logs and immutable reports were retained.

The earlier discovery records staging `tyltharlnbxrxibuxyye`, organization
`mbhkspintqoxntjbykrm`, eu-west-1, healthy PostgreSQL 17.11, an empty public schema
and migration ledger, no Edge Functions and no advisor lints. Its database
transaction was read-only, but its role was privileged `postgres`.
These are historical observations, not fresh checks.

Fresh plugin discovery in this continuation reports both Vercel and Supabase
unconnected. No database or hosted application request was made. Prior denied
management requests were not retried.

## Owner actions, in order

1. Open the Vercel connection flow and review its account/team/project access.
   Limit access to the intended staging project and read-only metadata if the
   connection supports those restrictions. Do not assume OAuth offers
   operation-level read-only permissions. If it requires broader access, use
   manual sanitized dashboard evidence instead. Do not grant deployment or
   database-write access merely to collect evidence.
2. In the staging project's **Settings → General**, record project and team IDs.
   In **Deployments**, open the exact reviewed deployment and record deployment
   ID, immutable deployment URL, READY status and full Git revision. Compare
   independently with production Vercel ID `prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb`.
   The runner rejects that production project. Aliases and branch URLs are not
   accepted in place of the immutable deployment URL.
3. Open **Settings → Environment Variables** and inspect Production, Preview,
   Development, custom environments, branch overrides, shared variables and
   integration-provided variables. Record names/scopes only. Privately verify
   values and independent credential provenance against the staging templates.
   Project settings changed after a deployment do not prove that deployment's
   configuration: record the deployed configuration/revision too.
   [Vercel scope and precedence documentation](https://vercel.com/docs/environment-variables)
   and [dashboard instructions](https://vercel.com/docs/environment-variables/managing-environment-variables).
4. In Supabase, select `lecomax-seo-staging` and compare the project reference,
   organization, region and signed-in account/role with the historical identifiers
   above. Production is `yddqwgdgeljkzfsmtein` and must never be selected for these
   staging checks. Review **Authentication → URL Configuration** (Site URL and
   every redirect), sign-in providers and callback hosts, **Authentication →
   Emails → SMTP Settings**, Phone/SMS provider configuration, Auth Hooks and
   session expiry/revocation settings. Record whether email/SMS destinations are
   sandbox-restricted; do not send test messages.
   [Redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls),
   [Auth configuration](https://supabase.com/docs/guides/auth/general-configuration),
   [SMTP dashboard location](https://supabase.com/docs/guides/deployment/going-into-prod).
5. Review Vercel Cron Jobs, integrations, Git/CI actions, external worker runners,
   Supabase Edge Functions, database hooks and webhook destinations. Confirm all
   SEO activation flags are false, provider keys absent and budgets zero.
   Local worker/staging cron files are empty; the root storefront cron file has
   four existing commerce/learning schedules and must not be copied into staging
   blindly. No hosted state was changed here.
6. Review `operations/seo/editorial-six-migration-plan.json` and its six pinned
   hashes. Prepare the ordered staging plan, prerequisite catalogue/Auth schema,
   synthetic fixtures and postflight checks offline. Never apply both original
   and decoupled base migrations. The observed empty staging schema cannot pass
   the authenticated status tests yet. Execution requires separate explicit
   approval after isolation and backup review.
7. In Supabase **Database → Backups**, record latest protected backup timestamp,
   retention and PITR window/status. Name restore/rollback operators, agree
   RPO/RTO, protect copies and separately approve a compatible isolated restore
   drill. Database backup coverage does not establish recovery of Storage object
   files; inventory those separately.
   [Backup and recovery documentation](https://supabase.com/docs/guides/platform/backups).

Never paste passwords, API keys, database URLs with passwords, session cookies or
service-role secrets into chat or evidence JSON. Do not use `vercel env pull` or
decrypted environment downloads for this checklist.

## Local configuration review

There is one Next.js storefront with the owner backend and SEO dashboard, plus
the Expo learning app and separate workers. Existing policy binds development to
local Supabase and preview/staging to the staging reference; production has its
own reference. Public client configuration uses `NEXT_PUBLIC_APP_ENV`,
`NEXT_PUBLIC_SUPABASE_URL`, the public key and its fingerprint binding. Service
keys, owner DSN/binding, `ADMIN_SESSION_SECRET`, `SESSION_SECRET` and worker
credentials remain server-only. Fingerprints detect drift, not credential origin.

The browser SDK has synchronous project/role checks and transport fingerprint
checks. Server SDK transport checks target/binding and rejects redirects; startup
instrumentation validates application configuration. Staff access also has direct
REST reads governed by startup configuration; this review does not claim every
repository fetch has an independent per-call isolation guard. Owner PostgreSQL
configuration rejects query overrides and requires hosted TLS. Worker guards and
offline validators remain covered by the regression suites.

Use the existing `operations/seo/staging-app.env.example` and
`staging-worker.env.example` to prepare protected local files, then run:

```text
node scripts/validate-seo-environment.mjs --app <protected-local-file>
node scripts/validate-seo-environment.mjs --worker <protected-local-file>
node scripts/seo-staging-acceptance.cjs --plan
```

Validation is offline and prints no values. Templates intentionally contain
missing credentials and are not valid configurations. The environment evidence
collector returns only allowlisted scope names and branch/custom-scope booleans;
it rejects incomplete/paginated/malformed inventories. It cannot verify secret
values, actual project bindings, all inherited settings or absent automation.

## Later read-only HTTP acceptance

Copy `operations/seo/staging-acceptance.example.json` into a protected local file.
Fill every identity from reviewed evidence; change approval flags only after the
corresponding review actually passes. `reviewedAt` must be UTC and younger than
24 hours. The full revision must be 40 lowercase hex characters.

After separately approved staging provisioning, authorized testers supply genuine
staging owner, catalogue-editor, view-only, product-only, suspended and expired
admin sessions using the environment names printed by `--plan`. No login,
account creation or cookie minting is performed by the runner. Supply
`SEO_ACCEPTANCE_VERCEL_READ_TOKEN` privately in the process environment using
approved scoped access; the runner never loads dotenv or CLI credentials.

```text
node scripts/seo-staging-acceptance.cjs --execute-readonly <reviewed-evidence.json>
```

Before sending any cookie, the runner uses exactly one fixed Vercel metadata GET
to verify deployment ID, distinct staging project, immutable URL, revision and
READY state. A denial, redirect, mismatch or malformed/oversized response blocks
execution with a sanitized error. It then performs fixed `/api/admin/seo/sync`
GETs only, stops on the first failure, checks disabled manual sync and no-store,
and persists bounded sanitized results. No worker endpoint is called.

The reviewed local status route performs authorization reads and a SELECT-only
`seo_run_status` function. HTTP GET alone cannot enforce a read-only database
transaction in an arbitrary hosted deployment. The report explicitly marks
database/environment identity as operator-attested and database transaction
read-only verification as false. Full hosted RLS/RPC and mutation acceptance
requires a separate approved procedure. No SQL inspection is executed here.

The historical production runner retains its offline plan but all execution
arguments now fail with `PRODUCTION_ACCEPTANCE_DISABLED_USE_STAGING_RUNNER`.
Re-enabling it requires a separate reviewed change and production authorization.
