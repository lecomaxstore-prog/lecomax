# Gate A staging connection — FAIL / blocked pending credentials

User-designated target: `lecomax-seo-staging`, reference `tyltharlnbxrxibuxyye`, reported region `eu-west-1`. Production expected reference: `yddqwgdgeljkzfsmtein`. The references are different. The staging name, region, ownership and live database identity are user-supplied and have not yet been independently verified.

Fresh inspection found no staging/restore/isolated environment variables. Neither available connected Supabase account lists the designated staging project. The Primary connection returned no projects; Ax returned an unrelated project, which was not used. This does not prove staging does not exist: account access may be missing.

Per the user's explicit stop condition, no connection attempt, production dump or restore was made. No project was provisioned or modified. Existing backup documentation, Gate A report, migration-chain audit and append-only history were reviewed. Historical restore errors are not a new test outcome. No migration SQL was executed or changed.

## Secure setup instructions

1. Open the Supabase dashboard in the account that owns **lecomax-seo-staging**. Verify its project reference is exactly `tyltharlnbxrxibuxyye` and its region is `eu-west-1`. Connect that account to the Supabase connector so platform configuration can be inspected. Do not select the production project.
2. In the staging project's **Connect** panel, obtain the direct PostgreSQL host/user on port **5432**, or use **Session pooler** on port **5432** if direct IPv6 is unavailable. Copy the actual pooler hostname from the dashboard; do not construct it from the region. Do not use transaction pooler port 6543. The password is the staging database password, not an API key.
3. Download the staging database CA certificate using the dashboard's SSL configuration. Save the certificate locally. The helper accepts a PEM CA file, not a private key. Its simple file-content check does not authenticate the certificate; obtain it from the authenticated dashboard. Actual TLS chain and hostname validation will occur before any database work.
4. From a private PowerShell terminal in the repository root, run:

   ```powershell
   & .\scripts\setup-seo-staging-connection.ps1
   ```

   Enter only the host, user and CA path at the visible prompts. Enter the staging password at the hidden prompt. Do not paste a full credential-bearing URL into a shell command, chat or a transcript. The helper percent-encodes the password, accepts only the designated direct host/user or staging session-pooler username, and fixes the port to 5432. It makes no network or database calls.

5. The helper creates a new timestamped directory under `C:/Users/Ziko/Backups/LECOMAX/`, removes inherited access, and grants access only to the current Windows user, SYSTEM and Administrators before writing credentials. It stores `STAGING_PROJECT_REF`, `STAGING_DATABASE_URL` and `STAGING_SSL_ROOT_CERT` in `seo-staging.env` there. This file is plaintext protected by filesystem permissions, not encrypted storage. It is outside Git; do not copy it into the repository, deploy it, or overwrite production environment variables. Previous files are preserved.
6. Reply with **only the generated configuration file path**, and confirm the owning Supabase account is connected if available. Do not send the password, file contents, service-role key or connection URL. The existing Gate A approval remains valid; this is missing configuration, not a request to reapprove Gate A.

The helper has been parsed for PowerShell syntax only. Interactive credential storage, ACL creation, TLS and database connectivity are not yet runtime-verified. If it stops, do not weaken permissions or disable TLS; report the non-secret failure context.

## Isolation requirements before backup

A new project name alone does not establish isolation. Do not connect staging to Vercel, production apps, workers, SMTP, payment providers or production webhooks. Do not copy production integration secrets into staging.

After credentials are available, inspect staging read-only for PostgreSQL version, installed/available extensions, role privileges, existing application data, RLS/grants, triggers, database webhooks, cron schedules, network queues, foreign servers and replication subscriptions. Inspect platform Edge Functions, Auth/SMTP/hooks, integrations and external application connections through the owning account. A database-only credential cannot certify every platform or external-service setting.

The restore plan must prevent imported production cron rows, queued network jobs, webhook triggers or secrets from becoming active. Do not blindly restore a full archive into a running hosted stack. If hazardous objects need quarantining or exclusion, retain them securely and explicitly report incomplete recovery; do not call an intentionally partial restore a full pass. No cron activation, outbound tests, emails or payment calls are authorized.

## Gate A status

| Check | Result |
| --- | --- |
| Distinct supplied project references | PASS: staging differs from production |
| Live staging identity/name/region | Not verified; designated project absent from accessible connector listings |
| Staging credential/TLS connection | Not configured / not run |
| Isolation and absence of live integrations | Not verified |
| PostgreSQL/extensions/permissions compatibility | Not run against staging |
| Fresh production identity/TLS check | Not run this attempt; must precede backup |
| Fresh protected backup/checksum/archive traversal | Not run; no fresh archive exists |
| Restore/tables/product counts/schema/RLS/functions | Not run |
| Production and deployment restrictions | Preserved; no database operations, deployment, activation, publication or paid AI requests |

Overall **FAIL / blocked**, not a restore failure. Next prerequisite is secure staging connection setup and platform visibility/isolation evidence. No additional Gate A approval is required for the already authorized scope. **Gate B remains unauthorized** and requires explicit approval only after a documented Gate A pass.

## Changes Made

- Added `scripts/setup-seo-staging-connection.ps1`, an interactive local-only credential setup helper.
- Added this setup and blocked-status report.
- Appended linked `seo-gate-a-staging-setup-20261019` to Change History using its CLI; previous entries remain unchanged.
- No application runtime or migration changes. No live preview claimed.

References: [Supabase PostgreSQL connection methods](https://supabase.com/docs/guides/database/connecting-to-postgres), [SSL enforcement and certificate verification](https://supabase.com/docs/guides/platform/ssl-enforcement).
