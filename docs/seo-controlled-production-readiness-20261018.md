# Controlled production SEO rollout: readiness and approval boundaries

**Prepared only. No production migration, test mutation, settings change, restoration or website deployment was executed.** This report supersedes the rollout recommendation in earlier reports without changing their historical evidence. The owner has chosen to defer a separate hosted staging project.

**Assessment: conditional GO for the reviewed database migration only after explicit approval of the controlled plan and residual integration risk. HOLD for Next.js deployment until a specific release artifact, hosted environment and rollback target are verified.** Hosted tests are not silently waived or reported as passed; they become explicit post-migration gates. A separate staging project is not imposed as a prerequisite to the owner's chosen path.

## Fresh evidence

Inspection finished **2026-10-18T18:16:58.169Z (20:16:58 Europe/Paris)**. Evidence: `artifacts/seo-migration/production-readiness-1792347399527.json`.

- Latest `lecomax-production-2026-10-18T17-42-58-995Z.dump`: **1,685,487 bytes**, **1,233 archive entries**, created at 17:42:58.996 UTC. SHA-256 still matches **256adfcfcfa6e63ea46a574c016effbbc2f945b0fbef31cd66f593b692d47c91**. The backup was not changed.
- Verified TLS to the configured official project, PostgreSQL **17.6**, role/database `postgres`, not a replica; explicit read-only transactions. The session pooler's backend hop remains outside end-to-end TLS certification as previously documented.
- Fresh schema-only pg_dump used an exported read-only repeatable-read snapshot. **All 1,114 named schema blocks matched the backup**, including owners, ACLs, default privileges, extensions, functions, indexes, policies and triggers. Dump control tokens/comments were excluded from comparison. This is a point-in-time schema comparison, not certification of role-global attributes, external services, or every current data value.
- Current counts: **34 products, 4 categories, 6 orders, 8 Auth users**. Aggregate content fingerprints were saved for later comparison; matching counts alone do not prove unchanged row contents since backup.
- Preflight: no SEO objects/policies or existing catalogue triggers; no migration-ledger entry `202610180001`; no missing/empty required catalogue identity fields or duplicate IDs/active slugs. Required types, constraints and ownership remain unchanged. `postgres` owns both catalogue tables with SELECT/TRIGGER privileges. `service_role` has BYPASSRLS. `anon`, `authenticated` and `service_role` cannot CREATE in public.
- Reviewed migration hash unchanged: **958e8727fb9d5f32df6702b00cd17e1e0a2e71b98674f1523ae29e439af3332f**.

Recovery evidence remains valid: 110 selected COPY table contents recovered exactly, portable application restore exit 0, 719 object comparisons, non-superuser migration rehearsal and 34 SQL postflight checks passed. The original full restore had 36 managed-infrastructure errors; it is NOT certified as complete Supabase recovery. The scheduled learning job requires cron/Vault/pg_net; Storage binaries, external credentials and hosted services are outside the logical database recovery guarantee. See `docs/seo-application-recovery-and-staging.md` and the numbered error ledger.

## Migration impact review

The exact file is `supabase/migrations/202610180001_seo_engine.sql`. It creates two SEO tables, their indexes/identity sequence, four functions and two catalogue triggers, then backfills SEO records. It does not write products/categories/orders/Auth records, alter existing policies or alter global default grants. No SEO foreign keys or cascading deletion paths are added.

Both triggers run AFTER INSERT/UPDATE/DELETE, once per catalogue row, in the caller's transaction. They still execute on stock/price-only updates; unchanged SEO facts avoid an SEO UPDATE, but there is lookup/conflict-lock overhead. Any error in synchronization rejects the corresponding catalogue write. Checkout/order paths that update products or stock can therefore be affected indirectly even though no order trigger is added. Concurrent catalogue edits can contend on the same SEO document. CREATE TRIGGER takes a lock conflicting with writers; locks are held until the enclosing transaction completes. The file bounds lock waits to 5 seconds and individual statements to 60 seconds, not the entire transaction. See [PostgreSQL locking](https://www.postgresql.org/docs/17/explicit-locking.html).

