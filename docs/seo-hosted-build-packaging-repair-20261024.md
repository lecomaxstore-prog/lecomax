# First hosted Preview build: packaging repair

**GO for requesting ONE new protected staging Preview attempt. No deployment was performed.** Local validation is complete. The previous authorization is consumed and has not been reused. Production and lecomax.com remain out of scope.

## Root cause and retained evidence

Failed deployment: `dpl_8XvapF5aDPPH57s6opLBLQqX67uC`, project `lecomax-seo-staging` / `prj_jPniwpH4s81bhISVReUKTQN0GwvD`. Read-only provider evidence confirms ERROR / BUILD_UTILS_SPAWN_1, `npm ci`, `npm run build`, and 1,204 downloaded files. Logs contain `fr/module-02-git-github references missing repository path: .gitignore` at `/vercel/path1/scripts/validate-course.mjs:252`.

The actual consumed request was `retry-free-deployment-request.json`, identified by the receipt and both guards with SHA-256 `e015311dd1b8dba8db6e7d3d0424f41f0aaaccaa5d2a146215c9ecf457ed27d4`. It was not the later 1,208-file certificate package.

`prepare-retry-free-payload.mjs` uses an explicit root-file/script allowlist which omits `.gitignore`, README, labs and referenced setup scripts. The validator correctly computes the repository root from its own script location. This is an upload omission, not an incorrect hosted repository root. An earlier certificate preparation copied the six references into a local audit directory only; that audit did not validate the actual hosted `npm run build` lifecycle.

Provider evidence is retained in [deployment.json](../artifacts/seo-preview-resume-20261023/hosted-build-repair/deployment.json) and [events.json](../artifacts/seo-preview-resume-20261023/hosted-build-repair/events.json). Original receipts, requests, manifests, scripts and guards were not rewritten.

## Exact package additions

The audit found 231 unique course-reference paths: 38 existing repository files and 193 student-created exercise paths. These six existing files were missing:

1. `.gitignore`
2. `README.md`
3. `academy-labs/06-javascript/values.js`
4. `academy-labs/sql-data-modeling/sql-transactions-indexes.sql`
5. `scripts/run-migrations.mjs`
6. `scripts/setup-chat.mjs`

Two further required imports were absent:

7. `scripts/source-inspector-loader.cjs`, required by `next.config.js`.
8. `operations/seo-vercel/lib/environment-target.mjs`, imported by `lib/indexnow.mjs`.

All eight are copied verbatim from `.recovery-seo-preview-isolated`. Migration/setup scripts are included as course-reference source files only and were never executed. No existing application source, configuration, content, validator, dependency lockfile or image bytes were changed. All 1,204 original uploaded files and all 2,601 recorded recovery-source hashes remain intact. No Git directory, private env file, credential, dependency/cache directory or unrelated development artifact was added to the payload.

## Certified package

- Files: **1,212**.
- Payload/request SHA-256: **`e04c877a42ddbad8c5be5a2bddf9919bd072cddefc75aa32e9d6159d49054e6c`**.
- Manifest-file SHA-256: `04f8431e00f37aef5927f588aa0dae4d3d8dbc6d906ab763d1f258adb2017423`.
- [Manifest](../artifacts/seo-preview-resume-20261023/hosted-build-repair/payload.json), [new request](../artifacts/seo-preview-resume-20261023/hosted-build-repair/request.json), [validation certificate](../artifacts/seo-preview-resume-20261023/hosted-build-repair/certificate.json).

The payload digest follows the retained workflow: SHA-256 of `JSON.stringify(parsed request.json)` with its recorded property/file-array order. Each manifest entry additionally pins file-byte SHA-256, upload SHA-1 and size. The formatted JSON file digest is a different value and is recorded separately in the certificate. This package does not reuse the old 1,204-file checksum. `authorized: false` remains in the manifest; the separate certificate records the completed validation without rewriting the preparation artifact.

## Actual local validation

The exact package was copied into its own directory, installed with **`npm ci`**, then built with **`npm run build`**, including the original prebuild hooks. Final isolated directory: `C:/Users/Ziko/AppData/Local/Temp/lecomax-hosted-repair-1212`. Node 24.22.0 / npm 11.19.0 on Windows; the failed host used Node 24.22.1 on Linux. Existing package install-script policy was preserved, with the same allowScripts warnings as Vercel. No install-hook approvals or validation bypasses were introduced.

