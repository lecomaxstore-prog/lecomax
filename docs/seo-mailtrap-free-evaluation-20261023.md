# Mailtrap Free evaluation: NO-GO under the current security requirements

Evaluation date: 23 October 2026. Scope: public documentation, local source review and synthetic tests only. No Mailtrap account was created or accessed; no SMTP connection, provider setting change, credential operation, deployment or email submission occurred.

## Decision

**NO-GO for connecting Mailtrap Free to Supabase staging now.** It is a credible capture service and the Free plan excludes forwarding, but the reviewed Sandbox documentation explicitly describes TLS as optional. Required, fail-closed TLS on the actual Supabase-to-Sandbox connection is not established. This is a concrete requirement mismatch/evidence gap, not evidence that Mailtrap normally delivers sandbox messages to real recipients.

A later GO would require an enforceable TLS-only endpoint or a verified Supabase client configuration that refuses authentication/submission without validated TLS, plus an account-level check confirming Free-only entitlements and no forwarding. A successful encrypted connection alone would not prove refusal of insecure fallback. Do not assume port 465 provides implicit TLS: Mailtrap's Sandbox article describes STARTTLS across its listed ports. Do not use live-sending SMTP documentation as proof about the Sandbox service.

## Verified product facts and limits

| Requirement | Evidence | Assessment |
| --- | --- | --- |
| Cost/limits | Current pricing: $0/month, 50 test messages/month, one user, one sandbox, ten retained messages, one message per ten seconds, 5 MB message size | Suitable for small-volume testing; no automatic paid upgrade or fallback allowed |
| Capture | Sandbox documentation describes capture instead of delivery to To/Cc/Bcc recipients | Appropriate service purpose; not a firewall for other services |
| Authentication | Each sandbox has its own SMTP username/password | Supported; never disclose credentials in chat or evidence |
| TLS | Official Sandbox PHP guide states TLS is optional, STARTTLS on listed ports | Support verified; mandatory TLS not established |
| Automatic forwarding | Official forwarding page says Basic plan or above | Not included on Free |
| Manual forwarding | Official manual-forwarding page also says Basic or above | Not included on Free |
| Effective account restrictions | No actual account or trial entitlements inspected | Must verify before any future configuration |
| Global outbound blocking | SMTP sandbox only captures messages sent to its own service | Does not cover Resend, another SMTP provider, live Mailtrap service or arbitrary server egress |

Pricing is product-specific: the Free **Email API/SMTP sending plan** is not the Free **Email Sandbox** plan. Do not configure a live sending domain or use live sending credentials. One older help page mentions 500 Free messages; the current pricing page lists 50, which is the conservative limit used here. Quota exhaustion must stop testing; never switch to default or live SMTP to continue.

