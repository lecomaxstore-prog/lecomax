# PostgreSQL concurrency readiness: BLOCKED before execution

## Current result

Environment inspection completed. **No suitable running disposable instance was verified; concurrency tests were NOT RUN.** This is an availability/isolation blocker, not a SQL failure. The prior PGlite PASS remains unchanged: 86 local tests and six history tests were historical results, not rerun here.

No database connection (local or hosted), initialization, service start/stop, migration, deletion, deployment, scheduler or paid provider request occurred. All previous clusters, releases, backups and reports remain preserved.

## Findings

| Check | Result |
| --- | --- |
| Installed binaries | PASS: `C:/Program Files/PostgreSQL/18/bin/postgres.exe --version` reports PostgreSQL 18.6 |
| Active Windows service | `postgresql-x64-18`, running, data directory `C:/Program Files/PostgreSQL/18/data` |
| Active listeners | Port 5432 on `0.0.0.0` and `::`, process 16800 at inspection time |
| Active service disposable / synthetic-only | NOT VERIFIED; do not connect, modify, stop or reuse it |
| Retained test clusters | 12 directories inspected under `artifacts/seo-concurrency-*`, `artifacts/seo-run-concurrency-*`, and `artifacts/seo-premium/concurrency-*` |
| Retained cluster status | Every `pg_ctl -D <exact-directory>/data status` returned exit 3, `no server running`; no postmaster PID files |
| Latest retained premium result | Historical synthetic test passed; shutdown log confirms it stopped. This does not certify its current contents for reuse |
| Suitable running disposable target | BLOCKED / not established |
| Concurrency, row locks, SKIP LOCKED, retries, idempotency, rollback | NOT RUN this session |

The first CIM query was denied in the sandbox. A read-only inspection outside that sandbox succeeded for service/listener metadata; process command lines remained unavailable. No permissions were changed. A PowerShell inventory expression had a syntax error and was replaced by a read-only Node inventory; it did not alter files or services.

PostgreSQL 18 is adequate for a supplementary local mechanics test, but differs from the previously recorded hosted PostgreSQL 17.11. It cannot certify major-version parity. Installing PostgreSQL 17 would require separate approval; no installation was attempted.

## Existing runner review

- `scripts/test-seo-run-concurrency.cjs` creates and starts a fresh cluster on port 55443. It exercises SKIP LOCKED, concurrent run acquisition, lock timeouts, stale acknowledgements and catalogue independence, but applies only the first two migrations.
- `scripts/test-seo-premium-concurrency.cjs` creates and starts a fresh cluster on port 55447. It tests duplicate enqueue, competing budget reservations, retained crash reservations and stale tokens, but applies four migrations and calls the old editorial claim RPC.
- Both use `initdb` and `pg_ctl start`; running either now would provision a cluster, contrary to the current conditional authorization. Neither is a complete five-migration v3 acceptance runner.
- The latest reviewed chain and hashes are available through `scripts/prepare-seo-minimal-staging.cjs`; v3 requires `seo_ai_enqueue_v3` and `seo_ai_claim_editorial_v3`. Do not silently fall back to the revoked old claim RPC.

## Exact setup instructions — NOT EXECUTED; approval required first

Use a new cluster rather than overwriting historical test evidence. The following PowerShell procedure uses the already installed PostgreSQL 18.6, creates a unique workspace-local directory, prompts for a new test-only password, and binds only IPv4 loopback. Run it in a fresh terminal from the repository root only after setup approval. It does not install a Windows service. Do not use any production/staging credentials.

