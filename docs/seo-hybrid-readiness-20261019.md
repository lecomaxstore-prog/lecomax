# Hybrid SEO readiness — local only

This supersedes the commercial-hosting recommendation in the October 18 Hobby preparation. Earlier evidence and candidates remain untouched. No migration, deployment, provider purchase, activation, scheduler, production write or secret change occurred.

## Architecture retained

Product/category rendering already constructs factual deterministic metadata from current catalogue data. It does not invoke a worker or AI. The optional approved-metadata read is React-deduplicated and cached for 300 seconds with the storefront-seo tag; its existing transport timeout is 1.8 seconds. Missing schema, unavailable storage or outdated source facts fall back locally. “Immediate” means independent of queue completion, not zero network latency. Existing catalogue/cache freshness remains relevant; no new per-visitor worker invocation is added.

Current approved metadata remains served when the worker stops. Changed facts instead receive deterministic current metadata; old approval remains stored and is flagged for revalidation, never silently erased or republished. Total database unavailability can prevent retrieving approved text, so fallback is the honest available result, not a promise to recover unavailable data. Canonical, price, availability, preorder status and structured data retain existing current-product rules.

The durable asynchronous queue reconciles SEO-relevant payloads (name, description, slug, category, brand, images, active), handles tombstones and processes only changed payloads, pending retries or expired leases. Stock/price changes alone do not enqueue SEO work. Unchanged documents do not age into paid regeneration merely because time passes. “Stale” means source revision mismatch or unfinished eligible work, not an arbitrary daily AI expiry. Reconciliation scans the small catalogue; processing is incremental. Leases, fenced run ownership, atomic completion, eight-attempt retry bounds and 100-job limit are retained.

Asynchronous enrichment here is deterministic SEO document synchronization, audit inputs and review workflow. There is no automatic background AI optimization, and no AI has been added to queue jobs. The existing optional Admin AI suggestion remains an explicit request/response editorial tool outside the worker. Automatic queued AI would require a separately reviewed durable task type/cost budget; it is not silently enabled as part of this hybrid release. Default and scheduled operations make zero AI calls.

No SEO triggers, foreign keys or writes touch checkout, inventory or payment tables. Worker polling reads committed catalogue data and writes SEO tables only. Shared database resource usage is not zero: bounded reads still consume database CPU/I/O. Previous SQL isolation/concurrency evidence is retained; migrations were not modified or rerun.

## Minimal local changes

- Admin generation reuses a valid current-source AI/manual draft without another provider call or database write. Outdated client versions still fail first; stale-source drafts regenerate. Human drafts are not overwritten by a Generate AI click. Simultaneous first-time AI requests across instances can still both contact the provider before optimistic SQL version protection chooses a winner; this is not an exactly-once billing guarantee. Keep AI optional/off for the lowest cost. Worker overlap remains durably fenced.
- Manual Sync supports a non-Vercel HTTPS endpoint only with exact server-side `SEO_WORKER_ALLOWED_ORIGIN`. It still requires full catalogue permissions, session/origin/rate checks, an independent secret, exact `/api/sync`, no redirects and no browser-exposed credentials.
- Both manual adapter and worker accept explicit `SEO_RUNTIME_ENV=production` on other hosts. If VERCEL_ENV exists, it takes precedence, so preview cannot override its guard.
- `operations/seo-vercel/node-server.mjs` exposes the unchanged bounded handler using Node 24 HTTP. Default bind is loopback, suitable behind an HTTPS reverse proxy; managed containers must explicitly set SEO_BIND_HOST=0.0.0.0 and PORT. Run `node node-server.mjs` from the isolated worker package. No built-in scheduler. It uses the same fixed official Supabase target and fenced RPCs. Do not use the historical direct-RPC CLI/systemd worker after run-control migration, because its unfenced RPCs are intentionally revoked.

## Hosting and commercial use

Official pages reviewed October 19, 2026 (local date); USD prices exclude tax and additional usage.

