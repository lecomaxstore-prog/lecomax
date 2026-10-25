# Protected staging Preview: final local preflight

Recorded: 2026-10-23T15:09:46.170Z

**GO to request explicit approval for one protected staging Preview. No live execution is authorized. Production: NO-GO; Release E remains on hold.**

## Checkpoint and preservation
- Candidate directory: .recovery-seo-preview-isolated (its own Git working tree).
- Branch: preparation/seo-preview-credential-20261023
- Actual Git SHA: 8a12abcce38c0dc557a9ef9f86c3ce3dd113e863. This is the observed SHA, correcting the handoff's transposed character.
- All 2,601 baseline file hashes match; 137 tracked modifications and 15 untracked files remain. No candidate source edits, resets, cleanup or commits were made.
- The successful hosted verifier evidence and consumed verifier-only guard remain unchanged. The only top-level submission guard is the existing verifier-only guard. Synthetic guard tests use separate fixture directories.

## Interruption investigation
The exact attempted PowerShell command was: node artifacts/seo-preview-resume-20261023/validate-option-a-payload.cjs (requested with require_escalated).
The 2026-10-23T14:39:54.074Z session tool result states that automatic review could not complete because the account hit its usage limit, and explicitly states the action was not executed. This was a review failure, not an unsafe-action determination. Therefore that rejected command performed no file changes, network operation, upload, deployment or guard consumption. The preceding successful operation had already written option-a configuration and the unverified harness. This session used the supported approval review workflow for its revised builds; review succeeded.

## Packaging correction
The original 1,204-file package failed course validation because module references require README.md, .gitignore, two academy-lab examples, scripts/run-migrations.mjs and scripts/setup-chat.mjs. Adding only .gitignore would not solve it. Shipping migration tooling solely to satisfy educational references was rejected.

The unchanged generator and validator ran in a separate local audit copy containing those references. They passed 635,429 checks (48 modules, 192 lessons, 3 languages). All generated output matches the candidate after line-ending normalization. A deployment prebuild verifies exact SHA-256 hashes of 177 source/generated course files. Migration scripts and audit copies are not in the payload.

Actual Next.js dependencies missing from the old filter were added: scripts/source-inspector-loader.cjs and operations/seo-vercel/lib/environment-target.mjs. A Preview-only terminal route override returns 403 without importing node-pty or creating its timer. This resolves the fact that node-pty has Windows/macOS prebuilds but no Linux prebuild under --ignore-scripts. The original candidate terminal route is untouched.

The Preview-only next.config.js pins outputFileTracingRoot to the package and disables disposable webpack disk caching. Vercel config has no crons, no Git deployment connection and private source. Its install command is npm ci --include=dev --ignore-scripts --no-audit --no-fund; its build command verifies the course certificate, refreshes the source library and runs scripts/next-build.mjs. Production configuration is unchanged.

Native audit: argon2, sharp, unrs-resolver and Next SWC load successfully from the clean install. The lockfile contains the Linux x64 optional packages for sharp/libvips, SWC and unrs; argon2 ships Linux prebuilds. No built server trace imports node-pty. Linux execution itself remains untested.

## Reviewed inventory
- Final manifest: artifacts/seo-preview-resume-20261023/certified-payload-v5.json
- Final request: artifacts/seo-preview-resume-20261023/certified-request-v5.json
- Files: 1208; bytes: 101190260.
- Request SHA-256 (JSON.stringify of parsed request): f9083972cebc378c0790273e30410342c6aff7b2a70607fea1b5df38f84526e0
- All selected source and isolated-copy hashes match. No selected .env, .git history, test artifacts, private documents, migration scripts, hosted-verifier entrypoint or unrelated artifact directories. Selected shared mobile/learning modules support the existing application; full mobile/learning projects are excluded.
- Secret-pattern scan: zero findings. Browser bundles contain neither the synthetic service credential nor its environment variable name. Pattern scans cannot prove absence of every possible secret.
- Earlier manifests and failed build evidence are retained. The v3 manifest is incomplete from ENOSPC and MUST NOT be used. Only v5 is reviewed.

## Validation results
| Check | Result |
|---|---|
| Clean install | PASS: 604 packages, lifecycle scripts disabled |
| Course prebuild | PASS: full generation/validation plus package hash certificate |
| Filtered Next.js production build | PASS: 226 generated pages |
| Explicit TypeScript | PASS |
| Candidate regressions | 120/120 PASS |
| Focused security tests against filtered source | 62/62 PASS (19 credential, 18 email, 13 read-only, 12 verifier/error handling) |
| Filtered runtime/browser acceptance | 37/37 PASS; four hydrated browser pages; no page errors or unexpected outbound requests |
| Product images | 30/30 HTTP 200 with matching SHA-256 |
| Output traces | 288 checked; no outside/missing paths; no node-pty traces |
| API adapter and submission guards | 50/50 PASS; no external requests |
| Unmodified CLI loopback behavior | 4/4 PASS; retained distinction between upload retries and creation calls |

Acceptance covers home/Boutique/product/categories, canonical URLs, product JSON-LD presence, sitemap index and five shard types, robots/noindex, restrictive CSP, blocked auth/admin/contact/orders/payment/IndexNow/cron routes, all tested mutations, remote-image rejection and unknown-product 404. Fixtures are deterministic; no real database requests, emails or payments occurred. The original full-candidate build and this newly passing filtered build are separate evidence.

Evidence: certified-build-result-1792767800246.json; certified-acceptance-1792767852804.json; certified-validation-focused-1792767902405.log; certified-inventory-audit.json; certified-trace-audit.json; certified-transport-and-checkpoint.json (all in artifacts/seo-preview-resume-20261023).

## Provider target and transport
Project: lecomax-seo-staging / prj_jPniwpH4s81bhISVReUKTQN0GwvD. Team: team_yFLUcpSvgQi8EQuvuorOZW7w. Staging database reference: tyltharlnbxrxibuxyye.

GET-only audits at 14:49Z and 14:53Z verified protection for all deployments, zero protection exceptions, private source, no Git connection, no cron definitions, no shared environment inventory, both sensitive variables scoped only to Preview and all checked safety flags correct. No sensitive values were retrieved. One earlier broad metadata read failed; its subsequent diagnostic GET-only run passed. Existing generated domain: lecomax-seo-staging.vercel.app; no Production domain attached or changed.

The native HTTPS adapter accepts only api.vercel.com:443 and the exact staging-team paths. It disables connection reuse, follows no redirects, makes no retries, imposes a timeout and sanitizes failures. Mandatory protection verification precedes uploads. Durable exclusive-create guards prevent concurrent/repeated entry; each unique file hash has at most one upload call; one creation call site runs only after every upload is confirmed. Any ambiguous creation/upload response stops permanently for that guard. Responses must match project, Preview target, deployment ID and a generated vercel.app URL. This is an at-most-once client submission policy, not a claim of provider-side idempotency.

Official references: [upload API](https://vercel.com/docs/rest-api/deployments/upload-deployment-files), [creation API](https://vercel.com/docs/rest-api/deployments/create-a-new-deployment). The documented omitted target selects Preview. No aliases/domains are submitted in the request.

## Exact proposed next steps — only after separate explicit approval
1. Recheck the v5 request hash, every source hash, current protection, target identity, Preview scopes and disabled flags with GET-only reads. Reconfirm capacity and approval for this exact digest.
2. Use one durable directory named artifacts/seo-preview-resume-20261023/approved-storefront-submission. Refuse any existing operation/creation guard; never clear or substitute a directory after ambiguity. This directory has not been claimed.
3. Load the Vercel bearer token into memory without logging it. Compose createRetryFreeRequest with submitReviewed using the v5 request and manifest. No live CLI entrypoint is currently provided.
4. Upload each unique verified hash once to /v2/files with the fixed team ID. Stop on any unconfirmed response; do not retry.
5. Persist the creation guard, then make at most one POST to /v13/deployments with the fixed team ID and v5 body. Target, aliases, domains, gitSource and inline environment overrides are omitted. Never resubmit after ambiguity.
6. Observe status using GET only. Accept only protected automatically generated Preview URLs. Validate hosted protection and storefront behavior separately before any use; do not rerun the consumed credential verifier. A failed build or ambiguous result does not authorize another deployment.

## Remaining risks and limits
The Linux/Vercel build, provider upload behavior under real failure and live staging-backed storefront acceptance have not run. Provider configuration can drift and must be rechecked immediately before an approved submission. Existing lint warnings remain. Disk exhaustion occurred locally; only newly generated disposable caches were removed, and NTFS compression preserved all source/evidence bytes. The final build passed after disabling its webpack disk cache. No live upload, deployment, promotion, secret update, migration, email, payment or Release E activation occurred.

## Changes Made
Local packaging, course certification, Preview-only terminal/build overrides, transport implementation and validation artifacts were added or corrected. Recovery candidate files remain intact. Linked append-only history records: seo-filtered-build-blockers-1792768186171, seo-filtered-preview-verified-1792768186171; verification follows seo-certified-payload-prepared-1792766736080. No public Preview exists, and no preview link is claimed.
