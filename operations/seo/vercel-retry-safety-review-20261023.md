# Vercel 53.4.0 retry and payload review

No deployment/upload executed. The recovery candidate, consumed verifier guard and successful verifier evidence remain unchanged. This review supersedes the earlier implication that five upload retries themselves can create five deployments.

## Exact installed-client behavior

Source: `C:/Users/Ziko/AppData/Roaming/npm/node_modules/vercel/dist/chunks/chunk-LBP7YFBV.js`.

- `uploadFiles` (around 47865–47990) retries a POST to `/v2/files` for recognized network errors, with five retries (up to six attempts), factor six, minimum delay 10 ms. It sends the same content hash and bytes. Not every HTTP 5xx is retried: the implementation's catch/classifier can bail for errors outside its network-error list.
- `postDeployment` (around 47300) makes one `/v13/deployments` POST through `fetchApi`; that helper directly uses node-fetch, not the CLI's generic retrying client. Network/JSON/server errors are yielded to the caller; no creation retry loop appears here.
- `upload` (around 47800) first calls the deployment endpoint to discover missing files. On `missing_files`, uploads run, then the deployment endpoint is called again. Therefore one CLI invocation is not one creation-endpoint POST. Normal expected behavior is zero deployment records for missing-files rejection and one for the subsequent success.
- Status polling has separate GET retries. They do not create deployments. A source-file hash, cache hit, `forceNew`, metadata tag or existing deploymentId is not a documented deployment idempotency key. `deploymentId` requests a redeployment; it is not a recovery lookup.

Four loopback-only tests executed the unmodified installed client's exported createDeployment method with fake credentials and one synthetic file: cached success (1 creation POST); missing-file/upload socket loss (2 creation POSTs, 2 upload POSTs, 1 simulated record); lost creation response (1 creation POST, stop); HTTP 500 creation (1 creation POST, stop). No real Vercel request or verifier execution. These demonstrate client behavior for those cases, not provider-wide exactly-once semantics for every failure state.

## Idempotency and options

Official file-upload API documents SHA1 integrity and HTTP 200 for a file already uploaded. Repeating identical blob uploads is distinct from repeating creation. Bounded uploads are compatible in principle with the intent of one deployment, if creation cannot be repeated and ambiguous outcomes halt. They violate the previous literal ban on all automatic retries unless that approval condition is changed.

No documented CLI no-retry flag was found. Archive changes packaging, still using the upload/creation machinery. Prebuilt changes the artifact format, not creation semantics, and would require a separately validated build with correct Preview configuration; existing local fixture builds must never be uploaded. Neither option solves idempotency.

The official Deployment API supports upload-first, SHA-referenced creation. Its documented schema does not expose an idempotency key guaranteeing duplicate suppression. The SDK documents retry configuration, but SDK defaults must not be assumed retry-free. A direct HTTP adapter with no retry machinery is simpler to audit for this operation.

| Option | Finding | Recommendation |
|---|---|---|
| A: upload-first API, no retries, one guarded creation POST | Can enforce at-most-one client creation request. Does not prove provider exactly-once execution. Stops permanently on ambiguous response. | Preferred after remaining gates and explicit method approval. |
| B: one CLI invocation with bounded blob retries | Tested failures do not replay creation; normal missing-file negotiation still uses two creation POSTs. No comprehensive server duplicate-prevention contract found. | Upload retries alone are not unsafe, but the user's strict demonstrable duplicate-prevention requirement is not established. |

## Proposed A procedure

