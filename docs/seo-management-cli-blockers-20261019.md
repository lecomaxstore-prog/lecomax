# Management and CLI blocker diagnosis

**Deployment remains NO-GO.** This session made no database connection, hosted write, migration, account login, deployment, worker invocation or paid request. Previously successful SQL/concurrency suites were not repeated. Actual recording time is in the linked Change History entry.

## What is now established

1. Fresh plugin discovery reports the Supabase management plugin **uninstalled**. There is no callable project/Auth management connector. The dedicated database MCP is a separate working connection; its credentials cannot be assumed to authorize Management API access. The immediate diagnosed problem is absence of a connected management integration, not a proven OAuth-scope rejection.
2. No `supabase`, `supabase.exe` or `supabase.cmd` was resolved on PATH. No binary was found in the checked project node_modules, common user Scoop/npm/local-bin and Chocolatey locations or the checked npm `_npx` cache locations. This is a bounded search, not proof the binary exists nowhere on disk.
3. `SUPABASE_ACCESS_TOKEN` is absent from the current environment. The checked user `.supabase/access-token` and roaming Supabase token files are absent. Credential values were never read. No OS credential vault was enumerated and no executable could be used to verify such a stored session; an authenticated CLI session therefore remains **unverified**, rather than conclusively nonexistent.
4. **The repository's `supabase/.temp/project-ref` equals production `yddqwgdgeljkzfsmtein`, not staging `tyltharlnbxrxibuxyye`.** The link was inspected but left unchanged. It does not prove a current login. No linked CLI command should be used for the staging audit. No npx download, CLI installation, login or relink was attempted.

## Exact documented permissions versus unknown grant state

| Read task | Documented OAuth scope / permission | Current evidence |
| --- | --- | --- |
| Project listing / metadata discovery | `projects:read`; fine-grained project-list permission `projects_read` | No connected token available to test |
| Auth configuration, including SMTP/hooks settings | `auth:read`; fine-grained permission `auth_config_read` | No connected token available to test |
| Organization metadata/member visibility | Organizations Read | Owning account and membership unverified |
| Database/pooler/SSL configuration | Database Read | Dedicated SQL inventory is not equivalent management access |
| Edge Function management metadata | Edge Functions Read | Existing dedicated MCP already supplies function inventory |
| PostgREST configuration | Rest Read | Inaccessible through current dedicated tool set |

