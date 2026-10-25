# SEO migration preparation — 18 October 2026

**Prepared only. No production migration or deployment was executed.**

## Exact migration and scope

Apply only `supabase/migrations/202610180001_seo_engine.sql`, once, after approval.
SHA-256 of the reviewed file:
`958e8727fb9d5f32df6702b00cd17e1e0a2e71b98674f1523ae29e439af3332f`.
Recheck the hash immediately before application; changes require a new review.

The original unapplied file is preserved in `artifacts/seo-migration/original-*.sql`.
The preparation adds five-second lock waits, a 60-second per-statement timeout,
explicit sequence privilege revocation, and explicit service-role revocation on
internal helper functions before granting only the save RPC. It does not replace
an already-applied migration.

Objects created:

| Object | Purpose |
| --- | --- |
| `public.seo_documents` | Source, fallback, draft, published content and version; composite primary key `(kind, entity_id)` |
| `public.seo_events` | Append-only mutation history; bigint identity primary key |
| `seo_documents_slug` | Partial `(kind, slug)` index for active storefront reads |
| `seo_events_document` | `(kind, entity_id, id DESC)` history index |
| `seo_events_id_seq` | Audit-event identity sequence, owner-only access |
| `seo_fallback(jsonb,text)` | Pure fallback generation |
| `sync_seo_document(text,jsonb)` | Owner-only catalogue synchronization |
| `seo_catalogue_trigger()` | Owner-executed trigger function |
| `save_seo_document(text,text,integer,text,jsonb,text,text,text)` | Server-only transactional mutation with event recording and optimistic version check |
| `products_seo_sync`, `categories_seo_sync` | AFTER INSERT/UPDATE/DELETE row triggers on existing catalogue tables |

There are **no foreign keys**, intentionally: SEO documents and audit history
survive deletion of their catalogue entry. `entity_id` is the UUID rendered as
text and is qualified by `kind`. There are no cascade deletes. No existing
columns, product/customer/order rows, policies, or global default privileges are
modified. Backfill only reads products/categories and writes new SEO documents.
The two catalogue tables do gain triggers; future writes execute these triggers
in the same transaction and can fail if synchronization fails.

