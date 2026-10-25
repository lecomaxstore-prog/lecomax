# Staging email isolation: readiness and manual setup

**Preparation passed; hosted non-delivery remains unverified.** No SMTP server was provisioned, container started, provider setting changed, email submitted, hosted verifier run or deployment created. This approval covered investigation and local synthetic tests only.

## Fresh findings

At 2026-10-23T11:35:24Z, the staging-only Auth management GET confirmed signup and Email Provider disabled; Send Email Hook disabled with no URI/secrets; all listed account-security notification emails disabled; SMTP host/user/password absent. Existing controls remain unchanged. Supabase default mail transport is not a non-delivering sink.

At 2026-10-23T11:35:54Z, Vercel metadata confirmed project `lecomax-seo-staging` / `prj_jPniwpH4s81bhISVReUKTQN0GwvD`, owned by `team_yFLUcpSvgQi8EQuvuorOZW7w`. Both Preview credentials remain Sensitive, Preview-only and branch-unrestricted. Protection applies to all deployments, no Git connection or cron definitions exist, and the audited payment/indexing/worker flags remain disabled. No sensitive values were read.

Application review and 18 fresh synthetic tests confirm suppression for the 12 inventoried sender files, including Resend orders/messages/newsletters/confirmation and Supabase staff invitations. Dedicated mail handlers stop before dependencies; optional Resend clients are not constructed in Preview; staff mutations and browser Auth email mutations remain guarded. No candidate source was changed. This does not constrain direct dashboard/admin API calls or external systems.

## Recommended sink and its limits

Use a dedicated **self-hosted Mailpit capture service**, separate from production infrastructure. It is MIT-licensed with no software licence charge; hosting, storage, a DNS name, certificate management, backups/monitoring and operator maintenance may cost money. No host has been selected and no paid resource has been authorized, so there is no defensible monthly quote yet. Reusing an existing isolated host may avoid incremental compute cost, but requires the same network controls. Supabase custom SMTP is configured through its Auth settings; check the existing account plan and host quote before purchasing anything. No sending provider subscription is needed for this capture design.

The proposed contract is `operations/seo/email-isolation-plan.json`:

- Pin a reviewed release by immutable image digest before installation; the current null digest and hostname are deliberately unresolved, not deployment values.
- Require STARTTLS and authenticated SMTP, with certificate/private key/auth file mounted read-only from the host secret store. Do not use accept-any or insecure authentication. Expose host TCP 587 to the process's 1025 listener. Use a real certificate matching the chosen hostname; hosted Supabase must be able to reach it. Restrict inbound sources where a stable documented source range is available; do not invent an IP allowlist.
- No `MP_SMTP_RELAY_*` or `MP_SMTP_FORWARD_*` environment variables, relay/forward CLI flags, configuration files or upstream delivery credentials. Start from a clean environment, not an inherited operator shell. No extra unreviewed mounts or arguments.
- Enforce denial of **all NEW outbound IPv4 and IPv6 connections** outside the process/container. Allow replies on established inbound SMTP/admin connections, not arbitrary new HTTP/SMTP/DNS connections. Apply to the actual container forwarding/network namespace path; a host OUTPUT rule alone may miss container traffic. Do not rely on Mailpit flags or an unattached firewall policy as proof. Drop capabilities, prohibit Docker socket access and use a read-only root filesystem.
- Keep UI/API on loopback and access through an authenticated administrative tunnel. If containerized, ensure the tunnel reaches that namespace without publishing the UI. Keep SMTP separate from web access. A local SQLite volume is the only message store; no remote database. Disable automatic version checking. Short retention is proposed for captured messages only; SEO evidence and Change History retention are unaffected.

Mailpit supports forwarding and manual/automatic release when configured, so its name alone is not a safety guarantee. Its defaults also lack SMTP TLS/authentication. The infrastructure deny rule is the independent barrier against accidental relay configuration. With the actual rule installed and validated, the sink cannot initiate connections to recipient mail servers or HTTP email providers. This is a conditional design conclusion, **not a claim that an enforced hosted rule currently exists**.

Mailpit captures mail rather than silently discarding it; captured authentication links would be sensitive. Restrict access and retention, never load external content from captured messages, and never put captured tokens in evidence. A capture sink covers Supabase SMTP only. Existing Resend suppression must remain; do not claim that this firewall also controls the Vercel application's egress.

