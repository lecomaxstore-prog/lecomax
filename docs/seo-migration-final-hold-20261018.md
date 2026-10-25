# Final migration gate — HOLD

Checked 18 October 2026, approximately 18:47 UTC (20:47 Paris). **NO-GO for the current trigger-enabled production migration when protecting uninterrupted stock/checkout operations is the priority.** No execution approval was granted or inferred. No production migration, deployment or data change occurred.

## Checks completed

- Latest backup: `lecomax-production-2026-10-18T18-37-25-364Z.dump`, approximately ten minutes old at this report. Fresh checksum matches `8bedc61407d22acc8cac307f964c3671b856ead785489fffce492b5b23b3d0df`; 1,233 entries and full archive-read verification already passed. The latest schema comparison matches all 1,114 blocks. This exact snapshot has not been restored; the previously restored backup remains preserved. Refresh if age exceeds 15 minutes before any later approved execution.
- Exact target reverified at 18:46:54 UTC: project `yddqwgdgeljkzfsmtein`, `aws-0-eu-west-1.pooler.supabase.com:5432`, project-qualified connection user, database/SQL role `postgres`, PostgreSQL 17.6, not a replica, TLS certificate verified, explicit read-only transaction. Zero transactions over 60 seconds and zero lock waiters at that instant. Evidence: `artifacts/seo-migration/final-identity-1792349214919.json`.
- Fresh preflight: no SEO objects/catalogue triggers or migration-ledger entry; 34 products, 4 categories; integrity checks clean. Evidence: `production-readiness-1792349126921.json`.
- Exact original migration SHA-256: `958e8727fb9d5f32df6702b00cd17e1e0a2e71b98674f1523ae29e439af3332f`.
- The prepared psql wrapper includes only that SQL file. It does not invoke a workspace migration runner, deploy source, or include unrelated modifications. Original SQL remains unchanged.

## Exact proposed scope

Two new SEO tables, their primary-key/secondary indexes and identity sequence, four functions, table/function/sequence grants and RLS on the new tables, two AFTER row triggers on existing products/categories, and initial SEO-only backfill for 38 catalogue records. No direct business-row rewrite, stock-function change, unrelated migration, ledger write, environment change or website deployment is included. The added triggers still change the behavior of subsequent business writes.

## Transaction and recovery verification

The original file has its own BEGIN/COMMIT and no transaction-prohibited operations. A new isolated PGlite/PostgreSQL 18.3 rehearsal executed the exact original SQL with 34 synthetic products and four categories under the proposed 120-second transaction/15-second idle session settings and existing 60-second statement/5-second lock limits. It committed in **22 ms**, with 38 backfilled documents. This is local timing, not a promise of production completion. The prior real-host READ ONLY test proved transaction-timeout enforcement on PostgreSQL 17.6. On production timeout, stop and inspect outcome; never retry blindly.

The added failure/recovery test deliberately made SEO synchronization fail. **A stock decrement failed and its stock value remained unchanged.** After executing the exact bounded recovery SQL, stock decrement and an unrelated synthetic business-audit trigger worked, both SEO triggers were disabled and the SEO save RPC was denied. Evidence: `artifacts/seo-migration/transaction-recovery-1792349183349.json`. The initial test-helper function replacement omitted required parameter names; correcting only the synthetic helper resolved that test error. No production or migration code was modified.

Existing successful-disable and second-table-lock timeout tests are retained. Recovery targets only the two named SEO triggers and SEO RPC privilege; it does not disable all triggers, checkout functions, inventory functions, payments or authentication. **It intentionally stops automatic SEO synchronization and SEO editing**, allowing stale SEO data until reviewed reconciliation and re-enable. This effect must be explicit in any recovery approval. Real hosted checkout behavior after recovery is not certified by a synthetic test. Recovery may itself fail to obtain locks; no immediate or zero-interruption guarantee is made.

## Risk and safest alternative

The synchronous SEO trigger runs inside product/stock transactions. Failures or SEO-row lock contention can reject/delay inventory reservation and therefore checkout, even before deploying the new website. A quiet migration window and timeouts limit installation exposure but do not remove this ongoing coupling. Frontend rollback does not remove database triggers.

**Safest recommendation: do not activate these synchronous triggers yet.** Prepare a separately reviewed phased design that installs SEO storage/backfill without activating catalogue triggers, then synchronizes outside the critical stock transaction with explicit reconciliation/error monitoring. A storage-only phase still needs lock/privilege review and does not by itself provide ongoing SEO synchronization. This is a proposed alternative, not an implemented or approved replacement. It requires a new explicit SQL scope, hash and validation; never edit/omit statements from the currently approved-for-review hash at execution time.

The current engine and all work are preserved. Await explicit instruction/approval before any production-changing operation. Earlier conditional approval recommendations are superseded by this HOLD recommendation under the stated checkout/inventory risk criterion.