Deletes archive SEO by marking it inactive; drafts, approvals and audit events remain. Source changes update fallback/version while retaining published content; approving a draft made from an older source fails. Save RPC row locking and expected-version checks prevent silent concurrent overwrites. Existing approved content may intentionally remain until a new review.

RLS is enabled on both new tables with no policies. Browser roles have no table, sequence or function privileges. `service_role` receives SELECT and only the save RPC's EXECUTE, not direct table writes or sequence access. Revocations override broad Supabase defaults. Three functions use SECURITY DEFINER with `search_path=public`; `seo_fallback` is invoker SQL. The public-schema CREATE denial protects that trusted schema. The privileged service credential and function owner remain trust boundaries; the RPC accepts the actor supplied by the server, not an independently authenticated database identity.

The application checks same-origin/session/rate limits, then product/category permissions; permissions are reread per request. Owner authorization depends on the configured ADMIN_EMAIL. Server-side storefront reads require the service credential because anonymous SEO access is denied. Missing service credentials must not be 'fixed' by granting anonymous SEO access. No AI-provider configuration is required for deterministic generation.

## Production migration execution plan — requires approval

1. Confirm approval refers to the exact file/hash above, the official project, a named operator and the agreed catalogue-edit window. Explicitly acknowledge that hosted HTTP/auth/cache tests have not run and will be gated after installation. Define an acceptable recovery point; the current backup is historical and cannot recover writes made after it. Refresh the backup immediately before the window if it is no longer acceptable, retaining the earlier archive and verifying the new one.
2. Recheck project identity and TLS, original migration hash, a fresh read-only preflight and `supabase/verification/seo-rollout-integrity.sql`. Capture counts/fingerprints immediately before execution. Inspect long transactions/lock waits; agree a quiet catalogue-edit interval. Do not toggle maintenance settings, terminate other sessions or block customers without separate authorization. Ordinary order traffic may continue, but then before/after differences must be reconciled with legitimate writes rather than assumed corruption.
3. STOP if schema differs unexpectedly, any SEO collision/ledger entry exists, catalogue checks fail, credentials/project identity are ambiguous, backup integrity fails, recovery-point acceptance is absent, or conflicting/long transactions make the window unsafe. No forced drops, blanket db push, retries in a loop, or disabling checks.
4. Execute the **entire original migration exactly once**, BEGIN through COMMIT, as the verified owner via the supported session connection with `sslmode=verify-full` and the trusted CA. With connection parameters loaded securely into process-local PG variables (never the command line), the prepared operation is:

   `psql -X --no-password --set=ON_ERROR_STOP=1 --file=supabase/migrations/202610180001_seo_engine.sql`

   This command is documentation, not an executed action. Do not substitute the general migration runner. Keep credentials and raw server errors out of chat/logs shared outside the protected directory.
5. On any error before confirmed commit, stop and ROLLBACK if the connection is still in an aborted transaction. On a lost connection/unknown commit outcome, reconnect read-only, inspect object state and postflight; **never blindly retry**. The migration is intentionally non-idempotent.
6. Run all SQL postflight checks immediately; require every `passed=true`. With an unchanged catalogue, expect 38 SEO documents and zero initial drafts, publications and audit events. Compare integrity baselines and investigate every unexplained difference. Confirm default privileges on unrelated objects and existing policies were not changed. Reconcile ledger bookkeeping using the chosen migration process only after success; a SQL Editor/psql execution does not automatically add a Supabase ledger row. Any ledger write is separately included in the approval scope or remains unperformed.
7. Hold deployment until database acceptance is recorded. Database triggers become active at commit regardless of website deployment. If current deployed code already uses SEO storage, behavior may begin at commit; do not assume the new schema is dormant until deployment.

## Prepared acceptance checks and their timing

