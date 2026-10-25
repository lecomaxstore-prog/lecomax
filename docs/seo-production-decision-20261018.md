# Controlled production decision — refreshed 18 October 2026

**GO to request approval for a database-only controlled rollout with the explicit conditions below. NO-GO for execution until approval; NO-GO for website deployment or a claim of complete hosted acceptance.** Use the existing official Supabase project. A separate staging project is not required by this plan, and its absence is an explicitly retained risk.

No production data/schema, hosted configuration, deployment or persistent database setting was changed. Only read-only SQL, GET requests, local artifacts and a read-only backup were used. Ordinary platform request logs may record the probes. The transaction-timeout test terminated only its own read-only connection.

## Fresh evidence

| Check | Result and evidence |
| --- | --- |
| Latest schema/preflight | `production-readiness-1792348849167.json`: verified TLS, PostgreSQL 17.6, postgres owner, read-only transaction, 1,114/1,114 schema blocks match the new backup; no SEO objects, existing catalogue triggers or migration version `202610180001`; catalogue integrity clean |
| Counts | 34 products, 4 categories, 6 orders, 8 Auth users; matching counts alone do not establish unchanged contents |
| Activity at 18:38:53 UTC | Zero transactions older than 60 seconds and zero lock-waiting sessions; point-in-time only |
| Hosted GET probes | Auth settings 200; invalid Auth token 403; real local service key PostgREST catalogue SELECT 200; OpenAPI 200 with SEO save RPC absent as expected; anonymous/invalid-cookie Admin API 401; anonymous Admin page 307 |
| Transaction limit | `SET LOCAL transaction_timeout='1000ms'` in READ ONLY followed by `pg_sleep(2)` ended this session with `25P04` after 1,003 ms. Actual execution proves this timeout works on the hosted server. The separate parameter ACL metadata field returned false and must not be mistaken for a failure of this USERSET operation |
| Live deployment | Direct alias check at 18:39:29 UTC still resolves to `dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx`, READY, commit `d9d1d7a7b274fe3df9f70bb154704ea9e07e78ee`, Node 24.x |
| Runtime compatibility | Official standalone Node **24.22.0**, published SHA-256 verified. Candidate passed all 23 focused tests and a full Next.js 15.5.24 production build under Node 24; build exit 0 |
| Candidate integrity | All 26 recorded overlay hashes unchanged. No frontend/SEO engine changes were made in this refresh |
| Hosted environment | Production names ADMIN_EMAIL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY present as sensitive values. Dedicated ADMIN_SESSION_SECRET and SEO_AI_* absent. Secret values were neither exposed nor downloaded |

Runtime evidence: `artifacts/seo-node24/runtime-verification.json`, `artifacts/seo-migration/node24-focused-tests.log`, `node24-candidate-build.log`, `refreshed-hosting-identity.json`, and `refreshed-hosting-env-names.json`. The build reused installed dependencies and generated source from the existing candidate, with placeholder credentials. Existing unrelated lint and workspace-root warnings remain. It proves Windows Node 24 compilation/testing, not a clean Linux/Vercel dependency install, deployed middleware behavior or hosted credential correctness. Do not deploy this placeholder build with `--prebuilt`.

## Backup validity and recency

The previous restored archive was about an hour old, so a new **read-only** dump was created without deleting or replacing it:

- Path: `C:\Users\Ziko\Backups\LECOMAX\lecomax-production-2026-10-18T18-37-25-364Z.dump`.
- Operation began **18:37:25 UTC / 20:37:25 Paris**, completed 18:37:54 UTC. The snapshot was taken during this operation; do not claim its exact snapshot instant from the filename.
- 1,686,628 bytes; 1,233 archive entries; full archive traversal/decompression passed.
- SHA-256 `8bedc61407d22acc8cac307f964c3671b856ead785489fffce492b5b23b3d0df`, independently recomputed by the subsequent archive comparison and readiness check.
- New archive schema matches the current production schema. All 113 COPY sections compared with the previous archive; product/category/order rows match. Differences occurred in `auth.refresh_tokens`, `auth.sessions`, `auth.users`, `cron.job_run_details` and `public.client_behavioral_events`. These show the database is changing; their business legitimacy was not established merely from hashes.
- **The exact new archive has not been restored.** Previous application-recovery tests remain evidence for the procedure/schema, not certification of newly changed Auth/analytics rows. The old restored archive is retained. Neither archive certifies complete managed Supabase recovery: Storage files, Vault keys, hosted services, platform roles, cron/network dependencies and external secrets remain outside that guarantee.

