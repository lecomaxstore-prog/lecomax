# Private owner login — L’ECOMAX Learn

Implemented on 8 October 2026 in the existing Expo learning app and Next.js backend. The separate shopping mobile app and storefront authentication are unchanged.

## Status and verification

Latest resumed checks and release blockers: [8 October release checkpoint](owner-release-resume-20261008.md). The local owner configuration and persistent database are now verified; earlier notes below describing them as unconfigured are historical.

The implementation has passed the real password → remember choice → session → protected API → logout flow using the actual Next route handlers, Argon2id, an isolated PostgreSQL-compatible PGlite database, and the mobile session state machine. A headless Chrome test also exercised the rendered login UI against these handlers. This is not a claim that a live Supabase deployment or physical Android device has been tested.

- 23 new authentication tests passed, including the HTTP integration test.
- Learning-app regression suite: 120 tests passed (including the new backend-outage test).
- Root and learning-app TypeScript checks passed.
- Root lint passed with existing warnings; learning-app lint passed without warnings. Generated artifacts are now excluded from lint.
- Web export and Android Hermes bundle export passed. A Hermes export is not an installed APK.
- Client source, content snapshots and exported bundles were checked for configured backend secret values.
- Browser smoke test passed: protected deep link, Arabic/English login, generic invalid credentials, successful verification, remember prompt, session-only login, and reload requiring login. Screenshots are in ignored local folder .owner-auth-qa/.
- Full root test run: 554 passed, 2 failed, 1 skipped (557 tests at that run, before the new HTTP test was added). The two failures are existing web learning-guided.test.ts mocks rejecting the unrelated ../LessonTeacher import; neither that test nor its component was changed here.
- Resumed Android QA on 8 October: an API 36 emulator ran a separate `com.lecomax.learning.ownerqa` debug APK. Generic credential rejection, the remember choice, session-only force-stop, remembered force-stop, an in-place reinstall of the same APK, restoration after emulator reboot, current-device revocation and the signed-out settings deep link passed against the isolated local backend. The existing installed learning app and its data were preserved.
- One first launch after emulator reboot failed while downloading the development bundle from Metro (OkHttp `ProtocolException`); a fresh launch restored the session successfully. This is qualified emulator evidence, not a release-build or physical-phone sign-off.
- No physical phone or production backend was tested. A real signed version upgrade, physical phone reboot/background behavior, and production PostgreSQL/TLS deployment still need the acceptance checks below. Optional biometric locking was not added.

The resumed checks again passed 23 authentication tests, 120 learning-app tests, both TypeScript checks, the browser smoke flow and a 1,125-file client secret audit. The local owner email/hash/session secret/database URL remain unconfigured; run the private setup steps below before real use.

The native build succeeded from `C:\Temp\l7` after the original checkout hit Ninja’s Windows path-length limit. All 1,134 copied runtime/content/asset/config files matched the workspace. Expo prebuild corrected the stale generated manifest: backup is disabled and version code 4 is applied. QA evidence is saved in `.owner-auth-qa/verification.json`; the QA debug APK is not a distributable release.

Do not treat this as production rollout approval until those remaining checks pass.

## Architecture and preserved data

The learning app uses Expo 57, Expo Router, React Native, SchoolProvider/AsyncStorage progress, a separate wellness store, bundled lessons and source explanations, and local notifications. Its previous login only protected the AI teacher, used Supabase Auth/ADMIN_EMAIL and persisted a nonrenewing access token.

The new owner login uses Next.js Node route handlers and the existing PostgreSQL ecosystem (including Supabase PostgreSQL). It is separate from the shop’s public Supabase accounts. No registration, guest accounts, default credentials, or public account creation were added. Existing Supabase shop users cannot authenticate to the new learning endpoints with their shop tokens.

All Expo routes mount behind OwnerGate, including notification/deep-link destinations. A protected route is not rendered during session restoration, failed verification, or background revalidation. Learning time only accrues while authenticated. Logout preserves courses, notes, results, drafts, teacher history and wellness progress. Old teacher access tokens are removed from SecureStore.

