# Existing staging deployment: recovered and HTTP verified

This continuation recovered the submitted candidate rather than deploying again. Production was queried read-only; no production deployment, migration, settings change, commit or push occurred. Earlier artifacts and reports remain intact.

## Exact deployment

- ID: `dpl_9PVLNqN3YRoSmDgi4T5D9o81Svcv`
- Immutable URL: https://lecomax-seo-staging-rf9rswh7q-lecomaxstore-4321s-projects.vercel.app
- Alias: https://lecomax-seo-staging.vercel.app
- Project: `prj_jPniwpH4s81bhISVReUKTQN0GwvD`; team: `team_yFLUcpSvgQi8EQuvuorOZW7w`.
- READY and aliases assigned. `target=production` names the stable slot of the dedicated **staging project**, not lecomax.com.
- Build evidence: `artifacts/seo-runtime-deployment-1792540103835/build-1792540506345.log`. Linux npm ci, Next 15.5.28 compilation, lint/type validation, prerendered FR/AR product routes and serverless output completed. Existing lint/deprecation warnings and nine development-tool advisories remain; no blocking build error.
- Uploaded-file API inventory contains all approved paths. Its 587 additional paths are 586 generated `out/` paths plus generated `next-env.d.ts`; this API inventory is not a fresh byte-for-byte source hash certification. Original preflight pinned 2,123 reviewed source files.

## Verified in this continuation

- `artifacts/seo-staging-env-verified-1792540509728.json`: exact staging identity, 20 environment names in both scopes, all 18 readable values match, staging Supabase key bindings, no shared variables/integrations, all-deployment authentication. Two sensitive values remain write-only.
- `artifacts/seo-runtime-deployment-1792540103835/hosted-acceptance-1792540890899.json`: final 23/23 protected HTTP checks passed, including the stable alias. Homepage; sitemap index and product/category/static shards; robots; products/categories/banners/promotions/settings/review APIs; FR/AR product and category SSR metadata/canonical/JSON-LD; inactive-product 404; unauthenticated admin API 401 and admin page redirect; IndexNow unauthorized; signup and cron disabled. Earlier successful immutable-deployment run is retained as `hosted-acceptance-1792540609696.json`.
- Canonicals intentionally remain under `https://lecomax.com/`; fixture offers are synthetic 100 MAD. Robots preserves production rules and production sitemap reference. Staging safety is authenticated protection plus verified noindex response headers, not a claim that robots disallows all crawling.
- `artifacts/seo-staging-runtime-rest-1792540637381.json`: ten service-role REST reads and eight anonymous table denials passed. `artifacts/seo-staging-runtime-handlers-1792540640722.json`: five local handler checks against hosted staging data passed, separate from hosted HTTP.
- Fresh isolated candidate application/security suite: 161/161; worker suite: 71/71; TypeScript passed. Evidence: `artifacts/seo-dependency-remediation-20261021/application-1792540715171.log`, `worker-1792540715196.log`, `types-1792540715148.log`. Focused ESLint passed for the changed operational scripts. The hosted production-mode build provides fresh Linux validation; another identical local build was not needed for test-harness-only changes.
- `artifacts/seo-sixth-runtime-log-summary-1792540843361.json`: bounded last-hour sample of 50 requests, 38 HTTP 200, two 307, four 401, two 404, four 503. These correspond to expected acceptance statuses, including disabled routes. Raw message bodies were not exported; this is not exhaustive production monitoring or proof that every runtime path is error-free.
- `artifacts/seo-sixth-readonly-1792540814741.json`: staging protection all, no crons, Git disconnected, zero leftover acceptance credentials. Production project/domain confirmed; latest READY production deployment remains `dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx`, revision `d9d1d7a7b274fe3df9f70bb154704ea9e07e78ee`, matching staging worktree baseline. Four existing production schedules were observed and left unchanged. Production environment names were read, but values were withheld; false presence/equality flags in this evidence mean unavailable readback, not proven missing credentials or wrong database.

## Failures and fixes

The prepared HTTP harness initially failed HTTP 400 before any application checks because it generated a 64-character automation credential. Changing to 32 hexadecimal characters succeeded. Immediate requests then intermittently hit Vercel authentication during propagation. The runner now waits 15 seconds and retries only GET requests receiving an explicit Vercel authentication redirect, bounded to five attempts. POSTs are never retried. Tests default to the immutable deployment, with an explicit stable-alias check.

