# Minimal production storefront release — 22 October 2026

Source candidate ready; production deployment held for specific changed-secret runtime verification. No deployment authorization requested yet because that gate remains open. No production deployment, migration, credential change or production data mutation occurred.

## Exact candidate

- ID: `seo-minimal-production-20261022`
- Worktree: `release/seo-minimal-production-20261022` (detached)
- Baseline: `d9d1d7a7b274fe3df9f70bb154704ea9e07e78ee`
- Immutable manifest: `artifacts/seo-minimal-production-20261022/candidate-manifest.json`
- Manifest SHA-256: `76f192aec62c58709bb28ba8f9457c6482643f7a614754df2844604d33908674`
- Current READY production and rollback reference: `dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx`
- Project: `prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb`; team: `team_yFLUcpSvgQi8EQuvuorOZW7w`.
- Production domain: `lecomax.com`; immutable current host: `lecomax-bf5hgr5bl-lecomaxstore-4321s-projects.vercel.app`.

| File | Candidate SHA-256 |
|---|---|
| `app/layout.tsx` | `3a333a77f2eacd18f6a6e12d56c0ff0ce3d30823f530ef30c26a6eded4473681` |
| `components/CategoryTiles.tsx` | `3eb36a15a4f89509c796deec96b464e5ea6bb72e5bdc824912fdd0bf2757c32c` |
| `public/images/placeholder.png` | `2f12eb2197ed4fe89685ab4c323de05b0bf942e50dd2aff40a7aee3481e3e935` |

Accepted inputs were verified against `artifacts/seo-fix-integration-20261021/integration.json`. The accepted staging layout hash is `e5380f9e18c8f48f1c7e98637d1b7fc40ef4cd11c356a9409f54ad6c2eeda0b1`. It contains staging tracking gates in addition to the manifest fix. Only the credentialed manifest change was ported to production, deliberately yielding the different candidate hash above. CategoryTiles and placeholder are byte-identical to accepted inputs. Exactly two modified files and one added image; no removals, dependency changes, schema changes or advanced SEO modules. Original workspace changes preserved.

## Actual validation

| Gate | Result |
|---|---|
| Source scope and SHA-256 recheck | PASS; see final-verification.json |
| TypeScript | PASS |
| Full ESLint | PASS, existing warnings retained |
| Production Next.js build | PASS, Node 24.22.0 / locked Next.js 15.5.24 |
| SEO, storefront, commerce and authentication regressions | PASS: 94, no failures/skips |
| FR/AR home, boutique, product, category browser checks | PASS: 18 cases at 1440/375/390 pixels |
| Canonicals, metadata, JSON-LD, manifest, decoded images | PASS on actual compiled candidate with synthetic catalogue |
| Robots and sitemap | PASS: HTTP 200, production URLs, FR/AR fixtures |
| Production identity and four cron schedules | PASS: fresh read-only Vercel evidence |
| Fresh encrypted database backup and local restore | PASS within application-profile scope |
| Production-scoped sensitive configuration runtime | BLOCKED: newer than live deployment; values write-only |
| Deployment / live candidate checks | NOT RUN; final authorization not yet requested |

Evidence is under `artifacts/seo-minimal-production-20261022`. Initial font-fetch sandbox failure and missing synthetic Resend key build failure are retained; only the harness was corrected. Local browser raw all-network verdict failed on two Vercel-hosted analytics script URLs unavailable under standalone Next.js. `browser-assessment.json` preserves and classifies those exact 404s; every storefront/SEO assertion passed. External browser requests and mutations were blocked. Existing realtime CSP rejection remains visible. No real payment, delivery, production owner session or tracking integration acceptance is claimed. Local screenshot is synthetic, not a production preview.

## Production configuration and smallest owner action

`config-versions.json` establishes that OWNER_DATABASE_URL, OWNER_DATABASE_BINDING, ADMIN_SESSION_SECRET and both runtime selectors were changed after the current live deployment. Therefore redeployment picks up configuration not established by current live health.

