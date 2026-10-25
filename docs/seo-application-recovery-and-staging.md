# LECOMAX application recovery and staging assessment

Recorded 18 October 2026. **GO for application-database recovery and continued staging validation. NO-GO for production SEO migration until hosted integration checks pass.** Nothing in this procedure authorizes a production mutation or deployment.

## Classification of the 36 original restore errors

| Root cause | Errors | Meaning |
| --- | ---: | --- |
| Missing pg_cron and dependent objects | 19 | Extension/comment, two data loads, two sequence values, schema/function/table grants and default privileges |
| Missing pg_net and dependent objects | 3 | Extension/comment and schema grants |
| Missing Supabase Vault and dependent objects | 8 | Extension/comment, secret-data load, function and table/view grants |
| Supabase event-trigger ownership | 6 | Hosted superuser ownership cannot be assigned to the locally recreated non-superuser supabase_admin |
| Application-table/schema failures | 0 | None among these 36 errors |

See [the complete numbered ledger](seo-restore-error-ledger-20261018.md). The original backup and previous reports were preserved.

The distinction is not equivalent to saying these failures are harmless. The restored `public.tick_micro_learning()` function references `vault.decrypted_secrets` and `net.http_get`; the omitted cron job invokes this function. Scheduled micro-learning automation is therefore NOT recovered locally. Missing rows remain `cron.job` (1), `cron.job_run_details` (17,471), and `vault.secrets` (1). Never replay the production job or secret into staging: it could invoke a production endpoint.

The SEO migration and SEO source modules contain no direct cron/net/Vault dependency. Supabase-specific dependencies for the application integration are its REST API, role grants and service-role credential, admin-session configuration, and schema-cache behavior. The synthetic baseline also requires the genuine `auth.role()` helper and pgcrypto in `extensions` for `admin_staff.invite_token` defaults. These were identified and supplied in local validation; hosted staging must verify their presence.

## New evidence, without repeating the full restore

The original unfiltered restore was not repeated. A **new application recovery profile** was rehearsed because its failure behavior and exclusions had not previously been tested:

- `scripts/verify-application-recovery.cjs` created `lecomax_app_recovery_1792346248261` in the existing isolated cluster.
- Derived a TOC selection from the immutable archive, explicitly omitting **38 entries**: the unsupported extension objects/namespaces and hosted event triggers. The difference from 36 errors reflects omitted objects that did not themselves cause an error, and exclusion of entire event triggers rather than their failed owner statement alone.
- `pg_restore --exit-on-error --single-transaction --use-list ...` completed with **exit 0 and no restore errors**. Ownership and privileges were retained for the selected objects. This is a portable application-data recovery profile, NOT a full Supabase restore and NOT a recipe to overlay a managed Supabase project.
- **110 COPY tables**, including **61 public application tables**, matched archive column lists, row counts, and SHA-256 hashes of sorted COPY rows. Timestamp output was explicitly UTC to match the source snapshot; the first comparison correctly stopped on local-timezone formatting differences before the comparison was corrected.
- Includes products (34), categories (4), orders (6), product translations (63), settings (81), admin roles (4), staff (1), role permissions (27), Auth users (8), learning records, and Storage metadata. All included COPY tables were checked, not only this sample.
- The original backup SHA-256 remained `256adfcfcfa6e63ea46a574c016effbbc2f945b0fbef31cd66f593b692d47c91`.
- The reviewed SEO migration passed under a **NOSUPERUSER** role with inherited ownership permissions and BYPASSRLS. Deliberately broad Supabase-like default grants were applied before migration; all **34 postflight assertions passed**. This approximates relevant privileges, not the complete managed platform.
- New product creation, product updates, real `fallbackSeo` deterministic generation, and service-role draft/save/approve passed. Behavioral writes were rolled back. No provider request was sent.
- A second synthetic-only package produced two SEO documents. **Ten real session/permission-code checks passed**: anonymous, owner, viewer read/write separation, editor create/update, category isolation, unknown staff, tampered session, and suspended staff. REST transport was replaced with a SQL adapter. These are local component integration checks, **not hosted HTTP/login/middleware/PostgREST tests**.

Protected evidence is in `C:\Users\Ziko\Backups\LECOMAX\application-recovery-1792346248261`: `result.json`, `application.list`, `omitted-objects.json`, `row-content-comparison.json`, and restore logs. Sensitive SQL exports stay there. Synthetic package results are in `artifacts/seo-staging/local-validation.json`.

## Reproducible local application recovery

Prerequisites: existing protected test cluster from the verified restore, PostgreSQL 18.6 tools, current local TLS certificate/key, SCRAM password file, and the roles created during the original local bootstrap. The self-signed local certificate was created for seven days; renew it locally when expired and keep hostname verification enabled. No production credential or `.env` file is used.

From the repository root, in the authorized Windows account:

```powershell
node artifacts/restore-test.cjs start
node scripts/verify-application-recovery.cjs
node artifacts/restore-test.cjs stop
```

Stop the cluster even if the middle command fails. Never use `configure-start`, `setup`, or a production connection string to repeat this existing-cluster procedure. The runner always creates a new uniquely named database, verifies loopback/data-directory identity and the backup checksum, uses verify-full TLS, and refuses an existing target database. It has no remote-target argument. The optional numeric rehearsal ID resumes diagnostics for an existing isolated run; use it only after inspecting that run's protected logs, because migration/role creation is intentionally not idempotent.

The selection is derived from the original archive rather than editing it. Unexpected restore errors roll back the selected restore. The allowlist keeps Auth/Storage/Realtime schemas as offline data dependencies; it does not start those services. Do not upload this data-bearing local profile to a hosted test project. Do not enable excluded jobs, network functions, or production credentials during a rehearsal.

