# Separate admin-session revocation remediation

Status: **review prototype, not a deployable release**. This directory is outside Candidate E. E retains its six migrations and unchanged authentication implementation. Nothing here has been applied to production.

## Confirmed issue and impact

Production D (`ddf12f4a916478f80f1ca75a1ca83a193d36ef28`) and recovered E have identical `lib/admin-session.ts`, `lib/admin-access.ts`, `app/api/admin/auth/session/route.ts` and `middleware.ts`. The live provider identity still points to D. This is an inherited production behavior, not an E regression. No production login, logout or stolen-cookie replay was attempted.

The signed owner cookie authenticates an email until its signed expiry, with a maximum verifier age of 30 days. Logout clears browser cookies but does not invalidate a copied cookie. The owner email bypasses staff membership reads after signature verification. A holder of a still-valid copied owner cookie can therefore retain owner privileges after browser logout; upstream Auth sign-out is not checked by this path. Staff deactivation and permission changes are rechecked on the next request, but that is not individual session revocation. HMAC tampering and expiry checks work.

## Minimal separate change

`session-registry.mjs` demonstrates a version-2 signed token with a random 256-bit session identifier and a durable registry containing only its SHA-256 hash, normalized identity, issuance/expiry times and revocation time. Registration must commit before issuing the cookie. Every verification checks signature, audience, expiry and the uncached registry, including owner requests. Missing rows and storage failures deny access. Logout must durably revoke before reporting success; repeated revocation is idempotent. An owner/security operator can revoke all sessions for an identity through an owner-only, same-origin protected action.

The prototype deliberately rejects legacy tokens. A secure cutover forces all existing administrators to sign in again. Keeping a legacy acceptance fallback would preserve the issue. The `store` interface is injectable for tests; a production Supabase/SQL adapter and application wiring have **not** been implemented or certified. This prototype does not automatically propagate upstream Supabase session revocation: the implementation must explicitly bind the upstream session ID and verify it on sensitive requests, or define and test an equally strong revocation signal. An email-only token is insufficient for that requirement.

## Migration and integration sequence — separate approval required

1. Create a separate security branch from the then-live baseline. Inventory the actual Auth/session model and choose the authoritative revocation source before finalizing the store adapter.
2. Use `supabase migration new admin_session_registry` to create a separately reviewed migration. `schema-proposal.sql` is a proposal, not an executable migration plan or the seventh E migration. Its additive table uses RLS, denies `anon`/`authenticated`, grants the server role insertion/read and only the revocation update column. No definer RPC is needed for this prototype. Extend the proposal with the reviewed upstream-session binding as necessary.
3. Implement the private uncached store adapter and wire successful upstream login to durable issuance. Use version-2 verification in both Edge middleware and Node handlers. Keep the existing fresh staff/permission checks. Do not cache an owner allow decision across requests.
4. Wire same-origin logout and owner-only revoke-all. A database failure must return an explicit failure, never claim server revocation succeeded. Do not log cookies, raw session IDs or keys. Return uniform authentication failures externally.
5. Run PostgreSQL 17 and PostgREST grant/role tests, real upstream owner/editor/viewer sessions, staff deactivation, upstream logout, copied-cookie replay after logout, concurrent revoke/verify, revoke-all, expired sessions and backend outages through middleware and API paths. Verify login rate limits and cookie attributes remain intact. Define the race boundary: a request authorized before revocation can finish; the next authorization must deny it.
6. Take and verify a release-window backup; obtain separate migration and exact-source deployment approval. Apply only the new security migration, verify grants, deploy the security app release, and force legacy-cookie reauthentication. Do not rotate production secrets as an incidental preparation step.
7. Retain the additive registry on rollback. Reverting to legacy token acceptance restores the known vulnerability and is not a secure rollback. Prefer a forward fix or administrative access maintenance mode with a tested recovery path. Session expiry cleanup is optional later work, not a newly activated scheduler.

## Tests performed

Five prototype tests pass: copied owner token after logout, revoke-all actor isolation, expiry/tamper/legacy/missing registry, fail-closed storage and failed logout, and identity/expiry binding without raw-token storage. One isolated PGlite schema test passes under deliberately broad default grants: public roles cannot read/insert, and the server role cannot change identity/expiry or delete/truncate rows. These are design-level tests, not hosted authentication acceptance.

Evidence is saved in `artifacts/seo-e-final-20261022/revocation-prototype-tests.log` and `revocation-schema-tests.log`. The production issue remains open until a separately implemented, reviewed and accepted security release closes it.
