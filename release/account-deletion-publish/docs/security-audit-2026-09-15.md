# Security audit and hardening — 15 September 2026

## Executive result

The current application has substantial server-side security controls, and this audit added further fixes and regression tests. **Production security is not yet verified. The highest-priority outstanding action is confirming revocation of an exposed historical Supabase service-role credential.** No production writes, payments, credential attacks, history rewrites, or deployment were performed.

The workspace already contained extensive uncommitted security and feature work before this audit. Those changes were preserved. Findings below distinguish existing protection from changes made during this run.

**Provisional overall score: 5/10**, held down by historical credential exposure and unverified deployment configuration. This is an engineering assessment, not a certification or measured probability of compromise. Do not treat passing tests or a clean dependency audit as proof of production security.

## 1. Critical vulnerabilities

### Historical Supabase service-role credential exposure — revocation verification required

Scanning 3,364 historical Git blobs found one distinct legacy JWT with the `service_role` claim in seven historical scripts:

- `scripts/check-names.mjs`
- `scripts/fix-image-paths.mjs`
- `scripts/seed-products.mjs`
- `scripts/seed-settings.mjs`
- `scripts/setup-data-collection.mjs`
- `scripts/setup-review-photos.mjs`
- `scripts/update-descriptions.mjs`

Its project reference matches the locally configured Supabase project. Its embedded expiry has not passed. It differs from the current local `SUPABASE_SERVICE_ROLE_KEY`; that difference does **not** prove the old credential was revoked. Its validity was deliberately not tested against production. Details containing only paths and Git object identifiers are in `security-secret-history.json`.

**Action:** verify that the exposed legacy service-role credential is disabled/revoked in Supabase. If still enabled, migrate affected services to replacement secret keys and disable the old key using Supabase's supported process. Coordinate with deployed web/mobile clients before disabling legacy anon keys or signing keys. New keys alone do not revoke legacy keys. See [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys) and [legacy-key rotation guidance](https://supabase.com/docs/guides/troubleshooting/rotating-anon-service-and-jwt-secrets-1Jq6yd).

Review database/auth/storage logs and repository access. Cleaning history is secondary to revocation and requires coordination with collaborators; history was not rewritten.

## 2. High-risk findings and fixes

| Finding | Change | Status |
|---|---|---|
| PayPal event lookup, order update and event insert were separate operations; late events could overwrite newer payment state. | Added a service-role-only transaction with event deduplication, order locking, event timestamps, and terminal-state protection. Missing orders return a retryable failure instead of losing the event. | Code and SQL tested locally; migration required before deployment. |
| Refund resource IDs were used as capture IDs. | Resolve the original capture from related IDs or a strictly validated PayPal capture link; do not fetch supplied links. | Fixed. |
| Support multipart parsing trusted a declared length before unbounded parsing; avatars/support images relied on simple signatures. | Stream-limit multipart bodies and validate image metadata/pixel budgets with Sharp. | Fixed. |
| Tracking returned address/order details behind a six-digit number plus email, with no route-specific shared/account limiter. | Added IP and hashed account limits; bounded email length. | Fixed in code; shared enforcement requires Redis configuration. |
| Admin-session issuance did not explicitly require confirmed email. | Require `email_confirmed_at` from verified Supabase user data; bound upstream request time and log failed attempts without credentials. | Fixed. |

## 3. Medium-risk findings and fixes

- **`WHATSAPP_VERIFY_TOKEN` in source/history:** removed hard-coded values from both local release snapshots. Current active source was already environment-only. Rotate this token in Meta and Vercel; history still contains it. This is the webhook verification token, not proof that the WhatsApp access token leaked.
- **Password-reset email abuse:** added account/IP limiting before contacting the provider. The target remains the verified account, and the redirect remains server-controlled.
- **Public review-image storage abuse/error details:** added shared limiting, reduced multipart budget to the actual upload allowance plus overhead, and replaced raw exception messages with a safe response. Guest uploading still exists for compatibility.
- **Assistant API cost/validation:** bounded request size, message count, message roles and lengths, platform and session-ID format; added shared limiting.
- **PostgREST filter injection:** community search text could add syntax to `.or()`. Removed filter metacharacters and capped search/pagination. This is query-expression manipulation, not arbitrary SQL execution.
- **Avatar cleanup paths:** reject malformed escapes, backslashes, empty/dot/traversal segments before storage deletion.
- **Community upload allocation:** members' requests now use the image-sized multipart budget instead of the admin video budget.
- **APK processing:** stop reading storage data once the configured APK size maximum is exceeded.