Important boundary: offline lessons and source explanations remain bundled to preserve existing functionality. They can be extracted from an APK. Existing learning progress stays in the app’s OS-protected local storage and is not converted into encrypted cloud storage. Android backup is disabled for future builds. True confidentiality of bundled lesson/source files would require moving those files to authenticated server delivery; this implementation does not claim that property.

## Backend setup: private email, password, hash and secret

Use Node 22.18+ (the tests here ran on Node 26.7), with npm dependencies installed. From the repository root:

    npm install
    npm run owner:setup

The interactive script asks for your chosen email and a password of at least 14 characters. Password entry is hidden; it is never passed on the command line or printed. It writes only your email, an Argon2id hash (64 MiB, 3 iterations, parallelism 1), and a cryptographically generated 32-byte session secret to the existing backend .env.local. It preserves unrelated configuration and removes any OWNER_PASSWORD entry. Do not send your password in chat.

Required backend-only variables:

    OWNER_EMAIL="your-chosen-email@example.com"
    OWNER_PASSWORD_HASH="generated-by-owner-setup"
    SESSION_SECRET="generated-64-character-random-hex-value"
    OWNER_DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=verify-full"

Optional:

    OWNER_TRUST_PROXY="0"

The setup command generates both the hash and secret, so you do not need to copy them through a terminal or chat. To generate a separate secret yourself in your private terminal:

    node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"

Next.js expands dollar signs in dotenv files. The setup script escapes the dollar signs in the PHC hash automatically. If configuring a hosting dashboard instead of .env.local, enter the actual Argon2id hash with ordinary dollar signs, without the backslashes used in the dotenv file. Email comparison trims and lowercases both configured and supplied email.

Keep .env.local only in the backend root. It is Git-ignored. Never copy it into the Expo project, EAS configuration or an APK. .env.example contains placeholders. Never prefix any of the four secrets/configuration variables above with EXPO_PUBLIC_ or NEXT_PUBLIC_. A database URL includes a password and is a secret.

## Persistent database and startup

Use your existing Supabase PostgreSQL database or another PostgreSQL database. OWNER_DATABASE_URL must be a server-only SQL connection string, not the Supabase REST URL or anon key. Use a backend database role with access to the learning_private schema. For Supabase choose a compatible direct or pooler connection from its database connection settings.

    npm run owner:migrate
    npm run owner:check
    npm run owner:dev

owner:migrate applies supabase/migrations/202610080001_learning_owner_sessions.sql transactionally. It creates only the private session/challenge/token/throttle tables and indexes, with public schema/table privileges revoked. It does not modify lessons or progress. It is repeatable. Do not expose learning_private through the Supabase Data API or grant anon/authenticated roles access.

owner:check validates email, Argon2id parameters, secret format, database access and migration presence. owner:dev and owner:start run this check before starting Next. Missing or invalid configuration also causes auth endpoints to fail closed with a generic 503. The existing storefront npm scripts remain unchanged; use the owner startup commands for the learning backend.

For production:

    npm run build
    npm run owner:start

Set the same backend-only environment variables on the backend host. Expose it only through HTTPS. Nonlocal database connections require certificate verification; use a valid CA chain (or NODE_EXTRA_CA_CERTS for the provider’s CA), never disable certificate checks. The backend uses a bounded pg pool. Keep the migration credential private; production can use a restricted runtime role with schema usage and SELECT/INSERT/UPDATE/DELETE on these tables.

Set OWNER_TRUST_PROXY=1 only if the ingress proxy replaces, rather than appends/trusts, client-supplied x-forwarded-for and x-forwarded-proto headers. Otherwise keep 0: logins share a bounded database rate-limit bucket. Production HTTP auth requests are rejected unless the trusted ingress proves HTTPS.

Schedule this command daily on the backend, not from the app:

    npm run owner:cleanup

It removes expired challenges/throttles and expired/revoked sessions after a seven-day retention period. Refresh reuse records stay until their session is removed. Deletion cascades to token hashes.

## Connect Expo and test Android

