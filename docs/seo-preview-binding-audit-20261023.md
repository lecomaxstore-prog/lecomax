# SEO recovery binding audit — 23 October 2026

**NO-GO for deployment. No remote configuration or application source changed.** This report supersedes the earlier recommendation to duplicate the staging URL/public key: fresh verification establishes that those entries can remain inherited unchanged.

## Candidate and effective environment

Clean candidate `8a12abcce38c0dc557a9ef9f86c3ce3dd113e863`, branch `correction/seo-abcd-utf8-20261023`, preserved in `.recovery-seo-abcd-corrected`.

Intended target: Vercel `lecomax-seo-staging`, project `prj_jPniwpH4s81bhISVReUKTQN0GwvD`, team `team_yFLUcpSvgQi8EQuvuorOZW7w`, **Preview** only. The staging project's own Production environment scope is distinct from the storefront project's live Production; neither was modified.

Fresh evidence: `artifacts/seo-preview-resume-20261023/binding-audit-1792737919339.json`, checked at `2026-10-23T06:45:18.705Z`. All five existing Supabase variables target this project's Production and Preview, with no branch restriction or applicable branch override. The recovery branch therefore inherits them. Shared inventory is empty with complete pagination. No custom environment is selected.

| Variable | Verification |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Exact expected staging URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Readable public key; successful GET of staging Auth settings, HTTP 200 |
| NEXT_PUBLIC_SUPABASE_KEY_BINDING | Correct staging prefix and exact SHA-256 match to public key |
| SUPABASE_SERVICE_ROLE_KEY | Present, Secret/Sensitive; value withheld |
| SUPABASE_SERVICE_KEY_BINDING | Correct staging prefix and 64-hex format; cannot compare with withheld service key |

No credential or binding value/hash was logged. A successful public Auth-settings request does not validate the separate server credential or prove privileged database access.

## What bindings actually do in this candidate

The format is `project-ref:sha256(exact UTF-8 key)`. The helper `credentialBinding` compares the exact fingerprint; `supabaseCredential` also checks the expected URL and role, and `applicationEnvironment` would validate both bindings and external-service configuration.

**Those checks are not connected to the corrected candidate's Supabase runtime or build.** A tracked-source search finds these helpers only in `operations/seo-vercel/lib/environment-target.mjs`; the candidate's `lib/indexnow.mjs` imports only `environment`. Its `lib/supabase.ts`, `lib/supabase-server.ts`, direct API clients and `scripts/next-build.mjs` do not invoke binding validation. The dirty main workspace has additional guarded clients; it must not be confused with this preserved candidate.

Therefore a binding is neither independent credential provenance nor an enforced database boundary for this release. No guard code was transplanted and no candidate changes were made. The service key remains required for the unchanged products/categories APIs, which construct clients with it directly.

## Side-effect checks

- Staging selectors verified; PayPal, IndexNow, SEO sync/AI/editorial/manual-sync/Mirai and live agent studio flags are false; tutor token budget zero.
- Effective variable inventory has no external payment/email/push/WhatsApp/AI provider credentials or cron/worker authorization keys. No shared credentials are linked.
- Vercel staging cron definitions empty, deployment protection covers all deployments. Candidate's four cron definitions preserved; no cron invoked.
- Read-only staging metadata: no Edge Functions; no non-internal triggers on public/auth tables; no pg_cron, pg_net or http extensions installed. These checks are bounded metadata evidence, not proof that every possible external hook is absent.
- Public staging Auth settings: sign-ups disabled; anonymous and external OAuth/phone providers disabled; **Email provider enabled**, mailer autoconfirm false. Password-reset flows exist in the candidate. SMTP delivery and Auth hook destinations are not exposed by this public endpoint, so email isolation remains unverified. No mail-sending request was made.

## Smallest safe manual changes

Leave all five existing Production+Preview entries intact. Do not duplicate the URL, anon key or public binding; they already pass.

In **lecomax-seo-staging → Settings → Environment Variables**, add only a deliberate override for:

- Key: `SUPABASE_SERVICE_ROLE_KEY`
- Type: **Secret**
- Environment: **Preview only**
- Git branch: **correction/seo-abcd-utf8-20261023**
- Value: existing server key copied securely from Supabase project **tyltharlnbxrxibuxyye**. No rotation, chat paste, online hashing tool or change to the general entry is required.

For consistency, privately compute `tyltharlnbxrxibuxyye:` followed by lowercase SHA-256 of the exact key's UTF-8 bytes (no added newline). Compare with the existing service binding. **Only if it differs**, add `SUPABASE_SERVICE_KEY_BINDING` for that same Preview branch with the matching binding. Do not change the general binding. This preserves accurate metadata but does not activate runtime enforcement. Thus the required configuration change is one scoped secret override, plus one binding override only if its fingerprint differs. If trusted setup evidence can instead establish the existing secret and binding's provenance, replacing credentials is unnecessary; current API evidence alone cannot establish it.

For email isolation, in **Supabase staging project tyltharlnbxrxibuxyye → Authentication → Sign In / Providers → Email**, disable the Email provider if authentication is outside this SEO Preview's scope. Keep sign-ups disabled. If authentication must remain testable, configure a non-delivering test SMTP sink and inspect Auth hooks instead; do not use real customer addresses. These are staging-only manual changes, not Vercel variables, and were not performed here. Disabling sign-ups alone does not disable existing-user reset flows.

Preserve all other disabled flags and absent provider secrets. Do not press Redeploy. After the manual changes, re-audit exact branch resolution and Auth settings before any new Preview deployment. Deployment must explicitly select the staging project, Preview target and recovery branch, with no inherited local dotenv/production project linkage. Browser acceptance should block mutation requests and avoid orders, password resets, admin writes and provider submissions.

Vercel confirms branch-specific Preview values override general Preview values without requiring replication of unrelated entries: https://vercel.com/docs/environment-variables . Supabase documents password-reset email delivery separately from signup policy: https://supabase.com/docs/guides/auth/passwords .

## Validation and Changes Made

Added the read-only binding audit, sanitized results and this report; appended linked Change History. The candidate is unchanged and clean. No production, database record/schema, credential, flag, worker, cron or Release E modification occurred. No build/regression rerun was warranted for documentation-only work; prior source validation remains historical evidence. No Preview deployment or hosted acceptance was performed, so there is no new Preview URL or rollback action. `/change-history` is the history route; its UI was not previewed.
