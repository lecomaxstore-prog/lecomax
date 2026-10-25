# Protected SEO Preview release review

Prepared only. Deployment is NOT authorized by this document. No hosted verifier rerun.

## Candidate and evidence

- Source: `.recovery-seo-preview-isolated`, branch `preparation/seo-preview-credential-20261023`.
- Actual Git HEAD: `8a12abcce38c0dc557a9ef9f86c3ce3dd113e863` (use Git's value; the handoff spelling differs).
- Exact changed-file inventory: `artifacts/seo-preview-resume-20261023/final-preview-candidate-inventory.json`.
- 2601 baseline file hashes unchanged; 137 tracked modifications and 15 untracked files preserved.
- Hosted verifier PASS evidence: `verifier-only-inspection-1792764132082.json` in that artifact directory. One request, HTTP 200, intentional ERROR, no aliases. Guard consumed.
- Current protection/environment evidence: `resume-metadata-1792764308801.json`, `verifier-build-preflight-1792764310901.json`, `final-preview-control-audit-1792764375214.json`.
- 62 focused security tests passed this session, using synthetic transports only. Prior unchanged-candidate evidence: 226-page fixture build, TypeScript, 120 recovery regressions, 37 local acceptance checks and four browser pages. These are not real staging-backed storefront results. No full build repeated.

## Target and protection

Only project `prj_jPniwpH4s81bhISVReUKTQN0GwvD` / `lecomax-seo-staging`, team `team_yFLUcpSvgQi8EQuvuorOZW7w` / `lecomaxstore-4321s-projects`, target Preview. Supabase URL must remain `https://tyltharlnbxrxibuxyye.supabase.co`.

Authenticated metadata confirms Vercel Authentication protection `all`, zero protection exceptions in project metadata, source not public, no Git connection, no project cron definitions, no build-ignore command. Only assigned project domain is `lecomax-seo-staging.vercel.app`, with no branch mapping. Both dedicated credentials are sensitive, Preview-only and unbranched. Shared env inventory is empty. All audited staging selectors and disabling flags match.

A future URL does not exist yet; verify anonymous access is denied after deployment before opening application pages. Never disable protection, generate share links, add exceptions or change secrets to facilitate testing.

## Exact proposed Git-free CLI procedure (after explicit approval)

1. Refresh safe project/env/protection metadata and compare candidate inventory and all 2601 hashes. Abort on drift. Confirm no unexpected dotenv, `.npmrc`, symlink, generated fixture or secret file enters upload. Review actual CLI upload inventory against `.vercelignore` before claiming source completeness. Do not use an older recovery directory.
2. Run one CLI invocation with working directory set to the absolute candidate directory. Construct a clean child environment containing only OS necessities (`PATH`, `SystemRoot`, `WINDIR`, `ComSpec`, `TEMP`, `TMP`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA`) and the two pinned non-secret values below. Do not inherit application credentials, NODE_OPTIONS, npm overrides or VERCEL_TOKEN. Use existing CLI authentication; never pass tokens in argv.

```text
VERCEL_ORG_ID=team_yFLUcpSvgQi8EQuvuorOZW7w
VERCEL_PROJECT_ID=prj_jPniwpH4s81bhISVReUKTQN0GwvD
node C:/Users/Ziko/AppData/Roaming/npm/node_modules/vercel/dist/vc.js deploy . --target=preview --scope lecomaxstore-4321s-projects --local-config "C:/Users/Ziko/Desktop/my projects/L'ecomax/artifacts/seo-preview-resume-20261023/resume-preview-config.json" --yes
```

The argument list above is literal; use a child-process argument array to preserve spaces/apostrophes. The config explicitly selects Next.js, empty crons and disabled Git deployments. Do not use the candidate default vercel.json (it contains cron definitions). No `--prod`, `--prebuilt`, `--public`, env overrides, `promote`, `alias set`, Git connect or retries. `--skip-domain` is a production option, not a Preview isolation mechanism.

3. Record the returned deployment ID and immutable hostname. Independently GET its provider record and validate project/team, Preview target, effective config, protection, aliases and source identity. Stop on ambiguity; do not automatically repeat CLI invocation after a lost response. Do not repoint the project production domain or any lecomax.com alias. Generated Preview URLs/aliases are expected provider side effects and must be inventoried.
4. Complete the acceptance below before calling the Preview accepted. No production promotion follows.

## Build behavior and limits

This is a full Next.js application upload, including server functions whose routes are denied by middleware; it is not the seven-file verifier package. `.vercelignore` excludes Git, dotenv, node_modules, .next, .vercel and build artifacts. Remote `npm ci` uses the lockfile; `npm run build` invokes prebuild course generation/validation/source catalogue generation and then the credential-guarded Next build. Build can fetch npm packages, native dependencies/Node headers, fonts and allowed staging catalogue data; it consumes hosting resources and creates logs/artifacts.

Lockfile lifecycle packages: argon2, node-pty, unrs-resolver and optional macOS fsevents. Locally inspected native hooks compile/check binaries, copy build files or prepare native packages. This is not an exhaustive proof of remote dependency behavior. Team webhooks/integration callbacks are not exhaustively inventoried by project metadata. Do not describe build as having zero external side effects.

The dedicated selector fails closed without matching staging URL/binding and never falls back to the inherited legacy service key. Middleware checks every path before session/rate-limit/route work, allows only enumerated GET/HEAD SEO reads, and denies auth, signup, invitation, checkout, payment, contact, admin, cron and API routes. Server fetch allows only named staging REST tables with GET/HEAD and redirect rejection. Browser Supabase transport/session restoration is disabled; CSP blocks external connections, forms, workers and frames. Email suppression and feature-disable flags remain intact. Robots disallows all; responses carry noindex/nofollow/noarchive and private/no-store.

These are application boundaries, not an OS-level egress firewall for arbitrary native sockets or dependency hooks. The old service secret still exists in Preview metadata but is not consumed by the audited selector. No secrets were changed.

## Real staging-backed acceptance

Use `readonly-preview-acceptance.json` as the detailed checklist; authorization remains false until separate approval. The optional fetch harness cannot authenticate to this protected deployment and is not sufficient by itself.

Before acceptance, select existing approved staging product/category records and establish data provenance without copying customer data, creating fixtures or writing the database. No approved product selection is asserted in this review. If absent, stop. Compare visible name, slug, price, stock and category to that approved record so fallback/local catalogue output cannot masquerade as staging success.

Authenticate through ordinary Vercel access in an authorized browser; keep cookies only in memory, never export them. Use a dedicated context with service workers blocked and request routing installed before application navigation: only GET/HEAD to the verified immutable deployment hostname; block external origins, writes and WebSockets. Authentication itself is a separate Vercel step. Do not create automation secrets. Record anonymous denial separately.

Check homepage, Boutique, approved product and each permitted category for 200, expected data, no hydration errors, no loader fallback and correct production canonical strings. Parse Product JSON-LD and compare product identity, price, availability and URL. Do not follow production canonicals.

Parse sitemap index and every referenced shard; map only approved sitemap paths back to the immutable Preview origin. Reject private/staging loc values, invalid XML and cross-origin fetches. Verify static/products/categories/pages/posts shards and invalid shard behavior. Check robots Disallow: /, noindex headers and restrictive CSP. Decode all visible product images; GET the 30 repaired assets and compare recorded hashes. Reject external image fetches.

GET denied routes and expect 403; never issue hosted mutation probes. Cart page is intentionally unsupported (403); inspect existing cart UI only where available without navigating to checkout or relaxing restrictions. Empty category data or unsupported CMS/ecomedia routes must be reported as coverage limitations, not silently accepted.

Save only sanitized status/assertion/network counts, timestamps, deployment/source identity and image hashes. Do not save cookies, headers, service keys, key fingerprints, raw database bodies or sensitive logs. Stop on any mismatch or attempted side effect.

## Rollback and cleanup

Before deployment, no rollback is needed. After approval, capture the prior staging deployment/domain inventory. If build is still running and unsafe, request cancellation of only the new verified staging deployment. If ready but unacceptable, keep protection enabled, stop acceptance, and obtain authorization to remove only that deployment and its newly generated aliases. Confirm exact project/team/deployment ownership first. Never promote an old deployment, touch production domains, change cron schedules or delete the staging project as rollback.

Preserve the candidate, all uncommitted files, verifier guard, receipts, evidence and Change History. Close temporary acceptance contexts; remove only explicitly identified temporary browser data after checking paths. No migrations/data writes means no database rollback should be necessary. Provider cancellation/deletion is a separately reviewed action; nothing is deleted now.

## Recommendation

Conditional GO for requesting approval of the protected Preview procedure; NO-GO for execution until explicit approval and the final source/metadata checks. NO-GO for acceptance/release until real staging data provenance, authenticated access and all hosted checks pass. Production and Release E remain on hold. Residual native build-hook/integration limitations above must not be represented as verified isolation guarantees.

References: https://vercel.com/docs/cli/deploy ; https://vercel.com/docs/deployment-protection ; https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication
