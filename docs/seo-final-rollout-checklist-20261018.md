# SEO rollout handover — 18 October 2026

This continues the existing engine and supersedes older readiness conclusions, without changing their evidence. **NO-GO for production execution now. GO for requesting narrowly scoped migration approval after the gates below are agreed. Deployment remains a separate decision.** No production migration, record mutation, deployment, environment update or rollback was executed.

## Recovered state and completed verification

- Original migration remains SHA-256 `958e8727fb9d5f32df6702b00cd17e1e0a2e71b98674f1523ae29e439af3332f`.
- The supposedly unfinished basic recovery rehearsal had actually completed at 18:20:09 UTC. Its report remains `artifacts/seo-migration/bounded-recovery-local-validation.json`; it was not rerun.
- Additional failure-path rehearsal at 18:24:07 UTC blocked the second catalogue table. The exact bounded recovery SQL failed with `55P03` after **5,031 ms**. Explicit rollback restored both trigger states and service RPC privilege, including the first ALTER already executed. Evidence: `artifacts/seo-migration/bounded-recovery-failure-path-1792347842261.json`. Local TLS/loopback/database/data-directory identity was verified; cluster stopped afterward. This is PostgreSQL 18 evidence, not hosted PostgreSQL 17.6 certification.
- Recovery file: `supabase/rollback/20261018_seo_engine_disable_bounded.sql`, SHA-256 `7252c09dc2a2c6f39e30b7388e55e8b91d16058c58f673ed97c94985d3616351`. Five-second lock and 60-second statement timeouts are **not a total transaction deadline**. The script can itself fail to acquire locks; never promise immediate recovery or kill other sessions without authorization.
- Latest archive found in the protected backup directory remains `lecomax-production-2026-10-18T17-42-58-995Z.dump`, 1,685,487 bytes. Fresh checksum matches `256adfcfcfa6e63ea46a574c016effbbc2f945b0fbef31cd66f593b692d47c91`. No newer archive was found. The recovery point is 17:42:58 UTC, not the time of this checksum check.
- Existing restore success is retained: portable application restore, 110 selected COPY contents, 719 object comparisons, non-superuser migration rehearsal and 34 SQL assertions. The full restore had 36 managed-infrastructure errors. See `seo-restore-verification-20261018.md`, `seo-restore-error-ledger-20261018.md`, and `seo-application-recovery-and-staging.md`. No repeat full restore was needed.

## Exact active deployment and recovery baseline

Read-only Vercel deployment and direct alias API checks at approximately 18:25:55 UTC establish:

| Field | Verified value |
| --- | --- |
| Project | `lecomax` / `prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb` |
| Team | `team_yFLUcpSvgQi8EQuvuorOZW7w` / `lecomaxstore-4321s-projects` |
| Live alias | `lecomax.com` resolves to `dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx` |
| Deployment | `https://lecomax-bf5hgr5bl-lecomaxstore-4321s-projects.vercel.app` |
| State | READY, production |
| Source | GitHub main, `d9d1d7a7b274fe3df9f70bb154704ea9e07e78ee` |
| Matching clean checkout | `release/brands-20261018` |
| Hosted runtime | Node 24.x, Next.js |

This current deployment is the exact **pre-SEO rollback target after a future SEO deployment**. The older October 17 `dpl_8haYmMxDrjBnACRoqiXZWXYwPART` still exists and is READY, but is not selected for this rollout. A historical deployment's alias list is not sufficient proof of current routing; the direct alias API was checked.

The matching production source has no `lib/seo-store.ts`, `/admin/seo` or `/api/admin/seo` implementation. The new database triggers nevertheless activate immediately at migration COMMIT, independently of any deployment. The current source is the correct frontend baseline; this does not prove it works with the new hosted triggers.

