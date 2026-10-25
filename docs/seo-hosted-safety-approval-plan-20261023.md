# Hosted safety gates: execution plan and approval boundaries

Status: **NO-GO for deployment. Plan only; no hosted verifier, deployment, email configuration change or real acceptance executed.** This supplements, rather than replaces, earlier evidence and the prepared acceptance plan.

## Verifier review

Reviewed `.recovery-seo-preview-isolated/lib/seo-preview-runtime-check.mjs`, `lib/seo-preview-credential-policy.mjs`, `lib/seo-preview-credential.mjs` and `scripts/verify-seo-preview-runtime.mjs`.

Before transport, the verifier requires Vercel hosted Preview, exact project `prj_jPniwpH4s81bhISVReUKTQN0GwvD`, exact team `team_yFLUcpSvgQi8EQuvuorOZW7w`, staging environment markers, exact Supabase origin `https://tyltharlnbxrxibuxyye.supabase.co`, a nonempty whitespace-free Preview key and matching SHA-256 binding. Legacy service credentials are not read in Preview. JWT claims, where applicable, must identify staging and service_role; this is consistency checking, not signature verification.

Only after validation, one GET is permitted to `https://tyltharlnbxrxibuxyye.supabase.co/auth/v1/admin/users?page=1&per_page=1`. No caller URL, mutation, redirect following or retry is accepted. Timeout is ten seconds; success requires HTTP 200 without redirection. The body is cancelled, never parsed or logged. Cancellation cannot guarantee that zero response bytes reach the process, but no account body is retained by the code. Output is a fixed success object or generic error; credentials and bindings are never printed. No application route exposes the verifier.

Fresh synthetic results: 12 verifier/strict-loader tests passed, including zero transport calls on invalid identity, missing binding, wrong fingerprint and conflicting context; generic failures on redirected success and body cancellation failure. This does not establish actual hosted credential equality.

## Protected execution plan — approval B required

No non-deployment execution facility with these existing Sensitive Preview values has been established. Do not claim that a local script, local `vercel build`, a new Sandbox or an arbitrary CI job automatically inherits them. The concrete proposed mechanism is a **verification-only Vercel Preview build request**, not an application deployment ready for traffic. Creating that request is still a deployment API operation and remains prohibited without new explicit approval.

Preparation after approval, before any upload:

1. Create a separate minimal probe package outside the candidate. Copy only the existing verifier and its policy/context/credential imports; record code hashes. No application routes, Next.js build, fixtures, dependency install scripts or background processes. Disable installation, framework detection and crons in deployment-scoped configuration. Review the complete package before submission.
2. Refresh provider metadata and verify project/team, protection, target Preview and existing sensitive scopes. Use exact project ID and team, never a name-based default or production project link. Do not pull/export secrets or supply secret-valued CLI arguments.
3. Bind the provider deployment record, submitted package hashes and returned deployment ID to the audit. Vercel documents `VERCEL_PROJECT_ID` and `VERCEL_DEPLOYMENT_ID` at build time; it does **not** list `VERCEL_ORG_ID` as an automatic system variable. Do not assume it exists. The reviewed wrapper may provide the nonsecret expected organization ID for this one build only after the authenticated provider record establishes that owning team. This constant is a consistency check, not independent attestation. If deployment-scoped injection is unavailable without persistent configuration changes, stop for a revised review; do not weaken the verifier or modify project environment variables.
4. Inside the genuine Vercel build, verify native project/deployment/Preview identity and run the unchanged verifier exactly once with the existing sensitive Preview values. Never dump the environment, enable shell tracing or rely on provider log redaction.
5. After a verifier success marker, the wrapper must deliberately exit nonzero before output/deployment publication. On any other failure, exit nonzero with a different fixed failure marker. No route or static output is generated. A failed build status is expected and is not itself evidence that the probe passed.
6. Read only sanitized build output and provider metadata. Require the unique verifier success marker, expected intentional-stop marker, matching project/team/target/package and failed build state. If Vercel rejects the package before execution, record an inconclusive result. Do not retry automatically. No promotion, alias, Git connection, environment change or follow-on app deployment is included.

This design avoids a public verification endpoint but still creates a provider deployment/build record and can incur build usage. Its packaging and provider behavior must be checked before submission; this document is not an already tested runnable deployment command. Existing application build output remains untouched. Provider metadata from the earlier audit remains the latest actual hosted evidence.

