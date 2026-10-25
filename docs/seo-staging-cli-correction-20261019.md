# Staging CLI correction and readiness follow-up

**NO-GO for hosted writes, deployment, activation and production rollout.** This report supplements the Owner evidence report without changing historical reports. Actual UTC recording time is in Change History.

## Current findings

- Shared checkout `supabase/.temp/project-ref` identifies production `yddqwgdgeljkzfsmtein`. Its cache also contains linked-project.json, pooler-url and service-version metadata. Only filenames and project-ref were inspected; no pooler credential values were read. A one-file project-ref replacement could mix staging identity with production routing metadata.
- Dedicated MCP configuration in the existing user config identifies mcp.supabase.com, project_ref `tyltharlnbxrxibuxyye`, read_only=true. Fresh SELECT returned supabase_read_only_user, transaction_read_only=on and default_transaction_read_only=on. The SQL supabase.project_ref setting is absent: target identity is corroborated by configured binding and previous management metadata, not invented from SQL. No write probe was attempted.
- Repository contains substantial existing modifications/untracked work; no reset, cleanup or bulk staging was performed. All five reviewed migration hashes pass the offline plan tests; no migration bytes changed.
- Prior Owner/organization-wide evidence remains user-provided; management metadata, empty public schema, empty Edge Functions and seven Storage trigger/five function reviews remain the previously collected bounded evidence. Auth settings and external consumers are still unverified.

## Explicit staging-only correction proposal (not executed)

1. Preserve this shared checkout and its complete CLI cache. Do not edit project-ref in place, copy pooler-url/linked-project.json, or run a linked command here.
2. Reserve a separate workspace dedicated to staging, outside this checkout's linked Supabase directory. Start with no CLI cache, dotenv files, database credentials, migration directory or production environment inheritance. Do not copy the repository's broad migration folder (which includes obsolete synchronous SEO 001).
3. With an already available CLI, inspect version and local help for its workspace and link commands before preparing exact version-specific syntax. Do not download/install or invoke login/link as part of this proposal. No CLI availability or authenticated CLI session is claimed.
4. After a separately authorized hosted management/link step, bind only that isolated workspace to `tyltharlnbxrxibuxyye` using the CLI-supported flow. Independently inspect its sanitized generated reference and routing metadata for consistency. Never fabricate a link by writing only project-ref. Account access, routing and read-only authorization require separate verification.
5. Keep staging migrations absent until isolation passes and the exact five-file chain plus synthetic prerequisites are separately authorized. Never use blanket db push. Any eventual wrapper must check the target at invocation, avoid inherited production routing, and refuse arbitrary passthrough commands.

This plan corrects the workflow without silently repointing production tooling. It is prepared, not linked or executed. The existing guard is advisory: it cannot intercept arbitrary CLI commands or eliminate filesystem races between inspection and future execution.

## Local improvement

The offline target guard now rejects extra CLI arguments, empty/malformed/oversized/non-file references, unreadable paths, and symlinks/junctions within the inspected supabase path. Unlinked invocation returns nonzero. Exact staging linkage remains explicitly 'not authorization'. No network, dotenv, child CLI or credential access is added. Regression tests exercise production denial, staging observation, malformed metadata, directory substitution, junction refusal and execution argument rejection.

## Remaining evidence and precise manual steps

Start in project `tyltharlnbxrxibuxyye`; record inspection time, enabled state and sanitized destinations. Labels may vary; no live dashboard is exposed here. Do not save settings, test emails/SMS, invoke hooks or reveal secrets.

| Dashboard path | Required evidence |
| --- | --- |
| Authentication > URL Configuration | Site URL, all redirects/wildcards, absence of production destinations |
| Authentication > Sign In / Providers | Enabled email/phone/anonymous/OAuth providers; signup/confirmation policy; staging provider application and callback identities |
| Authentication > Email > SMTP Settings | Enabled state, host/sender domain, sandbox or recipient restriction evidence |
| Authentication > Sign In / Providers > Phone | SMS provider and sandbox/restricted recipient configuration |
| Authentication > Auth Hooks | Every enabled event and endpoint/function; read referenced definitions/configuration |
| Project Integrations > Database Webhooks; organization Integrations | All mappings, enabled states, trigger events and destinations |
| External hosting project > Environment Variables; Cron/Scheduled Jobs/Workers; CI workflows | Staging target, secret names/environment scope only, disabled execution/schedules, sandbox providers and no production destinations |

No actual Auth, SMTP, hooks or provider evidence has been supplied since the Owner verification. Worker source/packaging evidence cannot prove an external service is stopped. Existing production worker target protections remain intact. Matching v3 app/worker bundle, staging-only runner configuration, timeout/lease behavior and genuine actor/PostgREST acceptance remain outstanding. Default ACLs require the complete privilege matrix under the actual migration owner in a separately approved phase.

## Status and safest next step

PASS: configured staging MCP binding and current read-only session; eight offline safety/plan tests. FAIL: shared checkout is unsuitable for implicit staging CLI use (correctly blocked). UNVERIFIED: Auth/SMTP/SMS/hooks/providers, external integration/worker isolation, hosted full-chain acceptance, compatible recovery and later production gates.

Next: obtain read-only Auth and external configuration evidence using the verified Owner account. Prepare/review the isolated CLI workspace flow above; no hosted link or execution is necessary to collect dashboard evidence. The previous Owner report's recovery, budget, human review, monitoring and deployment gates remain in force. Local test success is not staging/production readiness.
