# Staging connection verification — 19 October 2026

**Connection checks PASS. Gate A remains incomplete / NO-GO for restore pending platform isolation evidence and separate execution approval.** Verification ran from 2026-10-19T10:59:13.642Z to 2026-10-19T10:59:15.187Z. No production connection, dump, restore, migration, deployment, worker/cron activation, publication or paid API request occurred.

## Verified configuration and access

- User-designated staging reference `tyltharlnbxrxibuxyye` differs from production reference `yddqwgdgeljkzfsmtein`.
- The protected environment file at `C:/Users/Ziko/Backups/LECOMAX/staging-connection-20261019T105639966Z/seo-staging.env` contains matching staging-only configuration. The session-pooler username matches the designated staging reference; port is 5432. No credential-bearing URL, password or token was printed or copied into repository artifacts.
- Directory ACL inheritance is disabled. The directory, environment file and certificate have no Allow entries beyond the current Windows user, SYSTEM and Administrators. Files inherit the restricted directory permissions. None of the three inspected objects is a reparse point. Credentials remain plaintext protected by filesystem permissions, not encrypted storage.
- Node PostgreSQL connected using the supplied CA with `rejectUnauthorized:true` and hostname verification, with no connection-string override of TLS settings. TLS authorization succeeded; protocol TLSv1.3.
- Database `postgres`, role `postgres`, PostgreSQL **17.11**. An explicit read-only transaction reported `transaction_read_only=on`. Only catalog reads and aggregate counts were executed; transaction rolled back.
- The hostname/session username plus authenticated connection identify the intended target. The project name `lecomax-seo-staging` and region `eu-west-1` remain user-supplied: management-plane access has not independently confirmed those fields.

## Database isolation observations

| Check | Result |
| --- | --- |
| Public application tables | 0 |
| Public functions / noninternal public triggers | 0 / 0 |
| Logical replication subscriptions | 0 |
| Foreign servers | 0 |
| Vault secret rows | 0 |
| Cron job table / HTTP queue | Absent; corresponding extensions are not installed |
| `anon` / `authenticated` public CREATE | Denied |
| Connected migration role | `postgres`, not superuser; CREATE ROLE, CREATE DATABASE, BYPASSRLS and public CREATE present |

These findings support a clean application-schema target. They do not establish that every managed schema is empty or that the hosted project has no external clients. No table row contents, function bodies, cron commands, subscription connection strings or Vault values were read into reports.

## Compatibility

Installed: `plpgsql` 1.0, `pg_stat_statements` 1.11, `pgcrypto` 1.3, `uuid-ossp` 1.1, `supabase_vault` 0.3.1.

Available but not installed: `pg_cron` 1.6.4, `pg_net` 0.20.4, `pg_graphql` 1.6.2. No extensions were enabled. Absence of cron/network extensions helps current inactivity but is not a completed restore compatibility test. A restore that creates those extensions or imports jobs can change that safety state.

The previous production audit reported PostgreSQL 17.6; this staging server is the same major version with a newer minor version. Production version and exact installed extension versions must be checked freshly before backup. Managed roles, extension ownership, Auth/Storage objects, Vault encryption keys and managed event triggers need a compatible restore strategy. The staging `postgres` role is not a superuser, so a blanket restoration of every archived owner/role cannot be assumed to succeed.

## Remaining isolation blockers

Both connected Supabase accounts were listed read-only again. Neither exposes `tyltharlnbxrxibuxyye`. No access to an unrelated project was substituted.

The owning account must be connected, or equivalent authenticated administrative inspection made available, to verify:

- Auth custom SMTP, Auth hooks, callback/redirect configuration and email-provider connections.
- Edge Functions, function secrets, database webhooks and platform integrations.
- External workers, schedulers, Vercel/other clients, payment credentials and production callback destinations.
- Appropriate restrictions on access to restored customer data and outbound integrations.

Database inbound network restrictions alone do not establish outbound isolation. Separate project IDs do not prove that production emails/payments/webhooks cannot be triggered. Complete isolation therefore remains **unconfirmed**.

## Next safe backup/restore sequence — prepared, not executed

1. Obtain owning-account visibility and verify platform/external isolation. Keep staging unconnected to production services. Do not perform email/payment/webhook test calls.
2. Prepare an explicit restore manifest addressing production cron records, network queues, webhook triggers, replication, service secrets and Vault. Prevent them from becoming runnable during import. If safe recovery requires quarantining/excluding them, record that limitation rather than claiming a complete restore. Do not enable schedulers as a compatibility shortcut.
3. Revalidate production reference against live deployment/configuration and a verified TLS read-only session. Check protected backup destination ACLs and source/client compatibility; no production writes.
4. With execution authorization, create a uniquely named archive outside Git; record checksum, bytes, archive listing and complete decompression/traversal. Capture snapshot-consistent comparison evidence, including tables/counts, schema/functions/RLS/grants/ownership and required extensions. Preserve prior backups.
5. Recheck staging identity and isolation immediately before any authorized restore. Use a reviewed Supabase-compatible procedure; stop on errors. Do not apply SEO migrations. Compare recovered objects and counts against the backup snapshot, not a later moving production state. Account explicitly for platform-managed failures and intentional exclusions.
6. Deliver Gate A PASS/FAIL with evidence and recovery limits. Gate B is a separate decision and must not start automatically.

The latest user instruction restricts this step to read-only checks and preparation. **No additional approval is needed for remaining read-only inspection once access is available.** After isolation is verified and the concrete restore manifest is reviewable, the next execution approval should be:

> Authorize a fresh read-only production backup into protected storage and restoration only of the reviewed manifest into staging `tyltharlnbxrxibuxyye`, with no active cron, outbound integrations, production writes, SEO migrations, deployments or AI calls.

Do not request or execute this restore approval while isolation is unresolved. Gate B remains explicitly unauthorized.

## Evidence, validation and Changes Made

- Added `scripts/verify-seo-staging-readonly.cjs`: fixed designated target, protected-file loading without production dotenv loading, TLS verification, explicit read-only transaction, metadata/count-only output and sanitized error codes. JavaScript syntax check passed; live staging execution exited 0.
- Added `artifacts/seo-quality/staging-readonly-1792407555187.json`: sanitized actual connection and catalog results.
- Added this report, `docs/seo-staging-readonly-verification-20261019.md`.
- Appended linked Change History report `seo-staging-readonly-verified-20261019` through the required CLI; no existing history was rewritten. No preview claimed.
- No runtime application or SQL migration code changed. Existing work and backups preserved.