RLS is enabled on both new tables with **zero policies**. This is intentional
deny-by-default for `anon` and `authenticated`; do not add a public SELECT policy
because documents include drafts. Table grants are also revoked. The verified
`service_role` has BYPASSRLS and SELECT only, plus EXECUTE on the save RPC. Writes
inside SECURITY DEFINER functions use the migration owner's privileges and a
fixed `search_path=public`. The browser never receives a service key. These RPCs
trust the server's existing admin permission checks; they are not user-facing
Supabase Auth RPCs. [Supabase privilege guidance](https://supabase.com/docs/guides/database/functions).

## Actual database compatibility

A TLS-verified SQL connection was matched to the configured Supabase project.
Inspection SQL uses explicit read-only transactions. Pooler startup options alone
are not a reliable read-only guarantee; the ledger phase also uses an explicit
read-only transaction. Evidence:
`artifacts/seo-migration/preflight-1792343495826.json` (17:11:35 UTC).

- Both tables have UUID primary keys, unique non-null text slugs, non-null text
  names and boolean `active`. Category `active` is nullable and is handled as false.
- Products have text `description`, `category`, `brand` and text-array `images`;
  categories have text `description` and `image`. Optional nulls are accepted.
- Categories have no `updated_at`; this migration does not require it.
- There are 34 products and 4 categories; no missing/blank required identities,
  duplicate IDs or duplicate active slugs were found.
- None of the named SEO tables, indexes, sequence, function overloads, triggers
  or policies exist. No existing user-defined catalogue triggers were returned.
- `postgres` has public-schema CREATE and BYPASSRLS; `service_role` has BYPASSRLS.
  Browser roles cannot CREATE in public. Required Supabase roles exist.
- `postgres` owns both catalogue tables and has SELECT/TRIGGER permissions.
  The migration ledger exists and has no entry for version `202610180001`.
- Actual default sequence privileges include UPDATE for browser/server roles.
  Explicit sequence revocation now prevents `setval` from disrupting audit IDs.

This is a point-in-time preflight, not proof that later database changes cannot
conflict. Rerun it immediately before application. Application-host environment
settings were not inspected by this SQL audit.

## Safe application procedure — do not execute until approved

1. Confirm the intended Supabase project and take/verify a restorable schema and
   data backup. Run the procedure on staging first. Use the schema-owner
   `postgres` role, not a browser token or restricted application role.
2. Run the complete `supabase/verification/seo-preflight.sql` in SQL Editor.
   Alternatively, with local configuration loaded, run
   `node scripts/audit-seo-migration.mjs`; this command is read-only.
   Require no SEO object collisions, compatible columns, and clean required data.
   Check the project's migration ledger for version `202610180001` using its
   established migration tooling. Stop on any previous installation/partial state.
3. Review the exact file/hash above. Obtain explicit approval for the production
   migration and agree on a quiet catalogue-edit window. CREATE TRIGGER acquires
   locks that conflict with writes; the five-second lock timeout aborts rather
   than waiting indefinitely. [PostgreSQL locking reference](https://www.postgresql.org/docs/current/explicit-locking.html).
4. In the intended project's SQL Editor, execute the **entire exact migration**
   including BEGIN and COMMIT, as one batch. Do not run only selected statements.
   Do not run a blanket `supabase db push`: this workspace has other pending
   migrations outside the SEO scope. If using an established migration runner,
   confirm it selects only this version and records it correctly. SQL Editor does
   not automatically reconcile a CLI migration ledger; use the team's standard
   reviewed bookkeeping procedure afterward, never mark a failed run applied.
5. On any error or timeout, stop. Issue ROLLBACK if the session is still in an
   aborted transaction, then rerun the read-only preflight before deciding whether
   to retry. This migration uses CREATE (not CREATE OR REPLACE/IF NOT EXISTS): it
   deliberately fails on collisions rather than silently changing existing objects.
   Do not drop objects or reset the database to force a retry.
6. Run `supabase/verification/seo-postflight.sql`, or
   `node scripts/audit-seo-migration.mjs --postflight`. Every `passed` field must be
   true; the runner exits nonzero otherwise. Inspect index/trigger definitions too.
   Expect one SEO document per current product/category (38 at this audit), no
   initial drafts/publications/events, and zero browser policies. Counts can change
   legitimately if catalogue writes or administrator activity occur after commit.
7. Verify PostgREST reads and `/api/admin/seo` with an authenticated owner. If SQL
   checks pass but the API still reports a missing table/function, allow the schema
   cache to refresh; use the project's approved schema-cache reload procedure if
   necessary. Do not grant public access to solve a cache error.
8. On **staging**, create/update/delete a test product and category; generate,
   save and approve a draft; verify source-change conflicts, history retention,
   anonymous denial and read-only staff permissions. Verify storefront metadata
   after approval/cache revalidation. These behavioral writes have not been run
   against production and are not part of the read-only postflight SQL.
9. Production deployment is a separate approval. If rollback becomes necessary,
   review `supabase/rollback/202610180001_seo_engine_disable.sql` and the application
   rollback procedure. The rollback preserves SEO tables/history and disables
   synchronization/RPC access; it does not delete or restore catalogue data.

## Environment variables (names only)

| Variable | Purpose | Local inspection |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL; required | Configured |
| `SUPABASE_SERVICE_ROLE_KEY` | Required server-only SEO reads/save RPC | Configured |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Existing browser authentication/client configuration; cannot access SEO tables | Configured |
| `OWNER_DATABASE_URL` | SQL pre/postflight runner only; not needed by runtime SEO or SQL Editor | Configured; project match and read-only connection verified |
| `ADMIN_EMAIL` | Existing owner authorization configuration | Configured |
| `ADMIN_SESSION_SECRET` | Optional dedicated admin signing secret; existing code otherwise uses service-role key | Absent; fallback is implemented |
| `SEO_AI_BASE_URL` | Optional HTTPS compatible AI endpoint | Absent |
| `SEO_AI_API_KEY` | Optional server-only AI credential | Absent |
| `SEO_AI_MODEL` | Optional provider model | Absent |

No new environment variable is required for the migration itself in SQL Editor.
The SQL audit runner also uses the existing `supabase/prod-ca-2021.crt` for TLS.
AI variables are needed only when enabling optional AI suggestions; deterministic
SEO and the approval workflow work without them. Do not prefix private keys or
database URLs with NEXT_PUBLIC. Local presence does not prove Vercel/production
deployment settings are present; verify those names separately before rollout.

## Validation and remaining gates

`node scripts/test-seo-sql.mjs` runs only in an isolated in-memory PGlite database.
It executes the migration and both verification SQL files, checks unchanged
product/category/customer/order fixtures, triggers, conflicts, retained approvals
and history, and service/browser table/function/sequence permissions under broad
default grants. It also checks that reapplication fails without replacing data.

Ready: reviewed migration, live schema/collision audit, read-only verification
queries, local SQL regression checks, rollback file and this runbook.

Pending: staging deployment and authenticated integration tests, confirmed backup,
fresh production preflight and deployment environment review. Production schema
application and application deployment both require separate explicit approval.
No production mutation, migration, provider call or deployment was performed.
