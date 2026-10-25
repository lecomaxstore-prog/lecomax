# Premium SEO editorial upgrade — local preparation

No paid generation, production database writes, deployment, migration or scheduler activation occurred in this upgrade session. The previous single Luna canary remains preserved. There is no measured Astra/Sol quality winner yet.

## Model support and comparison awaiting approval

Official documentation supports the exact `gpt-6-astra` identifier, Responses API and Structured Outputs. Astra supports `low` reasoning, not `none`. Read-only account metadata checks returned matching model IDs for Astra and Sol. Access metadata does not establish generation quality, latency, rate-limit capacity or guaranteed completion.

The concrete plan is `artifacts/seo-premium/comparison-1792401710535/plan.json`. Product: `c-baasploa-course-homme`, ID `92452bdd-884b-4c91-a411-aad4e9150c95`. A GET-only catalogue lookup confirmed one active product. The identical sanitized name, brand, category and description are saved in `source.json`, with a SHA-256 hash. No prices, stock, sizes or inferred materials are provided. Both complete request bodies are saved and hashed; they differ only in model ID. Both use low reasoning, standard processing, no tools/history, `store:false`, and a 2,000-token output ceiling including reasoning.

| Model | Counted input | Input allowance including 256-token margin | Maximum output | Conservative maximum USD |
| --- | ---: | ---: | ---: | ---: |
| gpt-6-sol | 569 | 825 | 2,000 | 0.0220625 |
| gpt-6-astra | 569 | 825 | 2,000 | 0.1103125 |
| Combined | | | | **0.132375** |

These maxima assume the current published standard short-context prices and charge every input token at the higher cache-write rate. At 1,000 total output tokens per request, the illustrative combined estimate is $0.068535. Actual output length and cost cannot be known before generation. Both figures are below the requested $0.25 total cap. No generation occurred while obtaining model metadata or input-token counts.

The exact proposed approval is: **Authorize two local comparison requests, one to gpt-6-sol and one to gpt-6-astra, for this saved Baasploa source and identical saved prompts, with a combined maximum of $0.132375; no retries, Mirai, publication or production writes.** If prices, source or request hashes change, stop and reprice before execution. A lower count at execution must not authorize changing the prompt or increasing output. The prepared comparison tool rejects generating endpoints and has no paid execution mode. This document is not approval.

Before those requests, the execution harness must reserve the full combined maximum in a durable isolated local budget, include the prior canary spend, and use permanent single-use markers per model. Save exact output, actual model, input/output/reasoning/cache usage, latency, schema result and quality violations locally. An incomplete/refused/uncertain result is a result, not authorization to retry. Human review uses anonymized A/B outputs: factual support 40%, language fluency 30%, Morocco search relevance 20%, distinctive usefulness 10%. Unsupported facts, invalid schema/length, inappropriate French prose in Arabic, and duplicates are hard failures. Neither model wins by reputation.

## Implemented behavior

The tested Luna/Sol phrase-selection path and its deterministic fallback remain intact. New versioned editorial tiers are `editorial-luna`, `editorial-sol`, and `premium` (Astra). Per-job model selection is explicit in Admin and part of the durable source/version/tier cache key; no automatic model escalation occurs. Astra is the default selection for new premium editorial requests. Legacy jobs and approvals are not rewritten.

The editorial schema includes French and Arabic titles, meta descriptions, 3–6 keyword suggestions, useful product descriptions, and claim/source-quote evidence. Limits: titles 20–65 Unicode characters, meta descriptions 110–160, product descriptions 180–900, keywords 2–60. Full original catalogue names appear in product descriptions, while Arabic surrounding prose and keywords must be Arabic; actual brand/model names stay unchanged. Descriptive French catalogue names are not treated as reasons to write whole French sentences in Arabic copy.

