# SEO Engine staging gate readiness

Recorded 2026-10-19T11:54:16.787Z. **Staging MCP PASS; Gate A remains BLOCKED; production migration, deployment, activation and scheduling NO-GO.** This report supersedes earlier readiness conclusions only where fresh evidence is explicitly identified. Historical reports and candidates remain preserved.

## Fresh read-only findings

- Local MCP configuration targets `tyltharlnbxrxibuxyye`, `read_only=true`, features `database,debugging,functions`. This matches the repository's designated lecomax-seo-staging reference and differs from recorded production `yddqwgdgeljkzfsmtein`. Display name, organization/owner and region remain unconfirmed through live management metadata. No production database was contacted in this review.
- Dedicated MCP SELECTs succeeded: PostgreSQL 17.11, database postgres, supabase_read_only_user, transaction_read_only on. Prior same-session checks also returned default_transaction_read_only on. Its eight tools expose SQL, tables, extensions, migrations, advisors, logs and Edge Function inventory/source; no migration/deployment tool is exposed. No write probe was used.
- Public: zero tables, functions and noninternal triggers. Migration inventory empty. Schemas/table counts: auth 27, storage 8, realtime 3, vault 1; public, extensions, graphql_public and graphql have zero tables. Managed schema presence is expected; this is not an entirely empty database.
- Auth users/sessions, Storage buckets/objects and Vault secret rows: all zero. No foreign servers or subscriptions. cron.job and net.http_request_queue absent. Edge Functions empty. Security advisors returned no lints.
- Eight enabled noninternal triggers exist in Storage/Realtime. Their metadata matches managed lifecycle/filter functions; bodies were not audited. Their presence is not proof of outbound isolation.
- Installed extensions: plpgsql 1.0, pg_stat_statements 1.11, uuid-ossp 1.1, pgcrypto 1.3, supabase_vault 0.3.1. Available but not installed: pg_cron 1.6.4, pg_net 0.20.4, pg_graphql 1.6.2. Availability does not establish compatible source versions or safe activation.
- anon/authenticated have public USAGE, no public CREATE, no superuser/createdb/createrole/BYPASSRLS. service_role and supabase_read_only_user have BYPASSRLS and public USAGE, but no public CREATE, superuser, createdb or createrole. postgres has createdb, createrole, BYPASSRLS and public CREATE, but is not superuser. No application objects exist on which to certify SEO grants/RLS. Read-only access does not certify restore ownership permissions.

## Separate app connector investigation

Both explicit staging get_project attempts earlier in this session returned `ProtocolError: MCP error -32600: You do not have permission to perform this action`, structured error INVALID_ARGUMENT. Fresh list_projects succeeds: Primary returns zero projects; Ax returns one unrelated project, not either LECOMAX reference. This demonstrates an account/project visibility gap rather than a failure of the dedicated staging MCP. Exact cause (account identity, organization membership, OAuth scope or connector policy) cannot be distinguished by these results. Authentication and permissions were not changed. Next safe investigation: inspect the owning account's existing authenticated dashboard read-only for project identity and settings; do not broaden grants or repeat login flows speculatively.

## Preserved artifacts and recovery evidence

Fresh hashes matched all 99 entries in the OpenAI/premium website and worker manifests (40+9+40+10). These are selected manifest entries, not a complete current source-to-baseline certification. Latest local build-only candidate is release/seo-quality-check-1792404118561; its saved build report records Node 24.22.0, exit 0, placeholder credentials, no deployment. No build was rerun. Frozen premium packages predate editorial v3; operations/seo-vercel contains later source. A matching frozen v3 website/worker release is still missing.

Change History validated at 579 reports before this report. Prior audit documents 111 passing local cases plus PostgreSQL concurrency; later MCP preparation documents 16 passing cases. These remain historical results, not tests rerun here. No SQL test suite was run because those suites execute migrations.

Protected backup directory ACL inspection: inheritance disabled; access limited to owner, Administrators and SYSTEM. Initial sandbox read was denied; a permitted read-only elevated inspection succeeded without ACL changes. Two archives were rehashed successfully against their existing report fields:

| Archive suffix (2026-10-18) | Bytes | SHA-256 |
|---|---:|---|
| 17-42-58-995Z.dump | 1685487 | 256adfcfcfa6e63ea46a574c016effbbc2f945b0fbef31cd66f593b692d47c91 |
| 18-37-25-364Z.dump | 1686628 | 8bedc61407d22acc8cac307f964c3671b856ead785489fffce492b5b23b3d0df |

