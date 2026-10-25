# Production recovery status

Recorded 2026-10-25T22:06:13.265Z.

The integrated release checkout preserves commit 3a41427b4779b62fb02ea444b320d345b96e9a97 and the previous recovery backup. Origin main was d9d1d7a7b274fe3df9f70bb154704ea9e07e78ee at inspection; integration is its descendant. No unresolved conflicts or destructive Git operations.

## Verified

- 790 Node 24 tests: 785 passed, five skipped, zero failed.
- Storefront, mobile and learning TypeScript: passed. Focused direct ESLint: passed.
- Android back/scroll-return checks and six change-history tests: passed.
- Exact LF attributes fix Windows migration checksum failures; approved hashes and SQL stay unchanged.
- Secret/conflict/large-file audit: no findings.
- Current lecomax.com home, selected product, search, robots and sitemap work; protected APIs reject anonymous calls. Metadata, server-rendered product links, loaded gallery images and temporary browser storage checked. This is the existing deployment, not the integrated candidate.

## Production blocker

Vercel project lecomax (prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb), Next.js, Node 24.x, repository-root defaults, production branch main. Required production variable names are present exactly once with production scope; no shared variables.

Hosted deployment dpl_BRzW7mEjfh1Lnx1EZdHAUZSt3muw failed at operations/seo-vercel/lib/environment-target.mjs credentialBinding invoked for NEXT_PUBLIC_SUPABASE_ANON_KEY. The approved NEXT_PUBLIC_SUPABASE_KEY_BINDING does not equal the required project prefix plus SHA-256 of the exact runtime key bytes. The preceding target/role/binding-format checks passed. Encrypted metadata responses must not be mistaken for plaintext binding values. Service-key and owner-database binding equality has not yet been established because validation stops at the first failure.

An owner must reconcile the exact approved key/binding pair in Vercel Project Settings > Environment Variables > Production. The binding format is the production project reference, colon, then lowercase SHA-256 of the exact UTF-8 credential bytes (including any existing whitespace). Prefer correcting accidental credential whitespace using the authoritative source, not approving unknown values. Do not remove or bypass the isolation guard, export all environment values, rotate unrelated credentials, or assume local credentials equal stored sensitive values. Review SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SERVICE_KEY_BINDING and OWNER_DATABASE_URL / OWNER_DATABASE_BINDING using the same approved-source process if the next build reports a failure there. Never paste secrets into chat or logs.

## Release limits

The previous synthetic local build failed ENOSPC; roughly 0.6 GB remained during this session. Authenticated learning and payment workflows were not exercised. GitHub synchronization and deployment results are reported separately after this pre-publication checkpoint. Only a successful hosted build and production alias/commit verification can establish deployment completion.
