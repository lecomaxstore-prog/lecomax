# Hosted SEO acceptance procedure — prepared, not executed

Use alongside [the final approval checklist](seo-final-production-preparation-20261018.md). All mutation tests below require the named gate's explicit approval. Never treat an HTTP method alone as proof that a request is read-only: authenticated `GET /api/sync` runs the worker and writes SEO state.

## Prerequisites and evidence capture

Use the final isolated candidate `release/seo-final-20261018` and its 36-file overlay manifest in `artifacts/seo-final-preparation/candidate.json`. The original manual candidate has an authorization defect for staff; keep it as history, not the rollout target. The worker remains the unchanged eight-file Account 6 manifest. Verify both migrations and their postflights before any successful worker invocation.

Record UTC time, project/deployment IDs, actor role, HTTP status, sanitized error code, duration and database aggregate results. Do not save cookies, Authorization headers, service keys, complete HTTP bodies, customer data, screenshots of secrets or exported browser HAR files. Use existing authorized testers or separately approved synthetic accounts; this procedure does not authorize creating staff, suspending real staff, changing roles or signing a token that impersonates a user.

The default command below emits only a plan and makes no network calls:

```powershell
& './artifacts/seo-node24/node-v24.22.0.exe' scripts/seo-hosted-acceptance-readonly.cjs
```

After the corrected website and migrations are accepted, the same command with `--execute-readonly` sends only fixed-origin GETs to `https://lecomax.com/api/admin/seo/sync`. Genuine test cookies are supplied securely through the named process environment variables in the plan, never command-line literals. Missing actors result in `not-run`, not a pass. It checks disabled status, no-store responses and absence of lease tokens. Do not run it before deployment and call the current site's responses candidate acceptance.

## Admin authentication and authorization

| Test | Expected outcome | Gate / restriction |
| --- | --- | --- |
| Genuine owner login and SEO page | Existing authentication succeeds; no new secret rotation; Run SEO Sync disabled before activation | Disabled deployment acceptance; owner supplies their normal login |
| Active full-catalogue staff login | Existing login works; GET sync status 200 | Requires products.view + products.edit + categories.edit |
| Anonymous, invalid session, expired session, suspended account | GET/POST denied 401; no worker request | Suspended/expired fixtures must already exist or be created under separate scope |
| Active view-only or product-only staff | GET sync status and POST sync denied 403 | Shared policy now admits active staff to route-level permission checks; it does not grant catalogue privileges |
| Valid owner/editor GET while activation off | 200; `enabled:false`; idle/persisted state, counts and no token | GET-only acceptance runner covers this |
| Valid owner/editor POST while activation off | 503 disabled; no worker invocation | Perform only with disabled deployment/activation configuration independently confirmed; never retry after flags change |
| Foreign Origin POST | 403 before worker invocation | Use synthetic hosted staging to exercise this and rate-limit behavior; do not consume production run budgets |
| Repeated authorized POST | Fourth request in the process-local minute bucket is 429 | Deterministic local guard test passed; distributed traffic is not a global quota. Exercise staged fixtures, not live runs |
| Browser polling and navigation | State polls while mounted; Run disabled during running; unknown outcome asks for status refresh; counts update after completion | Real browser acceptance still required; do not equate route unit tests with UI testing |

The new regression `tests/seo-sync-authorization.test.ts` executes the real route -> API security -> request authorization -> policy chain, replacing only session lookup and external transport. All three tests failed before the policy fix and passed afterward. Middleware imports the same policy; real hosted middleware remains part of the matrix above.

## PostgREST and RPC acceptance

