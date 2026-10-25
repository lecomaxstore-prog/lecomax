# Bounded staging editorial test — proposal only

Not authorized to execute. No hosted data/session/write flags were changed while preparing this document.

Fixed target: Vercel prj_jPniwpH4s81bhISVReUKTQN0GwvD; Supabase tyltharlnbxrxibuxyye; product seo-fixture-fr only. Current deployment is dpl_BTTcn1fzEYdVSxbevGo6njShC7UJ. New local staging mutation-denial guard has NOT been deployed.

First approve/build/deploy the denial fix and prove valid authenticated owner/editor mutations return 503 with no database changes. Use normal Vercel login and genuine application sessions. Do not run the historical real-session script: it creates a Vercel automation bypass and is incompatible with the current boundary.

Before any positive write test, a separate fixture-only access boundary must be designed, reviewed and approved; the proposed guard has no flag to bypass. Do not turn APP_ENV into production or enable SEO sync/AI to work around it. Positive tests cannot be claimed from local mocks. Approval must name the exact revised candidate, operator, test window, synthetic actors and source baseline.

Baseline capture must precede mutation and be attached for review: exact product source JSON, seo_documents row/version/publication snapshot, existing revision/event IDs, catalogue/SEO row counts and disabled gates. Refuse any non-synthetic catalogue or unexpected revisions. The local editorial-fixture.json is prepared content, not proof of current hosted baseline. No hosted fixture was seeded.

Proposed bounded sequence after separate approval:

1. Establish genuine no-delivery owner/editor/viewer/revoked test sessions through the ordinary authentication contract; record only role/result, never tokens/cookies. Exercise expired-session denial through genuine expiry, not a forged token. Logout/revoke created sessions at end.
2. Seed/synchronize only seo-fixture-fr through a reviewed single-entity operation. No queue-wide sync, bulk catalogue mutation, AI, payment, email, push, cron or IndexNow.
3. Editor saves the prepared bilingual draft with current version/revision/source; second stale client attempts save and receives 409 without another revision. Viewer save denied, revoked/expired sessions denied. Reads remain available only to permitted roles.
4. Editor submits review acknowledgements; owner publishes the exact reviewed revision with explicit confirmation. Check source facts, both language fields, resulting metadata, rendered content and cache invalidation. No public index submission.
5. Owner rolls back the exact publication event using captured event ID and fresh version/revision/source; assert exact prior publication restoration. Retain new revisions/events and before/after snapshots. Do not delete audit history to simulate cleanup.
6. Re-establish denial configuration/candidate, confirm disabled gates and no unexpected rows/provider events, terminate test sessions, append verification or failure report. On uncertain mutation outcome inspect state before retrying.

Expected role matrix: owner may read/edit/review/publish/rollback only within the separately approved test boundary; editor may read/edit/review, never publish/rollback; viewer read only; revoked/expired denied. Service-role direct mutation does not substitute for an authenticated UI authorization test.

Current owner actions: provide normal application-admin access without sharing credentials; approve the denial-fix deployment first. A later positive-write approval must be based on the concrete implemented fixture boundary and captured baseline, not this proposal alone.