Evidence: `artifacts/seo-migration/backup-data-comparison-1792348814034.json`; protected `.dump.report.json`; earlier restore/error-ledger documents. The comparison initially omitted pg_restore's required stdout option; the corrected local-only comparison succeeded without exposing row contents.

**Proposed operational recency gate:** snapshot operation started no more than **15 minutes** before migration, valid checksum/readability and no unexpected schema changes. This is a conservative proposed policy, not a universal guarantee or an accepted recovery-point objective. Refresh read-only if older; do not treat refreshed checksums as a newer recovery point. The owner must accept the possibility of losing post-snapshot writes if a separately authorized full restore ever becomes necessary. Routine recovery below does not restore data.

## Trigger impact, including checkout

The migration adds AFTER INSERT/UPDATE/DELETE triggers to products and categories. They execute in the writer's transaction, even for stock-only or price-only updates. An unchanged source avoids an SEO row update/version increment but still reaches an upsert conflict/lock path. The migration's local timeout settings do **not** become timeouts on later checkout requests.

Stock reservation/release functions update products (`20260904130000_atomic_color_size_inventory.sql`, plus earlier inventory migrations). A trigger error therefore can reject a stock change or roll back the surrounding checkout/order transaction. Concurrent SEO approval and inventory updates can contend on the same SEO row. The original migration does not delete business rows or add order triggers; those facts do not make future checkout writes risk-free.

CREATE TRIGGER locks may briefly block writers and remain held through COMMIT. A 120-second transaction cap limits the migration transaction, not the duration of any incident after COMMIT. Production concurrency/load effects remain untested. No real checkout or stock write was used as a test.

## Time-bounded execution procedure — prepared, not executed

1. Obtain explicit approval naming project `yddqwgdgeljkzfsmtein`, the original migration hash, the proposed 15-minute backup gate, deferred hosted tests, and any narrowly scoped recovery contingency. No deployment, synthetic writes, live product approval, maintenance toggle or ledger repair is implied.
2. Immediately before the agreed quiet catalogue interval, recheck TLS/project/owner, unchanged live deployment and migration hash, fresh backup, read-only preflight and integrity/activity SQL. Stop on collisions, unexpected drift, dirty required values, unsafe locks/long transactions or an unaccepted recovery point. Capture UTC fingerprints. Do not disable customer traffic or terminate others' sessions.
3. Use a single verified session connection (not transaction pooling) and psql `ON_ERROR_STOP`. Prepared wrapper `supabase/verification/seo-approved-session-procedure.psql` sets **transaction_timeout=120s**, **idle_in_transaction_session_timeout=15s**, then includes the exact original migration. It retains **lock_timeout=5s** per acquisition and **statement_timeout=60s** per statement. It does not add an outer transaction or modify the migration.
4. A named operator watches from launch; if there is no confirmed outcome by 130 seconds, stop further actions and inspect with a new read-only connection. Do not assume client timeout/cancellation means rollback. Server-side transaction timeout terminates the executing session; a connection loss near COMMIT still requires outcome verification. Never retry automatically.
5. On confirmed COMMIT, run all 34 postflight assertions immediately (target within 60 seconds), compare business-data fingerprints and reconcile legitimate concurrent changes. With unchanged catalogue, expect 38 documents, no drafts/publications/events. Run the post-migration read-only API checks below. Do not silently grant browser access or reload schema cache to make tests pass.
6. Observe existing traffic for at least five minutes with existing read-only logs/metrics, focusing on stock/order RPC errors, permission failures, lock waits and new 5xx errors. This cannot prove a successful checkout if no natural checkout occurs. Withhold deployment throughout. No synthetic order is authorized.

Original SQL SHA-256: `958e8727fb9d5f32df6702b00cd17e1e0a2e71b98674f1523ae29e439af3332f`.
Prepared wrapper SHA-256: `e794f9ced8016b1e936bb828b7c37b14428a6301b30c38a0645fda2303039e32`.