Sources: [current pricing](https://mailtrap.io/pricing/), [Sandbox capture and authentication](https://docs.mailtrap.io/email-sandbox/overview), [Sandbox TLS described as optional](https://mailtrap.io/blog/test-emails-in-php/), [manual forwarding](https://docs.mailtrap.io/email-sandbox/management/manual-email-forwarding), [automatic forwarding](https://docs.mailtrap.io/email-sandbox/management/automatic-email-forwarding).

## Can real-recipient delivery be reliably prevented?

For messages submitted to a genuine Free Sandbox, the documented design captures them and the Free feature gate excludes both forwarding modes. This is provider-enforced product behavior, not an independently inspected network rule. An account upgrade/trial with forwarding, credentials pointing to the live product, or an administrator sending through another service changes the safety boundary. Do not add forwarding recipients even as a negative test: that action can send a confirmation email. Confirm feature entitlements/settings without attempting forwarding or contacting a real recipient.

No capture service can prevent a person from copying a message into another mail client. The relevant guarantee is automated delivery within the configured test path, under maintained account/configuration controls. Treat captured messages and tokens as private; restrict access and never use real accounts/tokens for validation.

## Bypass review and current application suppression

Source review confirms that the application calls Resend directly through its SDK and `https://api.resend.com/emails`; those calls do not traverse Supabase SMTP. Staff resend-invite has a Supabase admin invitation path and a direct Resend fallback, both behind the Preview guard. Order and message routes construct no Resend client in Preview. These remain important even if a sink is added.

Fresh `continuation-email-1792757660496.log` records **18 passing synthetic email tests**: recognized executable sender inventory, Preview suppression, browser Auth mutation interception, dedicated handler early exits, staff invitation/create/update/delete guards, and optional Resend construction. The twelve recognized sender files include signup, password reset, staff resend-invite, review followups, inbox reply, newsletter send, messages, orders, order updates/notify/Trustpilot and send-confirmation. No candidate source was edited.

The tests are strong evidence for the reviewed code paths, not a universal external-system guarantee. Direct Supabase admin/dashboard actions bypass application guards; changes to providers/keys or future dynamic senders could also bypass them. Email Provider/signup/hook/notification settings remain as recorded by the latest successful read-only audit; they were not changed or independently refreshed in this documentation-only evaluation. Browser blocking alone cannot block server egress. Optional mail suppression does not necessarily block unrelated database mutations in message/order handlers, so acceptance must avoid those routes.

## Is a sink necessary for SEO-only Preview?

**No, not for the requested page-rendering and SEO checks.** Home, Boutique, products, categories, sitemaps, cart shell and login shell need no email workflow. The simplest zero-cost alternative is to retain disabled signup/Email Provider/Send Email Hook/security notifications and the tested application suppression, then limit any separately authorized protected review to synthetic staging catalogue reads. No login submission, password recovery, invitations, contact/newsletter/order writes, payment or admin/cron actions.

This alternative is a bounded, no-email-workflow safety case, not proof of provider-wide non-delivery. It requires explicit acceptance of that narrower scope before any Preview execution and does not automatically waive your existing requirement. If mandatory transport isolation for every possible email action remains required, **there is no demonstrated compliant $0 hosted setup available now**. Keep NO-GO instead of provisioning another server unnecessarily. The previously approved Mailpit design remains available only if an existing isolated host is identified; no host or new infrastructure is needed merely to continue local SEO work.

## Validation without real-recipient delivery — future approved scope only

To reconsider Mailtrap, prepare the following evidence before any Supabase edit:

1. Read the actual account's plan and sandbox settings: Free, no paid/trial forwarding entitlements, no manual/automatic forwarding addresses or domains. No recipient confirmation requests, upgrades, live sending setup or API sends.
2. Establish the applicable TLS guarantee from Sandbox-specific documentation/account settings and the actual Supabase SMTP client. If only opportunistic STARTTLS is available, stop. Do not send real credentials on an unencrypted connection to test rejection.
3. With separate permission for transport tests, validate certificate hostname/chain and TLS negotiation using no credentials or message commands. In an offline mock SMTP test, withhold STARTTLS and verify the intended client sends neither credentials nor message data. A local client test is not proof about hosted Supabase unless that implementation/configuration is verified to match.
4. Only after separate approval and the TLS gate, submit at most one synthetic capture-only message directly to the sandbox, with envelope and headers using `sender@example.invalid` and `recipient@example.invalid`, no Bcc/forwarding and a harmless unique marker. Require TLS and certificate validation; load secrets privately, not in CLI arguments/logs. Check the private capture record and record only status/count/marker. This test is not authorized or executed now.
5. A later Supabase SMTP setup would be a separate approval for **tyltharlnbxrxibuxyye only**. Keep all disabled provider/hook/notification controls disabled. Do not trigger a Supabase email flow to prove configuration. Readback plus direct sandbox capture tests do not constitute end-to-end Supabase delivery validation; record that limitation rather than claim success.

Because the decision is NO-GO, there is no approved connect-and-save procedure to execute now. Existing generic setup plans remain conditional and must not be treated as authorization.

## Preserved checkpoint and minimum next action

The authenticated Vercel ownership evidence remains `staging-host-capacity-identity-1792757090277.json`: project.accountId and team.id match `team_yFLUcpSvgQi8EQuvuorOZW7w`. No runtime variable is assumed, no hosted credential probe ran, and the derived candidate/build/image evidence is preserved. The earlier build and regression successes remain valid historical results; only the focused synthetic email suite was rerun.

**Recommended next decision:** accept or decline a protected SEO-only, no-email-workflow review as the scope, keeping all current settings unchanged. Accepting that scope would not authorize deployment, the hosted verifier, SMTP changes or any email test; those remain separate. If you require the broader transport guarantee instead, pause SMTP setup until mandatory TLS and actual Free-plan enforcement are established—no purchase, server or recipient contact is needed for that pause.
