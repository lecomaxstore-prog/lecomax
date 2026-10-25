# Fresh encrypted backup and application recovery

This addendum supersedes only the missing-credential/fresh-database-backup portions of RELEASE.md. Existing evidence and failed attempts are retained. Production deployment remains unauthorized.

- Production yddqwgdgeljkzfsmtein authenticated using the replacement Windows DPAPI credential. TLS certificate verification and database-enforced read-only transaction passed; PostgreSQL 17.6; no production mutation or migration.
- Snapshot: 2026-10-21T17:06:27.777Z (19:06 Paris). Archive: C:/Users/Ziko/Backups/LECOMAX/encrypted-production-1792602387119/production.dump.aes256gcm.
- AES-256-GCM archive: 1,790,930 bytes; SHA-256 40c343c8b29d38039fd53a768b48eb9e25479c483be442f68e632cf92af89d28. Random encryption key is Windows CurrentUser DPAPI-protected. Connection secret and plaintext dump were not saved to the repository or printed. Checksums, authenticated decryption and a full pg_restore archive read passed; 1,233 TOC entries.
- Independent recovery read the saved encrypted archive and unwrapped its persisted key. A new database encrypted_recovery_1792602598909 was restored into the existing fixed localhost:55439 test cluster, using verified local TLS and directory identity. No database was overwritten; no application or migration ran.
- All 110 included table COPY content hashes and sequence set values matched. Restore completed without owner/ACL errors. Public RLS tables: 61. Foreign servers, subscriptions and outbound managed extensions: zero. Cluster stopped successfully at 2026-10-21T17:10:07.838Z.

## Scope and limitations

The recovery profile intentionally omitted 38 archive entries for managed cron/net/Vault and hosted event triggers. Those entries remain in the encrypted backup. Local PostgreSQL is 18.6, production is 17.6: this is a successful application-profile restore, not same-major or full Supabase-platform certification. No globals/role-password backup, external Auth configuration, Storage binary backup or Vault-key portability is claimed. The source has 205 Storage object metadata rows; actual objects are not included.

DPAPI key recovery passed only on this Windows user profile. A separately recoverable/offsite archive and key copy remain necessary for machine-loss recovery. No external upload was performed. The stopped test cluster retains the restored plaintext database; the encrypted archive itself remains encrypted. Production freshness must be checked again against the owner's release-window RPO before migrations are approved.

The first local attempt encountered a Windows subprocess I/O stall. The specifically identified test cluster was stopped manually; the original script then recorded ECONNREFUSED and an unsuccessful redundant stop. Its static limitation text saying the cluster stopped was not independent evidence. The corrected runner directs pg_ctl output to a file, and the second attempt records successful restore and stop. Both reports are preserved.

## Evidence

- artifacts/seo-encrypted-backup-1792602378487.json: successful connection preflight.
- artifacts/seo-encrypted-backup-1792602387119.json: encrypted backup/integrity.
- artifacts/seo-encrypted-local-restore-1792602495870.json: failed first local attempt.
- artifacts/seo-encrypted-local-restore-1792602598909.json: successful recovery and shutdown.

## Remaining launch gates

Vercel production names/scopes and team identity were verified earlier in this continuation; no redundant check was performed. Eight candidate-required names remain missing. Exact hosted Supabase secret bytes/bindings remain unverified; successful use of a separate local database credential does not establish equality with Vercel's sensitive OWNER_DATABASE_URL. Any production configuration addition or secret replacement requires explicit approval.

Current staging security upload identity is verified, while authenticated hosted behavior/session acceptance remains open. Production-configured build and exact candidate approval remain open. Local disk space was about 483 MiB before the successful restore; do not start a large build without measuring and resolving headroom. No files/history were deleted to create space.

Proposed candidate remains the 2,124-file source-manifest.json, SHA-256 b9e9f98596a9bc3ea5610ae1861be6c9f6e83c926563f0145b3fd5870aa228b5, productionDeploymentAuthorized=false. Six pinned SQL hashes and four production cron pairs remain unchanged. Retained rollback target is dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx; revalidate at release time.

Decision: fresh encrypted database backup/integrity and bounded application recovery PASS; official production launch NO-GO. Final approval must name the exact candidate hash, six migration hashes, reviewed environment changes, target project/team, operator/window and rollback actions after remaining gates close. No launch approval is requested before then.