Production variable names verified present: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`. Dedicated `ADMIN_SESSION_SECRET` and `SEO_AI_*` names are absent. Existing session fallback must be preserved; do not rotate credentials as part of SEO. Values, matching key identity, runtime access, session correctness and actual hosted authentication were not certified by listing names.

## Source separation and candidate

The root remains dirty at its original HEAD `e5251911e2a6f1379aca827eb53c310359a662b3`. No reset, clean, revert, checkout replacement, deletion or commit was performed. Status with all untracked files expands directories into thousands of entries; this is not comparable to the earlier 611 compact status entries.

`artifacts/seo-migration/review-scope-1792347931430/manifest.json` separates 32 reviewed files and nine deltas against preserved pre-SEO files. It is an earlier review snapshot, before the preorder correction. Unrelated changes remain in place.

`release/seo-rollout-20261018` is a separate candidate extracted from the exact production commit, with 26 explicitly enumerated SEO/test/SQL overlays. Package and lockfile come from that commit. Source creation and hashes are in `artifacts/seo-migration/isolated-release-manifest.json`. No production .env files, private credentials or existing build output were copied. The initial extraction failed because `tar` was absent from PATH; the preserved archive was resumed only into the still-empty candidate directory using the explicit Windows tar executable. No earlier file was discarded.

Comparison found the old pre-SEO snapshot differed from production in three preorder availability expressions. The local SEO version had lost that deployed behavior. The correction restores explicit preorder metadata and structured data while preserving the unknown-stock safeguard. Six focused product-indexing tests passed, including five stock/preorder combinations. The root and isolated candidate each passed 23 focused SEO/API/sitemap/product tests. These API tests use mocks; they do not establish hosted compatibility.

Do not deploy the dirty root or use `--prebuilt` with a placeholder build. The candidate still requires the recorded validation results and hosted gates below. Local compilation uses the available Node 26.7.0/dependencies; hosted Node 24.x and a fresh lockfile install remain distinct checks.

Candidate static validation: 23 tests passed, `tsc --noEmit` exited 0, focused Next lint exited 0 without warnings. All 26 overlay hashes still match the source manifest; only `.env.example` exists in the candidate. Four Change History tests passed. The first candidate build failed downloading existing Inter/Sora fonts under restricted network access; its log is retained and a network-enabled retry is recorded separately. The candidate's verified project link contains only the existing Vercel project/team identifiers.

The network-enabled local production build **passed** (exit 0), including compilation, type validation and static generation. Log: `artifacts/seo-migration/isolated-candidate-build-network-retry.log`. Existing broader lint warnings and the parent-workspace tracing-root warning remain; focused SEO lint is clean. This build used non-secret placeholders and available parent dependencies, not real hosted credentials or a clean Node 24 install. It must not be uploaded as a prebuilt production artifact. `artifacts/seo-migration/isolated-candidate-source-hashes.json` records 2,594 candidate source files, excluding generated output/cache/source-library and the project link. No secret-named environment file is present. Hosting must build the reviewed source with its actual production environment and lockfile.

## Trigger impact and stopping conditions

Both AFTER row triggers run for INSERT, UPDATE and DELETE, including stock-only/price-only writes. The upsert avoids changing the SEO version when source facts/active status are unchanged, but still takes the conflict path and may wait on the SEO row. Migration-local timeouts do not apply to later application transactions.

Inventory functions in `20260904130000_atomic_color_size_inventory.sql` update `public.products` on reserve/release; earlier inventory migrations do likewise. Therefore SEO errors or contention can fail stock reservations, releases, product/category edits and the transaction containing them. No direct orders trigger is required for checkout impact. This is an operational risk even before the new frontend is deployed. No real order was created to test it.

Stop before execution for wrong project/hash, collisions or an existing ledger entry, unexpected schema drift, failed integrity checks, unaccepted recovery point, or unsafe long transactions/lock waits. Previous zero-lock/zero-long-transaction evidence is historical and must be refreshed at the window.

Stop after execution for any failed postflight assertion, unexpected access exposure, new checkout/catalogue errors, unexplained business-data changes or persistent schema-cache/API failures. No blind retries after an unknown COMMIT result. Reconnect read-only and determine actual state. No automatic drop, full restore, privilege broadening or session termination.

If approved, bounded disable retains SEO tables/history and original catalogue data; it does not unpublish existing content. Website rollback does not undo database triggers. Writes made while triggers are disabled require separately reviewed reconciliation before re-enabling. Full restore is a disaster operation that may lose newer orders/Auth changes, not the routine SEO rollback.

## Ordered final approval and acceptance checklist

1. Name the operator, official project `yddqwgdgeljkzfsmtein`, exact migration hash, quiet catalogue-write interval and acceptable recovery point. Refresh and verify backup if the existing snapshot is too old. Preserve all older archives.
2. Explicitly accept the absence of hosted staging and the resulting unverified integration risk. Migration approval alone does not authorize canary writes, deployment or emergency recovery; specify these separately if desired.
3. Recheck project/TLS/hash, read-only preflight, migration ledger, and `seo-rollout-integrity.sql` immediately before the approved window. Record counts/content fingerprints and reconcile legitimate concurrent traffic. Do not impose maintenance settings without approval.
4. Execute only the original migration once, in its original transaction. SQL errors stop execution. Unknown outcome requires inspection, never an automatic retry.
5. Require all 34 SQL postflight assertions; unchanged catalogue expects 38 documents, zero drafts/publications/events. Compare pre/post business-data fingerprints. `psql` does not add a Supabase ledger row: leave it unperformed unless the approval includes an exact reviewed bookkeeping action; do not use a blanket migration push.
6. Read-only hosted checks: real service-role REST SELECT and RPC discovery, anonymous denial, schema cache, owner/staff read boundaries. Do not call a mutation RPC merely to test discovery.
7. Separately approved bounded inactive canaries: product/category create/update/delete, stock update, deterministic draft/save/version conflict/approval/reset, persistent reads, audit retention and cache invalidation. Never test with real orders or publish a live product implicitly. Define canary retention/cleanup before writing.
8. Record candidate checks and environment identity. Obtain separate approval to deploy the named candidate only after database acceptance. Reinspect the live alias immediately before deployment; if the baseline changed, stop and rebase/review.
9. After authorized deployment, verify authenticated owner/staff/expired/suspended/cross-origin flows, rendered metadata/sitemap, persisted edits and cache invalidation. Monitor catalogue/checkout errors. Execute only explicitly approved recovery actions on failure.

## Prepared commands — not executed

Use the current workspace root unless `--cwd` is specified. Load the password securely into process-local `PGPASSWORD`; never paste it into command arguments, reports or shell history. Non-secret target settings are `PGHOST=aws-0-eu-west-1.pooler.supabase.com`, `PGPORT=5432`, `PGDATABASE=postgres`, `PGUSER=postgres.yddqwgdgeljkzfsmtein`, `PGSSLMODE=verify-full`, and `PGSSLROOTCERT` pointing to the absolute trusted `supabase/prod-ca-2021.crt`. Verify the connection's actual project/owner identity rather than trusting variable names.

```powershell
# Read-only, immediately before the approved window:
Get-FileHash supabase/migrations/202610180001_seo_engine.sql -Algorithm SHA256
node scripts/audit-seo-migration.mjs
& 'C:/Program Files/PostgreSQL/18/bin/psql.exe' -X --no-password --set=ON_ERROR_STOP=1 --file=supabase/verification/seo-rollout-integrity.sql

