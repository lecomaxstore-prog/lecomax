# Second protected SEO Preview — prepared, not executed

Decision: **GO for one manual protected staging Preview attempt**. Codex has not run the launcher, uploaded files, created a deployment, rerun the hosted credential verifier, or accessed the real Production project.

Recovery remains `.recovery-seo-preview-isolated`, branch `preparation/seo-preview-credential-20261023`, HEAD `8a12abcce38c0dc557a9ef9f86c3ce3dd113e863`, with 137 modified tracked files and 15 untracked files. All 2,601 certified recovery hashes match. The main repository remains on `agent/mobile-product-redesign`; its existing changes are preserved. Complete status inventories are saved in `artifacts/seo-preview-resume-20261023/second-preview-workspace-inventory.json`.

The actual certificate, formatted request, manifest and all 1,212 file sizes/SHA-256/SHA-1 hashes were checked. Request digest (SHA-256 of JSON.stringify of the parsed request):

`e04c877a42ddbad8c5be5a2bddf9919bd072cddefc75aa32e9d6159d49054e6c`

Manifest byte SHA-256: `04f8431e00f37aef5927f588aa0dae4d3d8dbc6d906ab763d1f258adb2017423`.

Historical successful npm ci/build, 635,429 course checks, 226 pages, TypeScript, 167 regressions, 37 acceptance checks and 30 images remain applicable to unchanged payload bytes. Expensive tests were not repeated. A fresh trace audit found 288 manifests, no missing/outside files and no unexpected differences.

The live GET-only Vercel audit completed at 2026-10-23T22:21:28.326Z (24 October in Paris). It confirms project `lecomax-seo-staging` / `prj_jPniwpH4s81bhISVReUKTQN0GwvD`, team `team_yFLUcpSvgQi8EQuvuorOZW7w` / `lecomaxstore-4321s-projects`, protection for all deployments, zero bypass entries, no Git connection, empty crons, empty shared environment inventory, Preview-only sensitive credential metadata and expected disabled side-effect flags. Sensitive credential values were not fetched. Staging MCP independently returned `https://tyltharlnbxrxibuxyye.supabase.co`.

Complete paginated history contains six deployments of the staging project; none is newer than failed first Preview `dpl_8XvapF5aDPPH57s6opLBLQqX67uC`. Older records marked production are targets within the staging project, not the real `lecomax` project. No second deployment exists as of this audit.

The first `operation-attempted.json`, `creation-attempted.json`, `receipt.json` and both verifier submission records remain byte-identical to certificate hashes. The new fixed directory `artifacts/seo-preview-resume-20261023/second-protected-preview-1212-submission` does not yet exist. Manual execution creates it exclusively; any existing directory blocks execution. Never delete it to retry.

## Manual command

Run in PowerShell after reviewing the files:

```powershell
& "C:\Users\Ziko\Desktop\my projects\L'ecomax\artifacts\seo-preview-resume-20261023\run-second-protected-preview.ps1"
```

The launcher prompts for a masked Vercel API Token, passes it temporarily to its Node child and clears the environment and secure buffer afterward. The child validates certificate/files/old guards, then performs fresh GET-only identity, protection, environment and complete history checks. Any newer deployment stops submission. It uses the unchanged reviewed native HTTPS adapter and guarded transport: no retries, redirects, missing-file negotiation or second creation request. Ambiguous results stop and retain guards. The request omits target, preserving the reviewed Preview-only API request shape, and permits no production target field.

The code only calls staging endpoints; it does not establish that the supplied token lacks broader account permissions. Use an appropriately limited token. Source middleware denies non-GET/HEAD requests and non-SEO routes before handlers, and outbound application fetch permits enumerated staging reads only. No prohibited mutations were tested live.

## Validation and limitations

PowerShell and Node syntax passed. Synthetic checks passed: 36 adapter checks, 11 hosted gate scenarios, nine guard-boundary scenarios, and five retry-free scenarios. The inherited adapter test failed because it expected a generic network error for malformed JSON; the reviewed adapter returns `RESPONSE_PARSE_FAILED`. The original test and transport are unchanged; a separate corrected test passed.

The initial restricted-network audit failed without exposing credentials; the approved GET-only audit outside that restriction passed. Both result records remain. Final evidence and launcher hashes: `artifacts/seo-preview-resume-20261023/second-preview-preparation-result.json`.

Hosted Linux build, actual staging data and protected HTTP/browser acceptance remain pending. Existing lint warnings, dependency audit findings and migration-dependent test exclusions remain. Release E stays on hold. No deployment, migration, domain assignment, promotion, email, payment, order, worker or IndexNow activation is included in this preparation.

## Changes Made

Added a separate one-use manual launcher, read-only audit, focused tests and immutable preparation evidence. No recovery application source, certified payload, prior report or consumed guard was changed. Linked preparation and verification reports were appended using the learning app's Change History command. The history route is `/change-history`; no UI or hosted Preview link was verified in this continuation.
