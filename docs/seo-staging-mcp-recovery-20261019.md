# Staging MCP recovery — 19 October 2026

Recorded 2026-10-19T11:16:36Z; checks continued afterward. **MCP connectivity PASS. Gate A remains NO-GO pending identity metadata, platform isolation and restore-plan evidence.** No production connection or data access, hosted write, restore, migration, deployment, activation, or paid OpenAI request was performed. Existing backups and work were preserved.

## Connection and configuration

The current session exposes eight tools under `mcp__lecomax_staging__`: execute_sql, get_advisors, get_edge_function, list_edge_functions, list_extensions, list_migrations, list_tables, query_logs. No deployment or migration mutation tool is exposed in this namespace.

Safe inspection of `C:/Users/Ziko/.codex/config.toml` found `[mcp_servers.lecomax-staging]` targeting host `mcp.supabase.com`, path `/mcp`, with `project_ref=tyltharlnbxrxibuxyye`, `read_only=true`, and `features=database,debugging,functions`. No credential values were printed. No project-local `.codex/config.toml` was found by the targeted check.

The reference matches the previously designated staging project and differs from the recorded production reference. Requests in this investigation used only that scoped namespace, plus metadata-only get_project attempts explicitly addressed to the staging reference. No account-wide project listing was performed.

Real MCP SELECT returned database `postgres`, role `supabase_read_only_user`, PostgreSQL `17.11`, transaction_read_only `on`. This verifies authenticated request execution and the actual read-only query context. No write probe was attempted. Successful calls establish usable authentication; OAuth token lifetime, refresh behavior and organization grant breadth were not inspected. Project scoping does not prove the underlying OAuth grant is limited to that one project.

**Identity limitation:** the target reference is verified in configuration, but the display name `lecomax-seo-staging`, region and owner remain independently unverified. This scoped namespace has no get_project or Auth configuration tool. Both separate app connector account links were queried only for this staging ID and returned exactly:

```text
ProtocolError
MCP error -32600: You do not have permission to perform this action
structuredContent.error_code: INVALID_ARGUMENT
isError: true
```

These errors belong to the app connectors, not the now-working staging namespace. The historical report likewise attributed its errors to those connectors. There is no evidence that the new scoped server itself produced -32600.

## Local initialization and extension observations

Installed npm CLI: `codex-cli 0.163.0`. PowerShell's `codex.ps1` shim was blocked by execution policy (PSSecurityException / UnauthorizedAccess); `codex.cmd` worked without changing that policy. However `codex.cmd mcp get lecomax-staging --json` returned `Error: No MCP server named 'lecomax-staging' found.` and its MCP list returned no entries. CODEX_HOME and HOME were unset; USERPROFILE was C:/Users/Ziko. The npm wrapper invokes the installed @openai/codex JavaScript entrypoint. The reason this CLI process sees different effective configuration remains unresolved; it must not be conflated with session MCP failure.

Extension inventory includes `openai.chatgpt-26.1007.21434-win32-x64` and `openai.codex-audio-26.1007.21434`. Inventory does not prove which process owns this session. No extension settings, configuration, tokens, credential stores or authentication state were changed. No login flow or restart is necessary to demonstrate current session connectivity. If CLI parity is needed later, inspect its effective configuration/home and launch context before reauthenticating or changing the working server.

## MCP comparison with prior PostgreSQL evidence

Compared with `artifacts/seo-quality/staging-readonly-1792407952310.json` (2026-10-19T11:05:50.830Z–11:05:52.310Z), not a new direct PostgreSQL run:

| Check | Prior direct PostgreSQL | Current MCP |
| --- | --- | --- |
| PostgreSQL / database | 17.11 / postgres | Same |
| Query role | postgres | supabase_read_only_user |
| Read-only transaction | on | on |
| Public tables / functions / triggers | 0 / 0 / 0 | Same |
| Foreign servers / subscriptions | 0 / 0 | Same |
| Vault secret rows | 0 | 0 |
| cron.job / net.http_request_queue | Absent | Absent |
| anon/authenticated public CREATE | Denied | Denied |