References: [Vercel system variables](https://vercel.com/docs/environment-variables/system-environment-variables), [Secret/Sensitive variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables).

## Email route and upstream review — approval A required for changes

The fresh executable inventory and handler tests cover these sender files under `app/api/`: `account/password-reset`, `admin/staff/resend-invite`, `auth/signup`, `cron/review-followups`, `inbox/reply`, `messages`, `newsletter/send`, `orders`, `orders/[id]`, `orders/[id]/notify`, `orders/[id]/trustpilot`, and `send-confirmation`. Guards stop dedicated mail handlers before dependencies; optional Resend clients in messages/orders are absent in Preview. Staff creation/update/deletion are also blocked. Browser Auth mutations are intercepted. All 18 tests pass. The inventory is source-based coverage of recognized executable sends, not a proof about arbitrary dynamic future code or external systems. Messages/orders may still perform non-email writes; acceptance must not call their mutations.

Latest hosted audit found signup, Email Provider, Send Email Hook and security notification emails disabled; no SMTP sink exists. Keep those controls disabled. Supabase default SMTP can deliver to permitted team addresses when a flow is accepted. Direct upstream admin invitations, recovery/email-change paths and dashboard actions do not inherit our application guards. Do not probe them to discover whether delivery occurs.

**Recommended configuration:** an isolated authenticated TLS SMTP capture/discard service dedicated to staging, with no forwarding, no relay, no delivery integration, and infrastructure-enforced denial of outbound network connections. Only established inbound connection replies and narrowly necessary infrastructure traffic may be allowed; deny outbound SMTP and HTTP mail-provider paths. Configure only Supabase staging custom SMTP to that reviewed endpoint. Retain disabled Auth features and hooks. Require evidence of the sink implementation/configuration, enforced egress policy and ownership; a provider marketing label or fake hostname is insufficient. An unreachable SMTP host or bad password is not a durable non-delivery guarantee.

Validate the sink separately with synthetic `.invalid` recipients and no real account tokens or addresses, only under the explicit sink-test approval. Inspect capture/discard and blocked forwarding evidence; do not invoke a Supabase email flow or send to a real recipient. Provider configuration readback must show custom SMTP remains selected, and any failure/fallback behavior must be documented. Until that evidence exists, keep the gate open rather than claiming proof.

An SMTP sink covers Supabase SMTP, **not Resend or arbitrary application HTTP sends**. Retain application suppression and review that no usable outbound mail credential/path is exercised. A stronger runtime-wide guarantee would additionally require enforceable server egress denial of mail providers or provider-enforced non-delivering credentials; neither is currently demonstrated or authorized to change. Browser request blocking alone does not constrain server egress.

A deny-only Send Email Hook is an alternative requiring separate hook deployment/configuration authorization and demonstrated coverage, failure and fallback behavior. It is not the default recommendation under the present prohibition on hooks, migrations and deployments. Do not enable Email Provider merely to test the hook. Supabase documents that enabled hooks replace SMTP, but that alone does not establish coverage of every application mail provider.

References: [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook).

## Real staging acceptance — approval C required

Retain `operations/seo/hosted-staging-acceptance-20261023.json`. It remains disabled with no fabricated deployment URL. After gates A/B pass, a separate approval may allow one protected application Preview from the preserved derived candidate, using explicit empty-cron configuration, no fixture/prebuilt output and no production alias.

Use existing approved synthetic staging catalogue records, verified through read-only access. Assert home/Boutique settings and promotions load successfully; category membership; product price/stock/image/schema/canonical; unknown-product 404; cart rendering and strictly local add/remove only; login rendering only; sitemaps and 30 image hashes. Block all unapproved network origins and all mutation requests before browser navigation. Inspect server-side fetch destinations separately; browser interception cannot prove server-side isolation. Stop on any production DB host, unexpected redirect, external send/payment attempt or loader failure. Never hide a failed loader behind fixtures during this phase. No checkout, order submission, real login, signup, OTP, password reset or staff invitation is authorized. Real authentication would be a separate test scope.

## Minimum owner actions and safest sequence

No reconnection or credential disclosure is needed. No approval is assumed from reading this plan.

| Approval | Exact permitted scope | Explicitly excluded |
| --- | --- | --- |
| A: non-delivery | Choose/provide a reviewed staging-only capture/discard SMTP service; approve only its infrastructure/setup, Supabase staging SMTP fields, and synthetic sink-only validation. Review the concrete endpoint and field list before applying. | Production SMTP, application credentials, enabling Email Provider/hooks, real recipients, Supabase email-flow tests, migrations. |
| B: one probe build | After the reviewed package is available, approve one verification-only Preview build request in `lecomax-seo-staging`, existing sensitive bindings, one fixed staging GET, and intentional failure before publication. Approve build-scoped nonsecret team context only if required and supported. | A ready application Preview, public probe endpoint, persistent environment/secret changes, production, automatic retries, alias/promotion. |
| C: protected app Preview and acceptance | Only after A/B evidence passes, approve one derived-candidate protected Preview and the read-only acceptance matrix. | Production deployment, checkout/email/Auth mutations, migrations, workers, cron activation, Release E. |

Safest sequence: prepare/review sink infrastructure and probe package; approve A and validate non-delivery; approve B and record genuine hosted key/binding proof; approve C and complete real-data acceptance; issue a new GO/NO-GO based on those results. No production approval is part of this sequence. If the current no-settings-change/no-deployment restrictions remain absolute, these gates cannot all be cleared; retain NO-GO.
