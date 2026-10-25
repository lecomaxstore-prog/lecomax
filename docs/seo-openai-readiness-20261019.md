# OpenAI hybrid SEO — local implementation

No real API requests, production migrations, production writes, deployment, scheduler or worker activation occurred. All prior candidates/reports remain preserved. New source packages are `release/seo-openai-20261019` and `release/seo-worker-openai-20261019`; hashes live in `artifacts/seo-openai/`.

## Provider and factual contract

The worker uses the official `openai` Node SDK, pinned to 6.42.0 in its own package/lockfile (already installed in the workspace). Routine requests use exactly `gpt-6-luna` with reasoning none. Advanced requests use exactly `gpt-6-sol` with reasoning low and require an explicit editorial reason. There is no automatic expensive-model escalation. Official Responses API origin is fixed, `store:false`, standard service tier, 1,200 output-token maximum, 6-second provider timeout and SDK retries disabled. OPENAI_API_KEY is worker-server-only and is never returned or included in client bundles. Website routes only enqueue/read/approve.

Strict JSON Schema and independent runtime validation require French and Arabic title, description and keyword arrays, reject unknown fields, and constrain every phrase to source-backed candidates. The model selects useful phrasing; it cannot introduce a brand, specification, number, price, stock, delivery or warranty claim. Arabic uses Arabic editorial templates with the exact source product/brand name, rather than unverifiable free-form translation of specifications. This deliberately bounds creative optimization. Keywords are editorial suggestions, not meta-keyword tags or a ranking guarantee. Human review still determines publication.

Mirai is an optional second provider using its separate SEO_AI_API_KEY/BASE_URL/MODEL. It requires both database permission and SEO_MIRAI_FALLBACK_ENABLED=true plus a verified per-request cost allowance. The official key is never sent to Mirai. Both providers use the same strict validation. Unsupported structured output, refusal, malformed JSON, fabricated content, timeout or missing configuration falls back to deterministic bilingual metadata. Generation never overwrites existing approvals.

## Durable storage and cost controls

New additive SQL is `operations/seo-vercel/supabase/migrations/202610190001_seo_ai_budget.sql`, prepared only. Apply only after separately approved standalone 002 and run-control SQL; never synchronous 001. It adds SEO-only settings, job/result, approval archive and budget-event tables. No commerce trigger, commerce foreign key, catalogue write or payment integration is introduced. Row security and revoked direct table grants restrict all operations to narrowly exposed service-role RPCs behind the existing Admin authorization.

Jobs are deduplicated by kind/entity, exact SEO-relevant source fingerprint, schema version and model tier. A completed result is reused across processes/restarts; unchanged stock/price alone does not invalidate SEO. Advanced and routine caches are intentionally distinct. Changed source creates a new retained record. Generated French/Arabic data stays in the job record permanently; explicit approvals append an immutable bilingual snapshot and use the existing transactional SEO publication path for French. Arabic approval is retained for future locale routing; this change does not create Arabic storefront URLs. Approval requires current source and document version.

The existing worker first drains its deterministic queue. It then processes at most three AI jobs while at least 35 seconds remain before each claim; the existing total 45-second work deadline and 60-second function limit remain. AI jobs share the existing durable run lease. No new scheduler or per-product invocation is added. A slow provider may reduce actual throughput to one job/run; initial 34-product generation could therefore require roughly 12–34 invocations, rather than promising a single run. Manual Sync keeps its existing authorization and bounded-worker path.

Before a paid request, SQL serializes a monthly UTC reservation against the owner's cap: $0.01 for Luna or $0.10 for Sol, plus the separately configured Mirai allowance if enabled. These conservative reservations exceed the bounded OpenAI input/output estimate. Successful usage settles the estimate and releases unused allowance. Missing usage or an unknown provider outcome keeps a conservative full estimate. A crash before settlement leaves the reservation intact and the job is not automatically retried. Prior reservations survive a lowered budget. Month attribution uses request-start month; this is an application spend control, not a replacement for the provider invoice/project-wide limit.