Official references: [Mailpit source and MIT licence](https://github.com/axllent/mailpit), [SMTP TLS/authentication](https://mailpit.axllent.org/docs/configuration/smtp/), [forwarding](https://mailpit.axllent.org/docs/configuration/smtp-forward/), [runtime controls](https://mailpit.axllent.org/docs/configuration/runtime-options/).

## Manual Supabase Dashboard setup — only after separate approval

Do not perform these steps yet. First select the host/DNS name, exact image digest, cost and owner; prepare and review its TLS/authentication and network-denial evidence. Store credentials in your password manager/host secret store, not chat or repository.

1. Open the Supabase Dashboard and select **lecomax-seo-staging**, reference **tyltharlnbxrxibuxyye**. Check the project reference in the URL and displayed project before editing. Do not open production settings.
2. In **Authentication → Email → SMTP Settings / Custom SMTP** (the menu label may vary), open the custom SMTP configuration. Supabase documents this under Authentication settings and Custom SMTP. Enable **custom SMTP only**, not the Email sign-in provider.
3. Enter the reviewed sink hostname, port **587**, dedicated staging SMTP username and password, a chosen staging sender email and sender name such as `L'ECOMAX STAGING — CAPTURE ONLY`. Use a non-customer sender address under your control; it is metadata, not a destination. Do not copy production SMTP credentials. Use STARTTLS; the sink must refuse plaintext submission. If the Dashboard/client cannot use that TLS mode, stop rather than relaxing security.
4. Save only the SMTP fields: host, port, user, password, sender email and sender name. Do not copy the documentation's sample API payload: it enables `external_email_enabled`, which conflicts with this task.
5. In **Authentication → Sign In / Providers**, keep Email disabled and signup disabled. In **Auth Hooks**, keep Send Email Hook disabled. Keep all account-security email notifications disabled. Preserve URL redirects, other providers, keys and existing notification settings.
6. Perform a GET-only audit afterward: exact staging project, SMTP field presence, unchanged disabled toggles, and no secret output. Compare the configured hostname privately with the approved endpoint. Do not use Dashboard “Send test email”, invite a user, sign up, recover a password or enable a provider to test connectivity.

Before claiming completion, independently validate the actual sink: authenticated TLS, rejection of plaintext/unauthenticated submission, capture of a synthetic message addressed only to `.invalid`, no forwarding/release configuration, and blocked NEW IPv4/IPv6 outbound attempts using controlled test destinations with no email payload. These tests require the separately approved infrastructure to exist. They must not use real account addresses or tokens, invoke Supabase mail flows or deliver to an external recipient. If proof is incomplete or rules are removed, keep NO-GO; do not revert to default SMTP as a supposed safe fallback.

[Supabase custom SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp) and [Auth configuration navigation](https://supabase.com/docs/guides/auth/general-configuration).

## Secure VERCEL_ORG_ID establishment

Do not assume this environment variable is supplied. The authenticated project GET establishes `accountId = team_yFLUcpSvgQi8EQuvuorOZW7w`. A future authorized build must additionally match its provider deployment record to that project/team, Preview target and native `VERCEL_PROJECT_ID` / `VERCEL_DEPLOYMENT_ID`.

`operations/seo/email-isolation-policy.cjs` contains an offline tested identity guard for normalized provider metadata. It rejects wrong project/team/deployment/target and a conflicting supplied org. The normalization adapter must use the actual provider API schema; missing fields or ambiguous target semantics must fail, not be inferred as Preview. The helper cannot authenticate arbitrary JSON or attest that a process is hosted. Only trusted authenticated API reads tied to the genuine provider build supply that provenance.

After that check, a reviewed future wrapper can supply the nonsecret expected organization ID **to the verifier's child process only**. No persistent Vercel environment variable or secret change is required by this design. The existing verifier's organization check remains intact. Such a wrapper has not been integrated or run, and the protected build still requires separate authorization. Alternatively, a properly signature-verified provider OIDC attestation could establish identity, but merely decoding a token is insufficient and is not implemented here. [Vercel system variables](https://vercel.com/docs/environment-variables/system-environment-variables).

## Validation and remaining approval

Seven new synthetic tests pass: forbidden relay/forward options, insecure auth/TLS/public UI/remote storage, absent egress controls, restored provider mail features, wrong project/execution permission, and matching/mismatched provider identity. They validate a strict preparation contract; they do not run Mailpit, inspect a real firewall or prove SMTP interoperability. All 18 application email safety tests pass again. Preservation reconfirms 2,588 original recovery files and 30 image hashes; the candidate remains at SHA `8a12abcce38c0dc557a9ef9f86c3ce3dd113e863` with the same 134 tracked modifications and 12 untracked files. The earlier successful build/regressions remain unchanged and were not rebuilt.

**Approval requested next:** approve the Mailpit design and identify an existing host or a hosting budget so a concrete host/cost/digest/firewall package can be prepared for review. That design choice alone does not authorize purchase, provisioning, SMTP secret creation or Supabase changes. After reviewing that package, separately approve only staging sink provisioning, synthetic infrastructure validation and the listed Supabase staging SMTP fields. No Vercel deployment, hosted credential verifier, production change, migration or Release E is included.

Email isolation is ready for configuration review, not ready to certify as externally enforced. The three release gates remain actual hosted credential verification, deployed non-delivery evidence, and real staging-backed acceptance.
