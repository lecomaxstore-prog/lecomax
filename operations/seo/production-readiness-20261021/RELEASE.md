# LECOMAX production readiness — review package

Status: **full staging NO-GO; production NO-GO**. The previously approved three-fix storefront deployment remains READY and its completed 36 checks are retained. This package contains a new local security fix and has NOT been approved, built for production, deployed, committed, pushed or merged.

## Exact candidate and evidence

`source-manifest-final.json` pins 2,124 source files and their SHA-256 hashes. It derives from the accepted staging manifest `58bd96cbb310dcef3e0bc0eb0432e92ba146070f145dc4049e0fd060b9a7e0b6` with only three file overrides:

- `vercel.json`: restore the four existing production schedules from production revision `d9d1d7a7b274fe3df9f70bb154704ea9e07e78ee`. Do not deploy staging's zero-cron configuration to production.
- `lib/api-security.ts`: deny all `seo:*` mutations in staging/preview after authentication/origin checks. Reads and production behavior remain unchanged.
- `tests/seo-editorial-api.test.ts`: authenticated owner/editor mutation denial before RPC/cache invalidation, read preservation and production save regression.

The final manifest supersedes the earlier proposal manifest in this directory. Existing staging source and historical manifests remain intact. No production credentials, synthetic database export or compiled local fixture build belongs in the release upload. Files named staging in the source are historical documentation/examples, not configuration to apply. No SQL file is automatically executed by deployment; only the six explicitly approved migration paths may ever be used.

Evidence links in this document are repository-relative identifiers, not deployment instructions:

- Staging alias remains `dpl_BTTcn1fzEYdVSxbevGo6njShC7UJ`, READY; previously tested storefront source unchanged.
- Fresh staging safety configuration: `artifacts/seo-staging-env-verified-1792588326498.json`; values remain isolated/disabled, but flags alone do NOT disable manual editorial writes.
- `retained-auth-evidence.json`: 24 relevant files match the earlier real-session test candidate. Historical owner/editor/viewer/revoked HTTP authorization passed; this is not current authenticated UI or expired-session acceptance. Current browser has Vercel authentication but `/admin/seo` redirects to app login.
- `production-alias.json`: actual lecomax.com alias and rollback target remain READY at `dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx`; four schedules verified.
- `production-permissions.json`: TLS and database-enforced read-only inventory; all 61 public tables have RLS, no anon/authenticated-accessible security-definer functions, no public-schema CREATE privileges for anon/authenticated/service_role. Policy predicates and every real-actor permission are not certified by metadata alone.
- Migration compatibility/restore evidence retained from this same day: `artifacts/seo-final-database-preflight-1792577337409.json` and `artifacts/seo-final-local-restore-1792577467672.json`. No repeated migration/restore performed.
- `guard-regression.log`: 29 tests pass. New guard tests cover 20 authorized staging/preview mutation attempts, reads and production save. This is local mocked SQL testing, not hosted mutation acceptance.

## Confirmed safety defect and local correction

The deployed manual editorial and legacy SEO mutation routes do not enforce a staging write-disable flag. `SEO_EDITORIAL_ENABLED=false` controls AI generation; it is not a manual mutation kill switch. Database absence of SEO documents and disabled synchronization reduce available targets but are not a durable authorization boundary. No hosted write was attempted to demonstrate the defect. The local guard closes those HTTP routes for staging/preview and is pending reviewed staging deployment. It deliberately has no env-only override. Existing production manual editor functionality is preserved, not newly activated here.

Earlier reports claiming all hosted editorial writes were disabled by the flags are superseded on this point. Their storefront/browser results remain valid for their stated scope.

## SEO quality and measured limits

The existing structural metadata/canonical/JSON-LD/sitemap/robots checks were reused, not repeated. Focused new review confirms French shell `lang=fr`, `og:locale=fr_MA`, no hreflang alternatives, and mixed French/Arabic description text on the Arabic synthetic product. The two fixture products are distinct entities, not translations of one page: do not invent reciprocal hreflang links between them. Arabic editorial storage is not a complete Arabic-indexing implementation.

`editorial-fixture.json` preserves a local bilingual draft and source. Automated assessment passes, with sparse-source/negation-review/duplicate-review warnings and mandatory human review. French text makes no technical promises; Arabic text likewise identifies a synthetic example. It is not approved production copy. A reviewer must verify factual entailment, idiomatic Arabic/French, brand preservation, actual product facts and cross-catalogue duplication before publication.

`seo-lab-review.json` contains one unthrottled mobile-viewport desktop Chrome sample per route: LCP 952/716/824 ms (home/FR/AR), no observed layout-shift entries, TTFB approximately 50–60 ms. INP was not measured. These are short lab samples of authenticated synthetic staging, not field Core Web Vitals or a mobile device SLO. Obtain production CrUX/Search Console p75 coverage and real interaction data through the owner; do not claim a field pass.

Google recommends separate URLs and hreflang for actual language alternatives: https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites . Field CWV assessment and measurement limits: https://web.dev/articles/vitals . No architectural locale change is included without a content/routing decision.

Robots retains production crawl rules and sitemap reference. Authenticated staging plus noindex prevents public staging exposure; robots is not the access control. Production must use APP_ENV=production to avoid inheriting staging noindex. Keep query/filter variants canonical to their intended catalogue pages; do not submit fixture URLs or staging sitemaps to indexing services. Rich-result eligibility, merchant feeds and production product facts require release-window checks; JSON syntax alone does not certify eligibility.

## Ranked blockers, approvals and effort

Estimates are engineering effort after access/decisions, not elapsed promises.