The default database configuration is disabled with a $0 monthly cap. Worker SEO_AI_ENABLED also defaults off. Only the owner can change the 0–100 USD cap and enable reservations; full catalogue editors can enqueue/review. The dashboard shows input/output tokens, estimated USD, reserved USD, pending and uncertain jobs, and bilingual approval previews. No provider errors, keys or run/lease tokens are returned. A reported charge above its reservation disables further database reservations for investigation. No automatic reset, blind retry or deletion of uncertain jobs is provided.

Use a dedicated OpenAI project/key and provider spend limits for additional protection. The application cap covers this SEO integration only, not other features sharing an account/key. Mirai prices are not assumed: verify its maximum charge before enabling fallback; the dashboard conservatively counts its entire allowance when attempted. Completed deterministic fallback is also cached; changing provider configuration alone does not silently trigger a new paid attempt for the same source/tier. An explicit retry/reconciliation policy would need review before adding it.

## Estimated cost before any paid calls

Official standard short-context prices per million tokens, reviewed October 19 local date:

| Model | Input | Cached input | Output |
| --- | ---: | ---: | ---: |
| GPT-6 Luna | $0.10 | $0.01 | $0.50 |
| GPT-6 Sol | $2.00 | $0.20 | $10.00 |

At an illustrative 1,000 input + 400 total output tokens per bilingual product, uncached:

| Workload | Estimated API cost |
| --- | ---: |
| One Luna generation | $0.0003 |
| One Sol generation | $0.006 |
| 34 products with Luna | $0.0102 |
| 34 Luna + 3 selected Sol reviews | $0.0282 |
| 38 products/categories with Luna | $0.0114 |
| Reuse of saved results | $0 |

These are scenarios, not measured token counts or a bill. Output includes reasoning tokens where applicable. The 12,000-byte serialized input/schema ceiling plus 1,200 output limit keeps conservative reservations substantially above the nominal maximum; actual model framing, cache writes, rate changes, tax and hosting are not represented by the simple table. Current cache-write rates are $0.125/M Luna and $2.50/M Sol. The SDK usage estimator discounts reported cache hits but does not claim exact cache-write invoice reconciliation. A proposed initial $1 application cap would leave ample headroom; it has not been enabled. Total API spend during this implementation: $0.

Sources: [Luna model](https://developers.openai.com/api/docs/models/gpt-6-luna), [Sol model](https://developers.openai.com/api/docs/models/gpt-6-sol), [official pricing](https://developers.openai.com/api/docs/pricing), [Structured Outputs and Node SDK examples](https://developers.openai.com/api/docs/guides/structured-outputs).

## Local verification and remaining gates

Mocked tests use the real official SDK with an injected transport, so no HTTP request can reach a provider. Coverage includes exact model/schema/options, invalid/refused/incomplete output, no automatic retry, Mirai fallback, key separation, deterministic fallback, cached token pricing, real Admin guard chain and owner-only budget changes. PGlite exercises actual SQL persistence, reuse, approval archive, stale source, role grants and budget exhaustion. Separate synthetic PostgreSQL tests use concurrent connections to prove duplicate enqueue coalescing, budget serialization, crash-reservation retention and commerce updates while AI tables are locked.

Browser fixtures render the real component/CSS at 390/1440 CSS pixels and exercise cost display, Arabic RTL, queueing, advanced-reason requirement, budget save and approval. Fixture screenshots are not a hosted preview. TypeScript and focused lint passed. No live model quality/latency, account model availability, hosted schema cache or deployed authentication claim is made. The initial local PostgreSQL sandbox launch failed with Windows token restrictions; the explicitly authorized localhost-only retry passed. An initial UI harness bundler setup issue was corrected before browser verification.

Before real calls: choose commercial-compatible hosting (Vercel Hobby is still unsuitable), review new SQL hash and postflight, prepare a fresh backup at the approved migration window, provision secrets securely, deploy with both worker/AI disabled, and verify hosted privileges/authentication. Separately approve a bounded paid canary with an explicit dollar ceiling and product selection. Only then enable the database budget and AI worker flag. Approval of paid calls does not authorize migration/deployment/scheduling, and none is requested or executed by this document. Uncertain paid outcomes require provider-usage reconciliation before any retry.