| Check | Result |
| --- | --- |
| Course generation | 48 modules, 192 lessons, 3 languages |
| Original course validator | **635,429 checks passed** |
| npm ci | Passed |
| npm run build | Passed; **226 static pages** |
| Explicit TypeScript | `tsc --noEmit --incremental false` passed |
| SEO, security, commerce and auth regressions | **167 passed, zero failures** in final selected suite |
| Runtime acceptance | **37 passed** |
| Browser acceptance | Four pages, no page errors or unexpected requests |
| Repaired product images | All 30 return HTTP 200 and match original SHA-256 |
| File tracing | 288 manifests, no missing or outside-directory files |
| Payload safety scan | No forbidden paths or credential-pattern findings |
| Recovery preservation | All 2,601 source hashes match |
| Consumed guards/receipts | All five recorded hashes match |
| Change History | Six history tests passed; append/check workflow used |

Runtime checks cover storefront/category/product pages, product JSON-LD/canonicals, sitemap index and all shard kinds, robots/noindex/CSP, denied sensitive routes, local mutation rejection, external-image rejection and browser hydration. Test data is synthetic; no real database requests or emails occurred. This does not certify real staging data or a future protected hosted URL.

The broader test harness initially lacked test-only helpers and unrelated mobile/release sources. Those failures are retained; support was copied only after the production build and never added to the upload manifest. The owner-auth PGlite suite and the webhook schema-migration test were deliberately excluded under the no-migrations constraint. Their schema SQL was not executed. No hosted credential verifier was rerun.

First local compilation failed because sandbox access blocked Google fonts. A second compilation succeeded but exhausted disk and memory during type checking. Both logs and linked failure reports remain. The successful retry used unchanged payload bytes after normal approval for font access and disposal of generated caches. The build directory was moved outside the repository to prevent parent-lockfile inference; the final trace audit confirms isolation.

Existing lint warnings and npm audit findings (6 moderate, 4 high, 1 critical) remain unchanged; no audit fix was run. Pattern scans cannot prove absence of every possible secret. Linux-hosted build and real protected Preview acceptance remain untested until separately authorized.

## Exact workspace changes

New local-only scripts under `artifacts/seo-preview-resume-20261023/`:

- `inspect-failed-build.cjs`
- `repair-hosted-payload.cjs`
- `validate-hosted-repair.cjs`
- `test-hosted-repair.cjs`
- `audit-hosted-repair.cjs`
- `finalize-hosted-repair.cjs`

New evidence and reports are under `hosted-build-repair/`; the acceptance harness also created timestamped `certified-acceptance-1792793517172.json` and runtime log files beside the existing artifacts. This document was added. Four immutable learning Change History reports were appended (preparation, font failure, resource failure, verification), and `lecomax-learning-app/data/change-history.json` was regenerated only by the prescribed append command. Existing report files were preserved.

A `node.exe` hard link to the existing Node 24 executable was added under `artifacts/seo-node24/` so npm subprocesses use Node 24 rather than the system Node 26. Disposable caches were removed from the isolated recovery `.next/cache`, the npm certification download cache, three dated September `.next-dev-*` backup caches, and `.next/cache` in `release/seo-advanced-d-20261022` and `release/seo-category-canonical-20261022`. Redundant `certified-build-2XEYXd/node_modules` was removed. These are generated caches/dependencies, not source or historical evidence.

## Guards and next action

`operation-attempted.json`, `creation-attempted.json`, `receipt.json`, `verifier-only-submission-attempted.json` and `verifier-only-submission.json` remain byte-identical. Do not delete/reset them or invoke the consumed launcher. No new upload, deployment creation, secret change, database migration, worker/cron/payment/IndexNow activation, Release E enablement or Production operation occurred.

Request separate explicit authorization for **ONE NEW protected staging Preview deployment attempt** of this exact 1,212-file package to `lecomax-seo-staging`. A future authorized operation must use a new independently reviewed one-use guard and refresh target/protection metadata without rerunning the consumed credential verifier. No automatic retry or Production promotion is authorized.

## Changes Made

Fixed the deployment allowlist omission through a new package containing eight required, unchanged repository files. Retained real course validation, completed the local build and regression checks above, and appended visible history records. Learning app history route: `/change-history`; no history UI preview or new hosted Preview was checked or published during this repair.
