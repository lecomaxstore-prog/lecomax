# SEO resume review — 19 October 2026

## Current state and verified scope

Continued the existing dirty workspace without resetting, cleaning or discarding unrelated work. The website release candidate remains `release/seo-openai-20261019`: all 40 recorded overlay hashes match. All nine files in the preceding worker package also match its manifest. This is overlay verification, not a new full comparison against production. Historical candidates and backups remain intact.

The local production build passed with Node v24.22.0, Next 15.5.24 and placeholder credentials. Evidence: `artifacts/seo-openai/build-1792363523353.json` and corresponding log. Network permission resolved the prior Google Fonts sandbox failure; transient socket errors recovered. TypeScript and ESLint passed separately; existing image and hook warnings remain. Do not deploy the placeholder `.next` output. A clean hosted Linux build and real environment acceptance are separate gates.

Baseline tests: 67 passed across SEO regressions, general OpenAI integration mocks, worker/handler/provider tests and isolated PGlite SQL. After the accounting correction, six focused provider/SQL tests passed. No real provider generation was used. Logs: `resume-tests.log`, `resume-budget-tests.log`, `resume-types.log`, `resume-lint.log` under `artifacts/seo-openai/`.

## Integration review and correction

Official model pages confirm exact IDs `gpt-6-luna` and `gpt-6-sol`, Responses API, Structured Outputs, and the configured none/low reasoning efforts. Read-only GET `/v1/models/{id}` returned 200 with matching IDs for both using the configured local key. This establishes metadata access, not successful generation, capacity, quality or latency. Account-specific RPM/TPM and hosted secrets remain unverified.

The worker pins official SDK 6.42.0. Mock transport tests exercise the actual SDK. Requests use the fixed official origin, `store:false`, standard tier, strict schema, a 1,200 output-token cap and a 12,000-byte input/schema bound. Refused, incomplete, malformed and failed responses yield deterministic metadata. SDK retries are disabled; 429/transport failures retain a conservative allowance rather than blindly retrying. The six-second timeout still needs a real latency measurement. Uncertain jobs must be reconciled before retries. Mirai remains separately disabled and separately credentialed.

Fixed one genuine accounting gap: settlement previously priced all uncached input at the ordinary rate, although published cache-write rates are 1.25x. It now conservatively prices all non-hit input at the cache-write rate while retaining the reported cache-hit discount. This can overestimate actual charges; it is not invoice reconciliation. Reservations remain $0.01 routine / $0.10 advanced. SQL serializes monthly reservations, preserves crash reservations, fences worker runs, and disables new reservations after a reported overrun. The cap covers this integration only; other key consumers and future pricing changes require separate controls.

The corrected worker is packaged at `release/seo-worker-openai-reviewed-20261019`, with SHA-256 manifest `artifacts/seo-openai/reviewed-worker-package.json`. Prior packages were not overwritten. Website source did not require changes.

Local key presence was checked without displaying its value. `.env.local` is ignored and untracked; no public OpenAI key environment variable was detected. This is not proof of hosted secret configuration or a comprehensive repository secret scan. Both local activation flags were false; prepared SQL still defaults to disabled and a $0 cap. No production database settings were changed or freshly asserted.

## Disabled one-product canary

`node scripts/prepare-seo-canary.mjs` writes a new offline plan only; it has no paid execution mode. The prepared product is the existing local catalogue's `c-baasploa-course-homme`. The plan includes its actual name, source hash, exact bilingual schema and choices. Live active status/database identity must be revalidated before execution.

Proposed isolated test: one routine Luna request, at most $0.01, no Mirai, no automatic retry, no publication. At 1,000 input and 400 output tokens, ordinary standard pricing is $0.0003 and the conservative cache-write estimate is $0.000325. These are examples, not measured usage. Use an isolated local SQL database with only this source fixture and the reviewed migrations, set its cap to $0.01, and claim a durable reservation before the request. Save output, token usage and latency locally; retain uncertain reservations. Production SQL, settings and catalogue remain untouched.

Exact next paid approval: **Authorize one local, isolated OpenAI canary for `c-baasploa-course-homme`, using `gpt-6-luna`, with a total ceiling of $0.01, no retries or Mirai, and no production writes or publication.** Until explicit approval, do not execute it. Provisioning, migration, deployment, AI activation and scheduling require separate approval.

## Remaining production gates

- Supabase: reviewed standalone decoupled migration, fenced run control, then AI budget migration; all remain unapplied by this session. Never substitute the historical synchronous migration. Fresh schema/grant/hash checks and window-specific backup are required.
- Backup: historical metadata records a verified archive from 18 October, with restore verification not established by that metadata. No fresh production backup or restore was performed here; recheck the separate restore evidence and create a fresh backup at an approved window.
- Hosting: choose/provision commercial-compatible worker hosting. Prior notes flag Vercel Hobby suitability; this session did not verify the current account plan or hosted configuration. Portable Node HTTP runtime is prepared; hosting, dedicated secrets and protection acceptance remain pending.
- Vercel: clean hosted build, current alias/source drift check, real configuration and independent website/worker deployment approval. No deployment performed.
- Authentication: local authorization tests pass, including owner-only budget changes. Real hosted owner/editor/view-only/anonymous/expired/suspended/origin cases and effective RPC timeouts remain pending.
- Activation: keep runtime and database flags disabled until canary and hosted acceptance pass. Account metadata access does not prove response quality or latency.
- Scheduling: `operations/seo-vercel/vercel.json` has an empty crons array. Accept monitoring ownership, alert delivery, freshness/backlog policy and manual run evidence before separately approving a schedule. Do not use older unfenced worker instructions.

## Official references

- https://developers.openai.com/api/docs/models/gpt-6-luna
- https://developers.openai.com/api/docs/models/gpt-6-sol
- https://developers.openai.com/api/docs/pricing

No paid generation, production-changing operation, migration, deployment or cron activation occurred in this session. The user's reported $50 credit balance was not independently verified.