| Option | Cost / limits | Fit |
| --- | --- | --- |
| Vercel Hobby | Personal, non-commercial only; daily cron with hour-level precision | Not suitable for this shop, regardless of low SEO traffic. Earlier “no upgrade needed” statement was incomplete and must not guide rollout. |
| Vercel Pro | $20/month platform fee, one deploying seat and $20 usage credit; extra seats/usage billed separately | Lowest implementation effort if the shop remains on Vercel. Worker can be a separate project in the same paid team; not automatically another $20 project fee. Keep 60s duration and one daily schedule or manual-only startup. |
| Existing commercial Node host/VPS | Incremental worker hosting may be near zero within purchased capacity; host plan, monitoring, TLS and administration costs still apply | New Node adapter is directly suitable, subject to hosted acceptance. One scheduler calls the authenticated endpoint; durable fencing survives restarts. |
| Render paid services | Cron service minimum $1/month plus runtime billing; persistent HTTP service priced separately | A cron-only service does not supply the endpoint required by Manual Sync. Compare the complete HTTP + scheduler cost, not the $1 minimum alone. Paid business hosting alternative; validate selected service plan before purchase. |
| Cloudflare Workers Paid | Minimum $5/account/month, includes 10M requests and 30M CPU-ms; additional usage metered | Potential commercial alternative, but the Node HTTP server is not a drop-in Workers module. Needs an adapter and separate runtime/crypto/deadline acceptance; do not claim deploy readiness there. |

Sources: [Vercel Hobby restriction](https://vercel.com/docs/plans/hobby), [Pro pricing](https://vercel.com/docs/plans/pro-plan), [cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Render cron billing](https://render.com/docs/cronjobs), [Render pricing](https://render.com/pricing), [Cloudflare pricing](https://developers.cloudflare.com/workers/platform/pricing/).

Recommendation: if keeping the shop on Vercel, evaluate a Pro upgrade for the whole commercial shop, then use the existing worker project design. Moving only SEO elsewhere does not resolve the website's Hobby restriction. If an already-paid Node host exists, use the portable adapter there after acceptance. No plan purchase or provider migration is authorized or performed.

## Usage estimate

Basis: last verified catalogue, 34 products + 4 categories, not a new live count. Normal successful run uses `4 + 2N` RPCs: begin, reconcile, one claim/completion pair per job, final empty claim, finish. Batch-limit and error exits differ. RPCs are database requests, not separate Vercel function invocations.

| Scenario | Worker invocations | RPCs | AI calls |
| --- | --- | --- | --- |
| Initial 38 entities, if within time budget | 1 | 80 | 0 |
| Unchanged catalogue check | 1 | 4 | 0 |
| Three changed entities | 1 | 10 | 0 |
| Daily schedule, unchanged, 30 days | 30 | 120 | 0 |
| Initial 38 + three edits/day for 30 days, initial separate | 31 | 380 | 0 |

At modelled 100ms/RPC, initial work is about 8s and unchanged work about 0.4s; at 250ms/RPC, the initial run will hit the conservative claim cutoff (~15s elapsed, since 30s is reserved) and require multiple bounded runs. These are estimates, not measurements. Absolute handler budget remains 45s plus bounded finalization, within configured 60s. Thirty runs reserving the full 60s mean at most 30 allocated runtime minutes for those invocations, not 30 CPU minutes or a guaranteed bill. Network/database latency and provider resource billing determine actual cost.

Start manual-only (zero idle scheduled invocations), batching edits before one Admin Sync, or choose one daily reconciliation for unattended freshness. Never auto-call from product views or commerce writes. Daily retries/backlog may take additional days; no hidden self-chaining. Alert on partial/failed runs, backlog age and >27h heartbeat only when daily cadence is actually enabled; manual-only must not generate false daily-heartbeat alarms. Nominate recipient and prove delivery before unattended operation.

## Release and acceptance

New local candidates: `release/seo-hybrid-20261019` and `release/seo-worker-hybrid-20261019`, manifests under `artifacts/seo-hybrid/`. The old `release/seo-final-20261018` and eight-file Account 6 worker manifest stay historical and unchanged; current root handler intentionally differs. Use the new manifests for any future deployment review.

Migration sequence and exact SQL hashes remain unchanged: standalone 002, then run-control, each with its own postflight and separate authorization. Synchronous 001 remains audit-only. Existing provisioning/migration/disabled-deployment/manual-activation/scheduling/incident gates still apply, now after a commercial hosting choice. No newly required migration.

Local validation: 48 focused metadata, API, authorization, sitemap, preorder and worker tests passed; two additional workload/real-loopback adapter tests passed. TypeScript and focused route lint passed. Existing module-type warnings and Next lint deprecation remain. No repeat full build or SQL/concurrency rehearsal was needed for unchanged frontend/SQL; this release still needs a clean hosted build, actual latency measurements, real Admin authentication, PostgREST privileges/persistence, effective timeout measurement and alert delivery under the existing gates. Local tests are not production certification.