Installed extensions match exactly: pg_stat_statements 1.11, pgcrypto 1.3, plpgsql 1.0, supabase_vault 0.3.1, uuid-ossp 1.1. The earlier TLS 1.3 certificate/hostname result belongs to the direct database client; MCP does not expose an equivalent database TLS handshake result.

New MCP observations: Auth users 0; Auth sessions 0; Storage buckets 0; Storage objects 0. Counts only were retrieved, without customer records or secret values. Edge Function inventory is empty. Security advisors returned `lints: []`; that is not a certification of complete isolation.

Eight enabled noninternal triggers were inventoried by name/function metadata: one realtime.subscription filter-check trigger and seven Storage bucket/object enforcement, lifecycle, deletion-protection and timestamp triggers. None are in public or auth. Their managed-schema locations and names are consistent with platform components; function bodies were not audited, so absence of arbitrary outbound behavior was not conclusively proven. This broader trigger inventory does not contradict the earlier public-only zero count.

## Remaining isolation risks

| Area | Verified | Still required |
| --- | --- | --- |
| Auth | No users/sessions; no noninternal Auth SQL triggers | Read-only authenticated inspection of signup controls, providers, site URL, redirect allowlist, Auth hooks and destinations |
| SMTP / messaging | No test mail sent | Confirm SMTP/SMS providers absent or isolated to sandbox recipients; empty Auth tables do not establish this |
| Edge Functions | No deployed functions listed | Secrets/configuration inventory is unavailable here; verify no production integration secrets without displaying values |
| Database hooks/jobs | No public functions/triggers; cron/network queue absent; no foreign servers/subscriptions; Vault empty | Ensure future restore excludes or quarantines jobs, network calls, hooks and integration secrets before they can execute |
| Storage / Realtime | Empty Storage counts; managed trigger metadata inspected | Review service access/configuration and external consumers as appropriate |
| External integrations | No service invoked | Verify staging-only Vercel/app/worker/Make/payment/email connections, schedules and webhooks through permitted settings; these were not accessible through the scoped tools |

Absence of database jobs or Edge Functions cannot establish that an external worker does not hold staging credentials. No external endpoint, signup, login, hook, payment or worker was invoked to test isolation. No broad log dump was requested because it could expose payloads/secrets and cannot replace configuration evidence.

## Required before Gate A execution

1. Confirm staging reference → display name, owner and region in an authenticated management view. Restore access to a staging-capable management connector or use read-only dashboard inspection; do not widen production access.
2. Complete the platform and external integration checks above. Record explicit disabled/sandbox states and unresolved settings. Any required hosted configuration change needs a separate concrete proposal and explicit authorization.
3. Review a restore manifest covering source/target schemas, managed Auth/Storage objects, extension versions, ownership, grants/RLS, functions, migration history and quarantine/exclusion of outbound-capable objects. Record recovery limits instead of treating a partial restore as complete.
4. Obtain explicit authorization for any subsequent production access/backup and every hosted write. This task's strict prohibition supersedes historical execution permissions. No restore or migration may proceed under this recovery task.
5. In that separately authorized window, retain old backups, create/verify the approved snapshot and checksum, traverse the archive, then validate the approved staging restore using snapshot-consistent counts/fingerprints and schema/security checks. Gate A cannot pass on connectivity alone; Gate B remains unauthorized.

## Documentation and validation

Only this report and append-only history/evidence entries were added; application runtime and database schema were not modified. Actual live MCP checks passed as described, while management metadata checks failed as recorded. No application build/UI preview or restore validation was performed or claimed.

References: [Supabase MCP configuration and scope](https://supabase.com/docs/guides/ai-tools/mcp), [official OpenAI MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli). Supabase documents project_ref scoping and read_only query execution; neither substitutes for platform isolation review. The changelog markdown fetch failed in web tooling (unsupported content type) and the shell fetch was unavailable; no feature implementation or configuration change relied on an unverified changelog assumption.
