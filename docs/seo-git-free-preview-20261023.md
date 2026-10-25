# Git-free SEO Preview preparation

Decision: **Git-free CLI workflow supported; deployment NO-GO pending credential provenance and email isolation.** No Git connection, deployment, remote setting, migration or credential change was made.

## Verified target and source

Fresh project API check at 2026-10-23T07:01:14.649Z: lecomax-seo-staging, prj_jPniwpH4s81bhISVReUKTQN0GwvD, team_yFLUcpSvgQi8EQuvuorOZW7w, no Git link. Next.js framework, npm ci install, npm run build, no custom root/output directory.

Correct candidate SHA is **8a12abcce38c0dc557a9ef9f86c3ce3dd113e863**; the pasted `8a12abcee...` spelling is a transcription error. Branch correction/seo-abcd-utf8-20261023 is local source provenance, not a prerequisite for a Git-connected deployment. Clean candidate verified again; all 2588 manifest files and all 30 repaired images match. Prior 120-test/build/image acceptance remains reusable unchanged-source evidence.

The earlier branch-override recommendation was unsuitable for this Git-unconnected project. General Preview configuration in this dedicated staging project is the intended path. No Git connection is needed or proposed.

## Prepared deployment workflow (NOT executed)

The preparation-only script `artifacts/seo-preview-resume-20261023/prepare-git-free-preview.cjs` verifies the source and emits a non-executable JSON plan. It contains no deployment call. Plan: `git-free-plan-1792738918802.json` in the same directory.

Once all gates pass, execute the installed Vercel CLI with source `.recovery-seo-abcd-corrected`, `deploy --target=preview --scope lecomaxstore-4321s-projects --yes`. Supply VERCEL_ORG_ID=team_yFLUcpSvgQi8EQuvuorOZW7w and VERCEL_PROJECT_ID=prj_jPniwpH4s81bhISVReUKTQN0GwvD in the child environment, avoiding the root workspace's production project linkage. Use a clean allowlisted child environment; do not pass secrets in arguments or pull them into tracked files. No --prod, promote, redeploy, branch override or Git connect. Refresh exact provider configuration before execution.

After submission, verify the returned project ID, Preview target, READY state and immutable URL, then protected HTTP/browser SEO acceptance. Check sitemap index/shards, robots/canonicals, JSON-LD, private exclusions, images, desktop/mobile, local cart persistence and checkout entry with mutation requests blocked. Report no success until those checks actually run. No URL exists yet.

Official workflow: https://vercel.com/docs/projects/deploy-from-cli and explicit project selection: https://vercel.com/docs/cli/global-options . The installed CLI supports --target. Its help command encountered an unrelated update-cache permission error after emitting help; authenticated read-only provider calls succeeded.

## Fresh configuration and remaining blockers

Evidence: `artifacts/seo-preview-resume-20261023/binding-audit-1792738870726.json`, checked 2026-10-23T07:01:10.278Z.

- General Preview URL targets tyltharlnbxrxibuxyye; public-key fingerprint binding matches exactly. No linked shared variables.
- Service secret remains withheld. Its binding has staging format but cannot be compared with the hidden key. The corrected application does not enforce the binding helpers at runtime. Neither the label nor an independently supplied matching key alone proves the existing Vercel secret equals it.
- PayPal, IndexNow, SEO workers/AI/editorial/manual sync/Mirai/live studio are disabled; tutor budget zero. Effective inventory has no external payment, email, push, WhatsApp, AI, cron or worker credentials. Staging cron definitions empty, deployment protection covers all. Prior bounded staging metadata found no Edge Functions, public/auth non-internal triggers or pg_cron/pg_net/http extensions; not rerun this turn.
- Supabase Auth still enables Email while disabling new signup. SMTP or Auth-hook delivery isolation is unverified. Existing-user reset flows may send mail; no sending test was attempted.

## Provenance method and proposed change requiring approval

There is no read-only provider API response currently available that reveals the existing Secret for fingerprint comparison. A diagnostic deployment would cross the user's pre-deployment gate and is not being performed. Do not weaken the secret's type to read it.

If trustworthy original provisioning evidence cannot establish the existing value, use controlled reprovisioning from the exact Supabase staging project, without rotating its key:

1. Obtain the existing staging server key privately from Supabase project tyltharlnbxrxibuxyye. A secure local preflight should check key role/project where applicable, compute its exact UTF-8 SHA-256, and perform a read-only authentication check only against the hardcoded staging endpoint. Print only pass/fail, never response data or credentials. Do not send the key to the production host, online hash tools or chat.
2. **Proposed smallest scope change:** on Vercel lecomax-seo-staging only, split the existing service-key configuration so the old entry retains its Production target, and create a general **Preview-only Secret** entry from the independently verified staging key. This requires removing Preview from the old combined entry before adding the replacement; do not deploy during the transition. Preserve the old Production value. No branch selection is needed.
3. If the existing binding matches the verified key, leave it inherited. Otherwise split its scope in the same way and provide the matching Preview-only binding. Leave the already verified URL/public key/public binding intact.
4. Record the secure entry's provenance and verify target metadata after saving. A build-time check comparing the exact runtime secret to its approved fingerprint and read-only staging authentication provides the final equality check before normal application build/acceptance. That additional deployment preflight is not yet implemented or executed; it must emit booleans only and fail closed. Preserve the candidate files by keeping deployment-verification tooling separate.

**Impact:** only future Preview deployments of lecomax-seo-staging use the replacement; all CLI Preview uploads to this project share it. Existing deployments retain their previously captured environment values. The staging project's Production value and real lecomax project remain unchanged. No old deployment is automatically updated or revoked, and this does not rotate the Supabase credential. Environment change behavior: https://vercel.com/docs/environment-variables .

Approval is required before any of this scope splitting or credential replacement because the user explicitly requested it. No change was made. The secret must be entered through a secure local/dashboard flow, not supplied in chat.

For email, separately disable the Email provider in the exact staging Supabase project for SEO-only testing, or verify a non-delivering SMTP sink and any Auth hooks if auth testing must remain enabled. Do not change the real Production project's Auth settings. No Vercel variable can by itself prove Supabase-managed email is disabled. Obtain approval for any agent-performed setting change; manual completion can then be verified read-only.

## Changes Made

Added Git-free provider evidence, preparation-only script/plan, refreshed sanitized isolation evidence, this report and append-only Change History. Application source and all prior reports preserved. No deployment, Git connection, Production change, database mutation or Release E activation. No rollback needed. History route /change-history; no UI preview checked.