| Check | How / expected result | When / approval |
| --- | --- | --- |
| Schema/grants/RLS | `node scripts/audit-seo-migration.mjs --postflight`; all 34 assertions pass | Read-only after migration |
| Product/order/Auth integrity | Run `seo-rollout-integrity.sql` before/after; compare counts/fingerprints using UTC; reconcile concurrent writes | Read-only before/after |
| Real service-role/PostgREST | SELECT new tables, confirm RPC discovery without calling mutation; no 503/schema-cache errors | Read-only after migration |
| Anonymous access | Direct REST SELECT to SEO tables rejected; never use a write RPC as a read-only probe | After migration |
| Admin reads | Owner and authorized staff see expected records; view-only/category restrictions hold | Existing authorized sessions; no credentials in reports |
| Authentication boundaries | Missing/invalid/expired session, suspended staff and cross-origin behavior | Existing sessions where possible; creating/suspending accounts or sending mutation probes needs approval |
| Trigger behavior in official project | A bounded inactive synthetic product/category create/update/delete sequence; confirm SEO archival and no unrelated effects | Separate production-canary write approval; no live product/order edits |
| Draft and persistence | Deterministic generation -> save -> new request/process reads same draft/version/event; stale version rejects; no automatic publication | Separate canary-write approval, after migration and usable application code |
| Publish/reset/cache | Approve only the approved inactive canary, inspect metadata/cache invalidation, reset and verify retained history | Separate approval; never silently publish an existing product |
| User-interface integration | Reload admin, navigate away/back, verify stored content and access; storefront/sitemap smoke tests | After compatible app release, or existing deployed compatible code if independently confirmed |

Tests on real SQL roles, PostgREST grants/schema cache, production trigger effects, persisted application mutations and real cache invalidation **cannot be claimed complete before the actual migration**. Local mocks/SQL adapters are not substitutes. Negative mutation tests are still production requests and are not executed under the present read-only authorization. Prefer `useAI=false` for any eventual canary; external AI calls need deliberate configuration/approval.

## Stopping and recovery instructions

- **Lock timeout, SQL error, privilege failure, or hash mismatch:** stop; no retry until cause is reviewed. A failed transaction is rolled back, not partially patched.
- **After commit, SQL postflight failure, new catalogue/checkout errors, unexpected permission exposure, unexplained integrity difference or persistent SEO 503:** stop rollout and withhold deployment/activation. Preserve logs and current data. Do not erase drafts or history to make checks pass.
- **Trigger-related write failure:** use the separately approved `supabase/rollback/20261018_seo_engine_disable_bounded.sql`. It sets 5-second lock/60-second statement timeouts, disables the two triggers and revokes service-role save-RPC execution. This retains tables, content, audit history and original business data. It is not currently authorized or executed. Prioritize reducing catalogue failures; do not wait for a frontend rollback first if that prolongs affected writes.
- **After disabling:** verify both triggers disabled and RPC denied. Reads may continue to expose previously approved SEO; disabling writes is not unpublishing. Roll back application code if needed. Catalogue edits made while disabled require reviewed reconciliation before re-enabling; re-enable/backfill is another write operation requiring approval.
- **Application regression:** restore the recorded previous deployment. Database objects/triggers are not rolled back by a website rollback. Do not assume environment changes are undone either; see separate deployment plan.
- **Full restore:** not the routine SEO rollback. It can lose newer orders, customers and Auth changes and has managed-platform dependencies. Any disaster recovery needs separate explicit approval, a chosen recovery point, preservation of newer data, an isolated recovery rehearsal and a service/downtime plan. Never restore production just to test the backup.

## Separate Next.js release preparation

The local Vercel link names `lecomax`. Its hosted Production environment, currently active deployment and rollback candidate were **not verified** in this session. There are **611 worktree change entries** at review time. `artifacts/seo-migration/production-review-source-manifest.json` records the review HEAD and hashes of key files, **not a complete deployable release**. Do not deploy this entire dirty tree without a scoped review.