Create lecomax-learning-app/.env.local containing only the public backend URL:

    EXPO_PUBLIC_LEARNING_API_URL=https://YOUR_BACKEND_HOST

Development emulator alternative: http://10.0.2.2:3000. For a physical development phone use your computer’s LAN IP and port 3000 on the same trusted network. Development HTTP is accepted only in development mode; release builds require HTTPS. Do not use localhost to mean your computer from a physical phone. Restart Metro after changing the URL.

    cd lecomax-learning-app
    npm install
    npx expo start --clear

Run the development app on Android. Before building from an existing local Android directory, synchronize it with the current Expo configuration:

    npx expo prebuild --platform android --no-install
    npm run android

This applies `android.allowBackup: false`, the current version, permission exclusions and the SecureStore config plugin to the generated native project. An older ignored `android/` directory can retain stale settings even when app.json is correct. Preserve the existing private signing credentials; never replace them during regeneration. The existing SecureStore native dependency and config plugin are reused.

On Windows, this checkout’s long path can make Ninja fail with `Filename longer than 260 characters`. Build from a short local path, synchronize the current source and lockfile, install matching dependencies, and run Expo prebuild there before Gradle. The existing local build workspace is `C:\Temp\l7`. Keep backend `.env.local` out of that copy, and preserve the existing private signing credentials for real updates.

Device acceptance checklist:

1. Open a lesson link while signed out: only login appears. Check Arabic RTL, English/French, keyboard, password visibility and light/dark themes.
2. Wrong email and wrong password both show the same generic error. Repeated attempts receive a finite cooldown.
3. Correct credentials show the remember prompt before any dashboard.
4. Choose YES. Force-stop and reopen the app; then reboot the phone. The app validates/rotates the saved token and opens the dashboard without asking for a password.
5. Install an ordinary update signed with the same Android signing key/package ID, without uninstalling or clearing app data. The remembered session and learning progress should remain. Android uninstall or clearing app data is not an ordinary update and removes SecureStore entries.
6. Choose NO on a fresh login. Fully terminate the app process and reopen: login is required. Backgrounding alone does not end the running process.
7. Disconnect the network on startup: the verification screen remains locked with Retry. Restore networking and retry. Protected server APIs remain unavailable without a valid session.
8. Revoke the phone’s session from another authenticated device. Its next API validation is denied; foreground UI checks occur every 60 seconds and on resume. Server revocation applies immediately on the next protected request.
9. Sign out and confirm notes, results, drafts and course progress reappear after signing in again.
10. Check teacher access, notification deep links, app background/resume, screen reader labels, and narrow-screen/keyboard behavior on the real device.

## Remember this device and session security

- Password verification returns only a random, hashed, single-use challenge valid for three minutes. It grants no protected API access.
- YES creates a session with a fixed 30-day absolute maximum. Only its refresh token is saved in Expo SecureStore; access tokens remain in memory.
- NO creates an at-most-12-hour session. Both tokens remain in process memory, and nothing is saved for the next launch.
- Access tokens are random opaque 256-bit values, valid for at most five minutes, checked against the session database on every protected API request. Both access and refresh tokens are stored as keyed hashes server-side.
- Refresh is atomic and serialized on the device. The database locks the session family, consumes the old token, and issues a replacement. Reusing a consumed refresh token revokes that family, including its current access token.
- A password/email/SESSION_SECRET change invalidates all existing challenges/sessions through their credential version. Restart/redeploy all backend instances consistently after changing configuration.
- Network errors never unlock the app. If a rotation succeeds but its response is lost, retrying the consumed token deliberately requires login again; there is no replay grace window.
- Logout first revokes the session on the backend, then removes local auth data. If the network is unavailable it reports failure and lets you retry rather than falsely claiming server revocation succeeded.
- Login throttles use shared PostgreSQL counters: 8 attempts per five-minute client bucket, plus 40 per minute globally. Cooldowns expire automatically; there is no permanent account lockout. Behind a correctly configured proxy, IP buckets are independent. Repeated throttling/reuse produces structured security events without emails, passwords, IPs or tokens.
- Web preview supports session-only login. Persistent browser tokens are intentionally not put in localStorage; remembered login is a native Android/iOS feature.

