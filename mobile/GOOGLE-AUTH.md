# Google sign-in

## September 21 callback routing repair

Native links such as `lecomax://auth?code=...` previously lost the `auth` route
because the URL parser puts it in `hostname`, leaving `pathname` empty. The
system-link handler now combines the hostname and pathname for the app scheme,
preserving the authorization code and account destination. This routes both cold
and warm app callbacks to the existing PKCE completion screen instead of Home.
Triple-slash, relative, and HTTPS product links remain supported.

The hosted Google provider and `lecomax://auth**` redirect were checked and are
enabled. No hosted settings were changed for this repair. Publish an app update
containing this JavaScript fix before testing the installed app. Automated tests
cover link routing, code exchange, cancellation, and callback navigation; an actual
Google account round trip still needs device verification.

Published to Android `production`, runtime `1.0.7`, on September 21, 2026:
update group `daa711f6-15df-472a-82ea-aa20dbd2931c`, Android update
`01a0c55f-ddc8-7c01-b738-b6eafe1275d2`. Release source is the existing live
`b609b4d` baseline in `release/current-fixes-publish` plus the native-intent fix.
Reopen the app online and accept the downloaded-update restart prompt before
testing Google sign-up.

The same **Continue with Google** action creates an account or signs in an existing user. The app uses Supabase Google OAuth with PKCE. Google client secrets stay in Supabase, never in the app.

Google is enabled. The hosted Supabase redirect allowlist was updated and read back successfully on September 14, 2026. The existing website redirects were preserved, and these app callbacks were added:

- `lecomax://auth**` for installed builds (the existing app scheme is `lecomax`).
- `http://localhost:8081/auth**` for the current L’ecomax web preview.
For any additional web origin, add its equivalent `/auth**` URL including the port in Supabase Authentication → URL Configuration. Inspect the configuration with `powershell -File scripts/configure-google-auth-redirects.ps1` from the repository root; use `-Apply` to restore the required app callbacks using the existing Supabase CLI login.

Use a development or installed build for native OAuth; Expo Go does not own the `lecomax` URL scheme. Restart the sign-in flow if the app is terminated while the browser is open.

Verify on web and Android: new account, existing account, cancellation, retry after an error, session persistence after restart, and sign-out. Automated mocked-flow checks run with `node --test tests/mobile-google-auth.test.ts` from the repository root. A real Google account round trip has not yet been verified.
