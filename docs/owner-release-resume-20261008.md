# Owner login release checkpoint — 8 October 2026

Resumed after the database password/connection setup. No credentials were printed or changed in this run.

## Verified

- `npm run owner:check` passed against the configured persistent database.
- The actual client socket used TLS 1.3 with an authorized certificate. `pg_stat_ssl` reported no TLS on the database-side pooled connection; this does not describe the client-to-pooler TLS hop.
- All four `learning_private` tables exist. Neither `anon` nor `authenticated` has SELECT access. RLS is not enabled on these private-schema tables; this check does not claim a full database security audit.
- 23 owner authentication tests passed.
- 120 learning-app tests passed after refreshing stale source snapshots.
- Root and learning-app TypeScript checks passed; learning-app lint passed.
- Production Next.js build passed, including its lint/type checks. Initial network TLS errors recovered during build retries.
- Fresh Expo web export and browser login smoke passed: protected deep link, Arabic/English UI, invalid credentials, password verification, remember choice, session-only login and reload lock.
- Expanded client audit scanned 1,129 source/content/export files without finding configured backend secret values, including database URLs. The existing native export was scanned but not rebuilt in this run.
- All six built learning API route traces include `supabase/prod-ca-2021.crt`.
- Expo CLI is authenticated as `lecomax`. Latest existing Android build is finished: `047dbccc-6e6d-4282-a7a8-4199acea579d`, app 1.0.3 / version code 4. It predates the owner-login implementation and is not evidence for this release.

## Fixes in this run

- Explicitly include the PostgreSQL TLS certificate in learning API deployment bundles.
- Include database URLs in the configured-secret scan.
- Exclude local owner QA/browser artifacts and npm cache from Vercel uploads; exclude `dist-*` exports from EAS uploads.
- Refresh mobile source snapshots to include the database connection changes.
- Update browser smoke selectors to the current accessible field labels, `Email address` and `Password`.

## Remaining release work

The current production site has not received the new session API: unauthenticated GET `/api/learning-mobile/auth/sessions` returns 404. GET `/api/learning-mobile/auth` returns 405, which only shows a route exists, not that the new authentication flow is deployed.

Prepare a focused backend release against current published source, configure the private owner environment on the deployment, and deploy/verify the new routes. The root workspace contains many unrelated changes and is based on an older commit; do not publish it wholesale. The existing `release/learning-app-live-20261008` checkout is clean at `e443248`, but its freshness must be checked before using it as a release base.

Then create a new signed APK with a version code above 4, retaining the existing signing identity, and test the actual artifact against the deployed backend. Physical-phone restart, update preservation, logout/revocation and live teacher response remain unverified. No new APK, production deployment or production environment update was performed in this run.

Local logs and screenshots: `.owner-auth-qa/resume-*.log` and `.owner-auth-qa/*.png` (ignored; excluded from deployment uploads).