An earlier local production build passed at 17:02 UTC; it is historical evidence, not a fresh certification of the eventual release. Prepare an isolated reviewed commit/artifact, lockfile and exact Node/Next versions; run focused SEO/admin regressions and a clean production build for that artifact. The build helper permits placeholder credentials when variables are missing, so build success alone is not an environment check. Verify real production variable presence and target identity separately without displaying values.

| Variable | Requirement / current local evidence |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Official project, public build-time target; locally present |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Matching public client key; locally present |
| SUPABASE_SERVICE_ROLE_KEY | Matching project, server-only; locally present; essential to SEO reads/RPC |
| ADMIN_EMAIL | Correct owner identity; locally present |
| ADMIN_SESSION_SECRET | Optional dedicated secret; locally absent, current code falls back to service key; introducing/rotating it can invalidate existing sessions |
| SEO_AI_BASE_URL / SEO_AI_API_KEY / SEO_AI_MODEL | Optional; all locally absent; leave AI disabled for initial rollout unless explicitly chosen |
| OWNER_DATABASE_URL / CA | Operator-only SQL tooling; not required in the deployed Next.js runtime |
| Existing non-SEO production variables | Preserve them; this release does not authorize payment/email/push or authentication configuration changes |

Local presence does not prove hosted configuration. Public values are bound into a build; do not promote a build bound to a placeholder or different project. Capture the actual active deployment ID, known-good previous deployment ID, candidate commit/artifact, build logs and relevant environment-version metadata before asking for deployment approval. Choose a previous deployment actually compatible with the database state.

Deployment approval is distinct from migration approval. On Vercel, production environment updates apply to a subsequent deployment; rollback routes to a previous build and does not undo database operations. Verify the target's expected environment and session-signing behavior rather than assuming project-setting edits are reversed. See [environment variables](https://vercel.com/docs/environment-variables) and [Instant Rollback](https://vercel.com/docs/instant-rollback).

Prepared rollback operation after selecting a verified target: `vercel rollback <VERIFIED_PREVIOUS_PRODUCTION_DEPLOYMENT_URL>`. No URL/ID is invented, and this command was not run. Neither `vercel --prod`, Git pushes that trigger production, deployment promotion, nor environment updates were performed.

## Exact actions needing explicit approval

1. Apply only migration `202610180001_seo_engine.sql` with the recorded SHA-256 to the verified official project, accepting the deferred hosted checks and agreed recovery point/window. Any migration-ledger update must be named in that scope.
2. Execute named production canary mutations: inactive test catalogue objects and bounded SEO draft/approve/reset tests, including a defined cleanup/archive policy. Approval of migration alone does not authorize live product edits, test orders, staff changes or customer messages.
3. Change any production environment/settings, rotate signing credentials, reload PostgREST configuration/cache manually, or impose maintenance/writer restrictions if necessary.
4. Deploy/promote the separately reviewed Next.js artifact to the official website after database acceptance and release/rollback identification.
5. If needed, execute the bounded trigger/RPC disable script, application rollback, later synchronization/re-enable, or any disaster restoration. These may be pre-authorized as a narrowly defined contingency; no such authorization is inferred here.

Read-only rechecks remain within this task's scope. Current readiness is a point-in-time review, not permission to perform any of the actions above.

## Validation of the newly prepared operational checks

`seo-rollout-integrity.sql` was executed successfully in a read-only production transaction with verified TLS. At that check there were zero transactions over 60 seconds and zero sessions waiting on locks; this must be rechecked at execution time. The bounded disable script was tested at **2026-10-18T18:20:09.253Z** only in the existing isolated local database: both triggers became disabled and service-role RPC execution was revoked inside the test transaction. ROLLBACK restored the original trigger/grant state exactly. The isolated cluster was then stopped. No production recovery action was tested or performed. The new readiness runner passed `node --check` and completed its read-only live inspection.