```powershell
# AFTER explicit migration approval and all gates; process-local verified PG
# connection variables must already be loaded securely, never echoed:
& 'C:/Program Files/PostgreSQL/18/bin/psql.exe' -X -w --set=ON_ERROR_STOP=1 --file=supabase/verification/seo-approved-session-procedure.psql
# Stop and inspect if LASTEXITCODE is nonzero; do not paste/run as an unconditional batch.

# Read-only after confirmed commit:
node scripts/audit-seo-migration.mjs --postflight
& 'C:/Program Files/PostgreSQL/18/bin/psql.exe' -X -w --set=ON_ERROR_STOP=1 --file=supabase/verification/seo-rollout-integrity.sql
```

psql execution does not register the Supabase migration ledger. This plan leaves that separate bookkeeping unperformed; later migration tooling must not blindly reapply the file. A ledger update needs its own reviewed action in an approval scope. Never run blanket `supabase db push` from this workspace.

## Immediate stops and realistic recovery

- **Before COMMIT:** any SQL/lock/privilege error, timeout, wrong hash or ambiguous target stops execution. Close the failed transaction/connection and inspect. No partial patch or automatic retry.
- **After COMMIT:** any failed postflight, unexpected anonymous access, unexplained integrity difference, new trigger-related catalogue/stock/checkout failure or persistent SEO REST error stops the rollout. Keep all evidence and withhold deployment.
- **If trigger writes are failing and recovery was explicitly approved:** use the existing bounded disable script. It disables both triggers and revokes service-role save-RPC execution in one transaction, retaining all content/history. Add a session transaction timeout of 30 seconds and idle timeout of 10 seconds. Five-second lock waits still apply. A blocked second ALTER rolls the entire recovery transaction back; the earlier 5.03-second local failure-path test proves that behavior locally, not that production locks will clear.
- **If recovery cannot obtain locks:** stop after one attempt. Read-only inspect blockers/transaction state; do not loop, terminate another session or force a full restore. Escalate for a separately approved intervention. This is why immediate recovery is not guaranteed.
- **Website rollback is not database recovery.** No deployment has occurred, so rolling back today's website would not remove the new triggers. After a separately approved future SEO deployment, the verified pre-SEO target is `dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx`. Reverify alias/target before use.
- **After disable:** verify disabled trigger states and denied service EXECUTE; reads may still expose earlier published SEO. Catalogue edits during disable require separately reviewed reconciliation before re-enabling. Do not erase SEO/history or restore the entire backup as routine rollback.

```powershell
# ONLY under explicit recovery approval; not executed:
& 'C:/Program Files/PostgreSQL/18/bin/psql.exe' -X -w --set=ON_ERROR_STOP=1 -c "set transaction_timeout='30s'; set idle_in_transaction_session_timeout='10s';" --file=supabase/rollback/20261018_seo_engine_disable_bounded.sql
```

Recovery SQL SHA-256 remains `7252c09dc2a2c6f39e30b7388e55e8b91d16058c58f673ed97c94985d3616351`. Full restore could lose newer orders/Auth changes and remains a distinct disaster operation requiring explicit authorization and a current-data preservation plan.

## Non-destructive hosted acceptance matrix

Use GET/HEAD and explicit READ ONLY SQL only. Keep tokens in protected local storage/process memory; never write tokens, cookies, user details, draft text or raw error bodies into reports. Existing logs/request counters are incidental. No sign-in, token refresh, account creation, revocation, staff suspension or API mutation is part of these probes.

