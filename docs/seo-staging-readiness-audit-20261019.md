# Read-only staging readiness audit

Latest blocker diagnosis: [management/CLI findings and synthetic catalogue proposal](seo-management-cli-blockers-20261019.md). The repository CLI link was found to target recorded production; it was preserved and no linked CLI command was run. Earlier audit evidence below remains unchanged.

## Decision: NO-GO for staging deployment

Fresh read-only checks confirm usable staging database access and an empty application schema. Exact management identity and platform/outbound isolation remain **UNVERIFIED**. No migrations, database writes, production connections, deployments, worker invocations, credential changes or paid AI requests occurred. Prior local native PostgreSQL 18.6 concurrency PASS is preserved, not rerun.

## Evidence matrix

| Area | Status | Fresh evidence / boundary |
| --- | --- | --- |
| Scoped connection | PASS | Local MCP configuration: `mcp.supabase.com/mcp`, project `tyltharlnbxrxibuxyye`, `read_only=true`, features database/debugging/functions |
| Separation from recorded production | PASS for reference separation | Staging ref differs from recorded production `yddqwgdgeljkzfsmtein`; production was not contacted or freshly re-identified |
| Project name, organization/owner, region | UNVERIFIED | No project-management endpoint in current dedicated MCP; no connected browser surface. Name `lecomax-seo-staging` remains recorded/user-designated |
| Database access | PASS | `postgres`, `supabase_read_only_user`, PostgreSQL 17.11 / 170011; transaction and default transaction read-only both on |
| Application inventory | PASS for clean target | Zero public tables/functions, empty migration ledger, zero Edge Functions |
| Required catalogue dependencies | FAIL readiness | `public.products` and `public.categories` both absent; synthetic dependency fixture plan is prepared but unapplied |
| Auth/Storage/Vault data | PASS for inspected emptiness | Users 0, sessions 0, buckets 0, objects 0, Vault secrets 0; aggregate counts only, no row contents read |
| Database integration activity | PASS for limited inventory | Foreign servers 0, subscriptions 0; cron job and HTTP request queue tables absent |
| Managed objects | UNVERIFIED behavior | Auth 27 tables, Storage 8, Realtime 3, Vault 1; eight enabled noninternal Storage/Realtime triggers and six enabled managed event triggers remain present; bodies not audited |
| Advisors | PASS for returned checks | Security and performance advisors returned empty lint lists; not a full security/performance certification |
| Auth configuration / external integrations | UNVERIFIED | SMTP/SMS, providers, hooks, redirect destinations, external workers, payment/email integrations, function secret metadata and network restrictions inaccessible |
| Hosted SEO permissions/PostgREST | UNVERIFIED | No SEO objects installed; cannot verify their effective permissions, schema cache or HTTP actor workflows |
| PostgreSQL 17 execution | UNVERIFIED | Static feature/dependency assessment only; native concurrency was on PostgreSQL 18.6 |
| Backup/recovery gate | FAIL readiness | No fresh snapshot or fully verified compatible restore; existing harness still needs hardening |

The dedicated server exposes SQL, advisors, logs, migration inventory, tables/extensions and Edge Function inspection, not project/Auth management. Current plugin discovery found an available but uninstalled Supabase management plugin; it was suggested, not installed or connected. Its advertised authentication/project capabilities are not proof of account visibility or granular read-only permissions. No earlier connector permission error was reclassified as a fresh result.

## Database settings and permission implications

