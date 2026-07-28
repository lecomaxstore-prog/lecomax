# L’ECOMAX mobile account implementation

Date: 26 July 2026

## Scope delivered

- Rebuilt the Account tab with a restrained black, white, and L’ECOMAX green visual system.
- Added explicit loading, session-error, guest, and authenticated customer states.
- Added real sign-in and registration actions with an account return route.
- Added an authenticated profile summary linked to the existing profile editor.
- Reworked Orders, Favourites, Addresses, and Assistance into a responsive two-column service grid.
- Added an admin-controlled EcoClub banner.
- Added persisted language and appearance selectors.
- Connected the notification preference to device permission state and the shared push-token API.
- Added settings-sheet actions for profile, language, appearance, privacy/security, support, logout, and account deletion.
- Kept the existing shared cart, wishlist, address, order, authentication, support, and legal flows.
- Removed nonessential account entrance animations so critical content paints immediately on weak devices.

## Shared backend and dashboard

The public settings API and dashboard now support:

- `app_notifications_enabled`
- `app_club_title`
- `app_club_description`
- `app_club_cta_label`
- `app_club_cta_destination`

The mobile settings query keeps its existing persisted React Query cache and safe refetch behaviour. The account screen uses the existing authenticated endpoints for push-token subscription and account-deletion requests. Existing app-provider synchronisation continues to merge account favourites and addresses after sign-in; the local persisted cart remains available.

## Accessibility and interaction quality

- All newly visible controls have descriptive accessibility labels.
- Selection state is exposed for language and appearance options.
- Notification state reflects unsupported, denied, disabled, loading, and enabled states.
- Destructive logout and deletion actions require confirmation.
- Press feedback and haptics use the shared `AnimatedPressable`.
- Controls use minimum 44–46 px touch targets.
- Text truncation is constrained in service and identity rows.
- The layout is constrained to the shared 480 px application viewport on tablets while remaining fluid on phones.

## Validation results

- Mobile Prettier: passed.
- Mobile ESLint (`expo lint`): passed with zero warnings.
- Mobile TypeScript (`tsc --noEmit -p tsconfig.json`): passed.
- Commerce unit tests: 5 passed, 0 failed.
- Admin API contract audit: 168 calls checked, 0 failures.
- Mobile secret audit: 258 files checked, 0 findings.
- Mobile interaction audit: 19 screens, 153 controls, 14 inputs, 0 errors and 0 warnings.
- Next.js production build: passed, including its type and route validation.
- Expo production export: passed for Android, iOS, and web.
- Visual QA: verified the guest account layout at phone width and the centered 480 px shell at iPad width.

The standalone root `tsc --noEmit` command is not a valid project check at present because the existing test imports use a `.ts` extension without `allowImportingTsExtensions`. The production Next.js build’s TypeScript validation passes.

## Deployment configuration still required

The live Supabase audit is intentionally not marked ready. Apply these existing migrations, in order, before enabling the affected production flows:

1. `20260726120000_order_source_idempotency.sql`
2. `20260726123000_mobile_app_settings.sql`
3. `20260726130000_mobile_push_tokens.sql`
4. `20260726140000_account_deletion_requests.sql`
5. `20260726133000_atomic_order_inventory.sql`

The live audit currently reports:

- Missing `mobile_push_tokens` and `account_deletion_requests` tables.
- Missing `orders.order_source` and `orders.idempotency_key`.
- Missing `reserve_order_inventory` and `release_order_inventory`.
- Missing app version, homepage, onboarding, notification, and Club setting rows.

Until the migrations are deployed, notification subscription and account-deletion requests cannot be considered production-operational, even though their app and API implementations build successfully.