## 4. Low-risk improvements

- Normalize the nonstandard `image/jpg` MIME alias to `image/jpeg` so filenames receive the correct extension.
- Mark the privileged community authentication module `server-only`.
- Remove duplicate successful admin-login logging; add safe failed-login logging and webhook rejection logging.
- Extend the secret scanner to optional release/project archives and reachable Git history, outputting metadata only.
- Add repeatable security regression tests and an API route inventory.

## 5. Existing protections reviewed

- **Authorization:** API handlers use centralized administrator checks, live staff status/permissions and fail-closed unknown permissions. Middleware adds a second layer. Customer APIs validate Supabase bearer tokens and scope queries to the user. Support RPCs receive the verified user ID. Admin access is not granted by customer-controlled metadata or hidden UI.
- **Sessions/CSRF:** admin cookies are HttpOnly, Secure in production, SameSite Strict; HMAC verification enforces signed expiry. Mutations check origin. Bearer-authenticated native clients can omit Origin. Customer Supabase sessions remain JavaScript-accessible as required by the existing client architecture.
- **Commerce:** prices, discounts, shipping, payment fees, tax and inventory availability are recomputed from database data. Final creation uses transactional RPCs; coupon and inventory changes are serialized. PayPal order/capture, completed state, currency and exact expected amount are checked server-side; payment reference uniqueness prevents reuse.
- **XSS:** React escaping, HTML sanitization for pages and escaped JSON-LD are present. No executable HTML upload types are allowed in the reviewed upload handlers. PDFs remain downloadable private attachments, not malware-scanned documents.
- **SSRF:** the product importer rejects private addresses, pins validated DNS results, refuses redirects, and limits time/response size. Push delivery uses provider hostname restrictions. Other reviewed fetches use fixed/configured service endpoints or storage-generated URLs.
- **SQL/command/path handling:** database access uses Supabase query builders and RPC parameters. No runtime shell execution or application-level Server Action files were identified by the source scans. The source browser checks owner + secondary PIN and restricts path/realpath access.
- **Webhooks:** PayPal verifies signatures through PayPal; WhatsApp checks an HMAC of the raw body. Cron routes require secrets. Missing configuration can disable these integrations; verify production settings.
- **Headers:** CSP, HSTS, nosniff, frame denial, referrer and permissions policies already exist. Sensitive routes have no-store protections. CSP retains inline scripts/styles for current Next.js and third-party compatibility; production does not add unsafe-eval.
- **Database:** checked migration definitions for RLS and service-role-only sensitive RPC permissions. This does not establish the deployed database's actual grants/policies or migration state.

`security-route-inventory.json` inventories all 159 API route source files. Its guard/body flags are static triage indicators, not an authorization proof for each branch. Disabled endpoints and public guest endpoints legitimately lack the listed guards.

## 6. Files changed in this run

Application code:

- `app/api/admin/auth/session/route.ts`
- `app/api/account/password-reset/route.ts`
- `app/api/account/avatar/route.ts`
- `app/api/tracking/route.ts`
- `app/api/paypal/webhook/route.ts`
- `app/api/upload/route.ts`
- `app/api/reviews/upload-photo/route.ts`
- `app/api/assistant/route.ts`
- `app/api/ecomedia/posts/route.ts`
- `app/api/ecomedia/upload/route.ts`
- `lib/support-files-server.ts`
- `lib/app-release-server.ts`
- `lib/ecomedia-auth.ts`
- `lib/security-log.ts`
- `lib/paypal-webhook-event.ts` (new)

Migration, tooling and evidence:

- `supabase/migrations/20260915120000_atomic_paypal_webhooks.sql` (new)
- `scripts/audit-security-secrets.mjs`
- `tests/security-hardening.test.ts` (new)
- `tests/password-reset-api.test.ts`
- This report, `docs/security-route-inventory.json`, `docs/security-secret-history.json`
- WhatsApp route in each of `release/product-visibility-publish/` and `release/storefront-genai-publish/` (secret removal only; those snapshots are not otherwise hardened release targets).