| Priority | Blocker | Required action / approval | Estimate |
|---|---|---|---|
| P0 | Manual SEO writes lack enforced staging denial | Approve exact local guard candidate for new staging build/deployment; verify valid authorized writes reject before RPC | 1–2 h |
| P0 | Production candidate cannot pass its environment contract with current metadata | Approve in-place addition of missing names in environment-contract.json and secure verification of production bindings; retain commerce secrets/settings | 1–2 h |
| P0 | No current app-admin UI/expired-session or bounded editorial lifecycle acceptance | Owner signs in normally; approve no-delivery synthetic role-session lifecycle. Separately review a fixture-only write test boundary, exact target/baseline and rollback before allowing writes | 3–6 h; more if a scoped test boundary must be implemented |
| P0 | Recovery freshness and managed-service coverage unproven | Provide current provider backup/PITR evidence; approve a separate isolated recovery rehearsal with storage/Vault coverage; no production restore | 2–4 h plus platform transfer time |
| P0 | Candidate final build and release-window approval incomplete | Review manifest/config/security delta, build and stage it with approval, then approve exact production migrations/deployment and named operator | 1–3 h |
| P1 | Arabic locale/indexing and editorial human review | Decide French-only launch scope versus actual localized URLs; approve reviewed content. Full locale implementation is a separate change | 1–2 h review; 1–3 days if localized routes required |
| P1 | Monitoring/rollback ownership and alert destinations unset | Name operator/on-call, RPO/RTO and recipients; approve thresholds and existing monitoring checks | 1–2 h |
| P1 | Retained development dependency advisories | Owner/security accepts documented build-only risk or approves targeted remediation and rebuild; no blind upgrade | 1–3 h assessment; remediation variable |
| P2 | Field CWV/Search Console and stale-cache behavior | Owner supplies field evidence; retain hard-refresh note for old staging clients and unused-preload warnings | 1–2 h review; field collection may take weeks |

No approval is requested for production now: prerequisite gates remain incomplete. Supplying credentials in chat is never required.

## Safe rollout — procedure only, not authorization

1. Close P0 gates and obtain separate approvals for the exact source manifest, production configuration, six SQL hashes, deployment and any commerce canary. Confirm production alias/revision and expected database ref immediately before execution; stop on drift.
2. Verify recovery point freshness against agreed RPO, restore coverage and named operator. Capture baseline deployment, existing environment **version/provenance**, schedules, catalogue invariants and monitoring metrics without exporting secret values into this package.
3. Securely prepare required production bindings from existing production secret bytes. Preserve payment/email/push/learning configuration and all four schedules. Do not apply staging environment files. Keep new SEO sync, AI, workers, indexing and scheduler activation off. Adding ADMIN_SESSION_SECRET changes admin session trust; verify owner login/re-authentication contract before traffic switch.
4. Execute only the six ordered files in migration-plan.json after separate approval. Respect each file's own transaction and timeouts. Record success per file; on ambiguous outcome inspect ledger/objects read-only before any retry. Do not use the superseded trigger migration, synthetic prerequisites, staging repair SQL or blanket migration push. Recheck RLS/grants, source compatibility and commerce trigger invariants.
5. Build the reviewed production source from source, never from the synthetic local `.next` output. Require clean install, type/lint/regression checks and the production environment guard. The production vercel.json must match reviewed existing schedules. Verify target project `prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb` and team before the separately authorized deployment.
6. Pin new deployment ID and verify source/build/alias. Run GET-only smoke checks below. Any payment/order/email test needs a separately bounded canary approval. Observe before enabling any new SEO services; leave new providers/indexing/sync off until their own activation approval.

## Post-deployment smoke tests

- Confirm alias/project/deployment, TLS, correct production Supabase binding and absence of staging fixtures/configuration.
- Home, boutique, representative active/inactive product/category and mobile navigation; valid image/manifest loading; no new hydration/console/network errors. Check both fresh and returning browser cache behavior.
- Production noindex absent where indexing is intended; correct production canonicals, descriptions, JSON-LD offers matching actual facts, sitemap shards with active catalogue coverage, robots sitemap location. No blanket noindex removal from private/utility routes.
- Genuine owner/editor/viewer/revoked/expired session authorization, admin reads and unauthorized denial. Do not execute mutations as a GET smoke test.
- Existing checkout page/payment configuration, order administration and notification job status by read-only observation. Real commerce/delivery canaries require explicit approval and reconciliation plan.
- SEO workers/AI/indexing remain disabled; no unexpected provider calls, job claims, outbound messages or new crons. Record exact evidence and timestamps.

## Rollback and incident response

Current application rollback target is `dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx` (READY at recorded check). Revalidate target and schema/config compatibility at release time. On regression stop any newly authorized SEO activation, preserve logs/audit/revision/budget state, and have the named operator perform the separately authorized application alias rollback. Restore only approved changed configuration versions; do not overwrite existing payment/mail credentials. Additive SQL is not automatically reversed: do not drop SEO tables or erase history. If database recovery is necessary, escalate to the approved recovery operator with a fresh recovery plan; never restore production automatically or retry uncertain payment/migration actions.

Proposed immediate stop conditions: cross-environment access/write, unauthorized mutation, unexpected paid job/message, new checkout/order failure, or broken owner authorization. Proposed availability escalation: two sitemap 5xx samples one minute apart, new sustained 5xx increase over baseline, or latency doubling over baseline for five minutes. Owner must accept thresholds and recipients; none were configured here. Use existing Vercel/Supabase logs, redact credentials/customer data and correlate deployment/time. Do not infer alerting exists merely because logs are accessible.

## Change History

Append-only preparation and verification reports correct the write-disable claim and record the local fix, evidence and limitations. `/change-history` is available in the learning app when its updated local bundle is loaded; no learning deployment or live preview is claimed.
