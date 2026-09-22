# Mobile fixes and notifications — resume checkpoint

## Verified locally on September 21, 2026

- `npm.cmd run typecheck` in `mobile`: passed.
- `node --test tests/mobile-*.test.ts tests/push-registration-error.test.ts`: 99 passed, zero failures.
- `node scripts/test-notification-migration.mjs node_modules/@electric-sql/pglite/dist/index.js`: passed publication, discounts, deduplication, rollback, repeat migration execution, and private table access checks in isolated PostgreSQL.
- The focused review submission and review photo schema tests also passed.

Existing changes include Google callback routing, keyboard handling, native file uploads, notification opt-in, registration retries, and actionable registration errors. These checks validate local code; they do not establish physical-device notification delivery.

## Remaining release dependencies

1. No `mobile/google-services.json` exists locally. Verify whether EAS production supplies the `GOOGLE_SERVICES_JSON` file variable and the matching FCM V1 credentials for `com.lecomax.app`. A production EAS environment read was rejected by automatic approval review because it could reveal sensitive configuration; explicit user approval is required before retrying that access.
2. `docs/customer-notifications.md` records missing notification tables in the earlier September 21 database check. Their current production status was not rechecked in this resume session. Follow its migration list once production access and the intended rollout are established.
3. Build a new Android binary with Firebase configuration, then verify registration and delivery on an opted-in physical test device, including foreground/background handling, navigation, and opt-out.

No code changes, production migrations, builds, deployments, or notification broadcasts were performed in this resume checkpoint. Existing uncommitted work was preserved.