Expo documents SecureStore persistence across ordinary restarts/updates and loss on Android uninstall: https://docs.expo.dev/versions/latest/sdk/securestore/
Argon2 implementation: https://github.com/ranisalt/node-argon2

## Device management and password changes

Open Settings → Security & devices. The list shows the current session, other active devices, whether each is remembered, login time, last token activity, and expiry. Revoke one device, sign out other devices, sign out all devices, or require a fresh login on the current device. All operations require a valid server session. Device labels are descriptive, not trusted hardware identities.

To change your password or email, run npm run owner:setup again in your private backend checkout. It generates a fresh hash and session secret and preserves the database URL. Apply the changed values to production and restart/redeploy every backend instance. All previous sessions then fail verification. Learning progress is not deleted. A leaked session secret is handled the same way.

If throttled, wait the displayed cooldown. For operational investigation inspect learning_auth_rejected, learning_auth_throttled, learning_auth_refresh_reuse and learning_auth_revoked events. Do not log request bodies or Authorization headers at your reverse proxy or monitoring service.

## Production APK

Configure EXPO_PUBLIC_LEARNING_API_URL as the HTTPS backend URL in the EAS environment/profile for the learning app. No backend secrets belong in EAS. Keep existing Android signing credentials and com.lecomax.learning package ID. Increment expo.android.versionCode for a new distributed release; retain the same signing key for updates.

From lecomax-learning-app:

    npm run typecheck
    npm run lint
    npm test
    npm run android:apk

android:apk uses the existing EAS preview profile, which generates an internally distributed APK. The production profile generates an AAB for the Play Store:

    npx eas-cli build --platform android --profile production

For a release APK using a production environment, add an APK build profile extending production with android.buildType set to apk, then build that profile. Do not distribute until the HTTPS backend is configured, migrated, checked and deployed, and the device checklist passes.

## Files and repeatable verification

Backend: lib/owner-auth-core.ts, lib/owner-auth-server.ts, lib/owner-auth-database.mjs; lib/learning-mobile-auth.ts; app/api/learning-mobile/auth/route.ts plus confirm, refresh, logout and sessions route handlers; the teacher route and learning API CORS matcher in middleware.ts.

Database: supabase/migrations/202610080001_learning_owner_sessions.sql.

Mobile: services/owner-session.ts, services/auth.ts, features/OwnerGate.tsx, features/SecuritySettings.tsx; app/_layout.tsx, app/settings.tsx, features/MobileTeacher.tsx, services/teacher.ts, store/School.tsx and app.json. Existing source-library learning snapshots under data/ were refreshed to reflect current source.

Setup/audit: scripts/setup-learning-owner.mjs, check-learning-owner.mjs, migrate-learning-owner.mjs, cleanup-learning-owner.mjs, audit-learning-owner-secrets.mjs, smoke-owner-login.ts; package.json/package-lock.json; backend/mobile .env.example; .gitignore; mobile lint configuration and affected test mocks.

Tests: tests/owner-auth.test.ts, tests/owner-session.test.ts, tests/owner-http.test.ts, tests/helpers/owner-http.ts and learning-app tests/release.test.cjs and tests/teacher-route.test.cjs.

Repeat from root:

    npm run test:owner-auth
    node node_modules/typescript/bin/tsc --noEmit --incremental false
    npm run lint
    node scripts/audit-learning-owner-secrets.mjs dist-owner-auth-qa dist-owner-auth-native

Browser smoke requires Chrome and a current web export:

    cd lecomax-learning-app
    npx expo export --platform web --output-dir dist-owner-auth-qa
    cd ..
    npm run smoke:owner-login

The smoke test uses an isolated local test database and a random disposable password. It intercepts the preview’s auth traffic into the local test handlers, never submits credentials to production, and does not create a default account or bypass in application code. It tests the app’s default API hostname; adjust its interception pattern if you export against a different public API URL.