## Prepare a Supabase Free Plan staging project

There is no existing staging project, Supabase CLI, or Docker runtime available in this session. The user confirmed no hosted staging project exists. A real Supabase project is needed for the remaining hosted-service tests. It is not needed to recover the verified application rows.

1. Open the [Supabase dashboard](https://supabase.com/dashboard). Create **lecomax-seo-staging** in a **Free Plan organization**. Do not place it in a paid production organization if the intention is a free project. Use a new strong database password saved in your password manager. Choose a suitable region without changing production.
2. Verify the new project reference differs from production. Free accounts currently have a limit of two active Free projects, with a 500 MB database allowance per project. If the quota is occupied, stop rather than pausing/deleting production or upgrading a plan. Low-activity Free projects may be paused after seven days. See [billing limits](https://supabase.com/docs/guides/platform/billing-on-supabase), [quota FAQ](https://supabase.com/docs/guides/platform/billing-faq), and [pausing](https://supabase.com/docs/guides/platform/free-project-pausing).
3. Save staging-only configuration under the existing protected backup directory, not in chat or Git. Required names: `STAGING_PROJECT_REF`, `STAGING_SUPABASE_URL`, `STAGING_DATABASE_URL`, `STAGING_ANON_KEY`, `STAGING_SERVICE_ROLE_KEY`, `STAGING_ADMIN_EMAIL`, `STAGING_ADMIN_SESSION_SECRET`, and `STAGING_CA_FILE`. Obtain the session-pooler connection and CA from the new project's Connect/Database settings. Use port 5432 and `sslmode=verify-full`; do not use the transaction pooler or disable certificate checks. See [Supabase TLS instructions](https://supabase.com/docs/guides/database/psql).
4. Provide only the new project reference and local configuration-file path to continue. Before any staging SQL write, compare both SQL and API project identity against that explicit reference and confirm it differs from production. The acknowledgement below is an additional accident guard, not proof of project identity.
5. The prepared `artifacts/seo-staging/synthetic-baseline.sql` contains five source-compatible table schemas, constraints, policies and grants plus **synthetic fixtures only**. It requires an empty application schema, pgcrypto in `extensions`, and hosted Auth helpers. It aborts if products/categories already exist. After target identity verification, set `lecomax.staging_only='synthetic-seo-test'` in that session and execute the entire baseline transaction. No production customers, orders, tokens, sessions, staff emails, Vault secrets, jobs, Storage records or API credentials belong in this project.
6. Run the reviewed SEO preflight, the single SEO migration (hash recorded in the earlier report), and postflight **on staging only**. Do not use a blanket migration push. The fixture has one product and one category: expected backfill is **2**, not 38. Verify all returned assertions and absence of drafts/events initially.
7. Run the application locally from a separate checkout/copy containing **no production .env files or cached production build**. Supply only staging URL/keys, a new signing secret and a test owner identity. Keep payment, email, WhatsApp, push, scheduled callbacks and AI-provider credentials absent. Do not start the existing production-configured workspace against staging or deploy a website. Configure test authentication deliberately; do not send invitations to production staff.

Regenerate/validate the synthetic package locally when needed:

```powershell
node scripts/prepare-seo-staging.cjs
node artifacts/restore-test.cjs start
node scripts/verify-seo-staging-package.cjs
node artifacts/restore-test.cjs stop
```

The package is a scoped SEO/admin test baseline, not the complete storefront or login-support schema. Before a full login flow, identify and provision any additional route dependencies with synthetic data; never work around a failure by importing live sessions or production signing secrets. Existing production table grants/policies are reproduced for compatibility, not endorsed as a complete security audit.

## Hosted staging acceptance matrix — not yet executed

| Flow | Required result |
| --- | --- |
| Signed-in owner creates a product through the application API | Product persists; SEO trigger creates matching document |
| Editor updates product name/description | Source and fallback update; stale drafts cannot approve silently |
| Generate with AI disabled | Real API stores deterministic draft; nothing published automatically |
| Approve, then reset | Published metadata changes correctly; audit events retained; storefront and sitemap caches refresh |
| Anonymous / invalid / expired session | Unauthorized requests fail before reads, generation or mutation |
| View-only staff | Read allowed; product creation/edit/generation/approval denied |
| Product editor | Product actions allowed; category SEO edits denied |
| Suspended staff or revoked permission | Next request loses access, including with an existing signed session |
| Cross-origin mutation | Rejected; same-origin authenticated mutation succeeds |
| Direct anon/authenticated REST access to SEO tables/RPC | Denied by database grants/RLS |
| Service-role REST read and RPC | Work through genuine PostgREST, with schema cache refreshed |
| Wrong project / TLS identity | Runner stops before mutation |

Use staging-only test accounts; record HTTP status, database state, and negative tests. AI-provider integration remains optional and untested; deterministic generation works without it. Synthetic `.invalid` staff emails in the package are fixtures, not deliverable login addresses.

## Remaining risks and production gate

The portable restore proves recoverability of included database data, not complete business continuity. Storage binaries, Vault decryption keys, external secrets, actual Auth login, platform roles/memberships, hosted event-trigger ownership, scheduled learning automation and external services remain outside this certification. PostgreSQL 18 local tests do not prove identical behavior on the production PostgreSQL 17.6 platform; inspect the new staging server version and record the difference.

**Production migration: NO-GO today.** Missing managed extensions are not a direct SEO SQL blocker, and no application row loss was found. The remaining gate is actual hosted staging/API/authentication validation, plus a fresh separately authorized production read-only preflight near rollout. Production migration and deployment each still require explicit approval. Do not treat this report or a staging pass as that approval.
