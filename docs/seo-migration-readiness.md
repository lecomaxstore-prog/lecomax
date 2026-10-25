# Final SEO migration readiness — NO-GO for production execution

Checked 18 October 2026, approximately 17:16 UTC. No production migration,
deployment, backup creation or restore was performed. The SQL migration itself
is unchanged from the reviewed SHA-256 in `seo-migration-runbook.md`.

## Target verified

- Supabase project reference: `yddqwgdgeljkzfsmtein`.
- API host: `yddqwgdgeljkzfsmtein.supabase.co`.
- SQL endpoint: `aws-0-eu-west-1.pooler.supabase.com:5432`, database `postgres`,
  role `postgres`, PostgreSQL 17.6; not a recovery replica.
- Public `https://lecomax.com/` returned 200 and its public assets reference the
  same Supabase project. This corroborates the production target. The dashboard's
  display name/branch label and deployment environment settings were not accessible.
- Client-to-pooler TLS is encrypted and certificate-authorized. `pg_stat_ssl`
  reports no TLS for the pooler-to-database connection; that is a separate hop,
  not the client connection. No network/security configuration was changed.
- Pooler startup read-only options were not honored. Both verification SQL files
  already used explicit read-only transactions; the audit runner's separate ledger
  query now does too. All earlier ledger queries were SELECT-only. The final
  identity transaction confirmed `transaction_read_only=on`.

## Passing checks

Fresh preflight: 34 products, 4 categories, compatible required columns/types,
clean required values and unique active slugs. Required roles/ownership/trigger
permissions exist. No SEO object collisions or version `202610180001` in the
migration ledger. No existing user-defined catalogue triggers were returned.

Migration scope is additive: two tables, indexes/identity sequence, functions,
two catalogue triggers, and backfill into SEO tables only. No INSERT/UPDATE/DELETE
targets products, orders, customers or auth tables. No source columns, existing
RLS policies, global default privileges or auth configuration are altered. There
are no foreign keys/cascades. Products/categories gain AFTER triggers, so this is
not a claim of zero schema or future-write impact.

Intended RLS: enabled on both SEO tables with zero browser policies. Explicit
table/sequence/function revocations deny browser access. `service_role` reads and
calls the save RPC; owner-executed functions perform audited writes. Dependencies
and broad default-grant protection pass isolated PGlite checks. The local fixture
test also checks authentication records remain unchanged during migration.

## Blockers and risks

1. **Recent restorable backup not verified.** No browser session was available,
   no Supabase management token was configured, and workspace filename inspection
   found no database backup artifact. These facts do not prove backups are absent.
   No backup timestamp, successful status, retention window or restore drill can
   currently be attested. Migration source snapshots are NOT database backups.
2. Staging application, real persisted approval workflow and restore rehearsal
   remain unverified. PGlite is not a substitute for staging integration.
3. Trigger creation can briefly block catalogue writes. The migration's five-second
   lock and 60-second statement timeouts can abort it. Once installed, a trigger
   failure can reject a product/category edit in the same transaction.
4. Production environment variable presence still needs deployment-host review.
   Do not broaden permissions to resolve an API schema-cache/configuration issue.

To close the backup gate, the project owner should inspect Database > Backups for
the exact reference above and record backup ID/type, completion time in UTC,
successful state, expiration or PITR recovery interval, and the acceptable recovery
point for recent orders. Confirm schema/data including auth are covered, and verify
restoration in an isolated target. Do not test Restore against production.
Database backups exclude stored file objects; preserve product media separately
if planning full-site recovery. See [Supabase backup scope and recovery](https://supabase.com/docs/guides/platform/backups).

## SQL Editor application steps — prepared, not authorized

1. Close the backup/staging gates, confirm the exact project reference, and obtain
   explicit approval for **this migration**, independently of website deployment.
2. In that project's Supabase Dashboard, open SQL Editor > New query and select
   the primary database and `postgres` role. Verify the project reference in the
   dashboard URL and run `select current_database(), current_user;`.
3. Paste and run all of `supabase/verification/seo-preflight.sql`. Require the
   same compatible schema, clean source data and no SEO object collisions. Confirm
   migration-ledger absence using the read-only audit runner or established tooling.
4. During a quiet catalogue-edit window, open a new query and paste the entire
   `supabase/migrations/202610180001_seo_engine.sql`, including BEGIN through COMMIT.
   Verify SHA-256 `958e8727fb9d5f32df6702b00cd17e1e0a2e71b98674f1523ae29e439af3332f`.
   Run the entire batch exactly once after approval. Do not use blanket db push.
5. Run all of `supabase/verification/seo-postflight.sql`: every `passed` must be
   true. Expect 38 initial SEO documents if the catalogue is unchanged, no initial
   drafts/publications/events, enabled triggers, valid indexes and denied browser
   table/function/sequence privileges. Inspect definitions as well as counts.
6. Confirm authenticated API reads, anonymous denial, staff restrictions and
   storefront fallback. Test mutations/approvals in staging. Allow/reload PostgREST
   schema cache through the approved operational process if needed. Reconcile the
   migration ledger only after success using established migration tooling.
7. Do not deploy the website until separately approved and integration checks pass.

## Failure, rollback and recovery

- **Error before COMMIT:** stop; execute ROLLBACK if the session remains aborted.
  The transaction prevents partial installation. Rerun preflight; never delete
  objects or reset the database to force a retry.
- **Committed migration, operational problem:** preserve all data and audit events.
  Use the reviewed `supabase/rollback/202610180001_seo_engine_disable.sql` only with
  explicit operational approval. It disables both sync triggers and revokes the
  save RPC; it does not undo schema creation or remove content. Roll back application
  behavior as appropriate. If catalogue writes are failing, prioritize disabling
  the new triggers within the approved recovery action. Use a bounded lock timeout
  and inspect lock contention rather than waiting indefinitely.
- **After disabling synchronization:** catalogue changes no longer update SEO.
  Before re-enabling, reconcile source snapshots as owner using the documented
  synchronization function, retain drafts/history, and rerun postflight/staging checks.
- **Full database restore:** last resort, separate explicit approval. First preserve
  evidence and newer orders/customer/auth changes, quiesce affected writers, and
  validate the backup in an isolated target. Agree on downtime and possible loss of
  changes since the recovery point. Never restore production merely to test a backup.

Recommendation: **NO-GO for production migration or deployment** until backup and
staging evidence are available. Migration source and read-only verification tooling
are technically ready; production execution, rollback/restore and deployment are
separately consequential actions requiring the owner's explicit approval.