- `ssl=on`, `row_security=on`, default isolation `read committed`, `max_connections=60`, `statement_timeout=120000`, `lock_timeout=0`, idle-in-transaction timeout 0. These are observed session/server settings, not proof of every API role's effective settings. MCP does not expose a direct database-client TLS handshake; do not claim fresh direct certificate verification.
- `wal_level=logical`, five replication slots allowed; actual subscriptions count zero. Enabled capability is not evidence of active replication.
- Installed extensions: pg_stat_statements 1.11, pgcrypto 1.3, plpgsql 1.0, supabase_vault 0.3.1, uuid-ossp 1.1. `shared_preload_libraries` includes pg_cron/pg_net among managed libraries even though their job/queue objects are absent. Absence of installed objects is not proof those facilities can never become active.
- anon/authenticated: no superuser, CREATEDB, CREATEROLE, BYPASSRLS or public CREATE; public USAGE allowed. service_role and the read-only MCP role have BYPASSRLS but no public CREATE. postgres has CREATEDB/CREATEROLE/BYPASSRLS/public CREATE, but is **not superuser**. Local fixture-owner tests do not certify hosted migration-owner behavior.
- Six public-schema default ACL entries exist. For postgres-created tables, API roles have default TRUNCATE, TRIGGER, REFERENCES and MAINTAIN privileges. Defaults for supabase_admin-created objects are broader, including table CRUD, sequence access and function execution. There are no current public tables exposed by these defaults. Future fixture and SEO objects must explicitly revoke unsafe privileges; RLS alone does not replace grants verification. The migration chain already contains explicit revocations, but their effective hosted result remains untested. Do not change platform defaults implicitly.
- The six enabled event triggers include PostgREST DDL/drop watchers and managed extension-access hooks. Managed triggers and owner mappings must be preserved/reviewed, not blindly replaced during restore.
- Aggregate logs for **2026-10-19T16:59:29Z–17:59:29Z** returned 483 pgbouncer entries and one postgres entry. No message bodies, IPs or identities were extracted. Counts do not establish error-free health or explain traffic origins.

## PostgreSQL 17 assessment

