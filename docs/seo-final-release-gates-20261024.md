# Final SEO A+B+C+D release gates — 24 October 2026

## Decision

**A+B+C+D are already present in the current Production revision. No additional SEO deployment is justified by this review.** Their scoped source and public SEO acceptance is verified using current Production reads plus the retained offline evidence. No real unresolved A–D code defect was demonstrated.

**NO-GO to deploy/promote the 1,212-file restrictive Preview package to Production.** It includes Preview isolation changes outside the SEO release scope. This is not a declaration that the currently live A–D release has failed. Keep it in place. Release E remains ON HOLD.

The old “full Preview NO-GO” described unrestricted storefront coverage that its approved policy intentionally denies. That coverage is not a prerequisite to accepting the allowed isolated SEO checks. No security weakening or new Preview is requested. Independent staging database provenance is still UNVERIFIED, with the access cause now identified.

## Current provider and rollback identity

Fresh authenticated Vercel GET evidence at **2026-10-24T12:27:57Z** identifies:

| Field | Verified value |
| --- | --- |
| Real project | `lecomax` / `prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb` |
| Team | `team_yFLUcpSvgQi8EQuvuorOZW7w` |
| Current `lecomax.com` alias target / future rollback anchor | `dpl_CxX8Deg6R6T4prqTnHEiJVvqGu6f` |
| Immutable deployment URL | `https://lecomax-5tvr48bai-lecomaxstore-4321s-projects.vercel.app` |
| State / target | READY / production |
| Source commit metadata | `ddf12f4a916478f80f1ca75a1ca83a193d36ef28` |
| Source branch metadata | `prepare/seo-advanced-d-20261022` |
| Deployment origin | CLI |
| Runtime | Next.js, Node 24.x, region `iad1` |
| Project overrides | No custom build/install/output/root directory values |
| Git connection | `lecomaxstore-prog/lecomax`, production branch `main` |
| Deployment protection | `all_except_custom_domains`; one existing bypass entry (value not read) |

This is an exact **current deployment anchor for a future release**, not a pre-A–D rollback target and not a claim that restore has been rehearsed. Current domain assignment and READY state were read; rollback eligibility/retention and a restore operation were not tested. Redeploying from its commit is not equivalent to restoring its existing artifact. Source commit metadata on a CLI deployment is not by itself a complete attestation of every uploaded byte; the earlier source-verification artifact for this same immutable ID is retained.

Rollback cannot restore database rows, inventory, external assets, provider secrets/configuration or payment/email side effects. Configuration and service state can drift independently. Do not roll back merely to “finish SEO.” Before any future changed release, re-read the alias/anchor, retain its configuration evidence, name the operator and separately authorize deployment/rollback scope. Use unexpected 5xx, broken catalogue/navigation, wrong canonical/indexability or side effects as abort/rollback triggers. Real transaction testing and rollback rehearsal were not performed.

The existing protected Preview `dpl_DtqnUXwVHUQ98YA4n5QqY3HUMgQB` is **freshly verified READY** in project `lecomax-seo-staging` / `prj_jPniwpH4s81bhISVReUKTQN0GwvD`. Protection remains `all`, bypass count zero, no Git connection, zero hosted cron definitions. Historical READY evidence is no longer the sole provider-state evidence; historical browser acceptance is still timestamped separately.

## Access diagnosis and exact reconnection path

**Vercel: resolved.** Sandbox network access returned `EACCES` before any HTTP response, including for public robots.txt. The prior catch-all audit hid that cause. PowerShell additionally blocks the `vercel.ps1` wrapper by execution policy. The supported `vercel.cmd` wrapper works without changing execution policy. With approved network access, `vercel.cmd whoami` succeeded using the existing CLI session; authenticated GETs read both projects and deployments. No auth file/token was extracted or printed; no login reset is needed. Use the same normal CLI session and approved network boundary for future reads, not debug output or token export.

**Supabase: authorization mismatch, unresolved.** Both connections can authenticate and list projects. `Primary` lists no projects; `Ax` lists one unrelated project. Neither exposes staging `tyltharlnbxrxibuxyye`; exact-project reads previously returned permission denied. This proves the current connections do not authorize the required project. It does not distinguish wrong account, omitted organization OAuth grant or missing organization membership without the owner checking those settings.

To reconnect without sending secrets:

