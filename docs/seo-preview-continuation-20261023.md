# SEO recovery continuation — isolated candidate only

Release E remains ON HOLD. No deployment, migration, customer mutation, real email, secret replacement, or production configuration change is authorized by this report.

## Candidate identity

Main workspace remains `agent/mobile-product-redesign` at `e5251911e2a6f1379aca827eb53c310359a662b3` with unrelated existing changes.

Candidate: `.recovery-seo-preview-isolated`, branch `preparation/seo-preview-credential-20261023`, base `8a12abcce38c0dc557a9ef9f86c3ce3dd113e863`. Security changes remain uncommitted. The handoff's spelling of the base SHA contained an extra `e`; the value above was read from Git.

The preserved corrected recovery has 2,588 manifest entries. The earlier Git-free deployment plan still points at that **older corrected candidate**, not the derived security candidate. Do not execute that plan unchanged. Any future authorized Preview packaging must use the derived candidate and its recorded exact files/hashes.

## Local binding procedure

In a VS Code PowerShell terminal:

```powershell
& "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Ziko\Desktop\my projects\L'ecomax\scripts\seo-preview-binding.ps1"
```

This invocation changes execution policy only for the child process. Enter the same verified staging key used for the existing Preview-only `SEO_PREVIEW_SUPABASE_SERVICE_ROLE_KEY`. Input is masked. The helper computes `tyltharlnbxrxibuxyye:SHA256(exact UTF-8 key bytes)` and copies only that binding; it does not print or persist the key. Like any hashing process, it briefly holds plaintext in memory; clearing managed variables is not a guarantee of memory erasure.

In Vercel, select **lecomax-seo-staging → Settings → Environment Variables**. Add `SEO_PREVIEW_SUPABASE_SERVICE_KEY_BINDING`, paste the clipboard as Value, select **Preview only**, and leave it unrestricted by Git branch. Save without redeploying. Then run:

```powershell
Set-Clipboard -Value ([string]::Empty)
```

The user reported it was not yet saved during this continuation. Metadata can establish scope and binding presence/format, but a Sensitive write-only key cannot be independently compared from metadata. Do not label exact hosted equality verified from an owner attestation or a synthetic test. A safely authorized execution using both hosted values remains necessary before readiness.

## Email audit and isolation

Application paths found: Resend order receipts, order-status/review/Trustpilot mail, contact messages, newsletters, signup and confirmation mail; SMTP inbox replies; Supabase admin invitations with a Resend fallback; server and browser password resets; browser signup and account/password updates; admin credential changes that could trigger security notifications.

The candidate now suppresses optional order/message mail clients in Preview. Mail-only endpoints, review cron and staff credential mutations return 403 before side effects. Browser Supabase Auth transport rejects mutations except password/refresh/PKCE token exchange and logout. Tests execute the actual blocked handler bodies without their service dependencies and use synthetic transports, never real recipients. Existing production branches retain their previous policy.

The staging project's Auth settings confirm Email provider and signup disabled. Its Edge Function inventory is empty. Neither observation proves SMTP or database Send Email Hook configuration is non-delivering. The connected project tools do not expose managed Auth configuration, and no browser session was available to inspect it. Direct use of the public Auth API is outside application transport guards.

Before changing Supabase configuration, use this exact inspection plan in project `tyltharlnbxrxibuxyye`:

1. Open **Authentication → Email / SMTP Settings** and record whether custom SMTP is enabled. Keep passwords hidden. A default SMTP sender is not a test sink.
2. Open **Authentication → Hooks → Send Email**. Record whether a hook is enabled, its type and destination. An enabled hook replaces SMTP; a sink SMTP setting alone does not constrain that hook.
3. Smallest upstream solution: use a dedicated, capture-only SMTP sandbox with forwarding, delivery, webhooks and external relays disabled; disable any delivering Send Email Hook. Use only staging-specific sink credentials. Inspect the sink's own forwarding settings and verify them before any sending test. No such provider/configuration change was made here.
4. If a hook is preferred, review and explicitly authorize a staging-only hook that terminates successfully without outbound calls or logging recipients/tokens. Creating/configuring it is a separate external change; no SQL or deployment was executed here.

Keep the application suppression even after establishing the upstream sink. No real-email probe is needed or authorized.

References: [Supabase Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook), [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## Capacity and validation limits

No files were deleted. `artifacts/seo-preview-resume-20261023/capacity-*.json` records inspected cache sizes. If more space is needed, the precise first cleanup candidate is `.recovery-seo-abcd-corrected/.next/cache` (about 988 MiB when inspected). This is regenerable compiler cache, not the whole `.next` build. Confirm no build is using that candidate, re-resolve the absolute path inside this workspace, and remove only that cache after cleanup approval. Preserve all source, images, manifests, reports, worktrees, environment files and evidence logs.

A separate approved machine with sufficient disk can build a copy of the exact derived candidate with synthetic credentials and outbound application traffic blocked. Vercel Preview would be a deployment and remains disallowed until explicit authorization; it is not an automatic build-capacity workaround.

Local build uses a production optimization mode with Preview selectors, synthetic credentials and application network traffic blocked. Google font downloads are permitted. Passing this build cannot establish hosted key equality, upstream SMTP safety or authenticated Preview acceptance. Source and production-mode regression tests establish limited compatibility, not a production deployment result.

The first build discovered `node:crypto` in the Edge middleware dependency graph through admin access. The correction shares one credential validation policy between the synchronous Node selector and async Edge Web Crypto selector. Missing configuration, wrong project, conflicting environments and binding mismatch still fail closed.

Final machine-readable results, exact candidate file inventory, and immutable Change History follow-ups are in `artifacts/seo-preview-resume-20261023/` and `lecomax-learning-app/changes/`.
