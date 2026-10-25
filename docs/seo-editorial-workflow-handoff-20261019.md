# Editorial workflow implementation and handoff

This checkpoint extends `docs/seo-continuation-unicode-dashboard-20261019.md`. All previous reports, unrelated uncommitted work, reviewed five-file migrations and release packages were preserved. No production access, hosted writes/migrations/restores, deployment, paid request, worker activation or new database service occurred. SQL tests use new in-memory PGlite instances with synthetic data only. Actual UTC recording times are in the linked Change History reports.

## Delivered local behavior

The product editorial workspace now supports manually authored or explicitly imported AI drafts in French and Arabic. Every save appends an immutable revision with content, catalogue source, actor, timestamp and optional originating job. Incomplete drafts can be saved within a bounded plain-text schema; they cannot be approved until the strict existing bilingual/factual assessment passes. The editor includes title, SEO description, product description, keywords and editable evidence entries. Arabic fields use RTL. Historical revisions can be copied into the editor and saved as a new revision; old records are never rewritten.

Every mutation requires the expected SEO document version, editorial revision and source snapshot. SQL holds a share lock on the product while validating its current source, then the SEO document row lock. Source changes, deactivation, missing products and unsynchronized SEO source projections fail closed. Edits, decisions, publication and rollback advance the document version. The source/content snapshots and event insertion commit in the same transaction.

Editors with products.view and products.edit can save and review. Approval requires factual, French, Arabic and duplicate-review acknowledgements plus explanatory notes. Publication and rollback additionally require the owner session and explicit confirmation. The API uses the server session actor, not caller-provided actor claims. Only the newest revision's latest review decision can authorize publication. Editing creates a new unreviewed revision; a subsequent changes-requested decision invalidates earlier approval. Review of the original AI suggestion is deliberately insufficient to approve an editorial revision.

Publication writes the exact reviewed bilingual bundle and French public metadata. The product page reads the published French product description, also used by its existing Product JSON-LD. Arabic is retained in the published bundle and can be read through the server helper; this change does not create Arabic storefront routes or hreflang destinations. Keywords remain editorial data, not public meta-keyword tags. Commerce/catalogue records are never changed by this workflow.

Rollback reverses the latest editorial publication/rollback event using its recorded before-snapshot, creates another event, and preserves all drafts/revisions. It requires the caller's current version and latest publication-event ID, unchanged current publication snapshot and a compatible source for the restored content. A first-publication rollback can restore automatic metadata. Stale retry, wrong event, changed source and out-of-band publication changes are rejected. It cannot silently undo unrelated intervening publication changes. A provider field changed by legacy drafting can also cause snapshot conflict; compare before attempting recovery, never force a database update.

Once a product has editorial revisions, legacy metadata approval/reset is blocked at the SQL boundary with SEO_EDITORIAL_WORKFLOW_REQUIRED. This closes the old manual/routine-AI approval path around owner-only editorial publication. Legacy drafts remain usable, and entities without editorial revisions retain their original metadata draft/approval/reset workflows. Existing suggestion results/reviews stay intact. The new shared admin-policy entry lets staff reach the handler, which applies its own read/edit/owner restrictions.

Workers still complete only AI jobs; they cannot update editorial revisions or published content. Importing a suggestion is a deliberate new save, with version/source checks and an exact comparison against the completed persisted job result. Late generation cannot overwrite a newer editorial revision. Old routine-AI approval also cannot bypass the editorial workflow. Failed/stale requests are not retried automatically.

The editor retains local text after failures/conflicts. Comparing the server version does not change the editing base; the user explicitly chooses to discard local text or adopt the new base while keeping it for manual merging. Dirty text disables review/publication. In-flight duplicate submissions are suppressed, late results after unmount are ignored, and page unload warns about unsaved edits. Unsaved text is not a durable cross-navigation/browser-crash archive: save a revision before switching products or leaving. Server-saved revisions persist independently.

