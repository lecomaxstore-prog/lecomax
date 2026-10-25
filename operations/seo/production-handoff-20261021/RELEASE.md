# Account handoff: production remains NO-GO

Recorded evidence is in verification.json. No production mutation, migration, deployment, secret update, or new staging deployment occurred in this continuation.

## Access and recovery

Vercel CLI 53.4.0 authenticates as lecomaxstore-4321. Production project is prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb, team team_yFLUcpSvgQi8EQuvuorOZW7w (lecomaxstore-4321s-projects). `vercel.cmd env ls production` succeeds. The sandbox EACCES was a network restriction, not missing login. The prior Custom Environment error does not reproduce with this documented syntax.

Supabase CLI lists production yddqwgdgeljkzfsmtein healthy, PG 17.6.1.111, and separate staging tyltharlnbxrxibuxyye healthy. Production OWNER_DATABASE_URL exists in Vercel but is Sensitive and unavailable for readback. No local production connection or standard pgpass/DPAPI connection was found. Database access, key bytes and production bindings are not certified by CLI management access.

Owner action: open Supabase production project yddqwgdgeljkzfsmtein > Connect. Use the direct connection or session pooler, port 5432, database postgres, with the existing database password from your password manager. Do not reset the password or use transaction pooler port 6543. In your own PowerShell at the repository root, run:

```powershell
powershell.exe -NoProfile -File .\scripts\setup-production-backup-credential.ps1
```

Paste the complete URI only into the hidden prompt, with password URI-encoded and no query options except optional sslmode=verify-full. Do not paste it as a shell command or into chat. The script checks the production identity and stores CurrentUser DPAPI ciphertext under your private Backups/LECOMAX directory with inheritance disabled. Share only the resulting path. Syntax validation passed; interactive credential storage/decryption is not yet tested. DPAPI recovery depends on the same Windows user profile; this is credential storage, not the backup encryption or offsite recovery plan.

Once access is available: validate TLS against the trusted Supabase CA and production identity in a read-only transaction; stream a consistent custom-format pg_dump into authenticated encryption outside the repository; keep the encryption recovery material separately protected; verify ciphertext checksum and authenticated decryption plus full pg_restore archive read. Restore into a fresh isolated loopback database with outbound integrations disabled, preserving the archive. Compare restored table content hashes, sequences, schema/ACLs and ownership. Record managed cron/net/Vault exclusions explicitly; Storage object binaries and platform configuration need separate coverage. Do not claim full recovery from an application-only profile. No production or local migration execution is authorized by the latest instruction. No fresh backup or restore was performed in this continuation.

## Candidate

The old final manifest SHA-256 is 66b67fa30d17b4f9ed8f2d6340b919af9738dd9a0555476f51e0defb57c4cf60. All 2,124 pinned bytes were located; two changed workspace references are recoverable from the immutable production-review source. Neither old manifest nor historical source was overwritten.

New proposal: source-manifest.json, SHA-256 b9e9f98596a9bc3ea5610ae1861be6c9f6e83c926563f0145b3fd5870aa228b5. All 2,124 files are materialized in artifacts/seo-production-handoff-20261021/source. It uses the current staging security source, changing only vercel.json to preserve the four production cron path/schedule pairs. productionDeploymentAuthorized=false. A production-configured build remains pending.

Staging dpl_4VCPk44FjpUmadAZKJyNFUKRHMyf is READY and aliased, protection all, zero crons. All 2,124 expected upload SHA-1 identifiers match local source, independently pinned by SHA-256; 586 generated out files are additional. This closes source/deployment uncertainty, not authenticated behavior acceptance. Current owner/editor/viewer/revoked/expired hosted acceptance remains required without disabling Vercel Authentication or changing Auth settings implicitly.

All six migration hashes in ../production-readiness-20261021/migration-plan.json match. Rollback deployment dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx remains READY at revision d9d1d7a7b274fe3df9f70bb154704ea9e07e78ee. Existing schedules and production data were unchanged.

## Ordered release gates and exact authorization boundary

1. Obtain the encrypted connection file; complete fresh encrypted backup and isolated recovery with agreed RPO/RTO and named recovery operator.
2. Securely verify existing production Supabase keys/URL and OWNER_DATABASE_URL. Approve addition of APP_ENV, NEXT_PUBLIC_APP_ENV, SEO_RUNTIME_ENV, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_KEY_BINDING, SUPABASE_SERVICE_KEY_BINDING, ADMIN_SESSION_SECRET and OWNER_DATABASE_BINDING using the existing environment contract. Six SEO initial-off names are also absent; approve explicit false settings. Preserve all commerce/mail/push secrets. No changes are applied here.
3. Complete authenticated staging security/session acceptance and retained content/security risk decisions. Reuse unaffected test evidence. Build the exact new manifest with production configuration; never deploy the dirty workspace or synthetic .next output.
4. Immediately before launch, reverify manifest, six migration hashes, production identity, backup age, four cron pairs and rollback readiness. Stop on drift.
5. Only after gates pass obtain explicit owner approval naming the new manifest hash, each of the six SQL hashes, environment additions, target project/team, operator, release window and rollback action. The old candidate approval cannot authorize this new proposal. Execute no blanket migration push; respect individual transactions and inspect uncertain outcomes read-only before retry.
6. After approved migrations/postflight, deploy only the isolated exact candidate via the verified production project/team. Record new deployment ID before assessing alias and runtime. Existing RELEASE.md supplies detailed postflight and rollback checks.
7. GET-only postflight: alias/TLS, homepage/boutique, active and inactive product/category, sitemap index and advertised shards, robots/canonical/noindex/JSON-LD, unauthorized admin denial, genuine authorized reads, mobile rendering and console/network errors. Observe existing cron and checkout configuration read-only. No purchase, order mutation, email, indexing, worker/AI activation or new cron is included; each requires separately bounded authorization.

Production launch: NO-GO. Only the secure local credential-entry action is requested now; launch approval is not yet requested.

Official references: https://vercel.com/docs/cli/env and https://supabase.com/docs/guides/platform/backups . No live app preview was checked.