Fresh provider inspection establishes both selectors equal production; SEO AI/editorial/sync/manual-sync flags and INDEXNOW_ENABLED equal false. Sensitive OWNER_DATABASE_URL and ADMIN_SESSION_SECRET exist but cannot be read back. No values were exported or changed. OWNER_DATABASE_BINDING matches the existing DPAPI-protected database credential, which successfully connected to production with certificate verification. This does **not** prove the write-only Vercel URL is the same bytes.

The candidate's unchanged owner database code enforces certificate validation and uses the existing bundled CA; separate OWNER_DATABASE_SSL / OWNER_DATABASE_SSL_CA variables are not required by this baseline. OWNER_DATABASE_BINDING is not consumed by this baseline. Admin signing uses ADMIN_SESSION_SECRET when set, requires at least 32 characters, and otherwise uses the service-role key. The newly added secret can therefore change session trust on redeployment.

**Required owner action:** have an authorized operator verify the existing current production-scoped values in a secure runtime or existing secret-management process: (1) actual OWNER_DATABASE_URL matches OWNER_DATABASE_BINDING and connects to `yddqwgdgeljkzfsmtein` with TLS certificate verification; (2) actual ADMIN_SESSION_SECRET satisfies the existing minimum length and owner login/re-authentication works with that configuration. Return only PASS/FAIL evidence and timestamps. Do not paste secrets, regenerate them or overwrite existing settings. If a protected preview using those values is needed, authorize that bounded deployment separately. Supabase's connected tool denied production project access in this session.

This is a configuration verification gate, not a request to repeat full advanced SEO staging acceptance. The three source fixes are independent of unfinished SEO migrations/workers/editorial features.

Existing baseline IndexNow publishing ignores INDEXNOW_ENABLED. It remains unchanged and was not invoked; this release neither adds nor activates an indexing integration. Do not describe that existing path as disabled by the flag. Advanced SEO modules are absent from this production candidate, so none of their workers or writes are introduced.

## Recovery and rollback

Fresh snapshot: `2026-10-22T09:47:41.864Z`, created under a database-enforced read-only transaction with verified TLS. Encrypted archive: `C:/Users/Ziko/Backups/LECOMAX/encrypted-production-1792662461177`. Ciphertext SHA-256: `497b5b2f4a672c27f25819a6183348fb9f103ce6a0c0b03d930f57579e846ed3`. Archive checksum, authenticated decryption and full archive-read verification passed.

Isolated local restore verified 110 tables and sequences, with 61 public RLS tables; no foreign servers, subscriptions or outbound extensions. Cluster stopped after test. Reports: `artifacts/seo-encrypted-backup-1792662461177.json` and `artifacts/seo-encrypted-local-restore-1792662506516.json`.

Limitations: local PostgreSQL 18.6 versus production 17.6; managed cron/net/Vault/event triggers excluded; Storage binaries and external platform configuration not included; DPAPI recovery tested under the same Windows user only. These are not full-platform disaster recovery certification. This release has no database or Storage changes and needs no schema rollback. Preserve the previous immutable deployment and its old environment snapshot; rolling back an alias must target that deployment, not rebuild old source with newer project settings.

## Exact next steps after configuration verification

1. Recheck manifest hashes, clean three-file scope, current alias/project/team and four crons. Preserve this candidate; any correction requires a new manifest/version.
2. Request explicit production authorization naming this candidate and manifest SHA-256.
3. Only after authorization, deploy this isolated source through the existing production Vercel project with a normal remote build and unchanged project settings. Never deploy the dirty root, staging worktree or synthetic local `.next`; never use `--prebuilt`.
4. Record immutable deployment ID, verify READY and lecomax.com alias, then perform GET-only storefront, metadata, canonical, JSON-LD, robots/sitemap, manifest, FR/AR product/category and cold image checks. Confirm owner re-authentication through normal authorized use; do not submit orders or payments as a smoke test.
5. Retain `dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx` as rollback reference. Stop on checkout/auth or route regressions. Any alias rollback requires explicit authorization.

No six migrations, AI, workers, editorial writes, synchronization or new indexing integration activation is authorized by this preparation.

## Changes Made

Preparation and linked verification reports are appended to the learning app's `/change-history` source system. They remain outside this minimal storefront upload. All prior history is retained; no learning-app deployment or live history preview is claimed.