1. In your browser, open `https://supabase.com/dashboard/project/tyltharlnbxrxibuxyye`. Sign in with the account that owns or is authorized for this staging project. If it is not visible, ask the organization owner to grant the necessary read access; do not use Production keys.
2. Open the installed Supabase connection management UI and reconnect/add that authorized account. During Supabase OAuth, select the organization containing the staging project. Existing `Primary` and `Ax` authorizations do not currently include it. Do not supply tokens in chat.
3. If using a project-scoped MCP connection, configure the official endpoint `https://mcp.supabase.com/mcp?project_ref=tyltharlnbxrxibuxyye&read_only=true&features=database,docs,debugging`, then complete its normal browser OAuth flow. This report does not change connector configuration or request broader permissions.
4. Reload/refresh the connection and verify a staging-only read. In project-scoped mode account listing tools are disabled; use a project database read, not an account-list requirement. Read only necessary product/category fields and aggregates; no writes/migrations/Auth/RLS changes.

Supabase documents organization selection, OAuth without a PAT, project scoping and read-only mode in its [official MCP setup guide](https://supabase.com/docs/guides/ai-tools/mcp). The exact connection-button label varies by client; no nonexistent reconnect tool was invoked. A corrected staging connection is needed for independent fixture provenance, not to re-prove Production public metadata already observed here.

## Final evidence matrix

| Gate | Current hosted evidence | Offline/source evidence | Conclusion |
| --- | --- | --- | --- |
| Production domain/canonicals | Home, boutique, four categories and six products return 200 with `https://lecomax.com` canonicals | Category/product canonical code matches current Production commit; retained unusual-slug tests pass | Verified for sampled live routes and tested source cases |
| Indexability | All 12 sampled public HTML pages have index/follow, no X-Robots noindex; robots.txt permits public crawling | Preview noindex is isolated; existing policy tests pass | Production sample passes; Preview security preserved |
| Utility noindex | Login/cart GET return 200 with `noindex, nofollow, noarchive, noimageindex` | Initial component rendering covered offline; Preview GET denials deliberate | Correct separation; no auth/cart mutations tested |
| Sitemaps | Index and four shards return 200: 23 static URLs, 36 products, four categories, five posts; no foreign origin or utility URL in checked lists | Retained >1,000-row, empty/error and canonical tests; source matches Production | A/B behavior evidenced; no exhaustive inactive-database reconciliation |
| Realistic metadata/images | Six real products have Product JSON-LD, canonical Offer URLs and numeric MAD prices; six first-image samples return 200 (two local GETs, four public storage HEADs) | Empty/populated image mapping covered by retained tests | Missing staging images are not a demonstrated mapping defect |
| Inventory schema | Five sampled InStock products and one OutOfStock product (`a-manette-sans-fil-rgb-v2`, 499 MAD) | Supported PreOrder and unknown-stock branches pass synthetic checks | C mapping covered; no real inventory audit or hosted PreOrder claim |
| IndexNow | Current project flag `INDEXNOW_ENABLED=false` | Current Production history includes D; `lib/indexnow.mjs` matches recovery; retained mocked transport/exclusion tests pass | D safety evidenced; no submission executed |
| Staging fixtures | Prior authenticated Preview: two products, two fixture categories, InStock only, missing Product.image | 83 focused tests + 20 additional checks retained, not rerun | Insufficient as sole representative catalogue; supplemented by current Production reads and offline cases |
| Search/navigation | Prior Preview overlay/navigation observation; API GET intentionally blocked | Actual handler, ranking, error/rate-limit and initial login/empty-cart rendering passed offline | Approved isolation is not a defect; no unrestricted Preview required |
| Browser console | Prior 185 entries: 178 expected 403s and seven CSP feedback blocks | Classification retained | No new browser/hydration claim; no demonstrated JS regression |
| Checkout/payments | No transaction or payment attempted | Checkout/cart/context source identical; Preview API isolation differences explicitly identified | Preserve existing deployment; no claim of payment end-to-end certification |
| Supabase provenance | Both connected accounts lack staging authorization | Source prevents staging-to-Production transport; historical guards/tests retained | UNVERIFIED independent staging DB state |
| Rollback anchor | Current custom domain resolves in provider metadata to exact READY deployment above | Commit and earlier immutable-deployment source evidence available | Exact anchor established; restore not executed or rehearsed |

Live observations were recorded at 12:28:46Z; public image HEAD checks and non-secret flags at 12:31:10Z. They are current observations, not promises of future inventory or uptime. Public storage HEAD checks used no database credentials and do not verify database contents. Structured-data syntax/fields are not an external rich-result-validator certification or proof of search-engine indexing.

## Production scope, storefront preservation and risk

Current Production commit ancestry explicitly contains A (`ac1c6fa0`), B (`471d97a3`), C (`9692b1b5`) and D (`32cbebd0`, `ddf12f4a`). Source comparison against the committed recovery HEAD `8a12abcce38c0dc557a9ef9f86c3ce3dd113e863` found **zero differences across 1,095 Production files** under app/components/lib/public and the selected root configuration/package files. This comparison is scoped, not an assertion about every mobile/learning/operations artifact.

Against the actual dirty recovery working directory, **960 are identical, 135 differ, zero are missing**. The seven inspected SEO files all match; checkout, cart and CartContext also match. Orders/PayPal handlers differ through Preview credential selection and email suppression, and middleware adds Preview restrictions. Other differences include support/auth/push/configuration isolation; this review does not approve those as a Production patch. The full changed-path inventory is saved. The root editor's extensive unrelated uncommitted work is not a production candidate and was not modified.

Thus the recovery baseline preserves the current deployed storefront within the compared scope; promoting the dirty Preview would unnecessarily change API/security/configuration behavior. **Proposed new A–D Production change scope: empty.** Leave the current deployment untouched. A future nonempty change must be reviewed as a separate exact diff with a certificate suited to Production.

Current non-secret project configuration reads show Production `APP_ENV`, `NEXT_PUBLIC_APP_ENV`, `SEO_RUNTIME_ENV` = production; staging equivalents = staging. Both targets have IndexNow, SEO sync, manual sync, AI and editorial flags false. These are current project settings, not a full dump of immutable deployment runtime environment. Production `PAYPAL_ENABLED` is marked sensitive and was not read. Staging PayPal flag is false.

Production already has four non-SEO cron definitions (two seasonal learning-reminder slots, mobile campaigns, review followups) and one protection bypass entry. They were observed only; nothing was enabled, invoked or changed. Do not copy staging's zero-cron configuration over Production. Release E activation, external worker inventory and every integration's logs are outside this scoped A–D review.

## A–E release classification and minimal checklist

- **A — Genuine new-deployment blockers:** the current dirty recovery package is not a reviewed Production package; its 135 differences include sensitive commerce/auth boundaries. No deployment is needed for already-present A–D. If proposing another change, first produce its exact minimal diff and reproducible artifact.
- **B — Intentional Preview-only restrictions:** search/APIs, login/cart, fixture category destinations, noindex, CSP and blocked browser resources. Preserve them; no unrestricted acceptance demand.
- **C — Already satisfied offline:** stock branches including PreOrder, image mapping, search handler, category/CMS encoding, sitemap pagination/error cases, guard boundaries and initial static login/cart rendering. Do not repeat large suites without a source change.
- **D — Unverified provider/business checks:** independent staging database state/provenance; real transaction execution; full egress logs and rollback rehearsal. None is silently marked passed. Staging account authorization repair remains a concrete follow-up, not a new SEO development phase.
- **E — Future authorized deployment checks:** only if new application changes are proposed: certify the production-specific diff, use separately authorized hosted validation appropriate to those changes, re-read the rollback anchor and obtain explicit Production approval. Consumed Preview guards cannot be reused.

Minimal closeout: accept this scoped evidence for already-live A–D; keep Production unchanged and E on hold. Restore the staging connection when independent fixture provenance is needed. **Do not authorize a vague redeployment of the recovery directory.** Any future Production deployment requires separate explicit authorization of its exact reviewed artifact, target and rollback plan. No deployment approval is being inferred from this report.

## Changes Made and handoff

Added four read-only audit scripts (`final-release-provider-audit.cjs`, `final-release-public-audit.cjs`, `final-release-source-audit.cjs`, `final-release-flags.cjs`), timestamped sanitized evidence, this report and append-only Change History reporting. Application source, secrets, provider configuration, databases and consumed guards were unchanged. No large test suites were repeated. No current learning-app UI preview was checked.

Evidence directory: `artifacts/seo-preview-resume-20261023/`. Key files:

- `final-release-provider-1792844886086.json`
- `final-release-public-1792844934616.json`
- `final-release-source-1792845045046.json` (expanded comparison; earlier checkpoint retained)
- `final-release-flags-1792845098875.json`

Next account: **do not restart SEO or deploy A–D again.** Read this report first. Vercel session is valid; sandbox EACCES was the earlier failure, resolved with approved read-only network access and `vercel.cmd`. Production is still `dpl_CxX8Deg6R6T4prqTnHEiJVvqGu6f`; fresh Preview is READY. Supabase connections authenticate but do not authorize staging; use the owner-authorized organization OAuth path above. Retain the 1,212-file certificate, 2,601 hashes, existing reports and consumed guards. There is no new approved Production artifact. Stop at this evidence-based decision unless separately instructed.
