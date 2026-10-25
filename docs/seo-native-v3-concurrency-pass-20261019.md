# Full-chain native PostgreSQL concurrency: PASS

Run: **2026-10-19T12:40:40.787Z–2026-10-19T12:40:55.283Z**. Ten checks passed; zero failed. The one authorized disposable PostgreSQL 18.6 cluster was stopped after testing. No production, Supabase staging, deployed worker, scheduler, deployment or paid provider was accessed.

## Isolation and lifecycle

- Created exactly one new cluster in `artifacts/seo-v3-authorized-20261019/cluster-a114be4e-ef1f-4ef3-9176-e29c17de66ef/data`. An exclusive task reservation prevents this script from provisioning a second cluster on rerun. Existing directories were not reused.
- Port `127.0.0.1:55449` was successfully bound and released as an availability probe before initialization and checked again before startup. The unique data directory did not exist before initialization.
- Used the existing PostgreSQL 18.6 binaries, not the running Windows service. No service registration or installation occurred. Startup was `pg_ctl` for the exact new data directory, explicitly binding `127.0.0.1` and port 55449.
- A random test-only password and SCRAM authentication protected the new cluster. The initialization password file was removed immediately after initialization; no password was printed. HBA permits only `127.0.0.1/32`, with IPv4/IPv6 catch-all rejection.
- Child processes received an allowlisted OS environment. No dotenv file, inherited PostgreSQL routing variable, hosted credential or backup was loaded.
- All three independent sessions verified the exact data directory, host, port, database/user `postgres`, listen address `127.0.0.1`, and server version 18.6 before fixture writes.
- Initial inventory contained only `postgres`, `template0`, `template1`, no application tables, no foreign servers and no subscriptions. Fixtures were two synthetic products (French/Arabic names) and one synthetic category plus test-only roles.
- Final shutdown targeted only this cluster with `pg_ctl -D <new-data> -m fast -w stop`. Independent follow-up status returned exit 3, `no server running`; the PID file is absent. The pre-existing `postgresql-x64-18` Windows service remains running and was not modified or stopped.
- Test data, server/init/start/stop logs and result JSON remain preserved. No old cluster, release or backup was deleted.

Loopback/SCRAM isolation is appropriate to this synthetic local rehearsal; it is not a hosted network-security or operating-system sandbox certification. The temporary password is not retained for reuse. Do not restart or reuse the preserved cluster implicitly.

## Migration chain

All five files were checked against the existing reviewed SHA-256 pins, then applied only to the new cluster:

1. `supabase/alternatives/202610180002_seo_decoupled.sql`
2. `operations/seo-vercel/supabase/migrations/20261018193508_seo_worker_run_control.sql`
3. `operations/seo-vercel/supabase/migrations/202610190001_seo_ai_budget.sql`
4. `operations/seo-vercel/supabase/migrations/202610190002_seo_editorial.sql`
5. `operations/seo-vercel/supabase/migrations/202610190003_seo_editorial_review.sql`

All 11 SEO tables were present. Exact hashes and authenticated server identity are in the immutable run result. The original synchronous migration was not used. Individual migrations are transactional; the full chain is not a single atomic transaction.

## PASS/FAIL results

| Test | Result | Observed behavior |
| --- | --- | --- |
| Fresh isolated cluster | PASS | Verified identities and empty application inventory before writes |
| Full chain / 11 tables | PASS | Five pinned migrations applied successfully |
| SKIP LOCKED / claim rollback | PASS | Session A held a claimed row in an open transaction; B claimed a different job. Rolling A back allowed C to reclaim the first job with a new token |
| Completion idempotency | PASS | First completion succeeded; duplicate completion and rolled-back claim token were rejected |
| Retry and rollback | PASS | Failure produced retry state and future backoff; after advancing only the fixture due time, a new lease superseded the old token. Completion rolled back to processing; a subsequent completion succeeded |
| Concurrent worker starts | PASS | Two concurrent begin-run calls produced exactly one durable run token |
| Row locking | PASS | Holding the control row caused another session's run step to time out with PostgreSQL `55P03`; rollback released the lock and the step succeeded. Independent synthetic stock update succeeded while the lock was held |
| Concurrent v3 enqueue | PASS | Two simultaneous enqueue requests returned the same job ID |
| Competing budget claims | PASS | Two concurrent v3 claims with a $0.21 synthetic budget yielded one $0.20 reservation, not two; claimed job carried revision 3 |
| Expiry / uncertain spend | PASS | Replacement run rejected the old token and retained the prior $0.20 reservation; remaining budget could not fund another job |

These are actual independent PostgreSQL sessions, unlike the earlier single-engine PGlite tests. Queue internals were invoked as the fixture owner to isolate SKIP LOCKED semantics; durable worker run and AI paths used the current v3 RPCs. No deployed worker endpoint or AI provider was invoked. Synthetic budget authorization exists only in this stopped cluster.

No confirmed SQL or runtime defect was found, so no migration or production application change was made and no second cluster/run was needed. This is a bounded integration test, not a throughput benchmark, exhaustive interleaving proof, native role-permission audit or sustained load test. Existing PGlite permission/constraint coverage remains separately recorded, not newly rerun here.

## Other validation and preservation

- New runner syntax and focused ESLint: passed.
- Change History persistence/interaction tests: six passed, zero failures.
- Root TypeScript: recorded in `artifacts/seo-v3-concurrency-records/typecheck.log` and final linked history report.
- Preserved release checks: all 99 selected website/worker manifest entries and eight saved comparison entries matched. Seven-file operational bundle verification passed without applying its SQL. This is selected-manifest integrity, not whole-repository baseline certification.
- No backup was opened, restored, overwritten or deleted.

## Evidence and exact changes

- Added `scripts/test-seo-v3-concurrency.cjs`.
- Added this report, `docs/seo-native-v3-concurrency-pass-20261019.md`.
- Added `artifacts/seo-v3-authorized-20261019/identity.json` and the one new cluster directory. Its `result.json` contains all ten results, timestamps, migration hashes and `stopped: true`; its logs preserve initialization and shutdown evidence.
- Added preparation/verification source records and check logs under `artifacts/seo-v3-concurrency-records/`.
- Appended linked `seo-native-v3-concurrency-prepared-20261019` and `seo-native-v3-concurrency-verified-20261019` Change History records through the CLI, updating only the generated manifest and new immutable entries.
- Timestamped preservation evidence is under `artifacts/seo-quality/`. No previous report was rewritten. No live preview is claimed.

## Remaining blockers

The local native concurrency blocker is now resolved for PostgreSQL 18.6 and the tested interleavings. This does not establish PostgreSQL 17.11 parity or hosted Supabase/PostgREST behavior. Staging platform isolation/identity, hosted roles/RPC acceptance, full recovery verification, Vercel authorization, matching frozen v3 releases, spend reconciliation, worker timeout/latency, editorial publication and monitoring remain unresolved. Their hosted state was not refreshed in this restricted task.

Production and hosted staging migrations remain unauthorized. The next hosted prerequisite is a separately authorized **read-only staging management/isolation audit**, using an authenticated owning-account view of Auth/SMTP/hooks, external clients and integrations. Access to those settings is still required. That audit would not authorize migrations, deployments or generation. The current one-cluster authorization is fully consumed and must not be reused to provision another cluster.
