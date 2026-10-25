# Zero-budget staging email decision

Design approval recorded: Mailpit for SEO staging only. Additional hosting budget: **$0**. No purchasing, account creation, provisioning, deployment, SMTP configuration, secret modification or real-recipient contact performed.

## Existing capacity: no suitable Mailpit host established

Authenticated Vercel GETs identify the existing staging project as a Next.js project. Authenticated Supabase metadata identifies the healthy managed staging project `tyltharlnbxrxibuxyye`. These are the evidenced staging resources, not general-purpose Linux machines with operator-controlled TCP ingress, persistent storage and network policy.

Mailpit needs a persistent SMTP listener reachable from hosted Supabase, TLS/authentication, private administration, storage and independently enforced denial of new outbound connections. The existing Next.js Functions deployment does not establish such capacity. Hosted Supabase database/Auth is not an OS host for installing Mailpit; its bounded Edge Functions do not establish that capability either. Do not attempt to use database SQL for OS installation or treat unused database capacity as a free server. These are architecture conclusions from the managed service models, not a claim to have exhaustively inventoried all accounts you may own. [Vercel Functions](https://vercel.com/docs/functions), [Supabase Edge Function limits](https://supabase.com/docs/guides/functions/limits).

The repository's `operations/seo/lecomax-seo.service` is a proposed Linux worker unit, not evidence of a running server. `docs/seo-account5-readiness-20261018.md` explicitly recorded that no Linux runner had been identified. No newer host ownership/capacity evidence was found in the reviewed SEO documents. Your workstation is not accepted as an internet-facing staging SMTP service: uptime, public ingress, certificates and network isolation are unverified, and exposing it would be new infrastructure work. A temporary Vercel Sandbox is likewise not an evidenced persistent, free SMTP host.

**Conclusion:** cannot securely place Mailpit on the currently evidenced staging infrastructure at a demonstrated $0 incremental cost. An already-paid isolated Linux host could change that conclusion, but its existence, spare capacity, network controls and no-extra-charge terms must first be established. No production host should be repurposed.

## Cost and requirement comparison

Prices checked 23 October 2026; no subscription or trial was started.

| Option | Additional cost | Non-delivery / security fit | Decision |
| --- | --- | --- | --- |
| Existing disabled email settings, no sink | $0 | Application paths suppressed; does not prove upstream-wide non-delivery or enforce all server egress | Valid only for an explicitly bounded SEO review, not the strict global guarantee |
| Mailpit on existing Vercel/Supabase | No supported $0 host established | Cannot demonstrate persistent SMTP or independent firewall controls | Do not deploy here |
| Mailpit on an existing isolated Linux host | Software licence $0; infrastructure may be $0 incremental only if already owned and sufficient | Can meet TLS/auth/private UI/no forwarding plus IPv4/IPv6 egress denial after configuration and tests | Approved design retained; host unavailable in evidence |
| Mailtrap **Email Sandbox Free** | $0/month; 50 test messages/month, one sandbox/user, ten stored messages | Provider captures mail; Free comparison lists neither manual forwarding recipients nor forwarded-email allowance. Authenticated SMTP/private account. Required TLS and account-effective enforcement still need evidence | Best managed $0 candidate to evaluate; not yet certified |
| Mailtrap Email Sandbox Basic | $17 monthly, or $168 paid annually ($14/month equivalent) | Includes forwarding capability; would need to remain disabled | Over budget and unnecessary for this task |

Mailtrap's **Email API/SMTP sending product is not the sandbox** and is not an acceptable substitute, even if its sending plan is free. No automatic paid upgrade or fallback to live sending is allowed. Quota exhaustion must stop testing, not switch transports. [Current pricing](https://mailtrap.io/pricing/), [Sandbox overview](https://docs.mailtrap.io/email-sandbox/overview), [forwarding documentation](https://docs.mailtrap.io/email-sandbox/management/automatic-email-forwarding).

Mailtrap documents unique per-sandbox SMTP authentication, the `sandbox.smtp.mailtrap.io` service and available ports. Its provider-enforced capture semantics differ from an owner-controlled firewall. Public documentation supports its purpose as a non-delivering service, but **we have not verified the actual account's plan, manual/API/automatic forwarding permissions, required TLS behavior or downgrade resistance**. STARTTLS support is not proof that plaintext is rejected. Do not mark it compliant with all requirements until those points are established. Paid/trial entitlements can differ from Free; they must be checked rather than assumed. No Mailtrap account was accessed and no provider was contacted on your behalf.

If the requirement specifically means a customer-controlled network firewall denying delivery, a managed sandbox cannot demonstrate that exact control; use an existing isolated Linux host or keep deployment blocked. If provider-enforced non-delivery is an acceptable equivalent, Mailtrap Free is worth a read-only account/settings review before any setup approval.

## Is a sink strictly necessary for SEO-only Preview?

**No: it is not a functional prerequisite for rendering catalogue pages, canonical/schema tags, sitemaps, cart shell or login shell.** Those acceptance checks do not require any email workflow. Keeping provider signup/email/hook/notifications disabled and the tested application guards can support a narrowly controlled, protected, read-only SEO review without SMTP configuration.

That does **not** satisfy a universal no-real-email guarantee. Remaining risks are direct Supabase admin/dashboard actions, undocumented or future mail paths, configuration drift, production-capable third-party mail credentials, and code outside the audited guard inventory. Browser request interception does not constrain server-side requests. Supabase default SMTP is capable of delivering to permitted team addresses when a mail flow is accepted; disabling the Email Provider should not be described as proof that every privileged mail operation is impossible. [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

For a no-sink SEO review, require explicit scope/risk acceptance: deployment protection, synthetic staging records only, no Auth/order/contact/admin/cron mutations, no real-user sessions, blocked unapproved browser traffic, reviewed server fetches and unchanged email guards. Stop on any attempted mail action. This is an alternative scoped safety case, **not** a claim that the email-isolation gate has passed. Your current enforced-non-delivery requirement remains in force unless you explicitly choose that narrower scope. Neither a Supabase SMTP sink nor Mailtrap captures direct Resend sends, so application suppression remains necessary in either design.

## VERCEL_ORG_ID: authenticated ownership check completed

Fresh authenticated Vercel project and team reads matched:

- Project: `prj_jPniwpH4s81bhISVReUKTQN0GwvD`, `lecomax-seo-staging`, framework `nextjs`.
- Project `accountId` equals team `id`: `team_yFLUcpSvgQi8EQuvuorOZW7w`.
- Team slug: `lecomaxstore-4321s-projects`.
- Evidence: `artifacts/seo-preview-resume-20261023/staging-host-capacity-identity-1792757090277.json`, checked at 2026-10-23T12:04:50Z.

This establishes the expected organization ID through authenticated metadata. It does not assume `VERCEL_ORG_ID` exists in the build. A future approved execution must match its genuine deployment record and native project/deployment IDs to this ownership, then supply the expected org to the verifier's child process only. No permanent environment change is needed for that design. The offline identity helper must receive provider-authenticated, schema-normalized records; arbitrary JSON is not attestation. The control-plane identity task is complete; actual hosted runtime identity and sensitive-key equality cannot be certified before an authorized runtime exists. No verifier was executed.

## Safest concrete next plan

1. Spend nothing and leave current Supabase/Vercel settings unchanged. Retain the Mailpit design and all existing application suppression.
2. With separate approval, review an existing Mailtrap **Free Email Sandbox** account, or create a Free-only sandbox if none exists. No billing upgrade, live sending domain/product or forwarding recipient. First establish the actual entitlements and TLS requirements through settings/documentation; any provider support contact would require explicit permission.
3. Prepare a settings-only approval package for the specific sandbox, including plan cost $0, authentication, verified required TLS, no forwarding/release capability, and provider-enforced non-delivery. If evidence fails, do not configure Supabase; request an existing isolated Linux host instead. No SMTP credential is to be pasted in chat.
4. Only after a separate SMTP-change approval, enter the selected sandbox credentials privately into **Supabase staging `tyltharlnbxrxibuxyye` only** and re-audit all disabled provider/hook/notification settings. Synthetic capture tests require their own approved scope; no real recipients or Auth flow tests. No fallback to live SMTP.
5. Hosted credential verification and protected application Preview remain separate future approvals. No changes to `lecomax.com`, migrations or Release E are included.

**Minimum next action:** authorize a Free-only Mailtrap sandbox evaluation/account setup with no Supabase changes, or identify an already-owned non-production Linux host. Under the strict current requirements and evidenced infrastructure, no fully verified $0 hosted sink is available yet. Overall release remains NO-GO; this report does not revoke the prior build/regression successes.

Only the new audit/report files and append-only history are changed. Candidate source and build outputs are preserved; no unnecessary rebuild or regression rerun was performed.