## New migration and security boundary

`operations/seo-vercel/supabase/migrations/202610190004_seo_editorial_workflow.sql` is the sixth migration, appended after the unchanged decoupled 002, run-control, AI-budget 001, editorial 002 and review 003 files. It adds two RLS tables (`seo_editorial_revisions`, `seo_editorial_events`), two publication columns on `seo_documents`, bounded read/mutation RPCs, a draft validator, snapshot helper and guarded wrapper around legacy metadata mutations. Application roles cannot directly select/write the private tables, manipulate the event sequence or execute internal helpers. Only service_role receives the bounded read/mutation entry points. Owner/editor distinctions are enforced in the authenticated server API; the service-role credential is a trusted server boundary, not an end-user database identity.

The original five-file offline staging plan and hash pins intentionally remain unchanged. They are historical reviewed artifacts, not a release manifest for this new workflow. Do not silently edit those pins or use a five-migration acceptance script to certify this six-migration implementation. No migration has been applied to hosted staging or production.

## Files changed in this session

| File | Change |
| --- | --- |
| operations/seo-vercel/supabase/migrations/202610190004_seo_editorial_workflow.sql | New revisions, review/publication/rollback RPCs, privileges and legacy guard |
| operations/seo-vercel/tests/editorial-workflow-sql.test.mjs | Nine isolated SQL workflow/security/compatibility cases |
| lib/seo-editorial.ts | Shared bilingual types, incomplete-draft validation, blank draft |
| lib/seo-editorial-store.ts | Published-only source-checked storefront reader |
| lib/admin-policy.ts | Explicit editorial route registration; other route policies preserved |
| app/api/admin/seo/editorial/route.ts | Authenticated read, save/import, review, owner publication/rollback, cache handling |
| app/api/admin/seo/route.ts | Actionable 409 for legacy editorial-workflow conflicts |
| app/admin/seo/EditorialWorkspace.tsx | Editing, evidence, import, conflict comparison, history and publication controls |
| app/admin/seo/page.tsx | Product-scoped editorial workspace integration |
| app/admin/seo/EditorialReview.tsx | Clarifies original suggestion review versus revision publication |
| app/produit/[slug]/page.tsx | Uses current published French editorial description with catalogue fallback |
| tests/seo-editorial-api.test.ts | Nine API authentication/authorization/validation/cache/import cases |
| tests/seo-editorial-store.test.ts | Two public-reader freshness/fallback cases |
| tests/seo-editorial-workspace.test.ts | Five component-hook interaction/race/conflict/RTL cases |
| tests/product-indexing.test.ts | Reader mock for existing product regressions |
| tests/seo-api.test.ts | Legacy workflow-required conflict regression |
| docs/seo-editorial-workflow-handoff-20261019.md | This handoff |

Also appended three immutable reports (`seo-editorial-workflow-prepared-20261019`, `seo-editorial-workflow-correction-20261019`, `seo-editorial-workflow-verified-20261019`) and regenerated `lecomax-learning-app/data/change-history.json` through the required CLI. Evidence logs and report inputs are under artifacts/. Many existing SEO files were already untracked relative to HEAD; Git diff alone cannot distinguish this session from prior work.

## Exact validation results

- Final combined run: **113 passed, 0 failed, 0 skipped**. This comprises the preceding 88 selected regression/history cases plus 25 new editorial cases: nine SQL, nine API, two storefront-reader and five editor component-hook cases. Reruns are not counted as additional tests.
- Root TypeScript: `node node_modules/typescript/bin/tsc --noEmit --incremental false`, exit 0 after the final guard changes.
- Learning app TypeScript: `npm.cmd run typecheck`, exit 0.
- Focused ESLint covering all changed TS/TSX/MJS runtime/test files: exit 0, no warnings.
- Change History persistence/interaction: six cases included in the combined run. Final manifest check is recorded after the verification report is appended.
- Intermediate failures retained honestly: the first SQL run passed 6/7 because the fixture used a rejected provider label; correcting it to the allowed openai label required no provider request. Initial API tests exposed the missing staff route mapping; after correction all nine passed. The later compatibility guard was added after a 112-case pass; the final 113-case run includes that guard.

