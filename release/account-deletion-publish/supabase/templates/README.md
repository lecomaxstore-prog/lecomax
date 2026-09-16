# L’ecomax confirmation email

The Expo app calls Supabase Auth directly. Its emails use the **hosted Supabase template**, not the website signup API. Changing the HTML in this repository alone does not update hosted emails.

## Hosted status — 14 September 2026

The confirmation subject and HTML were published to the linked L’ecomax project and verified by reading the settings back. Email confirmation remains enabled. Resend SMTP authentication succeeded, and Supabase now uses `smtp.resend.com:465` with sender `L'ecomax <noreply@lecomax.com>`. The sender settings were read back and verified. No test email was sent; inbox delivery and domain authorization still require an end-to-end signup check. The Resend key has sending-only access: the domains API returns `restricted_api_key`, which does not mean the SMTP credential is invalid.

On Windows, `scripts/publish-auth-email.ps1` reads the existing Supabase CLI login from Windows Credential Manager. Run without arguments to inspect the template and sender settings, or with `-Apply` to back up the old subject/body to the system temporary directory and publish only the confirmation subject/body. The script checks that the linked project matches `.env.local` and does not print the login token.

After verifying a replacement Resend key via SMTP, use `-ConfigureSmtp` to update the SMTP credential and branded sender from `.env.local`. It does not change email confirmation requirements and refuses to replace a different SMTP provider. The template backup does not include SMTP secrets.

## Updating the design

1. Run `node scripts/generate-auth-email.mjs` after editing `lib/auth-confirmation-email.ts`.
2. In the matching Supabase project, open Authentication → Email Templates → Confirm signup.
3. Set the subject to `Bienvenue chez L’ecomax — confirmez votre email`.
4. Paste `confirmation.html` into the body and save. Keep `{{ .ConfirmationURL }}` intact; Supabase supplies the secure confirmation link.
5. In the project's email/SMTP settings, use a verified L’ecomax sending domain and sender name `L’ecomax`. Keep the existing SMTP credentials if already configured. A branded template alone does not change the sender address.
6. Verify with a dedicated test account: email appearance on desktop/mobile, confirmation link, then sign-in. Do not disable email confirmation.

The website signup route uses the same design through `lib/auth-confirmation-email.ts`. Deploying the website is required for that route's new design to reach customers.

Documentation: https://supabase.com/docs/guides/auth/auth-email-templates