The five migration hashes still match the reviewed chain. It uses SQL/PLpgSQL, JSONB, UUID generation, row locks/SKIP LOCKED, identity columns and conflict handling; no identified PostgreSQL-18-only construct is required. Fresh target catalog checks confirm SQL/PLpgSQL and `gen_random_uuid()`, `md5(text)` and `jsonb_set(...)` exist. [PostgreSQL 17 SELECT documentation](https://www.postgresql.org/docs/17/sql-select.html) explicitly supports SKIP LOCKED.

**Inference:** the SQL feature set is plausibly compatible with 17.11. This is not a parse/execution certification. Missing catalogue tables, managed owner privileges, default ACLs, event triggers, collation/locale and PostgREST behavior still require target-appropriate testing. Do not treat the 18.6 local PASS as 17.11 parity. No remote EXPLAIN/DDL/RPC mutation was used to test this.

## Backup and restore prerequisites

Historical reports record two readable archives and a partial Windows restore with 36 errors. Those results were not refreshed here. The existing `artifacts/production-backup.cjs` was inspected as text only: it loads application environment, derives source identity from configuration and spreads inherited process environment. It must not be run unchanged for a new recovery gate.

Before a separately approved backup/restore: pin source/target identities, allowlist environment and clear libpq routing overrides, enforce TLS verify-full and exact role/database, verify protected destination ACLs and space, preserve existing archives, export a consistent snapshot for dump and comparisons, hash/traverse the archive, and review explicit restore selection/ownership. Exclude cron, network queues, Vault values, integration hooks and production login credentials from active staging import. Stop on errors and compare included objects/data against the same snapshot. Review Auth/Storage customizations, platform configuration and encryption recovery separately. [Supabase's restore guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) distinguishes roles/schema/data and managed-platform considerations; it is not execution authorization.

The prepared minimal SEO plan imports zero production rows and uses synthetic products/categories. It can support narrower SEO staging acceptance but **cannot replace full disaster-recovery verification**. Existing backup contents and credentials were not opened or copied during this audit. Current backup schedule, retention, PITR entitlement and latest successful managed recovery point remain inaccessible/unverified.

## Prioritized remediation and approval gates

1. **P0 — Management visibility and isolation, read-only.** Obtain owning-account access to this exact staging project's settings. Verify name/ref/organization/region, Auth providers/SMTP/SMS/hooks/redirects, Edge secrets metadata, integrations, network restrictions, backups and external consumers. This inspection is already authorized; changing permissions/configuration or connecting an app with broader access is not automatic. Do not request migration approval while this is unresolved.
2. **P1 — Review exact synthetic staging package, local/read-only.** Freeze matching v3 application/worker source and five migration hashes; include safe synthetic dependencies, explicit grants, disabled flags, zero initial budget, rollback and acceptance criteria. The current worker pins production, so a separate reviewed staging configuration is necessary; do not weaken the production guard. Resolve version-parity and migration-owner testing strategy. No deployment follows preparation.
3. **Gate S — Separate staging-write approval.** Only after P0/P1 pass, authorize the exact synthetic fixture schema and five-file chain on `tyltharlnbxrxibuxyye`. No real data, paid authorization, cron, worker activation or publication. Verify all 11 tables, complete grants including MAINTAIN/TRUNCATE, revoked legacy RPCs, disabled budget, PostgREST and actor/origin acceptance. Stop on any failure; no blanket db push.
4. **Gate R — Separate recovery approval.** Harden/review the backup harness and restore manifest first; then separately authorize a fresh read-only production snapshot and only the declared isolated restore scope. This is independent of synthetic Gate S and remains required before production rollout.
5. **Gate D — Separate staging deployment approval.** Requires confirmed hosting identity/access (historical Vercel 403 unresolved), matching source bundle, staging-only configuration and disabled workers/AI/scheduling. No invocation of a mutating worker GET as a health check.
6. **Gate A — Separate activation/paid/scheduling decisions.** Reconcile actual spending, prove the $5/$50 limits, resolve nine-second generation timeout versus historical latency, validate human French/Arabic review, monitoring and disable/rollback drills. Editorial publication remains unfinished. Production migration/deployment always requires its own approval after recovery and staging acceptance.

## Local verification and Changes Made

Fresh safe local checks: three offline plan/drift/refusal tests passed; all five migration hashes and seven operational-bundle entries verified without execution. Historical native/PGlite results retained, not rerun. History validated at 587 entries before this audit's append.

Added this readiness report and its append-only history record via the required CLI. No runtime, migration, credentials, backups, releases or existing reports changed. The generated Change History manifest is updated locally; no live preview or publication is claimed.

**Single safest next action:** provide an authenticated owning-account view of the staging management settings so the missing read-only identity/isolation audit can finish. Use the available Supabase management plugin only after reviewing its requested access, or an authenticated dashboard exposed to this session. Do not paste tokens or secrets. No new database-write approval is appropriate yet.

## Management-access follow-up — 19 October 2026

This addition preserves the original audit above. Actual recording time is in the linked `seo-staging-management-followup-20261019` Change History entry. **Deployment remains NO-GO.** No hosted or local SQL migrations, permission changes, account connections, deployment or paid API calls occurred.

### Fresh access determination

- The dedicated staging MCP still targets `tyltharlnbxrxibuxyye` with `read_only=true`. SELECT returns `supabase_read_only_user`, read-only on, PostgreSQL 17.11. This verifies the scoped database connection, not the identity of a connected management-account owner.
- Available tools still contain no Supabase project/organization/Auth-management reader. Fresh plugin discovery explicitly returns `installed:false` for the Supabase management plugin. Its earlier suggestion was not repeated. An available plugin is not a connected account and its advertised capabilities are not verified OAuth scopes.
- Fresh browser inventory contains no apps or browsers. There is no authenticated owning-account dashboard exposed to this session.
- Therefore project display name, organization, owner and region, Auth provider configuration, SMTP/SMS, Auth hooks, redirect destinations, Edge secrets metadata and external integrations remain UNVERIFIED. Edge Function inventory was freshly read and is empty. Function emptiness does not verify SMTP/hooks or external clients.

**Exact missing access capability:** authenticated read access to management metadata and configuration for project `tyltharlnbxrxibuxyye`, including organization membership/ownership visibility, project region, Auth configuration, hooks, SMTP/provider enabled state and destination metadata, and integration/secret-name inventories without secret values. No current management API call can be made, so there is no new permission-denied response identifying a particular OAuth scope. It would be incorrect to claim that a named scope, organization role or token is definitely missing or expired.

**Minimum safe action:** expose an already authenticated owning-account Supabase dashboard for this exact staging project to this session, with permission to inspect settings only. This avoids requiring a new broad API grant. Alternatively, install/connect the already identified management plugin only after reviewing its requested scopes and project visibility; do not grant write access solely for this audit. If granular read-only access is unavailable, use supervised dashboard inspection rather than broadening permissions. Do not paste credentials, grant database superuser privileges, reconnect production, or modify the working read-only MCP.

### Fresh privilege and migration-security review

The public schema remains empty and both catalogue dependencies remain absent. Default ACL inspection again confirms:

| Object owner / type | API-role defaults (`anon`, `authenticated`, `service_role`) |
| --- | --- |
| postgres / tables | MAINTAIN, REFERENCES, TRIGGER, TRUNCATE |
| supabase_admin / tables | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| supabase_admin / sequences | SELECT, UPDATE, USAGE |
| supabase_admin / functions | EXECUTE |

These are future-object defaults, not proof of currently exposed application rows. The five pinned migrations explicitly revoke table/function permissions and the SEO event identity sequence permissions, then grant selected service-role access. Later migrations revoke legacy claim RPCs. Security-definer routines set search_path, with older routines using `public` and newer routines `pg_catalog,public`; neither spelling alone proves the complete function safe. Review object qualification, temporary-object shadowing and role memberships during isolated security acceptance. No function or grant was edited here.

The hosted acceptance matrix must test **all** relevant privileges, not just INSERT/UPDATE/DELETE: SELECT, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN, sequence USAGE/SELECT/UPDATE, function EXECUTE, schema CREATE and role inheritance. Verify default ACL effects under the actual migration owner. Include an explicit PUBLIC-grant check and legacy/internal-function denial. RLS and an empty advisor result do not substitute for these tests. The earlier native run used a local fixture owner; it does not certify the hosted non-superuser owner or managed event triggers.

### Missing catalogue contract

Create nothing now. The minimum future synthetic schema needs `public.products` and `public.categories` with `id`, `name`, `slug`, `active`; IDs must be castable to text and active must be castable to boolean. Optional projected facts are `description`, `category`, `brand`, `images`, and `image`. The fixture should cover text product IDs, integer category IDs, French/Arabic content, omitted optional fields, inactive rows and stock-only updates. Explicitly restrict fixture grants and avoid copied production data, commerce triggers, orders, payment/customer tables or Auth rows. `model` is not projected by the existing queue payload and must not be presumed available.

### PostgreSQL 17 compatibility plan — prepared, not executed

1. Separately authorize an isolated PostgreSQL 17 environment or a bounded synthetic staging write phase only after management isolation passes. Do not reuse the consumed one-cluster PostgreSQL 18 authorization, restart its preserved cluster, install software or provision another cluster implicitly.
2. Pin exact server/client version, locale/collation and the five reviewed migration hashes. Use fresh synthetic fixtures and a non-superuser migration role with only reviewed prerequisites; reproduce observed default ACLs in the disposable environment. Never weaken hosted defaults as a test shortcut.
3. Apply the complete chain in order, stop on errors, verify 11 tables, three foreign keys, indexes, constraints, transaction rollback, RLS and the full privilege matrix above. Test partial-chain failures and absence of unsafe intermediate consumers. Do not apply synchronous 001.
4. Port the current three-session native suite to the approved PG17 target: worker lease race, row lock timeout, SKIP LOCKED, enqueue deduplication, retry/fencing, completion idempotency, rollback and budget reservation races. No provider transport or real authorization.
5. Separately verify managed event triggers, PostgREST schema cache and genuine HTTP actor/origin behavior in the approved Supabase staging phase. Local PG17 success does not establish those managed-service properties. Keep all runtime flags disabled and reconcile spending before any later activation.

### Backup and restore readiness plan — prepared, not executed

Keep synthetic SEO acceptance and full recovery as separate gates. First obtain read-only visibility into managed backup/PITR entitlement, retention and last successful recovery point; currently unavailable. Review and harden the existing backup harness before any execution: fixed production source and distinct staging target, exact database/role/TLS checks, allowlisted environment with inherited libpq routing removed, protected unique destination, adequate space, bounded snapshot-consistent dump/comparison and redacted diagnostics.

For an eventual separately approved recovery exercise, freeze the explicit archive-object manifest and owner mappings, preserve all old archives, verify checksum/TOC/full traversal, and exclude active cron/network/Vault/hook/secret objects from the runnable target. Do not replace managed schemas/roles blindly. Restore with stop-on-error and compare declared tables, content fingerprints, constraints/indexes, grants/RLS, sequences and functions to the same snapshot. Report exclusions and managed-service/storage-binary limitations honestly. No fresh production backup or restore is authorized by this audit.

### Status and local validation

- PASS: refreshed scoped database SELECT, empty Edge Functions, default-ACL inventory; three offline plan/hash-drift/execute-refusal tests.
- FAIL readiness: missing products/categories dependencies and unresolved mandatory isolation/recovery gates.
- UNVERIFIED: management identity/settings, PG17 full-chain execution, hosted grants/RPC behavior, current backup service settings and external integrations.
- No application or migration changes. Only this appended audit section, a new immutable Change History report and the generated history manifest changed. Prior reports and artifacts remain intact.

**Next action remains the owning-account dashboard read-only access described above.** No migration/deployment approval should be requested until that visibility and isolation evidence are complete.