Final evidence: `artifacts/seo-editorial-final-guarded-tests.log`, `artifacts/seo-editorial-final-guarded-types.log`, `artifacts/seo-editorial-final-guarded-lint.log`, `artifacts/seo-editorial-final-learning-types.log`. Earlier attempts remain in separate logs. Node emits an existing MODULE_TYPELESS_PACKAGE_JSON warning in TypeScript test files; tests still exit 0.

Focused reproduction, no dotenv or hosted credentials:

```text
node --test operations/seo-vercel/tests/editorial-workflow-sql.test.mjs tests/seo-editorial-api.test.ts tests/seo-editorial-store.test.ts tests/seo-editorial-workspace.test.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false
node lecomax-learning-app/scripts/change-report.cjs --check
```

## Limits and remaining blockers

Local implementation and the stated tests PASS. Hosted execution remains BLOCKED / NO-GO. This session did not refresh staging identity/isolation evidence; retain the prior PostgreSQL 17.11 read-only inventory and unresolved Auth/provider/external-worker gates without treating them as newly verified.

PGlite tests validate transaction behavior, stale versions and grants under simulated broad default privileges. They do not establish actual PostgreSQL 17 simultaneous-session row-lock behavior, hosted PostgREST signatures, actual migration-owner/default-ACL behavior or real browser sessions. Component-hook tests are not browser visual/interaction certification. No new production build, browser preview, rich-results validator, full unrelated repository suite or human linguistic acceptance was run. Automated factual/language checks remain heuristics; cross-catalogue duplicate comparison requires human acknowledgement, not an asserted exhaustive semantic check.

The new editorial workflow is product-only, matching the existing editorial generation scope; category metadata remains on its existing path. Generating content, spending reconciliation, timeout/lease policy, matching release packaging, monitoring ownership and full backup/restore readiness remain separate unresolved gates.

## Exact next-session actions

1. Read this checkpoint and the three immutable reports; inspect Git status and preserve all existing dirty/untracked work. Do not reset or rebuild prior releases.
2. Exercise the workspace in an isolated real browser with fixtures: save/reopen FR/AR drafts, switch products with unsaved work, import delayed suggestions, compare/rebase conflicts, historical-copy/save, owner publish/rollback and nonowner denial. Verify product body/JSON-LD uses only current publication and falls back on missing migration/source drift. Do not use production catalogue credentials for the fixture server.
3. Review migration 004 and prepare a new separately named six-file staging/release manifest with hashes and dependency inventory. Preserve the old five-file manifests. Rehearse actual PostgreSQL 17 competing-editor/publication/rollback transactions and privileges in an explicitly isolated local environment; do not reuse historical clusters implicitly.
4. Collect missing read-only Auth redirect/provider/SMTP/SMS/hooks and external integration/worker isolation evidence. Do not infer isolation from separate project IDs or an empty schema.
5. Only after isolation and a separate hosted-write approval: install the reviewed six-file synthetic staging chain, verify actual-owner ACL/RLS/RPC behavior and real actor/origin/concurrency cases. Keep AI/worker/scheduler activation disabled, initial budget zero and production untouched. This work grants no such approval.
6. Before any production proposal, resolve billing reconciliation, provider latency/lease policy, human French/Arabic review, frozen matching app/worker packages, recovery/backup and monitoring gates. No hosted activation follows automatically from these local tests.

## Changes Made

The editorial workflow is implemented locally with the validation and limits above. Reports are accessible through `/change-history` in an updated learning-app bundle. No running preview, deployment or hosted installation is claimed.
