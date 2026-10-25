# SEO Recovery Preview branch audit — 23 October 2026

**NO-GO: no deployment submitted.** The newly added Preview service secret is in the storefront Vercel project, not the isolated staging project. Application source, remote settings, Production and Release E were not modified.

## Exact candidate and target

- Branch: `correction/seo-abcd-utf8-20261023`.
- Commit: `8a12abcce38c0dc557a9ef9f86c3ce3dd113e863`.
- Source: `.recovery-seo-abcd-corrected`, clean at this audit.
- Intended Vercel project: **lecomax-seo-staging**, `prj_jPniwpH4s81bhISVReUKTQN0GwvD`.
- Team: `lecomaxstore-4321s-projects`, `team_yFLUcpSvgQi8EQuvuorOZW7w`.
- Environment: **Preview**, with the exact branch explicitly selected during the eventual deployment. No existing deployment will be redeployed. The candidate has no local `.vercel/project.json` and only `.env.example`; a later deployment must explicitly bind the correct project rather than inherit the workspace's storefront project.

## Fresh scope findings

Sanitized evidence: `artifacts/seo-preview-resume-20261023/branch-scope-1792737329231.json`, checked at `2026-10-23T06:35:29.230Z`.

| Project / variable | Scope | Effective for recovery branch |
| --- | --- | --- |
| lecomax / NEXT_PUBLIC_SUPABASE_URL | Preview, agent/storefront-order-readiness | Missing |
| lecomax / NEXT_PUBLIC_SUPABASE_ANON_KEY | Preview, agent/storefront-order-readiness | Missing |
| lecomax / SUPABASE_SERVICE_ROLE_KEY | Preview, all branches; newly updated | Present, secret withheld; user reports staging provenance |
| lecomax-seo-staging / NEXT_PUBLIC_SUPABASE_URL | General Preview and that project's Production target | Present; host tyltharlnbxrxibuxyye.supabase.co |
| lecomax-seo-staging / NEXT_PUBLIC_SUPABASE_ANON_KEY | General Preview and that project's Production target | Present; JWT payload ref tyltharlnbxrxibuxyye, role anon |
| lecomax-seo-staging / SUPABASE_SERVICE_ROLE_KEY | General Preview and that project's Production target | Present; older unchanged secret, not the newly added entry |

The public JWT payload was inspected in memory; this is not a signature verification. No secret values were printed or persisted. The user's provenance statement applies to the newly added entry in `lecomax`; it cannot establish the contents of the distinct older entry in `lecomax-seo-staging`.

Both projects returned **zero linked shared environment variables**, with pagination complete. All project rows were examined, including targets, branch overrides, custom-environment IDs and integration configuration IDs. The selected deployment is ordinary Preview, not a custom environment. Production-only rows and the other branch's rows are not inherited by this branch. Vercel's documented precedence is branch-specific Preview over general Preview, and project variables over linked shared variables. References: https://vercel.com/docs/environment-variables and https://vercel.com/docs/environment-variables/shared-environment-variables .

## Service-key requirement and side effects

The unchanged candidate **requires** the server key for normal API operation: `app/api/products/route.ts:16` and `app/api/categories/route.ts:8` construct clients with `SUPABASE_SERVICE_ROLE_KEY` directly. The shared storefront server client can fall back to anon, but that does not cover these routes. Removing the key would not be a valid full Preview test. A read-only-only refactor is outside this unchanged candidate and has not been made.

In the intended staging project, effective flags disable PayPal, IndexNow, SEO sync/AI/editorial/manual sync/Mirai fallback and live agent studio; tutor budget is zero. No linked/shared or project Preview credentials for payment providers, Resend/SMTP, WhatsApp, push delivery, external AI, owner database, Redis/KV or cron authorization appear in the inventory. Staging cron definitions are empty and all deployments are protected. The candidate's four cron definitions remain intact; no schedules were changed or invoked.

These controls are not proof of zero possible outbound effects. Supabase Auth password reset/sign-up paths can send mail independently of Vercel mail credentials (`app/connexion/page.tsx`, `app/compte/profil/page.tsx`, `app/admin/accept-invite/page.tsx`). Staging Auth delivery/provider settings and database webhooks/triggers have not been certified in this audit. Before hosted validation, establish that these use test sinks or are disabled for staging, and use GET/HEAD-only browser/network acceptance without sign-up, reset, order, payment or admin mutation actions. No actual customer messages or orders should be used as test data.

The storefront project's recovery-branch Preview also contains an unrelated public PayPal client ID and lacks the staging selectors/disabled flags; it is not an alternative deployment target.

## Precise secure correction

1. Open Vercel team **lecomaxstore-4321s-projects**, project **lecomax-seo-staging**, Settings → Environment Variables. Confirm project ID `prj_jPniwpH4s81bhISVReUKTQN0GwvD`.
2. Add a **new branch-specific override** `SUPABASE_SERVICE_ROLE_KEY`, Type **Secret**, Environment **Preview only**, Git branch **correction/seo-abcd-utf8-20261023**. Copy the existing server key securely from Supabase project **tyltharlnbxrxibuxyye**. Do not edit the older entry that also targets Production and do not paste the secret in chat.
3. For an explicit branch configuration, add Preview-only overrides for `NEXT_PUBLIC_SUPABASE_URL` = `https://tyltharlnbxrxibuxyye.supabase.co` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` using that same project's public anon key, both on **correction/seo-abcd-utf8-20261023**. Existing staging general values already identify the correct project; these overrides make the intended branch scope explicit. Never put the service key in a NEXT_PUBLIC variable.
4. In project **lecomax**, the newly created all-Preview service-secret entry is unnecessary for this recovery. Remove only that new Preview-only entry if it was added solely for this task, to avoid making a staging privileged credential available to unrelated branches. Leave the separate Production entry and the historical storefront-order-readiness entries untouched. No remote removal was performed by the agent.
5. Keep all staging disabled flags and provider-credential absences intact. Verify staging Supabase Auth delivery is disabled or directed to a test sink, and review staging outbound hooks before the isolation gate is accepted. No production Auth or database settings should change.
6. Do **not** press Redeploy. Resume the audit after saving the configuration; deploy a new isolated Preview only after its effective branch environment and outbound boundary pass.

## Validation, rollback and Changes Made

Fresh checks: exact candidate branch/commit and clean checkout; project and shared-variable scope audit; safe URL/public-key identity checks; source inspection of service-key use, payment gate, cron authorization and Auth mail paths. Full key provenance and outbound isolation remain incomplete. Build and regression tests were not rerun because application source is unchanged; prior 120-test/build/image evidence remains historical evidence, not new hosted acceptance.

Preview URL/ID: **none**. No rollback is needed. Preserve the original and corrected recovery repositories and production aliases. Added the read-only scope-audit script, sanitized timestamped results, this report and an append-only Change History follow-up. `/change-history` is the history route; no history UI preview was checked or published.