## 7. Dependencies

No dependency versions were changed during this run. The existing working tree already had Next.js 15.5.24, React/React DOM 19.2.5 and Sharp 0.35.4. The installed Windows Sharp binary reports libheif 1.23.2. `npm audit` returned **0 known vulnerabilities** across the root dependency tree. Mobile/release lockfiles were not independently certified.

Next.js 15.5.24 includes the fixes described in the [August 2026 security release](https://nextjs.org/blog/august-2026-security-release). Verify the deployed artifact uses the audited lockfile and `npm ci`; a version in this workspace does not establish the live site's version.

## 8. Deployment and manual configuration

1. Resolve the exposed Supabase legacy credential and rotate `WHATSAPP_VERIFY_TOKEN` as above.
2. Apply `20260915120000_atomic_paypal_webhooks.sql` **before deploying the new handler**. The handler returns 503 and requests provider retry if the RPC is missing. Verify previous commerce/inventory/coupon migrations are also applied. Do not run every historical seed/migration blindly against production.
3. Configure `ADMIN_SESSION_SECRET` to a separate random secret (at least 32 characters). The compatibility fallback currently uses the service-role key. Changing it invalidates signed admin/PIN/chat cookies, so plan a reauthentication window.
4. Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in the applicable Vercel environments. Without both, sensitive endpoints fall back to bounded process-local counters; configured-backend outages fail closed. These variables and `ADMIN_SESSION_SECRET` were absent from local `.env.local`; production values were not inspected.
5. Verify `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `PAYPAL_WEBHOOK_ID`, `CRON_SECRET`, production payment credentials and exact allowed site/auth redirect URLs. `WHATSAPP_APP_SECRET` and `CRON_SECRET` were absent locally, which does not prove they are absent in Vercel.
6. In Supabase Auth, configure provider-side password-login/recovery/signup limits and CAPTCHA where supported. Browser login talks directly to Supabase; an app limiter cannot secure that separate endpoint. Require MFA for administrators through an intentional enrollment/rollout; this audit did not silently lock out existing admins.
7. Enable GitHub secret scanning/push protection, dependency alerts, branch protection and required checks. Restrict repository, Vercel and Supabase administrative access. Use separate preview credentials; never supply production credentials to untrusted PR builds.

### Vercel firewall starting policy

Use existing managed protections and add narrowly scoped custom rules. Start new thresholds in **log mode**, review real traffic, then enforce. Suggested initial thresholds are tuning inputs, not measured capacity limits:

| Scope | Initial policy |
|---|---|
| `/api/admin/auth/session`, `/api/auth/signup`, `/api/account/password-reset` | 30/IP/15 minutes; return 429 for APIs. Keep provider-side account limits too. |
| POST `/api/orders`, `/api/paypal/mobile/create`, `/api/paypal/mobile/capture` | Around 15/IP/minute; monitor mobile/carrier NAT and retry traffic before enforcing. |
| `/api/tracking`, public upload and assistant endpoints | Separate low-volume rules; align with application limits and monitor false positives. |
| `/admin` pages | Managed challenge for suspicious browser traffic; additional restrictions only if staff network patterns permit. |
| Public search/catalog and admin reads | Higher thresholds; do not apply login thresholds to normal page/API fan-out. |

Do not serve browser challenges to PayPal/WhatsApp webhook deliveries, scheduled jobs or native-app APIs. Keep signature/cron authentication. Do not bypass all protection based on a spoofable `X-Lecomax-Client` header. Use Attack Challenge Mode during a confirmed incident with attention to payment callbacks and genuine crawlers. See [Vercel custom rules](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules) and [DDoS mitigation](https://vercel.com/docs/vercel-firewall/ddos-mitigation).

Send security events to an access-controlled log drain; alert on repeated authentication/authorization failures, 429/503 spikes and webhook retry failures. Add retention/redaction rules for existing application logs. Never record credentials, session headers or payment payloads. Successful administrative writes are not uniformly covered by a centralized audit trail yet.

## 9. Secrets requiring action

| Secret | Evidence | Required action |
|---|---|---|
| Historical Supabase `service_role` credential | One distinct unexpired JWT for the configured project in seven historical scripts; differs from the current local key. | Confirm revocation; disable/replace if still accepted. Review access logs. |
| `WHATSAPP_VERIFY_TOKEN` | Historical active-route blobs and two local release snapshots. | Rotate in Meta and Vercel; current/archive source copies removed. |

No values are included in the report. The scan compared seven configured private values and searched service-role JWTs/private-key markers; it is not a universal detector for every credential format, deleted remote ref, external artifact or provider log.

## 10. Remaining risks and limits

- Live database RLS/grants, storage policies, deployed credentials, GitHub controls, Vercel WAF and production logs remain unverified.
- Legacy mobile PayPal creation still accepts an amount and capture still uses a PayPal order identifier. These endpoints do not establish application cart ownership; `X-Lecomax-Client` is not authentication. Final order creation separately checks trusted totals and PayPal capture amounts, preventing the reviewed underpayment path. Replace this contract with a server-stored checkout intent and ship coordinated web/mobile changes; rejecting the installed client's existing payload immediately would break checkout.
- Guest review eligibility permits contact-based purchase lookup, and guest review uploads remain available. A contact address/phone is not proof of control. Move to emailed/SMS one-time verification for stronger impersonation resistance, with a coordinated guest-flow change.
- Stateless administrator cookies lack individual-session revocation; staff removal is rechecked, but an owner cookie can survive account/password changes until expiry or secret rotation. MFA and a revocable session store remain future work.
- Several lower-risk API schemas remain handwritten and inconsistent. The inventory/body scan does not prove semantic validation for every possible payload. Public AI sessions use the existing anonymous/RLS architecture; do not grant broad anonymous assistant-table access to make persistence work.
- CSP still permits inline code and broad HTTPS image/media sources. Nonce-based CSP requires coordinated dynamic rendering and third-party testing. Authenticated browser tokens remain exposed to any successful same-origin XSS.
- Upload validation is not antivirus scanning or proof that every decoder/media file is harmless. PDFs/APKs need separate content/signature review. Vercel request-size limits may be lower than some existing application upload limits.
- Payment reconciliation records a refund status but does not model partial-refund accounting, refund amounts or order/loyalty reversal as a complete financial ledger.
- Runtime checks used a local production build and anonymous requests. Real customer/admin success paths, live PayPal sandbox workflows and production migration application were not exercised. No visual UI changes were made; no mobile visual regression run was needed.

## 11. Verification and final review

- Root tests: **284 passed**, plus 10 Android Back scenarios and scroll-return scenarios.
- TypeScript: `tsc --noEmit --incremental false` passed.
- Lint: passed with existing image/React-hook warnings; warnings were not suppressed.
- Production build: **final post-review build passed**; initial sandbox attempt could not download Google Fonts, then network-enabled verification succeeded. Output is recorded in `security-build-results.log`.
- Admin API contract audit: 182 calls checked, 157 `.ts` route files, zero missing route/method contracts (159 total when the two `.tsx` image routes are included).
- Local HTTP checks: anonymous order/admin reads and admin writes rejected, source browser rejected, admin page redirected to login, malformed webhook rejected, cross-origin mutation rejected. CSP and nosniff headers were present.
- Security tests cover signed-session tampering/expiry, permission escalation, origin spoofing, streaming request limits, refund capture resolution, SQL replay/order/permission behavior, limiter outages and password-reset abuse.
- Expanded current-source scan: 3,401 text files, no remaining configured-secret copies. Git-history scan: 3,364 blobs, historical findings retained in the metadata report.
- Final review additionally fixed community filter parsing, avatar traversal/decoding, member multipart allocation and APK read limits; it identified the historical service-role credential described above.

Reproduce with `npm.cmd test`, `npx.cmd tsc --noEmit --incremental false`, `npm.cmd run lint`, `npm.cmd run build`, `npm.cmd audit`, `node scripts/audit-admin-api-contracts.mjs`, and `node scripts/audit-security-secrets.mjs --include-archives --history`. Do not interpret known historical findings as a newly introduced source leak.
