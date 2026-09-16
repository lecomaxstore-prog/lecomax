# Website Google sign-in

## Flow

1. `/connexion` and `/inscription` save the intended account or shopping page in tab-scoped storage, then open Google's account chooser.
2. Supabase returns to the fixed `/auth/callback` URL on the originating website.
3. The completion screen waits for the existing Supabase client to process and persist the session, then replaces the callback with the intended page (default `/compte`).
4. If Supabase falls back to the homepage on the same origin, the root completion component recovers an attempt made within the last ten minutes. Ordinary homepage visits do not redirect.

Errors, cancellation, and missing sessions show a retry link. A timeout stops an indefinitely loading completion screen. The SDK owns URL processing; the application does not exchange a one-time code twice.

## Supabase configuration

In **Authentication → URL Configuration → Redirect URLs**, add the exact `/auth/callback` URL for each website origin used to sign in, including the `www` alias if used. For local development add:

- `http://localhost:3000/auth/callback`
- `http://localhost:3001/auth/callback`

The existing `scripts/configure-google-auth-redirects.ps1` can add the configured Site URL's callback and these local callbacks while preserving existing website/mobile redirects. Run without `-Apply` to inspect; run with `-Apply` to save and verify. It requires an authenticated Supabase CLI account. No auth secrets are printed.

The live configuration could not be inspected during this change because the saved CLI login was unavailable. The recovery mechanism requires the same browser tab and origin; it cannot recover tab storage after a redirect from localhost or an alias to another domain. Configure the exact callback URLs to cover those cases.

Reference: https://supabase.com/docs/guides/auth/redirect-urls

## Validation

Automated regression coverage: `node --test tests/web-google-auth.test.ts`.

Manual verification with a real Google account:

1. Open `/connexion?redirect=%2Fcompte%2Fcommandes` and choose Google.
2. Choose a Google account; verify the completion screen opens the orders page.
3. Repeat on each production origin and localhost used for development.
4. Cancel Google sign-in; verify a useful retry state or usable login form when returning with the browser Back button.
5. Open `/auth/callback` in a signed-out browser; verify a retry message instead of an account redirect.

No real Google-account sign-in or deployment was performed during this change.