Validation rejects malformed fields, markup/control characters, duplicate keywords, changed identity, unsupported numbers, selected unsupported material/feature terms, commerce/superiority claims, incorrect script balance and evidence that does not quote the supplied source. Exact and near-duplicate checks compare prior generated content for other entities; SQL rechecks exact duplicates under the completion lock. This is not a web-wide plagiarism check. Language-script checks and self-reported evidence are not proof of semantic entailment or professional fluency. Human factual and language review remains necessary. The new SQL blocks editorial publication, and Admin visibly disables it during this comparison stage. Legacy metadata approval still works. Long product copy stays in the saved suggestion and is not written to commerce product descriptions.

An invalid, refused, incomplete, over-budget or failed editorial response returns deterministic metadata without a second paid attempt. No Mirai fallback is used. Successful-but-invalid output still accounts for usage; uncertain outcomes retain the full reservation. Production worker calls use at most three seconds for counting and nine seconds for generation, within the existing bounded run. Actual Astra latency remains unknown, so a timeout is possible and must not be silently retried. Runtime/editorial flags remain disabled; ordinary legacy workers cannot consume pending editorial jobs.

## Budget and approval policy

Prepared migration `operations/seo-vercel/supabase/migrations/202610190002_seo_editorial.sql` follows the existing decoupled, run-control and AI-budget migrations. It preserves records, disables activation, keeps the current cap at its existing value or reduces it, and limits future owner settings to $5/month. It does not automatically raise a $0 cap or enable spending. All new paid jobs require explicit owner authorization for one request; enqueueing is not approval. Audit entries are retained. Runtime authorization and the database cap are both required.

Reservations: legacy Luna $0.01; legacy Sol $0.10; editorial Luna $0.01; editorial Sol $0.05; Astra $0.20. Exact input counting and a 256-token margin must fit the configured 4,000-token input allowance, 2,000-token output limit, authorized ceiling and reservation before generation. SQL serializes monthly and lifetime commitments, retains uncertain/crashed reservations, and caps cumulative SEO commitments at $50 across month changes. Settlement retains fractional microdollars rather than rounding down to six decimals. The known earlier local canary is conservatively included as $0.000246 of external spend.

These guards protect the SEO ledger. They cannot guarantee the balance of a shared OpenAI account or account for unrelated features using the same project/key. Reconcile other usage into external spend and verify provider/project billing controls before activating any hosted worker. The user's reported $50 credit is not independently verified. No hosted budget or billing setting was changed.

## Validation and packages

- Node 24 regression suite: **73 passed**, covering existing SEO/SDK/worker tests plus editorial checks and isolated SQL. Initial SQL syntax/concatenation errors were corrected before the passing run.
- TypeScript and focused ESLint passed. Syntax checks passed.
- Browser fixture passed at 390/1440 widths: model choices, Arabic RTL, premium enqueue without payment, consent cancellation/confirmation, $5 input ceiling, and premium publication blocked. The initial fixture selector typo was corrected; no production browser session or hosted preview was used.
- Separate localhost PostgreSQL concurrency test passed: duplicate enqueue coalescing, concurrent premium reservations within cap, retained crash reservation, stale-token rejection, and commerce updates while AI tables were locked. Initial Windows sandbox token creation failed; the loopback-only permitted retry passed and the server was stopped.
- Build evidence is written to timestamped `artifacts/seo-premium/build-*.json` / `.log`. The build uses placeholders, not hosted credentials. Its final status is recorded in the linked Change History verification report.

New source-only candidates: `release/seo-premium-20261019` and `release/seo-worker-premium-20261019`; manifests are in `artifacts/seo-premium/`. All preceding candidate overlays were hash-checked before packaging. No old candidate or backup was overwritten. The worker package includes the new editorial module and pinned SDK lockfile. Before any future deployment, refresh the website candidate's bundled append-only history from the current learning app and recheck source/base drift; no deployment is authorized here.

Remaining gates: explicit approval for the local comparison; human quality review after results; separately approved production migration, fresh backup, hosting/configuration, hosted authorization/privilege tests, activation and cron. Do not infer a quality winner or production readiness from mocked tests or model metadata access.

Sources: [Astra model](https://developers.openai.com/api/docs/models/gpt-6-astra), [Sol model](https://developers.openai.com/api/docs/models/gpt-6-sol), [official pricing](https://developers.openai.com/api/docs/pricing).