Both saved reports record 1233 TOC entries and successful full archive traversal. Traversal was not repeated here. Both retain backup-verified-restore-pending status. The older archive's historical Windows restore exited 1 with 36 errors; missing pg_cron/pg_net/Vault and ownership differences prevent full recovery certification. Its 110 ordinary table-data counts and 719 compared objects passed then, but the tested migration was obsolete synchronous 001, not the current five-file chain. The archive included a cron job, 17471 cron history rows and one Vault secret; none of their contents were exposed. Neither archive is a fresh recovery point for a future migration window.

## Selected migration chain: inspection only

The seven-file decoupled operational bundle integrity check passed with zero network calls and applied=false. Fresh SHA-256 values:

| Order / file | SHA-256 |
|---|---|
| 1. supabase/alternatives/202610180002_seo_decoupled.sql | 1f084348a0702a9ae6f5a2a52a59537c544d8b8aa2dc7e86e6fe38c33a725445 |
| 2. operations/seo-vercel/supabase/migrations/20261018193508_seo_worker_run_control.sql | 39b1ad24d16124cddbb2d49052fd0d185b67681418e4a6dc0a3dd4ea1f2cf079 |
| 3. operations/seo-vercel/supabase/migrations/202610190001_seo_ai_budget.sql | 5087b11fb0b5692ba76b467aa3b6075e1919f59faef1358006e6e3422f426b63 |
| 4. operations/seo-vercel/supabase/migrations/202610190002_seo_editorial.sql | a88e6c5ae6d75805a1f01436a7e7fed77ee9e3a0a4855344504c8ba3712c2004 |
| 5. operations/seo-vercel/supabase/migrations/202610190003_seo_editorial_review.sql | f975fd04b40bf8b5cc4895bbdbe65cdb2640a0ce3549d5b4c69d244ad6d19030 |

Never precede these with synchronous 001, use blanket db push, or deploy an old worker whose claim RPC v3 revokes. Each file is individually transactional; the chain is not atomic. Intermediate budget defaults are not final policy. Full-chain acceptance must enforce disabled flags and zero spending before any service can connect.

## Reproducible backup/restore verification plan — NOT EXECUTED

1. **Approve and pin the target.** Candidate hosted target is tyltharlnbxrxibuxyye, conditional on authenticated name/owner/region confirmation and verified isolation. Inspect Auth providers/hooks/redirects, SMTP/SMS, API access, external workers, Vercel/Make integrations and secrets metadata without values. Prove jobs, webhooks, replication and external consumers cannot act during restoration. If hosted isolation cannot be established, use a separately approved disposable Linux Supabase-compatible stack with pinned versions, loopback-only ingress, denied outbound network, schedulers/services stopped and no production credentials. That alternative has not been provisioned or proven available. Quote any costs before approval.
2. **Freeze a restore manifest before execution.** Classify every archive object as application, platform-managed equivalent, custom managed-schema object, or quarantined integration object. Specify dependencies, extension versions, owners, grants/RLS, migration history and load order. Preserve production cron/Vault/network/hook records in protected backup but exclude them from an active hosted rehearsal. Do not use broad --clean, overwrite managed roles, import production login passwords, enable webhooks, or restore active schedules. Check encryption portability separately; do not copy production encryption keys into staging implicitly. An excluded object must be reported as unverified recovery scope, never full recovery. Full fidelity for hazardous objects requires the offline isolated target and separate approval.
3. **Prepare a reviewed harness before seeking execution approval.** Existing artifacts/production-backup.cjs is not approved as-is: it derives the source ref from environment instead of pinning yddqwgdgeljkzfsmtein, inherits PGHOSTADDR/other connection settings, does not enforce the expected postgres role/database independently, does not validate destination ACLs, and does not coordinate a snapshot for independent fingerprints. Use separate allowlisted source/target environments, unset inherited libpq routing/service variables, pin refs/ports/database/roles and TLS verify-full CA, refuse source=target, use exclusive unique output creation, and redact failures. Do not run the old restore-test harness (it executes obsolete migration 001).
4. **After explicit approval, establish a recovery point.** Recheck source identity/TLS, locks and selected migration ledger, target identity/isolation, client/server compatibility, directory ACL/free space, and accepted recovery-point/window. Use direct or session-pooler 5432, not transaction pooler. Export a consistent read-only snapshot and keep its transaction alive for the dump and baseline counts/fingerprints; capture schema/role metadata consistently and prohibit concurrent DDL for the window. Bound transaction duration and abort on drift. No secrets in command arguments/transcripts.
5. **Create and validate a new protected archive only in that window.** Preserve both existing archives. Record UTC start/end, tool versions, exit status, nonzero bytes, SHA-256, TOC and full decompression/traversal. Keep role exports and raw data outside Git with protected ACLs. Stop on any error; a readable archive is not a proven restore.
6. **Restore only the approved manifest to the reverified isolated target.** Use stop-on-error and reviewed ownership mapping. Avoid unsupported managed-schema replacement. Recheck egress/jobs/services before loading any data and after each phase. Retain failures and do not blind-retry unknown commits. This phase contains no SEO migrations or worker activation.
7. **Acceptance.** Compare same-snapshot counts and canonical ordered content fingerprints for every included table, schema/functions/constraints/indexes, RLS/grants/owners, sequences, extension dependencies and migration history. Explicitly list every excluded/mapped object and verify managed equivalents. Storage binary objects, platform configuration and encryption recovery are separate coverage items. No recovered sensitive values enter reports. Require zero unexplained differences and no restore errors before passing the declared recovery scope.
8. **Stop at Gate A.** Keep the rehearsal isolated and agree retention/cleanup separately. Full-chain staging migration and PostgREST/role acceptance require a subsequent explicit write authorization. No production migration or deployment is implied. Refresh the backup again near a later production migration if outside the approved recovery window.

