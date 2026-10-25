# Staging identity follow-up and remaining readiness gates

Deployment status: **NO-GO**. This additive report supersedes only the unresolved identity/role observations in earlier reports; it does not replace or delete them. Recording time is in the linked Change History entry.

## Evidence provenance

The user manually inspected the staging dashboard and reports: project name `lecomax-seo-staging`, reference `tyltharlnbxrxibuxyye`, region `eu-west-1` (Ireland), dashboard account role **Owner**, project access **Organization-wide**. These fields match the previously verified staging MCP target. Dashboard ownership is accepted as user-provided evidence, not represented as a fresh agent dashboard inspection. The exact dashboard account-to-plugin OAuth identity correlation has not been independently inspected.

Prior authenticated management reads verified the same project, ACTIVE_HEALTHY status, PostgreSQL 17.11, organization `mbhkspintqoxntjbykrm` / `lecomax SEO Staging`, Free plan, and organization membership. Earlier reports of absent management access are historical; the connection subsequently succeeded in this conversation.

## Reviewed read-only evidence

- Dedicated MCP session: `supabase_read_only_user`, transaction_read_only=on. Earlier direct connection separately verified TLS and the designated staging target. These are different access mechanisms.
- Empty public application tables/functions; zero subscriptions, foreign servers and Vault secret rows; cron job and HTTP request queue relations absent. This is bounded database evidence, not a complete egress guarantee.
- Edge Functions inventory empty. Secrets and external service configurations were not certified by this observation.
- Seven Storage triggers and five distinct function definitions inspected in this conversation: enforce_bucket_name_length, protect_bucket_control_columns, enforce_bucket_lifecycle_service_role, protect_delete, update_updated_at_column. All invoker-security; inspected bodies validate/protect Storage operations or update timestamps, with no outbound calls, dynamic SQL or production references observed. This is source inspection, not execution or full Storage security certification.
- Prior default-ACL audit found potentially broad future-object privileges. Preserve explicit per-object revocations and test PUBLIC/inherited grants, MAINTAIN/TRUNCATE, sequences, RPCs and schema CREATE under the actual migration owner in a separately authorized phase.
- Historical PG/PGlite, concurrency and backup results remain historical. No fresh recovery, PG17 full-chain execution or hosted actor/PostgREST acceptance is claimed.

## PASS / FAIL / UNVERIFIED

| Item | Status | Basis |
| --- | --- | --- |
| Staging identity, organization and region | PASS | Prior authenticated reads plus matching manual dashboard evidence |
| Dashboard Owner and organization-wide access | PASS (user-provided) | User's explicit manual verification |
| Exact plugin OAuth principal equals dashboard account | UNVERIFIED | No principal/role reader or correlated account identity evidence |
| Database isolation indicators and Edge Functions | PASS (prior bounded evidence) | Read-only inventory; not rerun |
| Storage trigger definition review | PASS (prior bounded evidence) | Seven triggers / five functions inspected |
| Offline five-file migration plan and refusal guards | PASS | Three fresh offline tests; no SQL execution |
| Checkout suitable for implicit staging CLI targeting | FAIL | Fresh guard finds production ref yddqwgdgeljkzfsmtein; exits 1 as designed |
| Auth, SMTP/SMS, hooks, providers, integrations and external workers | UNVERIFIED | No configuration evidence supplied yet |
| Overall staging execution/deployment readiness | FAIL / NO-GO | Mandatory isolation and acceptance gates incomplete |

## Precise remaining checklist

Collect inspection date, staging ref, enabled state, sanitized destinations and evidence source for each item. Do not include passwords, tokens or secret values. Dashboard labels may vary; paths below were not inspected live.

1. Authentication > URL Configuration: Site URL, complete redirect allowlist, wildcards, production destinations.
2. Authentication > Sign In / Providers: enabled email/phone/anonymous/external providers, signup and confirmation settings, provider application identity and staging callback destinations. Verify provider-side configuration too.
3. Authentication > Email > SMTP Settings: custom SMTP enabled state, host, sender domain, sandbox or recipient restrictions. Phone provider: SMS sandbox/test restrictions. Do not send test messages.
4. Authentication > Auth Hooks: all enabled hook events and endpoint/function destinations; inspect referenced definitions/configuration without invocation.
5. Project Integrations, Database Webhooks and organization Integrations: enabled inventory, event sources, destinations and external project mappings. Absence of database webhooks alone does not establish external isolation.
6. External hosting/provider dashboards: staging project mapping; Supabase ref; environment scope and secret names only; payment/email/SMS sandbox status; callbacks; cron schedules, worker/service enabled state, and CI automation. Verify no production credentials or production destinations are used without exposing values.
7. Worker preparation: freeze a matching v3 app/worker bundle, review staging-only configuration and version parity. Existing production-target protections must remain intact; do not invoke the worker as a health check. No current external worker state has been established.
8. Future acceptance, separately authorized only after isolation passes: synthetic products/categories prerequisites, complete five-file chain on PG17, actual-owner full privilege matrix, disabled flags/zero initial budget, real PostgREST/actor/origin tests, concurrency and rollback. Current public schema emptiness means those dependencies are not yet installed.
9. Production readiness remains separately blocked by recovery manifest/harness review, fresh verified backup/compatible restore, hosting/rollback evidence, spending reconciliation, timeout/lease policy, human FR/AR review and monitoring/disable drills. Synthetic staging is not full disaster recovery.

## Preserved safeguards and next action

No credentials, permissions, runtime source, SQL migrations, target pins, CLI link, hosted database or production settings changed. No restores, deployments, workers or paid requests. The checkout remains production-linked and must not be used for implicit linked staging commands. No old restore or database-writing test harness was run.

Safest next action: collect the Auth URL/provider/SMTP/hook evidence in items 1-4 from the already authorized Owner dashboard, then reconcile every integration and worker against external configuration. Do not request migration/deployment approval until mandatory isolation evidence is complete. Plugin reconnection or permission expansion is not needed merely to record the supplied Owner evidence.

Changes: this additive audit and append-only Change History records only. No live preview or deployment is claimed. Validation results and recording timestamps are recorded in the linked history entries.