Sources: [project-list permissions](https://supabase.com/docs/reference/api/v1-list-all-projects), [Auth-config permissions](https://supabase.com/docs/reference/api/v1-get-auth-service-config), [scope categories](https://supabase.com/docs/guides/integrations/build-a-supabase-oauth-integration/oauth-scopes).

These are endpoint requirements, **not claims that these scopes are missing from an inspected token**. No token grant or organization authorization has been inspected. Account identity, project membership and grant scope are separate checks; a 403 alone would not necessarily distinguish them. Historical failures are not fresh results.

Do not request `all`, write scopes, API keys or Secrets Read merely to unblock this audit. Auth configuration responses may contain sensitive provider fields; any future API reader must output an allowlist of enabled flags and sanitized destination metadata, never the entire response. Prefer the owning-account dashboard if the connector cannot restrict access appropriately. Current [CLI documentation](https://supabase.com/docs/reference/cli/supabase-login) provides login and project-list commands, but no CLI command was executed here and login would create new authorization state.

## Safe CLI fallback procedure, conditional on availability

Once an already-installed CLI and existing authorized session are available, inspect its version/help, then use only the documented read-only project listing, sanitizing output to the exact staging reference. Do not run `status`, `db pull`, `db push`, link, migration, secrets or deployment commands speculatively. Never use the repository's production link as a target. Run management-only checks in a separate unlinked working directory, with explicit staging reference wherever supported. Return only project name/ref/region/organization and HTTP/status error codes; do not print tokens, environment dumps or full Auth configuration.

If there is no existing usable CLI session, stop. CLI installation or login is not needed just to prove absence and is not an authorized fallback in this session. A scoped management connection or authenticated dashboard is the minimum next step.

## Offline improvements delivered

- `scripts/check-seo-cli-target.cjs` reads only the linked project-ref, uses no network/CLI/dotenv/credential access, and exits 1 for a nonstaging link. It freshly reports the production-link blocker. A staging-link result explicitly does not imply authorization or safe execution. This is an advisory guard, not an interceptor for arbitrary commands.
- `operations/seo/staging-catalogue-proposal.json` defines a concrete **unapplied proposal** for products/categories with required identity/name/slug/active fields, optional source fields, French/Arabic/inactive synthetic rows, fixture-only slug/ID checks and uniqueness constraints. Integer category IDs need no generated sequence. No customer/order/payment data or production rows are included.
- Proposed fixture protection: RLS enabled, no initial public policies, REVOKE ALL from PUBLIC/anon/authenticated/service_role in the same transaction as creation, then service_role SELECT only. Fixture-owner writes only. Refuse existing tables rather than replacing them or using IF NOT EXISTS. This is a narrow SEO contract, not a complete storefront schema.

Validation: new script syntax and focused ESLint passed; actual wrong-link detection returned the expected blocked status; proposal JSON structure, fixture-ID/slug uniqueness, synthetic prefixes, boolean active fields and SELECT-only policy were checked locally. SQL execution is **not tested or claimed** for the new proposal. No previous successful suite was rerun.

## Default privilege corrections recommended, not applied

The last read-only ACL audit remains the evidence; it was not repeated unnecessarily. postgres-created public tables grant API roles TRUNCATE/TRIGGER/REFERENCES/MAINTAIN by default, and supabase_admin defaults are broader. Keep the existing migrations' explicit revocations and validate PUBLIC/inherited grants, table privileges including MAINTAIN, sequence permissions, internal/legacy RPC denial and schema CREATE under the actual migration owner. The proposal applies the same object-specific restriction to catalogue fixtures.

Do not silently change project-wide defaults, managed role memberships or service_role BYPASSRLS. If blanket defaults require correction, prepare a separate owner-specific ALTER DEFAULT PRIVILEGES change and impact review for approval. Default-ACL changes do not repair existing objects. Validate security-definer name resolution, migration-owner privileges and the absence of unsafe intermediate exposure before any hosted rollout. No permission change is recommended for production under this task.

## Prioritized checklist

| Priority | Task | Offline or user action | Status |
| --- | --- | --- | --- |
| P0 | Establish staging-owning management identity/read grant | User action | BLOCKED; no integration connected |
| P0 | Avoid accidental production-linked CLI operations | Offline | Guard delivered; existing link preserved |
| P1 | Inspect Auth/SMTP/hooks, organization/region and external consumers | Read-only after access | BLOCKED |
| P1 | Review synthetic catalogue contract and grants | Offline | Proposal delivered; execution needs separate approval |
| P1 | Review PG17/non-superuser/default-ACL acceptance design | Offline | Existing plan retained; provisioning/execution separately approved |
| P1 | Harden backup harness and explicit restore selection | Offline preparation | Still pending; no old backup harness execution |
| P2 | Freeze matching v3 app/worker package and staging-only target configuration | Offline | Still pending; production-pinned worker cannot serve as staging runner |
| P2 | Fixture/migration/PostgREST acceptance | Explicit staging-write approval after isolation | NOT AUTHORIZED |
| P3 | Deploy, activate, schedule or publish | Separate approvals and passed mandatory gates | NO-GO |

**Exact next approval/action:** authorize and complete connecting the staging-owning Supabase account for management reads, beginning with project metadata and Auth configuration read permissions, limited to the staging project where supported. Review the actual consent screen; do not accept write/Secrets permissions just for this audit. If granular access is unavailable, expose the existing owning-account dashboard for supervised read-only inspection instead. No CLI relink, database grant change, hosted migration or deployment is included.
