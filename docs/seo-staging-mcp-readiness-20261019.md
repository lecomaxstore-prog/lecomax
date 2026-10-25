# Staging MCP and recovery readiness — 19 October 2026

**NO-GO for hosted restoration. Direct database read-only verification passes; the newly named MCP connection is not available to this active tool session.** No hosted data/schema changes, production connection, dump, restore, deployment, worker activation or paid API request occurred.

## Actual MCP verification

Available tool metadata exposes the Supabase app connector with two account links, Primary and Ax. It does not expose a callable `lecomax-staging` server namespace. This is a tool-availability observation, not a claimed remote error from that new server: no call to the unavailable namespace could be made.

Actual read-only `mcp__codex_apps__supabase_list_projects` calls succeeded: Primary returned an empty project list; Ax returned a different project, not the designated staging or production project. Direct `mcp__codex_apps__supabase_get_project` calls for `tyltharlnbxrxibuxyye` were then attempted using both available links. Both returned exactly:

```text
ProtocolError
MCP error -32600: You do not have permission to perform this action
structuredContent.error_code: INVALID_ARGUMENT
isError: true
```

These results do not verify the user's newly configured OAuth server, its project scope or its read-only enforcement. They also do not prove the new server is misconfigured: it may not have been loaded into this running session. No mutation was attempted to test permissions.

## Independently refreshed PostgreSQL verification

Used the previously authorized protected staging credential file through the direct PostgreSQL client, explicitly separate from MCP. Evidence: `artifacts/seo-quality/staging-readonly-1792407925431.json` and expanded catalog inventory `artifacts/seo-quality/staging-readonly-1792407952310.json`.

The final inventory ran at 2026-10-19T11:05:50.830Z–11:05:52.310Z. TLS 1.3 certificate/hostname authorization passed. The fixed staging session-pooler username and target configuration match `tyltharlnbxrxibuxyye`, distinct from production `yddqwgdgeljkzfsmtein`. Database `postgres`, role `postgres`, PostgreSQL 17.11, explicit `transaction_read_only=on`. No production credentials were loaded by this verification script. Project name `lecomax-seo-staging`, region and owning organization remain unverified through management metadata.

### Schema and functions

| Schema | Tables | Functions |
| --- | ---: | ---: |
| auth | 27 | 4 |
| extensions | 0 | 55 |
| graphql | 0 | 0 |
| graphql_public | 0 | 1 |
| public | 0 | 0 |
| realtime | 3 | 18 |
| storage | 8 | 19 |
| vault | 1 | 5 |

Recorded 102 non-system function signatures and SECURITY DEFINER flags in the sanitized evidence. Function bodies, secrets, default argument expressions and customer records were not exported. An empty public schema does not mean managed schemas are absent or empty. Managed schema structures cannot be blindly replaced by a full production archive.

Installed extensions remain pg_stat_statements 1.11, pgcrypto 1.3, plpgsql 1.0, supabase_vault 0.3.1 and uuid-ossp 1.1. Available but not installed: pg_cron 1.6.4, pg_graphql 1.6.2 and pg_net 0.20.4. No extension was enabled.

No public triggers/functions/tables, foreign servers or replication subscriptions. Vault secret count is zero. Cron job and network request queue tables are absent. `anon` and `authenticated` cannot CREATE in public. The connected postgres role has BYPASSRLS, CREATE ROLE and CREATE DATABASE but is not superuser. This connection is powerful despite the deliberately read-only SQL used; it is not evidence of MCP read-only enforcement.

## Comparison with existing reports

Fresh observations agree with `docs/seo-staging-readonly-verification-20261019.md`: PostgreSQL 17.11, empty public schema, same extensions and no observed database integration activity. New evidence inventories managed schemas and functions. The outstanding management-plane access problem remains unresolved, now with exact MCP permission errors rather than project-list absence alone.

The historical Windows restore remains a partial restore and does not certify this hosted target. No fresh backup or restored product counts exist. Existing release and backup evidence was preserved.

## Auth, Edge Functions, hooks and external integration limits

Auth schema structure is visible through SQL, but Auth SMTP/provider configuration, hooks and redirect settings were not accessible through the available project management connection. Edge Functions, function secrets, platform integrations and external application/worker/payment/email connections are likewise unverified. No functions, hooks, email flows or payment endpoints were invoked.

Risk remains that production cron rows, network jobs, webhook triggers or integration secrets could become active if imported into staging. A different project ID and an empty public schema do not prove complete service isolation. A normal managed Supabase stack still includes Auth, Storage and Realtime services; validate their relevant configuration and access restrictions before importing sensitive production data.

## Safe next steps and approval boundary

1. Refresh/reopen the client session so the configured `lecomax-staging` MCP server is actually exposed, or reconnect the Supabase app account that owns the project. Confirm the expected project reference and read-only scope in the client. Do not paste OAuth tokens or database credentials into chat. A successful read-only call must independently confirm the project metadata before describing MCP as verified.
2. Inspect permitted Auth/SMTP/hooks, Edge Functions and platform integrations; document any API limitations and arrange authenticated dashboard inspection for settings MCP cannot expose. Verify external workers, schedules and payment/email connections separately. No approval is needed for these read-only checks.
3. Produce a concrete restore manifest and compatibility assessment: source/target schemas, extensions and ownership; managed Auth/Storage objects; migration history; RLS/grants/functions; quarantined cron/network/webhook/secret objects; and snapshot-consistent validation. Do not blindly replay a full archive. State any exclusions and corresponding recovery limits.
4. Revalidate production identity, TLS and protected backup-directory permissions immediately before an independently authorized backup. Preserve every prior backup, compute a fresh checksum, and verify archive readability and full traversal.
5. Only after isolation and manifest review, obtain explicit approval to perform the fresh backup and restore that manifest **only into `tyltharlnbxrxibuxyye`**, without scheduler activation or external side effects. Test original application counts, fingerprints, schema, RLS, functions and permissions against that snapshot. Treat managed-component errors as failures/limitations rather than full success.

There is no hosted-changing action ready for approval today because isolation is unresolved. The immediate need is tool/account access, not permission to bypass the blocker. Gate B, SEO migrations, deployment, publication, worker/cron activation and paid AI remain unauthorized.

## Local validation and Changes Made

- Extended `scripts/verify-seo-staging-readonly.cjs` with schema counts and non-system function signatures, preserving fixed-target TLS and read-only guards. Syntax check and refreshed staging execution passed.
- Ran 16 Node 24 local tests covering the worker handler and editorial review SQL persistence; all passed. SQL testing used disposable in-memory PGlite fixtures only, not either hosted database. Log: `artifacts/seo-quality/staging-mcp-local-tests.log`.
- Added this report and new timestamped sanitized catalog evidence.
- Appended linked Change History report `seo-staging-mcp-readiness-20261019` with the exact MCP errors and limits. Historical reports are unchanged. No preview or deployment claimed.
