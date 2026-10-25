# Hosted staging deployment and acceptance

Recorded 2026-10-21T12:36:35.833Z.

**Approved three-fix deployment and protected storefront acceptance: GO. Full SEO-engine staging acceptance: NO-GO. Production release: NO-GO.**

## Deployment and source

- Deployment: dpl_BTTcn1fzEYdVSxbevGo6njShC7UJ, READY.
- Immutable URL: https://lecomax-seo-staging-qlk9zr988-lecomaxstore-4321s-projects.vercel.app
- Stable alias: https://lecomax-seo-staging.vercel.app
- Project prj_jPniwpH4s81bhISVReUKTQN0GwvD; team team_yFLUcpSvgQi8EQuvuorOZW7w (lecomaxstore-4321s-projects).
- Approved manifest SHA-256: 58bd96cbb310dcef3e0bc0eb0432e92ba146070f145dc4049e0fd060b9a7e0b6.
- All 2,124 local source hashes matched the approved snapshot and staging worktree. Remote uploaded-file UIDs matched local SHA-1 for every file; no missing, extra or mismatched upload files. Only app/layout.tsx, components/CategoryTiles.tsx and public/images/placeholder.png differ from the preceding reviewed package. Dependencies unchanged.
- The two older deployments were listed before submission; no interrupted deployment existed. One new deployment was submitted. The initial runner stopped during local copying because two approved filenames contained consecutive dots; its traversal guard was corrected before submission. No application source changed.
- Remote npm ci and Next.js 15.5.28 build completed, including lint/type checks and generated routes. Existing warnings remain. The Vercel target named production is the stable slot of this dedicated staging project, not lecomax.com.

## Safety

Fresh environment verification: artifacts/seo-staging-env-verified-1792585227896.json. Exact project/team, 20 variable names and 18 readable values in each scope passed. Supabase bindings point to tyltharlnbxrxibuxyye. Two sensitive values are write-only; their bytes were not independently read back. No shared variables or assigned integrations; Git disconnected; zero cron definitions; all-deployment Vercel Authentication preserved. Fresh anonymous requests to both origins returned 302 to vercel.com. Normal existing browser login was used; no bypass headers, copied cookies, automation credentials or protection changes.

No production changes, push/merge, migrations, hosted editorial writes, payment/mail/push activation or RLS changes occurred. Prior database/RLS evidence was retained rather than rerun. All application-side-effect flags remain disabled.

## Hosted acceptance

Evidence directory: artifacts/seo-approved-fix-deployment-1792585385500/.

- Immutable deployment: 18/18 route/viewport checks, home, boutique, FR/AR products and categories at 1440/375/390 widths. HTTP 200, no overflow, one H1, descriptions/canonicals, parseable JSON-LD, no page exceptions or HTTP error responses, all images decoded.
- Stable alias: 18/18 same checks after clearing only the MCP browser HTTP cache, preserving cookies/login. Hydration wait increased to 1.6 seconds. No console warnings/errors inside this final matrix.
- Exactly one use-credentials manifest link; Chrome Page.getAppManifest returned valid content and no errors.
- Hydrated desktop category source uses /images/pages%20images/homme.png; selected images decode. No malformed srcset warnings.
- Raw placeholder HTTP 200; optimized placeholder AVIF HTTP 200 with cache MISS. Category optimized AVIF HTTP 200, but cache HIT: genuinely cold category transformation is not independently certified.
- Mobile menu opens/closes; Arabic category -> product -> browser back and French desktop category -> product navigation passed. Initial navigation harness used an overly strict accessible name and timed out; corrected locator passed without app changes.
- Robots, sitemap index and all three shards returned 200; XML parsed. Two synthetic products and categories present. Production-domain canonicals and robots sitemap reference intentionally retained. Staging protection is Vercel Authentication plus noindex headers, not a robots disallow-all policy.
- Settled desktop and mobile screenshots inspected. Initial screenshots captured transitions and were preserved alongside settled screenshots.

## Observed limitations and retained failures

The reused stable-alias browser initially served stale placeholder 400/404 responses at image widths 256 and 384 while direct authenticated requests returned 200. Cache-disabled reload succeeded; a normal reload succeeded at the tested mobile width, but desktop resizing exposed another stale size. Clearing only HTTP browser cache then yielded a clean complete alias matrix. This supports a stale-client-cache diagnosis; it is not proof that every previously cached client will recover without refreshing. Use a hard refresh/clear site HTTP cache for affected staging sessions; no new source fix was authorized or made.

Outside the bounded matrices, unused CSS/image preload warnings occurred. Rapid navigation also produced ERR_ABORTED requests; these were recorded separately from HTTP errors. No claim of a warning-free entire browser session is made. Tests are responsive desktop Chrome checks, not physical mobile-device certification. No commerce transactions or editorial writes were performed.

## Remaining release gates

1. Separately authorize a concrete bounded synthetic editorial test for seo-fixture-fr: baseline snapshot, owner/editor/viewer/expired/revoked access, save/conflict/review/publish, cache invalidation and rollback with audit preservation. Current request forbids enabling hosted writes, so this remains unexecuted. Normal application-admin UI/session acceptance is not established by Vercel login.
2. Human French/Arabic content review; assess retained seven high/two moderate development-tool advisories. Historical runtime audit was clean, not freshly rerun.
3. At the production release window, refresh production revision, exact source delta and in-place secret bindings; prepare a production-specific six-migration package. Never copy synthetic staging configuration/data or apply staging repair SQL.
4. Refresh backup/PITR and managed-service restore coverage, nominate release/rollback operators, RPO/RTO, monitoring recipients and stop thresholds; pin current rollback target.
5. Obtain separate explicit approval for production deployment/migrations and any bounded commerce canaries. External delivery, AI/workers/indexing and schedules require their own activation approval.

## Changes Made

Deployed the exact approved three-file application package to isolated staging. Added guarded deployment/status scripts, hosted evidence and this handoff. Append-only preparation and verification reports are in the learning app Change History; no historical reports removed. Reports appear at /change-history when the updated local learning bundle is loaded; the learning app itself was not deployed and no live learning preview is claimed.
