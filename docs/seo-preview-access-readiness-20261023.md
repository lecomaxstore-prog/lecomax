# SEO Preview access readiness — 23 October 2026

Decision: **NO-GO for Preview deployment** until the server credential's staging provenance is established. No deployment, database write, migration, production setting, credential, cron or worker change was performed. Release E remains on hold.

## Verified identities and authentication

- Workspace: `agent/mobile-product-redesign`, `e5251911e2a6f1379aca827eb53c310359a662b3`; pre-existing dirty work preserved.
- Corrected separate repository: `.recovery-seo-abcd-corrected`, branch `correction/seo-abcd-utf8-20261023`, commit `8a12abcce38c0dc557a9ef9f86c3ce3dd113e863`, clean.
- Original recovery: `7278fcf84b733370081e9d44f87e768e1beed4b1`, preserved. Both pasted handoff SHAs contained transcription errors.
- Fresh Vercel alias and deployment reads: `lecomax.com` points to READY `dpl_CxX8Deg6R6T4prqTnHEiJVvqGu6f`. Release source metadata identifies `ddf12f4a916478f80f1ca75a1ca83a193d36ef28`; the unrelated dirty workspace Git label is not the release source. Prior uploaded-source verification is retained for this unchanged deployment.
- Corrected candidate and Release D share tree `e8dda63a070f4f429616ec521ad633836c99960f`; no newer live deployment was substituted or overwritten.
- Vercel account `lecomaxstore-4321`, team `team_yFLUcpSvgQi8EQuvuorOZW7w`; production project `prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb`; staging project `prj_jPniwpH4s81bhISVReUKTQN0GwvD`.
- Existing `lecomax-staging` MCP works without reconnecting. Its configured URL scopes it to `tyltharlnbxrxibuxyye` with `read_only=true`; live project-URL response matches. Table metadata reads succeeded and SQL reports `transaction_read_only=on`. No current OAuth failure is reproducible; the cause of the historical failure cannot be determined from present success.
- Supabase project display name and region were supplied by the user, not independently exposed by the available project-scoped tools. Vercel staging project name is verified.

## Isolation evidence and blocker

Preview URL is `tyltharlnbxrxibuxyye.supabase.co`; its readable public JWT identifies that project and role `anon` (payload inspection, not signature verification). Staging selectors match. PayPal, IndexNow, agent studio and inspected SEO feature flags are false. Preview variable inventory contains no payment-provider, mail-provider, push-private-key, worker-trigger, or owner-database credentials. Staging cron definitions are empty; deployment protection covers all deployments. All four production cron schedules remain unchanged.

**The Preview service key is Sensitive and its API response has no value field. Its project provenance cannot be verified.** The initial audit's `opaqueKey` and production `validUrl:false` fields reflect unavailable values, not proof of malformed configuration or actual opaque-key format. Likewise, `disabled:false` for an unreadable production flag is not proof it is enabled. The targeted readability follow-up establishes the limitation. Production database endpoints are also withheld, so full endpoint separation is not freshly certified.

Vercel documents that Secret/Sensitive values cannot be retrieved after saving: https://vercel.com/changelog/environment-variables-now-use-config-and-secret-types . A stored binding label alone would not prove the withheld key matches it. MCP read-only status does not constrain application service-key permissions.

Required user action: in Supabase project `tyltharlnbxrxibuxyye`, obtain the existing staging-only server key through the secure dashboard. In Vercel team `lecomaxstore-4321s-projects`, project `lecomax-seo-staging`, securely replace `SUPABASE_SERVICE_ROLE_KEY` for **Preview only** with that exact staging key. Preserve production settings and do not paste secrets into chat. Record the provenance through the secure setup workflow and refresh any associated binding from that same key. Then resume read-only isolation verification before deploying. No credential was changed in this session.

## Validation and remaining acceptance

Freshly checked: 2,588 corrected candidate hashes, zero mismatches; all 18 original recovery hashes match; clean corrected checkout; identical Release D tree; 759 existing history reports valid before this follow-up.

Reused unchanged-source evidence: TypeScript and lint exit 0; successful build retry with 225 static pages after the documented disk-space failure; 120 regression tests passed with no failures/skips. All 30 repaired image paths decoded and returned local/live HTTP 200 with original bytes; 92 catalogue references resolved. Prior live acceptance covers sitemap index/four shards, private-page exclusion, canonicals, Product JSON-LD/stock, category SEO, six desktop/mobile cases, cart persistence and checkout entry. These are retained prior checks, not rerun results.

Preview URL/ID: none created. Hosted Preview HTTP/browser acceptance remains not run. Authenticated admin lifecycle, actual orders/payments, absent inventory/locale samples and search-engine indexing outcomes remain unverified. Production endpoint and sensitive credential separation remain the critical gate. No success claim is based on local builds alone.

## Rollback and Changes Made

No production rollback is needed. Preserve both recovery repositories and all evidence. If a later Preview fails, stop using it and leave production aliases untouched. Any future production rollback needs separate approval and a freshly verified immutable deployment target; no database restore is part of this work.

Added read-only provider-audit scripts, sanitized timestamped evidence, this readiness report and a linked append-only Change History report. Application source and deployed behavior are unchanged. History route is `/change-history`; no UI preview was checked or published.