# PRODUCTION CHANGE: only after explicit migration approval:
& 'C:/Program Files/PostgreSQL/18/bin/psql.exe' -X --no-password --set=ON_ERROR_STOP=1 --file=supabase/migrations/202610180001_seo_engine.sql

# Read-only after confirmed commit:
node scripts/audit-seo-migration.mjs --postflight
& 'C:/Program Files/PostgreSQL/18/bin/psql.exe' -X --no-password --set=ON_ERROR_STOP=1 --file=supabase/verification/seo-rollout-integrity.sql

# PRODUCTION CHANGE: only after separate candidate deployment approval:
vercel.cmd deploy --prod --cwd release/seo-rollout-20261018 --scope lecomaxstore-4321s-projects

# PRODUCTION CHANGE: only under separately approved recovery contingency:
& 'C:/Program Files/PostgreSQL/18/bin/psql.exe' -X --no-password --set=ON_ERROR_STOP=1 --file=supabase/rollback/20261018_seo_engine_disable_bounded.sql
vercel.cmd rollback dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx --scope lecomaxstore-4321s-projects
```

Check `$LASTEXITCODE` after each operation and stop on failure; this is a reviewed command list, not a batch to paste and run unconditionally. The candidate must contain the verified `.vercel/project.json` link before any deployment. Rollback availability/permissions must be rechecked at the window; the target is deliberately the immediately preceding production build after this planned release. Vercel rollback does not restore database state or reverse environment settings. References: [Vercel deploy](https://vercel.com/docs/cli/deploy), [Vercel rollback](https://vercel.com/docs/cli/rollback), [PostgreSQL timeout semantics](https://www.postgresql.org/docs/17/runtime-config-client.html).

## Remaining limitations

Hosted Supabase Auth, middleware with real sessions, PostgREST permissions/cache, actual production trigger behavior, checkout contention and frontend cache integration remain unverified. No separate staging project was created. Storage binaries, Vault keys, managed cron/network services and external secrets are not certified by the logical backup. The database migration can be considered for controlled approval with these risks explicitly accepted; the complete rollout is not yet certified production-ready.