```powershell
$ErrorActionPreference = 'Stop'
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
$workspace = (Get-Location).ProviderPath
$testRoot = Join-Path $workspace ('artifacts\seo-v3-disposable-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ'))
$testData = Join-Path $testRoot 'data'
$testPort = 55449
if (Test-Path -LiteralPath $testRoot) { throw 'Refusing an existing directory' }
# Clear inherited connection/service routing in this new terminal only.
Get-ChildItem Env: | Where-Object Name -Like 'PG*' | ForEach-Object { Remove-Item -LiteralPath ('Env:' + $_.Name) }
$probe = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $testPort)
try { $probe.Start() } finally { $probe.Stop() }
New-Item -ItemType Directory -Path $testRoot | Out-Null
& "$pgBin\initdb.exe" -D $testData -U postgres --auth-host=scram-sha-256 --auth-local=scram-sha-256 --pwprompt --encoding=UTF8 --locale=C
if ($LASTEXITCODE -ne 0) { throw 'initdb failed; preserve logs, do not retry blindly' }
& "$pgBin\pg_ctl.exe" -D $testData -l (Join-Path $testRoot 'server.log') -o "-h 127.0.0.1 -p $testPort" -w start
if ($LASTEXITCODE -ne 0) { throw 'Startup failed; inspect this new cluster only' }
# -X ignores psql startup files; -W prompts without storing the password in command arguments.
& "$pgBin\psql.exe" -X -W -h 127.0.0.1 -p $testPort -U postgres -d postgres -v ON_ERROR_STOP=1 -c "BEGIN READ ONLY; SELECT current_database(),current_user,inet_server_addr(),inet_server_port(),current_setting('data_directory'),current_setting('listen_addresses'),current_setting('server_version'); SELECT datname FROM pg_database ORDER BY datname; SELECT schemaname,tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema'); SELECT count(*) AS foreign_servers FROM pg_foreign_server; SELECT count(*) AS subscriptions FROM pg_subscription; ROLLBACK;"
if ($LASTEXITCODE -ne 0) { throw 'Identity/inventory verification failed; do not run tests' }
```

Expected before any fixture load: exact new `$testData`, address `127.0.0.1`, port 55449, database/user `postgres`, only standard template/postgres databases, no application tables, no foreign servers/subscriptions. Inspect listener ownership again to ensure no wildcard listener belongs to this new cluster. A connection on localhost alone is insufficient identity evidence. No production environment files or backups are loaded. Keep the random test password out of reports and Git.

If the target fails any identity/emptiness check, stop without applying fixtures. Do not redirect the tests to the existing service on 5432. Explicit host/port/database/user and a cleared libpq environment must be preserved in the eventual Node runner; each session must verify the exact data directory before writes.

After verification, a reviewed full-chain runner must create synthetic roles/tables and use at least two independent connections to test: single run acquisition, row-lock blocking/timeout, SKIP LOCKED selecting a different unlocked job, simultaneous deduplicated enqueue, caps under competing claims, retry/expired-token fencing, idempotent completion, and transaction rollback. Include all five pinned migrations and v3 RPCs. Keep provider calls absent. This runner adaptation was not executed or claimed complete in this availability-only step.

After an authorized run, stop only the verified new cluster with `& "$pgBin\pg_ctl.exe" -D $testData -m fast -w stop`. Preserve its logs and results. Do not delete old or new cluster directories automatically. No backup, release or Windows service is a cleanup target.

## Next approval and remaining blockers

Authorize **creation and temporary startup of one new disposable PostgreSQL 18.6 cluster under a unique workspace artifact directory, loopback-only port 55449, synthetic fixtures only, followed by an adapted full-five-migration multi-session test and shutdown**. This uses existing binaries; no installation, hosted connection, deployment, scheduling or paid request is included. Version-17 parity remains a separate limitation.

This approval is required by the user's explicit instruction: “Do not provision infrastructure without separate approval.” No external approval system rejected an action; setup was deliberately not attempted.

Existing hosted isolation, recovery, Vercel, release-freeze, spend-reconciliation, worker latency, publication and monitoring blockers remain historical and unresolved. No hosted state was inspected in this session.

## Changes Made

Documentation and append-only Change History only: this report, its source append record, the new immutable history entry, and regenerated history manifest. No runner, runtime, migration, backup or release changes. No preview claimed.