Failed reports remain under the deployment evidence directory. They are harness/access failures, not accepted application results. Every successfully created temporary credential was revoked and protection rechecked. The credential stays in memory and is sent only in headers to the two fixed staging origins. No authentication protection was disabled. Mechanism reference: https://vercel.com/docs/rest-api/projects/update-protection-bypass-for-automation .

No deployed application defect was demonstrated and no application source/dependency change or redeployment was made in this continuation.

## Remaining acceptance gates

**Protected deployment/build and HTTP smoke: GO. Full staging acceptance: NO-GO. Production launch: NO-GO.**

1. No browser surface is connected (`apps=[]`, `browsers=[]`). Mobile/desktop visual rendering, hydration, interactive navigation and browser console/network checks remain unverified. Existing local browser-fixture evidence is historical and cannot replace hosted visual acceptance.
2. Real owner/editor/viewer/revoked/expired sessions are not tested. Staging email/password login and signup remain disabled. Vercel automation access does not authenticate the application. Agree a bounded no-delivery Auth test strategy for the existing synthetic users before changing Auth settings or minting test sessions; never forge an app session or enable real mail. Exercise dashboard reads, role denial and revoked-session behavior first. Editorial writes require a separately bounded fixture test because editorial functionality is intentionally disabled and the user's current scope is non-destructive tests.
3. Direct anonymous REST denial passes, but it does not alone prove every RLS policy for real authenticated actors. Retain prior SQL/grant evidence and complete real-session/RPC authorization without privileged-role shortcuts.
4. The staging schema has a minimal synthetic catalogue, not full commerce data. Checkout, order lifecycle, production owner-auth storage and every existing admin feature are not certified by these smoke checks. Do not broaden this result to full storefront acceptance.
5. Nine development-tool advisories (seven high, two moderate) remain from the candidate audit; its prior runtime-only audit was clean. Resolve or explicitly assess those build-tool findings before release; do not force a major upgrade blindly.

## Safest production sequence — preparation only

1. Finish the two hosted acceptance gates above and FR/AR human content review. Keep AI, sync, manual sync, editorial publication, IndexNow and external delivery disabled during staging tests.
2. Refresh the production alias/revision and compare the final source delta against it. The observation above is a point-in-time READY deployment listing, not a future rollback guarantee. Produce an exact production manifest with no synthetic staging data/configuration.
3. Review production environment **names and secret bindings** securely at the release window. Expected database identity is `yddqwgdgeljkzfsmtein`, distinct from staging `tyltharlnbxrxibuxyye`. Verify app/runtime environment selectors, Supabase service/anon bindings, actual admin-session contract and owner database dependencies. Do not copy staging secrets or overwrite existing payment/mail/push settings. Current API readback did not certify these production secret values.
4. Use the six ordered hashes in `operations/seo/staging-approval-package-20261021/manifest.json` as the reviewed design inputs: decoupled base, worker run control, AI budget, editorial, editorial review, editorial workflow. Recheck each against current production schema/ledger and prepare a production-specific execution package. **Do not execute the superseded October 18 trigger-based runbook, combine both base migrations, apply synthetic prerequisites, or run staging-runtime-repair.sql in production.** No blanket migration push. Each migration manages its own transaction; unknown commit outcome requires read-only inspection before any retry.
5. Refresh backup/PITR evidence, verify integrity and compatible isolated restore, name the release/rollback operator and agree RPO/RTO. Historical October 18 logical restore evidence does not establish current recovery freshness or cover storage binaries, Vault secrets and all managed services. Record the exact application rollback target, migration postflight and bounded disable procedure; preserve SEO/audit/budget history rather than destructive rollback.
6. Obtain separate explicit approval for the exact production migration package, deployment and any bounded commerce canaries. No production SEO workers, AI or indexing are authorized by staging acceptance. Preserve existing production schedules; approve any new scheduler/integration separately.
7. After an authorized release, check product/category canonical and JSON-LD compatibility, complete storefront/admin/auth acceptance, and monitor catalogue/checkout errors, sitemap failures, authorization denials, queue lag, job retries and spend. Require named ownership, alert destinations and stop thresholds before activation. On failure stop newly approved workers/integrations, use the reviewed application rollback and inspect database state; never automatically refund/retry uncertain provider work or erase history.

Change History is append-only at the learning app's `/change-history` once its updated bundle is loaded. No live preview is claimed, and local reports have not been deployed.