1. After standalone 002, run `operations/seo/postflight.sql` and require all assertions true. After run-control SQL, run `operations/seo-vercel/supabase/run-control-postflight.sql`; its fenced-access assertions supersede 002's old direct-worker execute assertion. Stop on any false assertion or missing row.
2. GET service-role `/rest/v1/products?select=id&limit=0` and OpenAPI root. Expect 200 and discovery of `begin_seo_run`, `seo_run_step`, `finish_seo_run`, `seo_run_status` after schema-cache propagation. Never log returned schema bodies or keys. Missing RPCs mean stop and diagnose; schema reload commands require their own scoped write authorization.
3. Service-role SELECTs of `seo_documents` and queue/health read views allowed by the reviewed grants succeed. Direct `seo_worker_control` table access must fail for service_role, anon and authenticated. Browser-role reads of SEO data must be denied, not merely return an empty result because no data exists. Check actual HTTP denial and SQL privileges together.
4. For RPC role transport checks, use only `seo_run_status()` after verifying its installed definition against reviewed SQL. It is a SELECT-only function despite its default PostgreSQL volatility classification. Service-role invocation returns sanitized state; anon and an existing authenticated non-admin user are denied. Do not test execute denial by invoking any mutating RPC: an unexpected grant would make such a probe a production write.
5. Use read-only SQL `has_function_privilege` and the postflight to establish that legacy reconcile/claim/complete/fail RPCs are denied and fenced RPCs are service-role-only. No legacy mutation probes, no manual lease-row edits and no grant changes during read-only acceptance.
6. Current authenticator statement/lock settings are 8 seconds. This is configuration evidence, not measured worker timeout. Measure effective REST cancellation on a separately approved synthetic hosted staging target with a disposable bounded sleep RPC, using the same role/timeout configuration and an HTTP deadline longer than SQL's expected limit. Verify SQLSTATE 57014 and actual completion/cancellation timing; remove the fixture under staging scope. Never install a sleep function, hold commerce locks, or inject failures in production. If staging is unavailable, hosted timeout acceptance remains blocked; do not silently waive it.

Existing `scripts/verify-seo-staging-package.cjs` and older recovery documentation execute/reference synchronous migration 001. They are historical evidence and **must not be used as the new SEO staging runner**. For any newly approved staging preparation, use synthetic fixtures, standalone 002 followed by run-control SQL, with exact reviewed hashes. The current worker deliberately binds the production project and rejects Vercel previews; production worker credentials must never be copied into staging. Testing an alternate staging binding requires an explicitly isolated test package, with no weakening of the production target guard.

## Disabled worker deployment acceptance

Verify a dedicated project ID distinct from the website, framework Other, Node 24.x, the pinned `.mjs` handler and imports, 60-second maxDuration, empty crons and `SEO_SYNC_ENABLED=false`. Verify expected environment-variable names and presence through metadata, without downloading secret values. Confirm deployed function metadata/build logs support the expected Node major and duration; website Fluid settings do not prove the new worker's settings.

Unauthenticated GET must return 401 when CRON_SECRET is configured (503 means it is not configured). Unsupported method returns 405. With activation independently confirmed disabled, one authorized GET should return 503 WORKER_DISABLED with no begin-run RPC. This authorized GET is excluded from automated read-only scripts because activation could drift; obtain deployment-acceptance scope before performing it. Inspect logs and SQL control state. A 200 HTML login page or platform 401/302 is deployment protection interception, not worker authentication success. Resolve the dedicated worker's access policy explicitly; do not disable website protection. Both website-to-worker and later Vercel cron delivery must be accepted.

## Manual activation and scheduler acceptance

Only gate C authorizes a real bounded run. Explicitly scope the first run, one unchanged-catalogue idempotency repeat, and an overlap attempt if desired. Before each, confirm target deployment and secret routing, no scheduler, healthy database and allowed role. Expected initial coverage is 38 active entities only if the current 34 products/4 categories remain unchanged. Record persistent latest-run counts, queue states, heartbeat, duration and no lease tokens in responses. Repeat on unchanged input completes zero extra jobs. A concurrently overlapping invocation returns 409; if the first finishes before the second starts, the result is inconclusive for concurrency rather than a failure. Never manufacture production delays or locks to force overlap. Do not automatically retry an unknown HTTP outcome; inspect durable status and expiry first.

GET representative product/category pages, canonical, title/description, JSON-LD and all sitemap types after the website update. Include a standard and preorder product; compare stock/availability facts with current read-only catalogue data. No checkout, order, payment or product edits are implied.

Gate D separately permits `0 3 * * *` scheduling and its configuration deployment. Require two observed invocations, actual alert delivery, heartbeat threshold 27 hours, queue-age/failure/partial-run monitoring and accepted daily freshness. Backlog/retry processing may take multiple days. Existing dashboard 15-minute freshness warnings must be explained or separately revised under that policy. Never use artificial staggered jobs to bypass Hobby limits.

## Failure and recovery

Any failed gate stops the next gate. Preserve reports and database state. Worker pause and website rollback are separate operations: disable both manual activation and worker schedule/activation under explicit incident authority, account for in-flight work, then roll back the website to the verified baseline if approved. Do not drop SEO tables, reset leases, restore the full database, regrant legacy RPCs or run the original trigger-disable migration as routine recovery. Investigate and approve any SQL repair separately.
