# SEO Engine isolated restore verification — 18 October 2026

**GO for further staging validation. NO-GO for production deployment or a claim of full Supabase disaster recovery.** No production connection, production mutation, migration, restoration, or website deployment was performed during this test.

## Backup and isolation

- Backup: `C:\Users\Ziko\Backups\LECOMAX\lecomax-production-2026-10-18T17-42-58-995Z.dump`.
- Size: 1,685,487 bytes; 1,233 archive entries.
- SHA-256 recomputed before restoration and matched the original report: `256adfcfcfa6e63ea46a574c016effbbc2f945b0fbef31cd66f593b692d47c91`.
- Source PostgreSQL 17.6; local server and pg_restore 18.6.
- A separate cluster was initialized under the protected backup directory at `restore-test-20261018`, bound only to `127.0.0.1:55439`. Database: `lecomax_restore_test_20261018`.
- SCRAM password authentication, TLS required by pg_hba, locally generated certificate trusted explicitly, hostname verification enabled. Every SQL phase checked database name, loopback address, and the exact data directory. No application environment file was loaded.
- Initial initialization failed because the Windows process environment was stripped. Retrying with the Windows runtime environment succeeded. A startup-wrapper pipe hang and IPv4 `/32` identity-format mismatch were corrected before restoration. These did not affect production or the backup.

## Actual restore results

The unfiltered archive was restored locally. **pg_restore exited 1 with 36 errors. This was a partial Supabase restore, not full success.** Protected logs retain the complete diagnostics.

All 110 ordinary COPY table-data entries matched counts computed directly from the archive's COPY records, including **34 products and 4 categories**. These comparisons use the actual backup snapshot, not a later production query. The local inventory contains 111 tables; the archive has 113 COPY entries, three of which belong to missing managed extensions.

| Compared archive objects | Matched |
| --- | ---: |
| Explicit schemas | 10 / 10 |
| Table definitions | 111 / 111 |
| Explicit function definitions | 79 / 79 |
| Table triggers | 9 / 9 |
| RLS policies | 44 / 44 |
| Row-security enablement entries | 86 / 86 |
| Indexes | 172 / 172 |
| Constraints | 153 / 153 |
| Foreign keys | 55 / 55 |

Definitions were compared with a fresh schema dump using the same PostgreSQL 18 client. Seven policy role lists changed from `authenticated, anon` to `anon, authenticated`; only this order difference was normalized. All 719 compared objects matched. These totals exclude extension-supplied objects and event-trigger ownership. The local function inventory additionally includes installed extension functions.

## Supabase compatibility gaps

- Windows PostgreSQL lacks `pg_cron`, `pg_net`, and `supabase_vault` in this installation. Their dependent schemas, ACLs, sequences, and functions cannot be fully restored here.
- Unrestored COPY entries: `cron.job` (1 row), `cron.job_run_details` (17,471 rows), and `vault.secrets` (1 row). Vault decryption functions and `vault.decrypted_secrets` are also unavailable. Secret values were not printed or copied into repository reports.
- Six event triggers were created but their ownership could not be reassigned to the locally recreated, non-superuser `supabase_admin`: `issue_graphql_placeholder`, `issue_pg_cron_access`, `issue_pg_graphql_access`, `issue_pg_net_access`, `pgrst_ddl_watch`, and `pgrst_drop_watch`. They retain local restore-user ownership.
- Database dumps do not include cluster-wide roles. Referenced roles were recreated locally as NOLOGIN roles; `service_role` was given BYPASSRLS for the test. Exact hosted role attributes/memberships are not certified by this backup.
- The local migration owner is a PostgreSQL superuser; hosted Supabase privilege behavior and platform services require separate validation. Auth, Storage, Realtime, PostgREST, jobs, and network integrations were not exercised.
- External Storage file contents, platform secrets, and hosted configuration are not recovered by this database archive.

## SEO migration test

Only the reviewed file `supabase/migrations/202610180001_seo_engine.sql` was applied to the isolated database. Its SHA-256 matched `958e8727fb9d5f32df6702b00cd17e1e0a2e71b98674f1523ae29e439af3332f`.

Results recorded at **2026-10-18T17:51:10.905Z**:

- Existing preflight SQL ran successfully after restore verification.
- All **34 postflight assertions passed**, including grants, RLS, function security, indexes, triggers, and backfill coverage.
- Backfill produced 34 product and 4 category SEO documents, with zero initial audit events.
- Counts and ordered row-content hashes across all **111 original tables** were unchanged by the migration and after behavioral tests.
- Product and category updates triggered matching SEO source updates.
- `anon` and `authenticated` were denied access to SEO tables.
- `service_role` could draft, approve, and reset SEO content through the RPC.
- Behavioral test transactions were rolled back. Sequence values can advance despite rollback; this does not affect the immutable backup or original table-content checks.

## Remaining gates

Before production rollout, validate recovery in a compatible isolated Supabase environment with matching extensions, roles, ownership, and platform services. Resolve all restore errors or explicitly verify the platform-managed equivalents. Test authenticated application flows, PostgREST permissions/schema cache, and storefront integration there. Re-run production read-only preflight near any separately authorized rollout; this backup and test are point-in-time evidence.

Raw SQL exports, restored data, local TLS material, credentials, inventories, comparison results, and logs remain inside the restricted backup directory, outside Git. They contain sensitive data and are protected by Windows permissions, not artifact-level encryption. The temporary cluster is retained for review and stopped after testing. No production authorization is implied by this report.

Operational harness: `artifacts/restore-test.cjs`. Protected evidence: `restore-status.json`, `snapshot-count-comparison.json`, `object-comparison.json`, `inventory-before-seo.json`, `inventory-after-seo.json`, and `seo-test-results.json` inside `C:\Users\Ziko\Backups\LECOMAX\restore-test-20261018`.
