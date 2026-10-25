# Staging configuration checkpoint — 20 October 2026

Vercel build/environment configuration is complete. First deployment remains **NO-GO**. No deployment, hosted migration, production modification or paid service activation occurred.

## Verified configuration

- Project `prj_jPniwpH4s81bhISVReUKTQN0GwvD`, name `lecomax-seo-staging`, team `team_yFLUcpSvgQi8EQuvuorOZW7w` / `lecomaxstore-4321s-projects`; verified before writes.
- Next.js, Node 24.x, root directory unset (uploaded storefront root), `npm ci`, `npm run build`, default output directory.
- Twenty variables configured for both Production and Preview; application identity remains `staging` in both scopes. No Development assignments.
- Exact staging origin: `https://lecomax-seo-staging.vercel.app`. Git remains disconnected; Vercel Authentication covers all deployments. No shared environment assignments or assigned integration.
- Legacy anon and service-role keys retrieved directly through authenticated Supabase CLI for `tyltharlnbxrxibuxyye`; decoded project/role claims checked, bindings computed and application isolation validator passed in memory. No production credentials read. No key values saved to source, logs or chat.
- Fresh 48-byte random admin signing secret; it and the service-role key use Vercel sensitive storage. Metadata readback passed; sensitive values were not decrypted.
- `ADMIN_EMAIL=owner@staging.invalid` is a reserved synthetic fixture identity, not a provisioned user. Do not claim working admin login.
- All eight feature flags false, tutor token budget zero, no external-provider, payment, push, worker, cron, Redis or optional owner-learning credentials. Candidate `vercel.json` retains empty crons and disabled Git deployments.

Evidence: `artifacts/seo-staging-hosting-config-1792518704470.json`.
The configuration script deliberately refuses an already-populated environment; do not rerun it to rotate credentials or overwrite this checkpoint.

## Supabase read-only inspection

Project `tyltharlnbxrxibuxyye` is `ACTIVE_HEALTHY`, region eu-west-1, PostgreSQL 17.11, in organization `mbhkspintqoxntjbykrm` / “lecomax SEO Staging” (free plan). It is distinct from production reference `yddqwgdgeljkzfsmtein`.

Read-only counts: zero public tables, Auth users, storage buckets, public triggers, subscriptions, foreign servers and installed pg_cron/pg_net/http extensions. Migration list and Edge Function list are empty. Security advisor returned no findings; an empty schema does not establish future RLS correctness.

CLI config dry-run reports Auth Site URL `http://localhost:3000`, empty additional redirects and email confirmations enabled. This fails staging URL readiness. The CLI diff does not independently establish all unchanged provider/SMTP/SMS/hook settings; those remain unverified. No signup, password-reset email or Auth configuration mutation was attempted.

Evidence: `artifacts/seo-staging-auth-inspection-1792518818849.json`. The earlier empty-settings inspection file is retained and does not prove Auth isolation.

## Fresh validation

- 161 candidate application/security tests, 71 worker tests, four email side-effect tests and six Change History tests passed.
- Candidate TypeScript and focused ESLint passed; two existing next/image warnings remain.
- Nine browser fixture scenarios passed at 375/768/1440 widths; mobile screenshot inspected. Fixtures do not prove hosted Auth.
- Thirteen native PostgreSQL/PostgREST synthetic checks passed, including six pinned SQL fixtures, 13-table RLS, RPC permissions, invalid JWTs, concurrency, rollback and backup/restore. Local services stopped; no hosted schema was touched.
- All 2,123 upload inventory hashes were checked before copying the candidate for a fresh lifecycle build. No source or credential file was added to the candidate.
- Full npm prebuild passed 635,429 course checks and source generation. Next compilation failed because sandbox network access blocked Google Fonts. The authorized retry stopped at the existing 1 GB free-space guard (approximately 935 MB then available). No guard bypass or historical-artifact cleanup occurred. Fresh build and HTTP smoke are **not passed**.
- Historical successful full build and eight HTTP checks remain in `artifacts/seo-staging-autonomous-completion-20261020.json`; they are not fresh results.
- Clean Linux `npm ci`, hosted install/build, real Auth sessions and hosted acceptance remain untested.

Evidence directories: `artifacts/seo-staging-rc-20261020/` (new timestamped logs), `artifacts/seo-staging-lifecycle-1792518723790/`, `artifacts/seo-editorial-browser/run-2TpjqZ/`, and `artifacts/seo-editorial-native-1792518948129/`. Failed sandbox attempts are preserved.

## Remaining actions

1. Approve staging-only Supabase Auth configuration: staging Site URL, exact required callbacks and outbound-provider/signup/SMTP/SMS/hook restrictions. Complete the currently partial Auth inspection before any fixture login.
2. Separately approve a complete synthetic catalogue/schema/Auth fixture provisioning plan. The six SEO migrations alone are insufficient for this empty database. No production data should be copied. Keep database AI budgets and authorizations disabled.
3. Make sufficient disk space available through separately reviewed cleanup or added capacity; rerun the isolated lifecycle build and HTTP checks. Do not remove history, source or historical evidence.
4. Resolve independently scoped rate limiting for protected login; do not copy production Redis. Approve the exact candidate manifest and first protected staging source deployment only after blockers pass.

Production readiness additionally requires hosted staging acceptance, FR/AR review, current production revision comparison, backup/recovery evidence and separately approved release/rollback ownership.

The learning application's `/change-history` displays the current bundled reports after rebuild, not a historical preview. No live preview was verified.
