# Google sign-in

The same **Continue with Google** action creates an account or signs in an existing user. The app uses Supabase Google OAuth with PKCE. Google client secrets stay in Supabase, never in the app.

Google is enabled. The hosted Supabase redirect allowlist was updated and read back successfully on September 14, 2026. The existing website redirects were preserved, and these app callbacks were added:

- `lecomax://auth**` for installed builds (the existing app scheme is `lecomax`).
- `http://localhost:8081/auth**` for the current L’ecomax web preview.
For any additional web origin, add its equivalent `/auth**` URL including the port in Supabase Authentication → URL Configuration. Inspect the configuration with `powershell -File scripts/configure-google-auth-redirects.ps1` from the repository root; use `-Apply` to restore the required app callbacks using the existing Supabase CLI login.

Use a development or installed build for native OAuth; Expo Go does not own the `lecomax` URL scheme. Restart the sign-in flow if the app is terminated while the browser is open.

Verify on web and Android: new account, existing account, cancellation, retry after an error, session persistence after restart, and sign-out. Automated mocked-flow checks run with `node --test tests/mobile-google-auth.test.ts` from the repository root. A real Google account round trip has not yet been verified.
