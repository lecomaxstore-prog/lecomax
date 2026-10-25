# Restricted SEO Preview readiness — 2026-10-23

Scope: preparation only, in `.recovery-seo-preview-isolated`. No deployment, hosted credential-verifier execution, SMTP/provider changes, secrets changes, migrations, Release E or production operations are authorized by this report.

## Implemented controls

- Preview middleware runs before rate limiting, sessions, maintenance reads and handlers. Only GET/HEAD to the four existing category pages, homepage, Boutique, product slugs, sitemap index/shards, robots and local assets are allowed. Unknown routes, APIs, login/cart/checkout/admin/contact and all other methods return 403. Production retains its original static-path exclusions.
- Configuration contradictions fail closed: staging application flags, exact Supabase staging origin, disabled payment/IndexNow/worker flags and, on Vercel, exact staging project ID are required. The application does not assume `VERCEL_ORG_ID` exists.
- Next instrumentation restricts server `fetch` to GET/HEAD on enumerated catalogue REST tables in `tyltharlnbxrxibuxyye`; auth/RPC/unknown tables, mutations, other origins and redirects are denied. The standalone credential verifier remains separate and unchanged.
- Browser Supabase transport is disabled, with no persisted/restored session, token refresh or URL-session detection. Existing Resend/admin invitation/email suppression remains active. Tracking, chat, push, consent scripts, global store synchronization and analytics are omitted from the Preview layout.
- CSP permits same-origin connections/assets and blocks form submission, frames and workers. Remote image optimization is denied; local encoded image filenames remain supported. Some existing components may attempt same-origin reads/prefetches that receive 403. These are not evidence of successful side effects.
- Preview responses carry `noindex, nofollow, noarchive`; robots serves `Disallow: /`. Production canonical URLs and JSON-LD are inspected as content only. Do not crawl production URLs from sitemap contents. A protected noindex Preview cannot prove actual Google indexing or rich-result eligibility.

## Provider metadata (read-only, not hosted runtime evidence)

Vercel audit at 2026-10-23 13:18 UTC matched `lecomax-seo-staging`, project `prj_jPniwpH4s81bhISVReUKTQN0GwvD`, team `team_yFLUcpSvgQi8EQuvuorOZW7w`. Both SEO Preview credentials are Sensitive, Preview-only and have no branch override. All audited staging/disable flags matched; protection applies to all deployments, no Git connection, no cron definitions and no shared environment entries. Sensitive values were not retrieved.

Supabase audit at 13:19 UTC matched `tyltharlnbxrxibuxyye` and its expected organization. Signup, Email Provider, Send Email Hook and security notification emails remain disabled. Custom SMTP host/user/password are absent. No email was sent and no configuration changed. Existing Vercel ownership evidence is preserved; this is not proof of effective hosted credential equality.

## Local evidence versus hosted gates

See the accompanying evidence JSON for exact logs, validation counts and final status. Local production-mode builds use synthetic credentials and fixture transport. They must never be uploaded as prebuilt output. Browser checks use localhost and deny other origins. They do not prove real staging content, hosted configuration inheritance, deployment protection, or real service credential validity.

The previous 120 regression, 19 credential-isolation, 18 email-safety and 12 verifier/error-handling tests remain passing. The original email transport unit test intentionally describes its older permissive login layer; the new browser transport and HTTP boundary provide the stricter outer restriction and are tested separately. Existing recovery files, corrected images and history are retained.

## Protected verifier execution plan — NOT executed

1. Obtain separate explicit authorization for exactly one hosted verification run. Before running it, identify a private execution context bound to the staging project and Preview environment. No public diagnostic route may be introduced.
2. Verify the execution/deployment's project/team using authenticated Vercel metadata, recheck Preview-only credential scopes and staging public-key binding, and pin the candidate source hash. Do not trust manually set project/team strings as independent proof of identity.
3. `VERCEL_ORG_ID` is not assumed to be automatically present. Establish the exact owner from authenticated project `accountId` and team `id`. If needed, pass that validated ID only to the verifier child process in the verified context; do not change saved environment variables. Stop if the context cannot be attested or either identity disagrees.
4. Run the existing `scripts/verify-seo-preview-runtime.mjs` only there, with existing sensitive bindings. It validates Vercel identity and the staging credential binding before one fixed GET to `https://tyltharlnbxrxibuxyye.supabase.co/auth/v1/admin/users?page=1&per_page=1`. Redirects are rejected, timeout is bounded, response body is cancelled without parsing and errors are generic. Never print keys, fingerprints, user bodies or environment dumps.
5. Approval for this run does **not** authorize creating or deploying its execution environment. No suitable hosted execution context has been established in this task. If a Vercel build/deployment is needed to supply one, stop for that separately scoped approval. A local process with fabricated Vercel variables is not a hosted verification substitute.

## Read-only hosted acceptance — prepared, disabled

`readonly-preview-acceptance.json` supersedes the broader historical acceptance plan for this scope. It remains `authorized: false` with no deployment URL. `verify-readonly-preview.mjs` is a prepared GET-only HTTP subset; it rejects missing approvals/identity/provenance and never accepts a protection bypass token. Do not relax deployment protection to run it. Use a separately reviewed authenticated browser session for protected access.

After verifier PASS and separate deployment/acceptance approval: deploy source only to the exact staging project using the existing `resume-preview-config.json` (`crons: []`, Git deployment disabled). Never use the candidate's default production cron configuration, local fixture build or `--prod`. Verify immutable deployment identity, source manifest, protection and effective environment before navigation. Select existing approved staging catalogue records; create no data.

Register browser interception before navigation, block service workers/WebSockets, allow GET/HEAD only to that immutable staging deployment and deny all other origins. Validate homepage, Boutique, all four categories, an approved product, Product JSON-LD/canonical/stock metadata, every sitemap shard and robots. Inspect all 30 repaired image hashes. Confirm forbidden surfaces return 403 using GET only. Keep mutation probes synthetic/local. Record statuses and redacted network counts; stop on any attempted mutation, unexpected external request, credential failure or data-provenance issue.

## Residual risks and decision

A dedicated SMTP sink is not necessary for this accepted SEO-only workflow, provided these restrictions and disabled Auth settings remain in force. This does **not** prove provider-wide non-delivery: Supabase default mail capabilities, manual dashboard operations, other services/keys or future code/settings changes remain outside the application guard. No Mailtrap or SMTP configuration is proposed here.

The server boundary wraps `fetch`; it is not an operating-system egress firewall and does not universally intercept native sockets, direct database drivers, alternate HTTP clients or arbitrary future server code. CSP does not constrain a separate external client calling Supabase directly. Use a fresh protected Preview origin/browser context; never reuse a production session or service worker. Remote CDN/storage images remain blocked and may need approved local assets if actual staging data references them. These are explicit limits, not a claim of universal network isolation.

Decision: local restricted-candidate readiness is determined by the final evidence file; hosted readiness remains **NO-GO pending separate authorization, a verified execution context, service-credential verification and real staging-backed acceptance**. Production remains outside scope.