1. Revalidate candidate, provider identity, Preview-only staging credentials, protection, integrations, domains and empty-cron config. Never rerun the hosted verifier.
2. Approve the complete filtered upload manifest and config override. Validate the filtered package's build before execution; prior full-candidate build evidence is insufficient for this changed packaging.
3. Use official `/v2/files?teamId=team_yFLUcpSvgQi8EQuvuorOZW7w`, once per unique SHA1, with raw bytes, length and x-vercel-digest. Durably journal each attempt before sending. No redirects, retry middleware, proxy replay or secret-valued arguments/logging. Stop on every failure; do not create if any upload is unconfirmed.
4. Persist an exclusive, durable authorization guard and body SHA256 before creation. POST `/v13/deployments?teamId=team_yFLUcpSvgQi8EQuvuorOZW7w` exactly once. Body is the saved request manifest: pinned staging project/name, SHA file references, non-secret review metadata. Omit target (documented Preview default), gitSource, deploymentId, customEnvironment, env/build.env and projectSettings. Use the uploaded private-source empty-cron vercel.json. No explicit aliases or production target.
5. Persist a sanitized receipt; verify project/team, target and protection via GET. On timeout, disconnect, 5xx, invalid JSON, missing_files or lost receipt: retain consumed guard, stop; never repeat POST. Use GET deployment inventory and metadata/source/time correlation to recover the ID. No matches is not proof of non-creation; wait/read or escalate to provider support. Multiple matches means quarantine/stop, never automatically delete or retry.
6. Run separately authorized protected read-only acceptance only after source/build/identity checks. No production promotion.

`retry-free-transport.mjs` is an inert, injected-transport state machine, not a live deploy command. Five local tests cover success, lost upload response, lost creation response, creation 500 and missing_files; each blocks re-entry, never retries, and calls creation at most once. It deliberately sacrifices availability after ambiguity. A real network/auth adapter and preflight wiring still require implementation/review and transport-level tests before execution. No CLI internals were patched.

## Complete payload inventory

Artifacts under `artifacts/seo-preview-resume-20261023/`:

- `retry-review-cli-file-list.json`: unmodified installed buildFileTree output, 2074 entries including six non-regular directory entries. No uploads performed.
- `retry-free-payload-review.json`: every included file with source, size, SHA1/SHA256; every excluded entry; untracked-file disposition; scan findings and limitations.
- `retry-free-deployment-request.json`: full proposed creation body with all 1204 file references. It contains no credential values.
- `retry-free-vercel.json`: explicit private source, Next.js, empty crons and Git disabled. Original candidate config untouched.

The old CLI tree selected tests, docs, mobile application/release material, SQL utilities and local source-library directory entries. The proposed allowlist excludes these and keeps app/components/lib/public, required configuration, build scripts and their course helpers, mobile shared library code, the existing shared learning modules and public database CA certificate. All nine untracked runtime files are included. Five untracked tests and the consumed verifier CLI script are excluded deliberately. Existing verifier library source is inert unless invoked; the storefront build procedure does not call it.

All 2601 baseline hashes still match, with 137 tracked modifications and 15 untracked files. No candidate file changed. A scan for private keys, credential token patterns, JWTs and password-bearing database URLs found zero matches in the proposed payload. This does not prove absence of every possible embedded secret. The reduced package has not been built, and source-library generated content will differ; it remains a draft, not a release-ready artifact.

## Alias limitation and approval change

Vercel documents generated immutable deployment URLs and automatic latest-Preview aliases. No verified documented zero-generated-alias switch was established for this source Preview. Explicit aliases can be omitted and production custom-domain assignment avoided by Preview targeting, but `alias: []` must not be treated as a universal prohibition on platform-generated aliases.

The current literal 'no aliases' condition remains a blocker. Either permit protected Vercel-generated Preview aliases only (never lecomax.com, production domains, explicit alias/promote operations) or obtain a supported provider mechanism proving none will be created. Do not silently relax it.

## Final assessment

Bounded content-hash upload retries do not inherently violate one authorized deployment. The earlier blanket concern was too broad. Nevertheless, exactly-once provider creation cannot be asserted from the reviewed docs/tests. Recommend A with an at-most-once client guarantee, permanent fail-closed ambiguous-response handling, and explicit acceptance of generated protected Preview aliases. Execution remains NO-GO until packaging/build, real adapter and final security gates pass. Production and Release E remain NO-GO.

Official references:
- https://vercel.com/docs/rest-api/deployments/upload-deployment-files
- https://vercel.com/docs/rest-api/deployments/create-a-new-deployment
- https://vercel.com/docs/cli/deploy
- https://github.com/vercel/sdk/blob/main/README.md#retries
- https://vercel.com/kb/guide/how-to-alias-a-preview-deployment-using-the-cli
- https://vercel.com/docs/cli/alias