The official [Supabase restore guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) distinguishes roles/schema/data, managed-schema customizations, migration history and encryption considerations. Its general activation instructions are not authorization to enable services in this rehearsal.

## Remaining production blockers and gate decision

1. Live staging name/owner/region and platform/external integration isolation unverified; app connector has no staging visibility.
2. No approved compatible restore manifest/hardened harness, fresh backup or successful compatible restore. Existing read-only MCP cannot execute the future write phase.
3. No frozen matching v3 website/worker source bundle and full baseline/diff certification; placeholder build is not deployable evidence.
4. Full five-migration chain, hosted PostgREST exposure/schema cache, grants/RLS, v3 concurrency, effective timeouts and genuine owner/editor/view-only/expired/suspended/origin acceptance remain unverified on staging.
5. Last Vercel audit returned HTTP 403: current project/plan, alias, deployment/rollback IDs, environment metadata and dedicated worker target are not certified. This was not retried or changed here.
6. Worker generation limit is nine seconds versus historical 17–20 second comparison latency. Resolve with the 45-second run budget, RPC deadlines and 90-second lease; no unapproved trial or timeout-only adjustment.
7. Budget reconciliation incomplete: prepared external spend only 0.000246 USD, while known comparison plus earlier usage conservatively totals at least 0.060741 USD, subject to invoice/shared-account reconciliation. Final monthly cap <=5 USD, zero initial budget, explicit per-request authorization and retained uncertain reservations require hosted acceptance.
8. Actual v3 French/Arabic quality and human acceptance unproven. Editorial result editing/publication is unfinished; review approval intentionally cannot publish. Define release scope or implement/review this separately.
9. Monitoring recipient/ownership, delivered alerts, backlog/freshness SLA, rollback/worker-disable drill and scheduler acceptance are incomplete. Website rollback alone does not stop an independent worker. Daily cadence conflicts with historical 15-minute warning until policy is resolved.

**Decision:** ready for further read-only target/settings verification and local harness preparation; not ready to execute Gate A or advance to production Gate B. Next approval-bearing operation is a fresh production read-only backup plus restore of the explicitly reviewed object manifest into a confirmed isolated target, with no migrations/deployment/activation/paid calls. Do not request unconditional execution approval while target safety and harness remain unresolved. Current user restrictions supersede historical Gate A execution authorization.

## Changes and validation

Documentation and append-only Change History only. No runtime, migration, database, account permission or authentication changes. No backup/restore/deployment, cron/worker invocation, paid provider request or live preview. Fresh checks: MCP inventories, connector project visibility, package hashes, migration hashes, seven-file operational bundle, backup hashes/ACLs and history validation. Historical tests/builds are explicitly labeled above.