| Timing | Test | Expected result / what it proves |
| --- | --- | --- |
| Before migration — done | GET `/auth/v1/settings`; GET `/auth/v1/user` with invalid bearer | 200 and rejection respectively; endpoint reachability and invalid-token denial only |
| Before migration — pending an existing valid token | GET `/auth/v1/user` with existing unexpired user access token, no auto-refresh | 200 and expected user identity checked in memory; expired token denied. Do not sign in or refresh merely to create this test |
| Before migration — done | GET `/rest/v1/products?select=id&limit=0` with configured service key | 200; real PostgREST/key compatibility for current catalogue, not the new SEO schema or hosted app environment |
| Before migration — done | GET `/rest/v1/` with service key, OpenAPI Accept | SEO save RPC absent, matching the unapplied schema; never invoke the RPC for discovery |
| Before migration — done | GET `/api/admin/seo` anonymous/invalid cookie; GET `/admin/seo` anonymous | 401 / 401 / redirect. This is the existing middleware boundary: the deployed SEO route itself does not yet exist |
| Before migration — pending existing Admin sessions | GET an existing protected read route using existing owner/staff cookies | Expected owner and staff access, no session creation. Admin uses its own HMAC cookie and live staff-role lookup; Supabase Auth success alone cannot prove Admin authorization |
| After migration, before deployment | SQL postflight, grants/RLS, `seo_documents` backfill and `seo_events` counts | All 34 checks true; 38 current catalogue documents and zero initial events/drafts/publications if no intervening edits |
| After migration, before deployment | GET `/rest/v1/seo_documents?select=kind,entity_id,version,active&order=kind,entity_id`; GET `/rest/v1/seo_events?select=id&limit=0`, service key | 200; fresh SQL SELECT and two independent HTTP reads agree on identifiers/versions. Compare in memory, report only counts/hash. Paginate if needed |
| After migration, before deployment | Repeat direct SEO-table SELECT with anon and, if available, a genuine authenticated user token | Permission denial (401/403); **200 with an empty array is not a pass**. SQL grants must independently deny both roles. Missing-table 404 is not proof of correct access control |
| After migration, before deployment | OpenAPI discovery using service key, plus SQL EXECUTE checks | save RPC discoverable with expected signature; browser roles denied EXECUTE. RPC is not invoked, including via GET |
| After compatible deployment, with existing sessions | GET `/api/admin/seo` and category-history GET for owner, view-only staff, product-only editor | Owner sees expected data; product editor cannot read restricted category history; invalid/expired cookie denied; an already-suspended account denied. Do not suspend/create accounts to manufacture fixtures |
| After compatible deployment | Reload Admin/read SEO from fresh requests; inspect storefront metadata and sitemap | Confirms stored migration/backfill or existing content is read through the app. Actual draft-save persistence, stale-save rejection, approval/reset and cache invalidation **cannot be proven without writes** |

Post-migration REST failures: poll GET-only discovery at 0, 5, 15 and 30 seconds, at most four attempts. Stop if missing/denied incorrectly; do not manually reload PostgREST cache or grant permissions without explicit approval. The migration/table state should be inspected even if HTTP is unavailable.

No positive authenticated session was accessed in this session; those rows remain pending. Do not mint an owner cookie with a service secret as a substitute for a genuine existing session. Cross-origin mutation rejection and draft persistence need separately approved bounded canaries later; a rolled-back SQL mutation is still a production-changing operation and can advance sequences. It is excluded from this read-only acceptance plan.

## Exact residual risks and decision

1. No hosted staging rehearsal: first real hosted SEO installation activates triggers on live catalogue/stock transactions.
2. Trigger errors/contention may affect checkout before frontend deployment; rollback itself can wait/fail on locks.
3. New backup integrity/schema verified, exact snapshot not restored; changing Auth/analytics rows and incomplete managed-service recovery remain limitations. Recency must be refreshed at execution.
4. Positive real-user Auth and owner/staff sessions remain unverified. Admin is a separate authentication layer.
5. New-table PostgREST grants/cache/discovery and backfill persistence require migration; draft/save/approve/reset and cache invalidation cannot be validated under a no-writes restriction.
6. Node 24 local tests/build pass, but clean Linux install, hosted middleware/runtime and actual production secret values/project binding are not certified by names or placeholder build success.
7. Original schema operation is non-idempotent; ambiguous COMMIT requires inspection. Ledger bookkeeping is not included.
8. No zero-downtime or complete disaster-recovery guarantee. No setting/credential change, migration, deployment or production canary has been authorized by this report.

**Approval scope to consider:** apply only the exact original migration through the 120-second wrapper after a fresh <=15-minute backup/preflight; optionally preauthorize exactly one bounded trigger/RPC disable attempt if the listed post-commit failure conditions occur. Keep website deployment, canary writes, ledger changes, environment changes and full restoration excluded. State the proposed recovery-point acceptance and quiet window explicitly. If those terms are not accepted, remain NO-GO.

Technical references: [PostgreSQL 17 timeout semantics](https://www.postgresql.org/docs/17/runtime-config-client.html), [Supabase getUser](https://supabase.com/docs/reference/javascript/auth-getuser). Local evidence and limitations take precedence over assumptions from documentation.
